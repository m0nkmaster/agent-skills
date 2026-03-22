# ClassDojo API Reference

## Base URL
```
https://home.classdojo.com/api
```

## Authentication

- **Normal login:** `POST https://home.classdojo.com/api/session?duration=long` with JSON  
  `{"login":"<email>","password":"<password>","resumeAddClassFlow":false}` (the web client may also send `email`).
- **After email OTP (e.g. new sign-in location):** `POST https://teach.classdojo.com/api/session?duration=long` with  
  `{"login":"<email>","password":"<password>","code":"<6-digit>"}`.

Successful responses set session cookies used on `home.classdojo.com` for API calls.

All subsequent requests must include the `dojo_login.sid` and `dojo_home_login.sid` cookies (names as observed in practice).

## Endpoints

### Session
| Method | Path | Purpose |
|--------|------|---------|
| POST | `https://home.classdojo.com/api/session?duration=long` | Log in (email + password) |
| POST | `https://teach.classdojo.com/api/session?duration=long` | Complete login with email **one-time code** (`code` in JSON body) |
| GET | `/session?includeExtras=location&supportsChildAsParent=true` | Validate session |

### Messages
| Method | Path | Purpose |
|--------|------|---------|
| GET | `/parent/{parent_id}/message-thread/page?limit=20` | List message threads |
| GET | `/message-thread/{thread_id}` | Full conversation |
| GET | `/message-thread/{thread_id}/message` | Messages in a thread |

### Class Stories
| Method | Path | Purpose |
|--------|------|---------|
| GET | `/storyFeed?withStudentCommentsAndLikes=true&withSyntheticPosts=true` | Story feed |
| GET | `/storyFeed?…&studentId={student_id}` | Stories for one student |
| GET | `/dojoClass/{class_id}/storyFeed/{story_id}/comments` | Story comments |

### Calendar Events
| Method | Path | Purpose |
|--------|------|---------|
| GET | `/parentCalendarEvent?hidePastEvents=false` | All events |
| GET | `/parentCalendarEvent/{event_id}` | Single event |
| GET | `/parentCalendarEvent/{event_id}/comments` | Event comments |

### Student Info
| Method | Path | Purpose |
|--------|------|---------|
| GET | `/parent/{parent_id}/student/{student_id}` | Student profile |
| GET | `/parent/{parent_id}/dashboard` | Dashboard overview |
| GET | `/parent/{parent_id}/student` | All linked students |

### Notifications
| Method | Path | Purpose |
|--------|------|---------|
| GET | `/notification` | List notifications |
| POST | `/markNotificationRead` | Mark notifications read |