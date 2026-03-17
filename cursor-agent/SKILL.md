---
name: cursor-agent
description: Use when the user asks for coding, code review, refactoring, features, bugs, tests, GitHub, PRs, or repo work — default to Cursor (run the agent CLI via bash + process). User does not need to say Cursor. Do NOT use sessions_spawn or subagent. NOT for OpenClaw workspace; never approve permission prompts for the user.
metadata:
  {
    "openclaw": { "emoji": "🖱️", "requires": { "bins": ["cursor", "cursor-agent"] } }
  }
---

# Cursor Agent

**Default for coding and GitHub.** If the task involves code, a repo, or GitHub (edits, refactors, code review, PRs, features, bugs, tests), use this skill and delegate to Cursor. The user does **not** need to say "Cursor" — assume Cursor for any coding/repo work.

**Triggers (use this skill):** code review, refactor, add feature, fix bug, write tests, review PR, open a PR, clone repo and…, work on repo X, speed up the app, improve code quality. No need for the user to mention Cursor.

Use the **`agent`** binary (Cursor's CLI) with the **bash** tool (PTY + workdir + background). Relay output and input via the **process** tool. Spawn in the target project directory — never in the OpenClaw workspace.

## ⚠️ Do NOT use sessions_spawn or subagent for Cursor

Cursor is run by executing the `agent` binary in a PTY. Do **not** use `sessions_spawn`, subagent, or thread-based spawning for Cursor. Those are for other runtimes. For Cursor you must: (1) clone or use the repo in a temp dir if the user gave a URL, (2) call **bash** with `command:"agent"`, `pty:true`, `workdir:<project-dir>`, `background:true`, (3) use **process** (poll, submit, paste, send-keys) to relay.

## PTY + workdir + background (use bash tool)

Cursor Agent is an interactive terminal app. Always use the **bash** tool with PTY:

```bash
bash pty:true workdir:<project-dir> background:true command:"agent"
```

Returns a sessionId. Then use **process** to poll for output and submit/paste user input. If your environment uses a different tool name (e.g. exec), use the same parameters: `command`: `agent`, `pty`: true, `workdir`: project dir, `background`: true.

- **workdir:** The project directory the user wants to work in (not the OpenClaw workspace). If the user gives a GitHub URL, clone to a temp dir first and use that as workdir.
- **First run in a directory:** `agent` may show a workspace trust prompt — relay it and send the user's choice (e.g. `a`, `w`, or `q`) via process send-keys; never choose for them.

### Bash (or exec) tool parameters

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

- Strip ANSI when presenting. Relay **substantive** content (new text, "Run this command?", command output, errors) to the user; for status-only output, a short summary is enough.
- For approval prompts, relay verbatim and wait for the user — never approve yourself. After relaying a substantive response, append `cursor @ <workdir>` (use `~` for home).

### ⚠️ Context bloat — you cannot fix it by shortening your messages

Each **process poll** return (the raw PTY chunk) is stored in the conversation. Cursor's PTY sends huge, repetitive status (Generating..., ANSI redraws, token counts). So the context fills up from **tool results**, not from what you send to the user. Short messages to the user do not prevent this.

**Mitigations:**

1. **Prefer Cloud Agent for long tasks.** For multi-step work (full code review + doc + PR), suggest the user run it in Cursor Cloud (`agent -c "task"` or hand off with `&`). Then the work never runs through the relay and no poll results accumulate.
2. **Poll less often.** Use a longer poll timeout (e.g. 30s) or poll only when you need to (e.g. after sending input). Fewer poll calls = fewer huge tool results in context. Balance with responsiveness.
3. If the user insists on local relay for a long task, warn that context may run out and suggest Cloud next time.

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

**When the user asks for any coding or GitHub work** (e.g. "run a code review of this repo", "add a feature", "refactor the auth module", "review PR #5", "fix the bug in X") — **default to Cursor**. They do not need to say "Cursor".

**Long or multi-step tasks (e.g. full repo review + document + PR):** Suggest **Cloud Agent** first: "This will take a while and may run for many steps. Want me to hand this off to Cursor Cloud so it runs there and you can follow at cursor.com/agents? Otherwise I'll run it here and summarize progress to avoid blowing context." If they prefer local, follow the steps below but **relay only substantive output** (see "Avoid context blow-up" under Relaying output).

1. **Repo from URL?** Clone to a temp dir: `REPO_DIR=$(mktemp -d) && git clone <url> $REPO_DIR` (or use a worktree). Use that path as workdir. Do not run Cursor in the OpenClaw workspace.
2. **Spawn Cursor:** Call **bash** with `pty:true`, `workdir:<that-dir>`, `background:true`, `command:"agent"`. Capture the sessionId.
3. **Send the task:** Use **process** `submit` or `paste` to send the user's instructions (e.g. "Run a code review focusing on X. Output a document with recommended next steps and open a PR."). Then `process send-keys Enter` if needed.
4. **Relay:** Use **process poll** to get output. **Relay only substantive content** (new text, approval prompts, command output, errors); do not paste repetitive status lines (Generating..., token count) or you will exhaust context. When Cursor asks for approval, relay the prompt — do not approve yourself. Repeat poll → relay/summarize and submit user replies until done.

**Interactive session (existing project):**

```bash
bash pty:true workdir:~/Projects/myproject background:true command:"agent"
```

Then poll and relay; when the user replies, use process submit or paste + send-keys Enter.

**One-shot / headless:** When the user wants a single non-interactive task (e.g. "just run this one command"), use headless mode — see Headless / one-shot below.

---

## Headless / one-shot mode

For **non-interactive** scripting or a single task without a relay, use [print mode](https://cursor.com/docs/cli/headless) (`-p` / `--print`). No PTY needed; run in `workdir` and capture output.

- **With file modifications:** Add `--force` or `--yolo` so the agent can apply changes. Without it, changes are only proposed, not applied.
- **Analysis only (no edits):** `agent -p "prompt"` — no `--force`.

```bash
bash workdir:<project-dir> command:"agent -p --force 'Add error handling to the API'"
```

Optional: `--output-format text` (default), `json`, or `stream-json`; `--stream-partial-output` for incremental streaming. See [Output format](https://cursor.com/docs/cli/reference/output-format.md). For headless auth in scripts, see [Cursor CLI Authentication](https://cursor.com/docs/cli/reference/authentication.md) (e.g. `CURSOR_API_KEY`).

---

## Cloud Agents

For **long-running or multi-step tasks** (e.g. full code review + doc + PR), prefer suggesting [Cloud Agent handoff](https://cursor.com/docs/cli/using#cloud-agent-handoff) so the work runs in the cloud and does not exhaust the OpenClaw relay conversation context.

- **Start in cloud:** `agent -c "task description"` or `agent --cloud "task description"` — conversation continues in the cloud; user can resume at [cursor.com/agents](https://cursor.com/agents).
- **Mid-conversation:** User can send `&` followed by a message to hand off the current session to a Cloud Agent.
- **When to suggest:** Task will involve many steps, large output, or long generation (e.g. "run a code review and open a PR"). Offer: "I can run this here and summarize progress, or you can run it in Cursor Cloud so context doesn't run out."
- Cloud Agents run from a clean git state on the remote. If there are uncommitted local changes, remind the user to commit or stash before handoff.

---

## Code review of a GitHub repo

**Example: "Get Cursor to run a code review of https://github.com/org/repo"**

For a full review + doc + PR, suggest Cloud Agent first (see Cloud Agents) to avoid context blow-up. If the user wants it run locally:

1. Clone to a temp dir (not OpenClaw workspace): `REPO_DIR=$(mktemp -d) && git clone https://github.com/org/repo.git $REPO_DIR`
2. Spawn Cursor: **bash** `pty:true` `workdir:$REPO_DIR` `background:true` `command:"agent"` → get sessionId
3. Send the task via **process submit** (or paste), e.g. "Run a code review of this repo focusing on [X]. Act as a [Rust/CLI] expert. Output a document with recommended next steps and create a PR with that document."
4. **process poll** → relay **only substantive** output (new text, approval prompts, command results). Do **not** paste repetitive status (Generating..., token count) into the conversation. Relay "Run this command?" to the user; do not approve. Continue until Cursor is done or user says stop.

**Reviewing an existing PR (branch already exists):** Clone or worktree, then same flow with workdir set to the clone/worktree path.

```bash
REVIEW_DIR=$(mktemp -d)
git clone https://github.com/user/repo.git $REVIEW_DIR
# Then: bash pty:true workdir:$REVIEW_DIR background:true command:"agent"
# Then: process submit sessionId:<id> data:"Review this repo ..."
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

1. **Use bash (or exec), not sessions_spawn** — Running Cursor = running the `agent` binary via the bash tool. sessions_spawn/subagent are for other runtimes, not Cursor.
2. **PTY required** — Always use `pty:true` when spawning `agent`.
3. **Default to Cursor for coding and GitHub** — Any request that involves code or a repo (edits, refactors, bugs, features, tests, PRs, code review) → use Cursor. The user does not need to say "Cursor". Do not perform edits or repo commands yourself unless the user explicitly asks (e.g. "you do it" or "just run this one command").
4. **Never approve for the user** — Relay "Run this command?" and similar prompts; wait for the user's answer.
5. **workdir = project** — Always set workdir to the repo/project the user cares about (clone to temp dir if user gave a URL); never the OpenClaw workspace.
6. **Be patient** — Don't kill sessions because they're slow.
7. **One session at a time** is typical; use `process list` to check for orphaned sessions.
8. **NEVER start the agent in ~/.openclaw/** (or OpenClaw workspace).
9. **Binary:** `agent` is Cursor's CLI; `cursor-agent` is a backward-compatible alias. Both must be on PATH.

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

- **Long local relay:** Running a long multi-step task (e.g. full review + PR) via local relay → each process poll stores a huge tool result, so context fills from tool results. Suggest Cloud Agent for long tasks instead.
- **Using sessions_spawn or subagent for Cursor:** Cursor is not run via OpenClaw session APIs. Use the **bash** tool to run the `agent` binary (pty, workdir, background), then **process** to relay.
- **Wrong workdir:** Using OpenClaw workspace instead of the user's project → clone the repo to a temp dir and use that as workdir.
- **Doing the work yourself:** Running edits or git/code commands instead of spawning the Cursor relay → for any code/repo task, spawn `agent` via bash and relay.
- **Approving for the user:** Sending "y" or Enter to Cursor's "Run this command?" → relay the prompt and wait for the user.

---

## Notes

- If `agent` / `cursor-agent` is not found, check TOOLS.md or config for custom binary paths.
- In doubt whether to delegate? If it involves code or a repo, use this skill and relay. The user does not need to mention Cursor — assume Cursor for all coding and GitHub tasks.
- **Docs:** [Using Agent in CLI](https://cursor.com/docs/cli/using), [Headless CLI](https://cursor.com/docs/cli/headless), [Installation](https://cursor.com/docs/cli/installation.md).
