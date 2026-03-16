---
name: cursor-coding-agent
description: Delegate coding tasks to Cursor Agent (the `agent` CLI). Use when building/creating features or apps, reviewing PRs (spawn in temp dir), refactoring, or iterative coding. NOT for simple one-liner fixes (just edit), reading code (use read tool), or any work in OpenClaw workspace (never spawn there). PTY required; relay output verbatim; never approve permission prompts on the user's behalf.
metadata:
  {
    "openclaw": { "emoji": "🖱️", "requires": { "bins": ["cursor", "cursor-agent"] } }
  }
---

# Cursor Coding Agent

Use the **`agent`** binary (Cursor's CLI) with **PTY** and **background** mode for all Cursor coding work. Spawn in the target project directory and relay output to the user.

## PTY + workdir + background

Cursor Agent is an interactive terminal app. Always use PTY:

```json
{ "tool": "exec", "command": "agent", "pty": true, "background": true, "workdir": "<project-dir>", "yieldMs": 3000 }
```

- **workdir:** Set to the project directory the user wants to work in (not the OpenClaw workspace). Ask if the user doesn't specify.
- **First run in a directory:** `agent` may show a workspace trust prompt — relay it and send the user's choice (e.g. `a`, `w`, or `q`) via `process send-keys`; never choose for them.

### Exec / Bash tool parameters

| Parameter    | Type    | Description                                                                 |
| ------------ | ------- | --------------------------------------------------------------------------- |
| `command`    | string  | `agent` (or `cursor-agent` alias)                                            |
| `pty`        | boolean | **Required.** Pseudo-terminal for interactive CLI                            |
| `workdir`    | string  | Project directory (agent sees only this folder's context)                    |
| `background` | boolean | Run in background, returns sessionId for relay/polling                      |
| `timeout`    | number  | Timeout in seconds (kills process on expiry)                                |

### Process tool actions (for background sessions)

| Action      | Description                                          |
| ----------- | ---------------------------------------------------- |
| `list`      | List all running/recent sessions                     |
| `poll`      | Get session output (poll for new output)             |
| `log`       | Get session output (with optional offset/limit)       |
| `submit`    | Send data + newline (like typing and pressing Enter) |
| `paste`     | Paste multi-line text                                |
| `send-keys` | Send key tokens (Enter, ArrowUp, etc.)               |
| `write`     | Send raw data to stdin                               |
| `kill`      | Terminate the session                                |

---

## Relaying output

After spawning or after sending input, poll for output:

```json
{ "tool": "process", "action": "poll", "sessionId": "<id>", "timeout": 15000 }
```

- Strip ANSI escape codes when presenting, but relay the **content** faithfully and verbatim.
- Do **not** wrap Cursor's output in code blocks or add preamble/commentary — relay exactly what Cursor outputs.
- If you need to add a note, prefix that line with your name in brackets (e.g. `[OpenClaw]`) so it's distinct from Cursor's output.
- **Permission prompts:** When Cursor shows "Run this command?" or any approval dialog, relay it verbatim to the user and wait for their response. **Never approve or deny on the user's behalf.**
- After relaying the agent's response, append a single prompt line: `cursor @ <workdir>` — use `~` for home (e.g. `~/repos/myproject`).

---

## Sending user input

Single-line:

```json
{ "tool": "process", "action": "submit", "sessionId": "<id>", "data": "<text>" }
```

Multi-line:

```json
{ "tool": "process", "action": "paste", "sessionId": "<id>", "text": "<text>" }
```

Then send Enter:

```json
{ "tool": "process", "action": "send-keys", "sessionId": "<id>", "keys": ["Enter"] }
```

Special keys (arrows, Escape):

```json
{ "tool": "process", "action": "send-keys", "sessionId": "<id>", "keys": ["ArrowUp"] }
```

Use `@filename` or `@directory/` in prompts to add context for Cursor.

---

## Ending the session

Send `/quit` or **Ctrl+D** to exit. Per [Cursor CLI docs](https://cursor.com/docs/cli/using), Ctrl+D follows standard shell behavior and may require a double-press to exit.

```json
{ "tool": "process", "action": "submit", "sessionId": "<id>", "data": "/quit" }
```

---

## Quick start

**Interactive session (typical):**

```json
{ "tool": "exec", "command": "agent", "pty": true, "background": true, "workdir": "~/Projects/myproject", "yieldMs": 3000 }
```

Then poll and relay; when the user replies, use `process submit` or `paste` + `send-keys Enter`.

**One-shot / headless:** When the user wants a single non-interactive task (e.g. "just run this one command"), use headless mode — see Headless / one-shot below.

---

## Headless / one-shot mode

For **non-interactive** scripting or a single task without a relay, use [print mode](https://cursor.com/docs/cli/headless) (`-p` / `--print`). No PTY needed; run in `workdir` and capture output.

- **With file modifications:** Add `--force` or `--yolo` so the agent can apply changes. Without it, changes are only proposed, not applied.
- **Analysis only (no edits):** `agent -p "prompt"` — no `--force`.

```json
{ "tool": "exec", "command": "agent -p --force \"Add error handling to the API\"", "workdir": "<project-dir>" }
```

Optional: `--output-format text` (default), `json`, or `stream-json`; `--stream-partial-output` for incremental streaming. See [Output format](https://cursor.com/docs/cli/reference/output-format.md). For headless auth in scripts, see [Cursor CLI Authentication](https://cursor.com/docs/cli/reference/authentication.md) (e.g. `CURSOR_API_KEY`).

---

## Cloud Agents

For long-running or "run in background" work, suggest Cursor's [Cloud Agent handoff](https://cursor.com/docs/cli/using#cloud-agent-handoff):

- **Start in cloud:** `agent -c "task description"` or `agent --cloud "task description"` — conversation continues in the cloud; user can resume at [cursor.com/agents](https://cursor.com/agents).
- **Mid-conversation:** User can send `&` followed by a message to hand off the current session to a Cloud Agent.

Cloud Agents run from a clean git state on the remote. If there are uncommitted local changes, remind the user to commit or stash before handoff.

---

## Reviewing PRs

**Never review PRs in OpenClaw's own project folder.** Clone to a temp directory or use a git worktree.

```bash
REVIEW_DIR=$(mktemp -d)
git clone https://github.com/user/repo.git $REVIEW_DIR
cd $REVIEW_DIR && gh pr checkout 130
# Then spawn agent with workdir:$REVIEW_DIR and ask it to review (e.g. "Review this PR; diff is origin/main...HEAD")
```

Or with a worktree:

```bash
git worktree add /tmp/pr-130-review pr-130-branch
# Spawn agent with workdir:/tmp/pr-130-review
```

---

## Parallel work with git worktrees

For multiple issues in parallel:

```bash
git worktree add -b fix/issue-78 /tmp/issue-78 main
git worktree add -b fix/issue-99 /tmp/issue-99 main
# Spawn one Cursor Agent session per workdir (background + PTY), each with its own sessionId
```

Monitor with `process action:list` and `process action:log sessionId:XXX`.

---

## Rules

1. **PTY required** — Always use `pty:true` when spawning `agent`.
2. **Default to Cursor for coding** — For edits, refactors, bugs, features, tests, GitHub/PRs, spawn the Cursor relay. Do not perform edits or repo commands yourself unless the user explicitly asks (e.g. "just run this one command").
3. **Never approve for the user** — Relay "Run this command?" and similar prompts; wait for the user's answer.
4. **workdir = project** — Always set workdir to the repo/project the user cares about; never the OpenClaw workspace.
5. **Be patient** — Don't kill sessions because they're slow.
6. **One session at a time** is typical; use `process list` to check for orphaned sessions.
7. **NEVER start the agent in ~/.openclaw/** (or OpenClaw workspace).
8. **Binary:** `agent` is Cursor's CLI; `cursor-agent` is a backward-compatible alias. Both must be on PATH.

---

## Progress updates

When you spawn Cursor Agent in the background, keep the user in the loop.

- Send one short message when you start (what's running and where).
- Update again when something changes: milestone done, agent asks a question, error, or agent finishes (what changed and where).
- If you kill a session, say so and why.

---

## Auto-notify on completion

For long-running background tasks, you can ask the user to have Cursor run a notifier when done, or append to your relayed prompt:

```
... your task here.

When completely finished, run: openclaw system event --text "Done: [brief summary]" --mode now
```

---

## Common mistakes

- **Wrong workdir:** Using OpenClaw workspace instead of the user's project → always set workdir to their repo/project; ask if unclear.
- **Doing the work yourself:** Running edits or git/code commands instead of spawning the Cursor relay → for any code/repo task, spawn `agent` and relay.
- **Approving for the user:** Sending "y" or Enter to Cursor's "Run this command?" → relay the prompt and wait for the user.

---

## Notes

- If `agent` / `cursor-agent` is not found, check TOOLS.md or config for custom binary paths.
- In doubt whether to delegate? If it involves code or a repo, use this skill and relay.
- **Docs:** [Using Agent in CLI](https://cursor.com/docs/cli/using), [Headless CLI](https://cursor.com/docs/cli/headless), [Installation](https://cursor.com/docs/cli/installation.md).
