---
name: classdojo
description: Query ClassDojo parent portal. Use for school messages, teacher communications, class stories, student progress, calendar events, or anything ClassDojo-related. Triggers on "ClassDojo", "school message", "teacher message", "how is [student] doing", "class story", "school app".
---

# ClassDojo Parent Portal

This skill queries the ClassDojo parent portal API.

## ⚡ QUICK START (For AI)

When user asks ANYTHING about ClassDojo:

1. **Run auth check:** `cd ~/.cursor/skills/classdojo && python3 scripts/client.py session-check`
2. **If NOT authenticated:** Ask user for email/password, then run: `cd ~/.cursor/skills/classdojo && python3 scripts/cli_login.py --email "EMAIL" --password "PASSWORD"` (add `--code "123456"` if they were emailed a 6-digit OTP — see **Email OTP (new location)** below)
3. **Make API call:** Use commands from the table below
4. **Parse JSON and respond conversationally**

**CRITICAL:** You (the AI) run these commands. Python3 IS installed. Do NOT ask the user to run commands.

## CRITICAL: How to Handle Any Request

For EVERY ClassDojo request, follow this exact workflow:

### 1. Check Auth Status (ALWAYS DO THIS FIRST)

Execute:
```bash
cd ~/.cursor/skills/classdojo && python3 scripts/client.py session-check
```

**Interpret the result:**
- Output contains `"authenticated": true` → Go to step 3
- Output contains `"authenticated": false` or any error → Go to step 2

### 2. Login If Needed

Say to user: "I need your ClassDojo email and password to access your account."

When user provides credentials, execute (replace with actual values):
```bash
cd ~/.cursor/skills/classdojo && python3 scripts/cli_login.py --email "USER_PROVIDED_EMAIL" --password "USER_PROVIDED_PASSWORD"
```

If successful: "Logged in. Session saved..." appears → Go to step 3  
If failed: Tell user credentials didn't work, ask them to try again  
If stderr mentions the 6-digit code / HTTP 401 after correct password: ClassDojo emailed an OTP — ask for the code, then run the same command with `--code "THE_CODE"` (or set `CLASSDOJO_OTP_CODE`)

### Email OTP (new location / device)

1. **Password step:** `POST https://home.classdojo.com/api/session?duration=long` with JSON  
   `{"login":"<email>","password":"<password>","resumeAddClassFlow":false}`  
   When a code is required, this returns **401** (response may include rate-limit headers such as `remaining-attempts`, `retry-after`).
2. **OTP step:** `POST https://teach.classdojo.com/api/session?duration=long` with JSON  
   `{"login":"<email>","password":"<password>","code":"<6-digit>"}`  
   On success (**200**), session cookies are issued like a normal login.

The parent portal UI strings for this flow live in `home.classdojo.com` locale pack `packages-one-time-codes` (e.g. “Enter the 6-digit code”, “We sent a one-time code to your email address”). Optional account MFA is a separate concept (`GET /api/parent/{id}/mfa`); this OTP is **not** the same as enabled TOTP MFA.

**CLI:** `python3 scripts/cli_login.py --email "…" --password "…" --code "123456"`

### 3. Make API Request

Execute the appropriate command from the table below.

## API Commands Reference

| User Request | Exact Command to Execute |
|-------------|--------------------------|
| "Any messages?" | `cd ~/.cursor/skills/classdojo && python3 scripts/client.py "/parent/5ec3b7790dfcbc1819952ec4/message-thread/page?limit=20"` |
| "What's new?" / "Class stories" | `cd ~/.cursor/skills/classdojo && python3 scripts/client.py "/storyFeed?withStudentCommentsAndLikes=true&withSyntheticPosts=true"` |
| "How is Alice?" | `cd ~/.cursor/skills/classdojo && python3 scripts/client.py "/storyFeed?withStudentCommentsAndLikes=true&withSyntheticPosts=true&studentId=5e7c84d75f8f36d133eddf0e"` |
| "How is Bob?" | `cd ~/.cursor/skills/classdojo && python3 scripts/client.py "/storyFeed?withStudentCommentsAndLikes=true&withSyntheticPosts=true&studentId=5eec913e1634abe97e805598"` |
| "Calendar" / "Events" | `cd ~/.cursor/skills/classdojo && python3 scripts/client.py "/parentCalendarEvent?hidePastEvents=false"` |
| "Alice's info" | `cd ~/.cursor/skills/classdojo && python3 scripts/client.py "/parent/5ec3b7790dfcbc1819952ec4/student/5e7c84d75f8f36d133eddf0e"` |
| "Dashboard" | `cd ~/.cursor/skills/classdojo && python3 scripts/client.py "/parent/5ec3b7790dfcbc1819952ec4/dashboard"` |

## Response Format

Parse the JSON output and respond like:

- **Messages:** "New message from [Name] ([time]): '[preview]'"
- **Stories:** "[Teacher] posted: '[content]' ([X] photos, [Y] likes)"
- **Calendar:** "Upcoming: [Event] - [Date] at [Time]"

## Error Handling

| Error | Action |
|-------|--------|
| "Session expired" or 401 | Go back to step 2, login again (use `--code` if ClassDojo emails an OTP), then retry step 3 |
| "No session found" | Go to step 2 and login |
| Empty JSON/array | "No [items] found right now" |
| Any HTTP error | "ClassDojo is temporarily unavailable" |

## Important Notes

- **Python3 is installed** - always use `python3` in commands
- **You execute the commands** - don't ask the user to run them
- **Never echo passwords** - use them in commands but don't show in responses
- **Session persists** - after login, the session file is created automatically
- **Always check auth first** - never skip step 1
