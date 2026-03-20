# agent-skills

```
══════════════════════════════════════════════════════════════════════════════
                                                                              
  ___  _____  _____ _   _ _____                                               
 / _ \|  __ \|  ___| \ | |_   _|                                              
/ /_\ \ |  \/| |__ |  \| | | |                                               
|  _  | | __ |  __|| . ` | | |                                               
| | | | |_\ \| |___| |\  | | |                                               
\_| |_/\____/\____/\_| \_/ \_/                                               
                                                                              
 _____ _   _______ _      _      _____                                        
/  ___| | / /_   _| |    | |    /  ___|                                       
\ `--.| |/ /  | | | |    | |    \ `--.                                        
 `--. \    \  | | | |    | |     `--. \                                       
/\__/ / |\  \_| |_| |____| |____/\__/ /                                       
\____/\_| \_/\___/\_____/\_____/\____/                                        
                                                                              
   · portable SKILL.md packs · scripts · references · no warranty ·           
══════════════════════════════════════════════════════════════════════════════
```

Open-source **agent skills**—instructions, references, and helpers for AI coding assistants (Cursor, OpenClaw, Codex, and anything that speaks the same format). This repo is **as-is**: no official support, no guarantees.

We align with the open standard: [agentskills.io](https://agentskills.io/home).

## Skills in this repo

Each row is an installable skill folder (each has a `SKILL.md`). Use your agent’s skill path, ClawHub, or copy the folder into your global/project skills directory.

| Skill | Directory | What it’s for |
|-------|-----------|----------------|
| **Hive Home** | [`hivehome/`](hivehome/) | UK Hive heating, hot water, lights via **Pyhiveapi** (unofficial API). Bundled `scripts/hive_control.py`; Python 3 + `pyhiveapi>=1.0.0`. |
| **ClassCharts** | [`classcharts/`](classcharts/) | UK ClassCharts parent/student data via **classcharts-api** (JS/TS). Homework, behaviour, timetable, detentions, attendance, and more. Node 20+ or Deno. |
| **ClassDojo** | [`classdojo/`](classdojo/) | ClassDojo **parent portal**—messages, stories, progress, calendar. Python helpers in `scripts/` (`client.py`, `cli_login.py`); session cookies after login. |
| **KPSD (ThinkSmart)** | [`thinksmart/`](thinksmart/) | Katie Philpott School of Dance account via the **ThinkSmart** customer portal API (`kpsd` in skill frontmatter). Lessons, teachers, schedules, payments—instructions and API patterns in `SKILL.md`. |
| **Cursor Agent** | [`cursor-agent/`](cursor-agent/) | Delegate **coding / GitHub / repo** work to the **Cursor CLI** (`agent` / `cursor-agent`) from an OpenClaw-style host: PTY, workdir, process I/O—**not** for spawning Cursor via generic subagent APIs. |
| **Apple Find My** | [`apple-find/`](apple-find/) | Short **reference** skill: pointers to [FindMy.py](https://github.com/malmeloo/FindMy.py) and related ClawHub listings—not a full integration on its own. |

### Setup notes

- **Credentials:** Skills that need secrets document env vars or login flows in their `SKILL.md` and `references/`. Set them in your environment or agent config—**never** commit secrets.
- **Install:** Follow each skill’s `SKILL.md` (and any `README.md` in that folder) for dependencies and how your agent should run scripts.

## Other files here

| File / path | Purpose |
|-------------|---------|
| [`skills-cursor.md`](skills-cursor.md), [`skills-claude.md`](skills-claude.md), [`skills-openai.md`](skills-openai.md) | Saved notes / vendor-style Agent Skills documentation (Cursor, Claude, Codex-oriented; may include fragments like JSX from originals)—reference only, not executable skills. |
| [`openclaw/.agent/workflows/`](openclaw/.agent/workflows/) | Optional OpenClaw workflow markdown (e.g. maintenance tasks). |

## License

MIT. See [LICENSE](LICENSE).

## No promises

This project is provided **as is**. There is no warranty of any kind; use at your own risk. Authors and contributors are not liable for damage, loss, or issues from use of these skills or any third-party services or APIs they rely on. You are responsible for your own credentials, security, and compliance. Unofficial APIs may break or violate provider terms—check before you rely on them.
