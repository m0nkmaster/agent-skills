---
name: apple-find
description: Query Apple Find (Find My) network to locate Apple devices, check their status, and get location information. Use when user mentions Find My, Find My iPhone, Find My Mac, tracking Apple devices, or locating lost Apple devices.
license: MIT
compatibility: Requires Node.js, apple-findmy-node library, and iCloud credentials. Works with any iCloud account that has Find My enabled.
homepage: https://github.com/m0nkmaster/agent-skills
metadata:
  {"openclaw":{"emoji":"📍","requires":{"env":["APPLE_ID","APPLE_PASSWORD"],"anyBins":["node","npm"]}},"clawdbot":{"emoji":"📍","requires":{"env":["APPLE_ID","APPLE_PASSWORD"]},"primaryEnv":"APPLE_ID"}}
---

# Apple Find

Query the Apple Find My network to locate Apple devices associated with your iCloud account. This skill uses the `findmy` npm package to interact with Apple's Find My service.

**Important:** This skill uses community-maintained libraries that interact with Apple's unofficial Find My API. Use responsibly and never hardcode credentials.

## Quick Start

```bash
# Install dependencies
cd /path/to/apple-find && npm install

# List devices
node index.js list

# Get location of a specific device
node index.js location "iPhone"

# Get status of all devices
node index.js status
```

## Required Environment Variables

| Variable | Description |
|----------|-------------|
| `APPLE_ID` | Your Apple ID email (iCloud email) |
| `APPLE_PASSWORD` | Your Apple ID password or app-specific password |

**For 2FA accounts:** Generate an app-specific password at appleid.apple.com and use that as `APPLE_PASSWORD`.

Set these in your shell or in OpenClaw's skill config (`~/.openclaw/openclaw.json` under `skills.entries.apple-find.env`).

## CLI Commands

### `list` - List all devices

```bash
node index.js list
```

Returns a list of all devices associated with your iCloud account, including:
- Device name (as set in Find My)
- Device model
- Device ID
- Online/offline status

### `location [deviceName]` - Get device location

```bash
# Location of specific device
node index.js location "iPhone"

# Location of all devices
node index.js location --all
```

Returns:
- Latitude and longitude
- Timestamp of last location update
- Address (if available)
- Accuracy

### `status` - Full device status

```bash
node index.js status
node index.js status "iPhone"
```

Returns detailed status including:
- Battery level
- Online/offline status
- Last seen timestamp
- Location coordinates
- Device model

### `play-sound [deviceName]` - Play sound on device

```bash
node index.js play-sound "iPhone"
```

Plays a sound on the specified device (requires device to be online).

### `lost-mode [deviceName]` - Enable Lost Mode

```bash
node index.js lost-mode "iPhone" --phone "1234567890"
```

Enables Lost Mode and optionally sets a phone number to display on the device.

## When to use this skill

- User asks to locate an Apple device (iPhone, iPad, Mac, AirPods, Apple Watch)
- User wants to check if a device is online or offline
- User needs to find the last known location of a lost device
- User wants to play a sound on a device to locate it
- User mentions "Find My", "Find My iPhone", or "Find My Mac"

## Authentication

The skill uses the `findmy` npm package which communicates with Apple's Find My API. First-time login may require 2FA if enabled on the Apple ID.

### Generating an App-Specific Password

1. Go to https://appleid.apple.com
2. Sign in with your Apple ID
3. Navigate to "Sign-In and Security" → "App-Specific Passwords"
4. Generate a new password and use it as `APPLE_PASSWORD`

## Architecture

```
apple-find/
├── SKILL.md           # This file
├── index.js           # Main entry point with CLI
├── package.json       # Dependencies
├── lib/
│   └── findmy.js      # Find My API wrapper
└── tests/
    └── findmy.test.js # Unit tests
```

## External Endpoints

This skill makes requests to Apple's Find My service. No data is sent to third-party servers.

| Purpose | Endpoint | Data sent |
|---------|----------|-----------|
| Authentication | `icloud.com` | Apple ID credentials |
| Find My API | `fmip.icloud.com` | Device location requests |
| Location data | Apple Maps | Reverse geocoding (optional) |

## Security and Privacy

- **What leaves the machine:** Apple ID credentials and device location queries are sent to Apple's servers.
- **What stays local:** All credentials should be stored in environment variables, never hardcoded.
- **App-specific passwords:** Always use app-specific passwords, never your main Apple ID password.
- **Autonomous invocation:** The agent may invoke this skill when the user asks about device locations or Find My.

## Troubleshooting

### "Authentication failed"
- Verify your Apple ID and password are correct
- If 2FA is enabled, use an app-specific password
- Check that Find My is enabled on your device

### "Device not found"
- The device may be offline (no connection for 7+ days)
- The device may not have Find My enabled
- Check the device name matches exactly (case-sensitive)

### "Location unavailable"
- Device is offline or in AirPlane Mode
- Location Services disabled on device
- Device has location sharing turned off

## References

- FindMy.py (Python reference): https://github.com/malmeloo/FindMy.py
- Alternative Node.js library: https://github.com/liamnichols/icloud-findmy
- Community Find My implementation: https://github.com/loganprit/apple-find-my-local