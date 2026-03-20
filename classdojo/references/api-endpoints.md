# ClassDojo API Reference

## Base URL
```
https://home.classdojo.com/api
```

## Authentication
POST `/session` with `{"email": "…", "password": "…"}` returns session cookies.
All subsequent requests must include the `dojo_login.sid` and `dojo_home_login.sid` cookies.

## Endpoints

### Session
| Method | Path | Purpose |
|--------|------|---------|
| POST | `/session` | Log in (email + password) |
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

## Known Account IDs

| Entity | ID |
|--------|----|
| Parent | `5ec3b7790dfcbc1819952ec4` |
| Student 1 | `5e7c84d75f8f36d133eddf0e` |
| Student 2 | `5eec913e1634abe97e805598` |
| Class | `687a96dc9a7b92b942b9b338` |
