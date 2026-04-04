#!/usr/bin/env node

/**
 * Apple Find Skill - Main Entry Point
 * 
 * Query Apple Find My network to locate Apple devices.
 * Supports: iPhone, iPad, Mac, Apple Watch, AirPods, AirTag
 * 
 * Usage:
 *   node index.js list                      # List all devices
 *   node index.js location "iPhone"         # Get location of device
 *   node index.js status                    # Full status of all devices
 *   node index.js status "iPhone"           # Status of specific device
 *   node index.js play-sound "iPhone"       # Play sound on device
 *   node index.js lost-mode "iPhone"        # Enable lost mode
 */

const https = require('https');
const http = require('http');
const { URL } = require('url');

// Configuration
const APPLE_ID = process.env.APPLE_ID;
const APPLE_PASSWORD = process.env.APPLE_PASSWORD;

const FINDMY_API = 'fmip.icloud.com';
const FINDMY_API_VERSION = 'v3';

/**
 * Parse command line arguments
 */
function parseArgs() {
  const args = process.argv.slice(2);
  const command = args[0] || 'help';
  const options = {};
  
  let i = 1;
  while (i < args.length) {
    const arg = args[i];
    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      options[key] = args[i + 1] !== undefined && !args[i + 1].startsWith('--') 
        ? args[++i] 
        : true;
    } else if (!options._) {
      options._ = [];
    }
    i++;
  }
  
  // If first arg is not a known command, treat it as device name for backward compat
  if (command !== 'list' && command !== 'status' && command !== 'location' && 
      command !== 'help' && command !== 'play-sound' && command !== 'lost-mode') {
    options._ = [command];
    return { command: 'status', options };
  }
  
  return { command, options };
}

/**
 * Make HTTP request to Apple Find My API
 */
function makeRequest(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, `https://${FINDMY_API}`);
    
    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname,
      method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'FindMy/3.0.0 iOS/17.0.0',
      },
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch {
          resolve(body);
        }
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

/**
 * Authenticate with iCloud
 */
async function authenticate() {
  if (!APPLE_ID || !APPLE_PASSWORD) {
    throw new Error('APPLE_ID and APPLE_PASSWORD environment variables are required');
  }

  // Note: In a real implementation, this would handle the full OAuth flow
  // including 2FA if enabled. For simplicity, we use a basic approach.
  // The findmy npm package handles this better.
  
  const authData = {
    appleId: APPLE_ID,
    password: APPLE_PASSWORD,
    trustToken: process.env.APPLE_TRUST_TOKEN || null,
  };

  try {
    const response = await makeRequest(
      `/${FINDMY_API_VERSION}/authenticate`,
      'POST',
      authData
    );
    return response;
  } catch (error) {
    throw new Error(`Authentication failed: ${error.message}`);
  }
}

/**
 * Get all devices from Find My
 */
async function getDevices() {
  // This would use the findmy library in production
  // For scaffold purposes, we show the expected structure
  
  // Placeholder: In real implementation, this calls the Find My API
  // via the findmy npm package
  return {
    content: [
      {
        id: 'DEVICE_ID_1',
        name: 'iPhone',
        model: 'iPhone 15 Pro',
        deviceModel: 'iPhone15,3',
        batteryLevel: 85,
        location: {
          latitude: 53.5814,
          longitude: -1.5698,
          timestamp: new Date().toISOString(),
          horizontalAccuracy: 10,
        },
        status: 'online',
        deviceStatus: '200',
      },
      {
        id: 'DEVICE_ID_2',
        name: 'MacBook Pro',
        model: 'MacBook Pro 16"',
        deviceModel: 'MacBookPro18,1',
        batteryLevel: null,
        location: {
          latitude: 53.5814,
          longitude: -1.5698,
          timestamp: new Date().toISOString(),
          horizontalAccuracy: 20,
        },
        status: 'offline',
        deviceStatus: '204',
      },
      {
        id: 'DEVICE_ID_3',
        name: 'Apple Watch',
        model: 'Apple Watch Ultra 2',
        deviceModel: 'Watch6,14',
        batteryLevel: 62,
        location: {
          latitude: 53.5814,
          longitude: -1.5698,
          timestamp: new Date().toISOString(),
          horizontalAccuracy: 15,
        },
        status: 'online',
        deviceStatus: '200',
      },
    ],
  };
}

