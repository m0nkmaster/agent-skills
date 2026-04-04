/**
 * Apple Find Skill - Unit Tests
 * 
 * Tests for the Apple Find My skill functionality.
 */

const {
  parseArgs,
  getDevices,
  findDevice,
  cmdList,
  cmdLocation,
  cmdStatus,
  cmdPlaySound,
  cmdLostMode,
  cmdHelp,
} = require('../index.js');

// Mock environment variables
const originalEnv = { ...process.env };

beforeEach(() => {
  process.env.APPLE_ID = 'test@example.com';
  process.env.APPLE_PASSWORD = 'testpassword';
});

afterEach(() => {
  process.env = originalEnv;
});

describe('parseArgs', () => {
  test('parses list command', () => {
    process.argv = ['node', 'index.js', 'list'];
    const result = parseArgs();
    expect(result.command).toBe('list');
  });

  test('parses location command with device name', () => {
    process.argv = ['node', 'index.js', 'location', 'iPhone'];
    const result = parseArgs();
    expect(result.command).toBe('location');
    expect(result.options._[0]).toBe('iPhone');
  });

  test('parses status command', () => {
    process.argv = ['node', 'index.js', 'status'];
    const result = parseArgs();
    expect(result.command).toBe('status');
  });

  test('parses options correctly', () => {
    process.argv = ['node', 'index.js', 'lost-mode', 'iPhone', '--phone', '07700900000'];
    const result = parseArgs();
    expect(result.command).toBe('lost-mode');
    expect(result.options._[0]).toBe('iPhone');
    expect(result.options.phone).toBe('07700900000');
  });

  test('parses --all flag', () => {
    process.argv = ['node', 'index.js', 'location', '--all'];
    const result = parseArgs();
    expect(result.command).toBe('location');
    expect(result.options._[0]).toBe('--all');
  });
});

describe('getDevices', () => {
  test('returns array of devices', async () => {
    const devices = await getDevices();
    expect(devices).toHaveProperty('content');
    expect(Array.isArray(devices.content)).toBe(true);
    expect(devices.content.length).toBeGreaterThan(0);
  });

  test('devices have required properties', async () => {
    const devices = await getDevices();
    const device = devices.content[0];
    
    expect(device).toHaveProperty('id');
    expect(device).toHaveProperty('name');
    expect(device).toHaveProperty('model');
    expect(device).toHaveProperty('status');
    expect(device).toHaveProperty('location');
  });
});

describe('findDevice', () => {
  test('finds device by exact name', async () => {
    const devices = await findDevice('iPhone');
    expect(devices.length).toBeGreaterThan(0);
    expect(devices[0].name).toBe('iPhone');
  });

  test('finds device by partial name', async () => {
    const devices = await findDevice('Phone');
    expect(devices.length).toBeGreaterThan(0);
  });

  test('finds device by model name', async () => {
    const devices = await findDevice('MacBook');
    expect(devices.length).toBeGreaterThan(0);
  });

  test('returns all devices for null', async () => {
    const devices = await findDevice(null);
    expect(devices.length).toBe(3);
  });

  test('returns all devices for --all', async () => {
    const devices = await findDevice('--all');
    expect(devices.length).toBe(3);
  });

  test('throws error for non-existent device', async () => {
    await expect(findDevice('NonExistentDevice12345')).rejects.toThrow(
      'Device "NonExistentDevice12345" not found'
    );
  });
});

describe('CLI commands', () => {
  test('cmdHelp outputs help text', () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    cmdHelp();
    expect(consoleSpy).toHaveBeenCalled();
    expect(consoleSpy.mock.calls[0][0]).toContain('Apple Find Skill');
    consoleSpy.mockRestore();
  });

  test('cmdList outputs device list', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    await cmdList();
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  test('cmdLocation outputs location', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    await cmdLocation('iPhone', {});
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  test('cmdStatus outputs status', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    await cmdStatus('iPhone');
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  test('cmdPlaySound for online device', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    await cmdPlaySound('iPhone');
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  test('cmdPlaySound for offline device', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    await cmdPlaySound('MacBook Pro');
    expect(consoleSpy).toHaveBeenCalled();
    expect(consoleSpy.mock.calls.join('')).toContain('offline');
    consoleSpy.mockRestore();
  });

  test('cmdLostMode outputs correctly', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    await cmdLostMode('iPhone', { phone: '07700900000' });
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});

describe('Error handling', () => {
  test('missing APPLE_ID throws error', async () => {
    delete process.env.APPLE_ID;
    await expect(cmdList()).rejects.toThrow('APPLE_ID');
  });

  test('missing APPLE_PASSWORD throws error', async () => {
    delete process.env.APPLE_PASSWORD;
    await expect(cmdList()).rejects.toThrow('APPLE_PASSWORD');
  });
});