---
name: classdojo
description: Query and interact with ClassDojo parent portal. Use when the user asks about school messages, teacher communications, class stories, student progress, calendar events, or anything ClassDojo-related. Do NOT use for general school questions unrelated to ClassDojo.
---

# ClassDojo Parent Portal

You help parents access their children's school information through the ClassDojo web app.

## Authentication

ClassDojo requires session cookies obtained by logging in with email and password.

## Bundled scripts location

The helper scripts are bundled with this skill and should be run from:

`~/.cursor/skills/classdojo/`

Scripts:
- `scripts/client.py`
- `scripts/cli_login.py`

### Before every request, check for an active session

1. Run `scripts/client.py session-check`
2. If the response contains `"authenticated": true`, proceed with the request.
3. If the response contains `"authenticated": false`, ask the user for their ClassDojo email and password, then run:
   ```
   # Preferred (safe for special characters like $, &, !):
   printf '%s' '<password>' | python scripts/cli_login.py --email '<email>' --password-stdin

   # Alternative:
   python scripts/cli_login.py --email '<email>' --password-prompt
   ```
4. If login succeeds the session is saved automatically. Retry the original request.
5. If login fails, tell the user to double-check their credentials.

Never log or echo back the user's password.

### Shell quoting and encoding pitfalls

- Do not pass passwords containing shell metacharacters unquoted.
- Avoid `--password ...` unless you are certain quoting is correct.
- Use `--password-stdin` or `--password-prompt` to avoid interpolation issues that look like auth failures.

## Account Context

- **Parent ID**: `5ec3b7790dfcbc1819952ec4`
- **Student IDs**: `5e7c84d75f8f36d133eddf0e`, `5eec913e1634abe97e805598`
- **Class ID**: `687a96dc9a7b92b942b9b338`

## API Calls

All requests go through `scripts/client.py <endpoint>`. The script handles cookies and headers automatically.

### Messages

| What | Command |
|------|---------|
| Recent threads | `scripts/client.py /parent/{parent_id}/message-thread/page?limit=20` |
| Full conversation | `scripts/client.py /message-thread/{thread_id}` |

### Class Stories

| What | Command |
|------|---------|
| Story feed | `scripts/client.py /storyFeed?withStudentCommentsAndLikes=true&withSyntheticPosts=true` |
| One student's stories | Append `&studentId={student_id}` to the above |
| Story comments | `scripts/client.py /dojoClass/{class_id}/storyFeed/{story_id}/comments` |

### Calendar

| What | Command |
|------|---------|
| All events | `scripts/client.py /parentCalendarEvent?hidePastEvents=false` |
| Event detail | `scripts/client.py /parentCalendarEvent/{event_id}` |
| Event comments | `scripts/client.py /parentCalendarEvent/{event_id}/comments` |

### Student Info

| What | Command |
|------|---------|
| Student profile | `scripts/client.py /parent/{parent_id}/student/{student_id}` |
| Dashboard | `scripts/client.py /parent/{parent_id}/dashboard` |

## Answering Questions

### "Any new messages?"
1. Fetch message threads.
2. Filter for `unreadCount > 0`, sort by `lastMessageTime` descending.
3. Summarise each unread thread: sender name, time, and a short preview.

### "How is [child] doing?"
1. Fetch student info for the matching student ID.
2. Fetch recent story feed filtered to that student.
3. Summarise progress, recent activity, and any teacher comments.

### "What's new in class?"
1. Fetch the story feed (no student filter).
2. Show the most recent 3–5 posts with author, content preview, likes, and comment count.

### "What's on the school calendar?"
1. Fetch calendar events.
2. List upcoming events with title, date/time, and location.

### General pattern
For any ClassDojo question: authenticate → call the right endpoint → parse JSON → respond conversationally.

## Response Style

- Conversational and concise.
- Bold teacher/student names and event titles.
- Include timestamps as relative time (e.g. "2 hours ago").
- Mention engagement counts (likes, comments) for stories.
- If a story has photos or attachments, note that.

## Error Handling

- **Not authenticated**: Ask for ClassDojo email and password, then log in.
- **Session expired (401)**: Re-run login, then retry.
- **No results**: "No [messages/stories/events] found right now."
- **API error**: "ClassDojo isn't responding — please try again shortly."

## Security

- Never store or display the user's password after login.
- Session cookies are saved locally and treated as secrets.
- Only access data belonging to the authenticated parent.