/**
 * Find device by name (partial match)
 */
async function findDevice(deviceName) {
  const devices = await getDevices();
  
  if (!deviceName || deviceName === '--all') {
    return devices.content;
  }
  
  const normalizedName = deviceName.toLowerCase();
  const matches = devices.content.filter(d => 
    d.name.toLowerCase().includes(normalizedName) ||
    d.model.toLowerCase().includes(normalizedName)
  );
  
  if (matches.length === 0) {
    throw new Error(`Device "${deviceName}" not found. Run 'list' to see all devices.`);
  }
  
  return matches;
}

/**
 * Command: list - List all devices
 */
async function cmdList() {
  console.log('\n📍 Apple Find My Devices\n');
  console.log('═'.repeat(60));
  
  const devices = await getDevices();
  
  if (!devices.content || devices.content.length === 0) {
    console.log('No devices found.');
    return;
  }
  
  devices.content.forEach(device => {
    const status = device.status === 'online' ? '🟢 Online' : '🔴 Offline';
    const battery = device.batteryLevel !== null ? `🔋 ${device.batteryLevel}%` : '';
    
    console.log(`\n${device.name}`);
    console.log(`  Model: ${device.model}`);
    console.log(`  Status: ${status} ${battery}`);
    console.log(`  ID: ${device.id}`);
  });
  
  console.log('\n' + '═'.repeat(60));
}

/**
 * Command: location - Get device location
 */
async function cmdLocation(deviceName, options) {
  const devices = await findDevice(deviceName);
  
  console.log('\n📍 Device Locations\n');
  console.log('═'.repeat(60));
  
  for (const device of devices) {
    console.log(`\n${device.name} (${device.model})`);
    console.log(`  Status: ${device.status}`);
    
    if (device.location) {
      console.log(`  Latitude: ${device.location.latitude}`);
      console.log(`  Longitude: ${device.location.longitude}`);
      console.log(`  Accuracy: ±${device.location.horizontalAccuracy}m`);
      console.log(`  Last seen: ${new Date(device.location.timestamp).toLocaleString()}`);
    } else {
      console.log('  Location: Not available (device may be offline)');
    }
  }
  
  console.log('\n' + '═'.repeat(60));
}

/**
 * Command: status - Get full device status
 */
async function cmdStatus(deviceName) {
  const devices = await findDevice(deviceName);
  
  console.log('\n📊 Device Status\n');
  console.log('═'.repeat(60));
  
  for (const device of devices) {
    console.log(`\n${device.name}`);
    console.log(`  Model: ${device.model}`);
    console.log(`  Device ID: ${device.id}`);
    console.log(`  Status: ${device.status}`);
    
    if (device.batteryLevel !== null) {
      console.log(`  Battery: ${device.batteryLevel}%`);
    }
    
    if (device.location) {
      console.log(`  Location: ${device.location.latitude}, ${device.location.longitude}`);
      console.log(`  Accuracy: ±${device.location.horizontalAccuracy}m`);
      console.log(`  Updated: ${new Date(device.location.timestamp).toLocaleString()}`);
    } else {
      console.log('  Location: Not available');
    }
    
    console.log(`  API Status Code: ${device.deviceStatus}`);
  }
  
  console.log('\n' + '═'.repeat(60));
}

/**
 * Command: play-sound - Play sound on device
 */
async function cmdPlaySound(deviceName) {
  const devices = await findDevice(deviceName);
  
  if (devices.length > 1) {
    console.log(`\n⚠️  Multiple devices match "${deviceName}":`);
    devices.forEach((d, i) => console.log(`  ${i + 1}. ${d.name} (${d.model})`));
    console.log('\nPlease specify a more precise device name.\n');
    return;
  }
  
  const device = devices[0];
  
  if (device.status !== 'online') {
    console.log(`\n❌ Cannot play sound: ${device.name} is offline.\n`);
    return;
  }
  
  console.log(`\n🔔 Playing sound on ${device.name}...`);
  console.log('  (In production, this would send a request to Apple\'s API)\n');
}

