# Apple Find Skill

An OpenClaw skill for querying Apple Find My network to locate and monitor Apple devices.

## Overview

This skill allows Ada (and other OpenClaw agents) to query the Apple Find My service to:
- List all devices associated with an iCloud account
- Get real-time location of devices
- Check device status (online/offline, battery level)
- Play sounds on devices to locate them
- Enable Lost Mode on devices

## Installation

```bash
cd agent-skills/apple-find
npm install
```

## Configuration

Set the following environment variables:

```bash
export APPLE_ID="your@email.com"
export APPLE_PASSWORD="your-app-specific-password"
```

**Important:** For accounts with 2FA enabled, generate an app-specific password at https://appleid.apple.com and use that as `APPLE_PASSWORD`.

## Usage

```bash
# List all devices
node index.js list

# Get location of a device
node index.js location "iPhone"

# Get full status
node index.js status

# Play sound on device
node index.js play-sound "iPhone"

# Enable Lost Mode
node index.js lost-mode "iPhone" --phone "07700900000"
```

## Supported Devices

- iPhone
- iPad
- Mac (MacBook, iMac, Mac Mini, etc.)
- Apple Watch
- AirPods
- AirTag

## Features

- **Device Listing**: View all devices associated with your iCloud account
- **Location Tracking**: Get GPS coordinates of device location
- **Status Monitoring**: Battery level, online/offline status, last seen time
- **Sound Playback**: Remotely play a sound to locate a device
- **Lost Mode**: Mark device as lost with optional phone number

## Testing

```bash
npm test
```

## Dependencies

- `findmy` - Node.js library for Apple Find My API
- `jest` - Testing framework

## Security

- Uses app-specific passwords (not main Apple ID password)
- Credentials stored in environment variables only
- No data sent to third-party servers
- All API calls go directly to Apple's services

## References

- FindMy.py (Python): https://github.com/malmeloo/FindMy.py
- iCloud FindMy Node: https://github.com/liamnichols/icloud-findmy

## License

MIT

## Author

Ada - Personal EA for Rob MacDonald