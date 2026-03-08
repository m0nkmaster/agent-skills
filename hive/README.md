# Hive Home

Control Hive Home (UK) thermostats, hot water, lights and devices via the unofficial API from your OpenClaw agent.

## What it does

- **Heating:** Read and set mode (SCHEDULE, HEAT, OFF), target temperature, boost (duration + temperature).
- **Hot water:** Read and set mode, boost duration.
- **Lights:** Read state, brightness, colour temp; control via Pyhiveapi session.
- **Auth:** First-time login with SMS 2FA; device credentials for subsequent runs (no 2FA).

The skill teaches the agent to use the [Pyhiveapi](https://github.com/Pyhass/Pyhiveapi) Python library. Hive does not provide a public API; Pyhiveapi talks to the same backend as the Hive app.

## How to use

1. **Install dependency:** `pip install pyhiveapi`
2. **Set credentials** (env or OpenClaw config):
   - `HIVE_USERNAME` – Hive account email
   - `HIVE_PASSWORD` – Hive account password  
   After first login with 2FA, optionally set for device login (no 2FA):
   - `HIVE_DEVICE_GROUP_KEY`, `HIVE_DEVICE_KEY`, `HIVE_DEVICE_PASSWORD`
3. **Enable the skill** in OpenClaw (workspace skills or ClawHub install).
4. Ask the agent to control heating, set temperature, boost hot water, etc. It will generate Python using Pyhiveapi or guide you through the steps.

See [SKILL.md](SKILL.md) for full instructions and code examples.

## Requirements

- Python 3
- `pyhiveapi` (`pip install pyhiveapi`)
- Hive (UK) account – [my.hivehome.com](https://my.hivehome.com)
- Network access (to Hive’s servers)

## Troubleshooting

- **SMS 2FA:** First login requires a code from Hive; run the first-time login snippet once and store device data for later.
- **Login errors:** Ensure username/password are correct and env vars are set. For device login, all three device keys must match the stored values from first login.
- **No devices:** Call `session.startSession()` before using `session.deviceList`; ensure your Hive account has devices linked.

## External services

This skill uses the **Pyhiveapi** library, which communicates with Hive’s backend (e.g. beekeeper.hivehome.com). Credentials and device commands are sent only to Hive. See the “External endpoints” and “Trust statement” sections in [SKILL.md](SKILL.md).

## License

MIT.