/**
 * Command: lost-mode - Enable lost mode
 */
async function cmdLostMode(deviceName, options) {
  const devices = await findDevice(deviceName);
  
  if (devices.length > 1) {
    console.log(`\n⚠️  Multiple devices match "${deviceName}":`);
    devices.forEach((d, i) => console.log(`  ${i + 1}. ${d.name} (${d.model})`));
    console.log('\nPlease specify a more precise device name.\n');
    return;
  }
  
  const device = devices[0];
  const phone = options.phone || null;
  
  console.log(`\n🔒 Enabling Lost Mode on ${device.name}...`);
  if (phone) {
    console.log(`  Phone number: ${phone}`);
  }
  console.log('  (In production, this would send a request to Apple\'s API)\n');
}

/**
 * Command: help - Show help
 */
function cmdHelp() {
  console.log(`
📍 Apple Find Skill

Usage:
  node index.js <command> [deviceName] [options]

Commands:
  list                      List all devices
  location [deviceName]     Get location of device(s)
  status [deviceName]       Get full status of device(s)
  play-sound <deviceName>   Play sound on device
  lost-mode <deviceName>    Enable Lost Mode
  help                      Show this help

Options:
  --all                     Apply to all devices
  --phone <number>          Phone number for Lost Mode

Environment Variables:
  APPLE_ID           Your Apple ID email
  APPLE_PASSWORD     Your Apple ID password or app-specific password

Examples:
  node index.js list
  node index.js location "iPhone"
  node index.js status
  node index.js play-sound "iPhone"
  node index.js lost-mode "MacBook Pro" --phone "07700900000"
`);
}

/**
 * Main entry point
 */
async function main() {
  const { command, options } = parseArgs();
  
  try {
    // Check for help
    if (command === 'help' || command === '--help' || command === '-h') {
      cmdHelp();
      return;
    }
    
    // Check for credentials
    if (!APPLE_ID || !APPLE_PASSWORD) {
      console.error('\n❌ Error: APPLE_ID and APPLE_PASSWORD are required\n');
      console.error('Set them in your environment:');
      console.error('  export APPLE_ID="your@email.com"');
      console.error('  export APPLE_PASSWORD="your-password-or-app-specific-password"\n');
      process.exit(1);
    }
    
    // Route command
    switch (command) {
      case 'list':
        await cmdList();
        break;
        
      case 'location':
        const locDevice = options._ ? options._[0] : null;
        await cmdLocation(locDevice, options);
        break;
        
      case 'status':
        const statusDevice = options._ ? options._[0] : null;
        await cmdStatus(statusDevice);
        break;
        
      case 'play-sound':
        const soundDevice = options._ ? options._[0] : null;
        if (!soundDevice) {
          console.error('\n❌ Error: Device name required\n');
          cmdHelp();
          process.exit(1);
        }
        await cmdPlaySound(soundDevice);
        break;
        
      case 'lost-mode':
        const lostDevice = options._ ? options._[0] : null;
        if (!lostDevice) {
          console.error('\n❌ Error: Device name required\n');
          cmdHelp();
          process.exit(1);
        }
        await cmdLostMode(lostDevice, options);
        break;
        
      default:
        console.error(`\n❌ Unknown command: ${command}\n`);
        cmdHelp();
        process.exit(1);
    }
  } catch (error) {
    console.error(`\n❌ Error: ${error.message}\n`);
    process.exit(1);
  }
}

// Export for testing
module.exports = {
  parseArgs,
  makeRequest,
  authenticate,
  getDevices,
  findDevice,
  cmdList,
  cmdLocation,
  cmdStatus,
  cmdPlaySound,
  cmdLostMode,
  cmdHelp,
};

// Run if executed directly
if (require.main === module) {
  main();
}