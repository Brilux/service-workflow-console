/**
 * Seed script for generating mock data for json-server
 * Run: node mock-api/seed-data.js
 */

const fs = require('fs');
const path = require('path');

// Deterministic random number generator (seeded)
function seededRandom(seed) {
  let value = seed;
  return function() {
    value = (value * 16807) % 2147483647;
    return (value - 1) / 2147483646;
  };
}

const random = seededRandom(42);

function randomElement(arr) {
  return arr[Math.floor(random() * arr.length)];
}

function randomInt(min, max) {
  return Math.floor(random() * (max - min + 1)) + min;
}

function generateId() {
  return Math.random().toString(36).substring(2, 11);
}

function randomDate(start, end) {
  const startTime = start.getTime();
  const endTime = end.getTime();
  const randomTime = startTime + random() * (endTime - startTime);
  return new Date(randomTime).toISOString();
}

// Device data generators
const deviceModels = [
  'SensorHub-3000', 'GatewayPro-X1', 'EdgeNode-500', 'DataCollector-200',
  'IoTBridge-100', 'SmartMeter-A1', 'ControlUnit-C5', 'MonitorStation-M2'
];

const locations = [
  'Building A - Floor 1', 'Building A - Floor 2', 'Building A - Basement',
  'Building B - Floor 1', 'Building B - Floor 2', 'Building B - Roof',
  'Building C - Floor 1', 'Building C - Server Room',
  'Warehouse - Section A', 'Warehouse - Section B',
  'Production Line 1', 'Production Line 2', 'Production Line 3',
  'Outdoor - North Perimeter', 'Outdoor - South Gate'
];

const firmwareVersions = [
  '1.0.0', '1.0.1', '1.1.0', '1.2.0', '1.2.1', '2.0.0', '2.0.1', '2.1.0'
];

const deviceStatuses = ['online', 'offline', 'maintenance'];

// Ticket data generators
const ticketTitles = [
  'Device not responding', 'Firmware update required', 'Sensor calibration needed',
  'Network connectivity issues', 'Battery replacement', 'Scheduled maintenance',
  'Data anomaly detected', 'Hardware malfunction', 'Configuration error',
  'Performance degradation', 'Security patch required', 'Device relocation',
  'Replace faulty component', 'Diagnostic check', 'System reset needed'
];

const ticketDescriptions = [
  'Device has stopped sending telemetry data and requires investigation.',
  'Current firmware version is outdated and needs to be updated to the latest stable release.',
  'Sensor readings are showing drift from expected baseline values.',
  'Device is experiencing intermittent connectivity drops to the central server.',
  'Battery level is critically low and requires immediate replacement.',
  'Regular scheduled maintenance as per the service agreement.',
  'Unusual patterns detected in the device data that require analysis.',
  'Hardware component appears to be malfunctioning and may need replacement.',
  'Configuration settings are incorrect and causing operational issues.',
  'Device performance has degraded significantly compared to baseline.',
  'Critical security vulnerability identified that requires patching.',
  'Device needs to be physically moved to a new location.',
  'Identified faulty component that needs to be replaced under warranty.',
  'Comprehensive diagnostic check requested by the operations team.',
  'Device requires a full system reset to restore normal operation.'
];

const users = [
  { id: 'user-1', username: 'admin', displayName: 'System Admin', role: 'admin' },
  { id: 'user-2', username: 'jsmith', displayName: 'John Smith', role: 'technician' },
  { id: 'user-3', username: 'mjohnson', displayName: 'Mary Johnson', role: 'technician' },
  { id: 'user-4', username: 'viewer1', displayName: 'Operations Viewer', role: 'viewer' }
];

const ticketStatuses = ['new', 'in_progress', 'waiting_parts', 'done'];
const ticketPriorities = ['low', 'medium', 'high', 'critical'];
const ticketTypes = ['maintenance', 'rma', 'inspection', 'repair'];

const auditActions = {
  device: ['device_created', 'device_updated', 'device_status_changed'],
  ticket: ['ticket_created', 'ticket_updated', 'ticket_status_changed', 'ticket_assigned']
};

// Generate devices
function generateDevices(count) {
  const devices = [];
  const now = new Date();
  const threeMonthsAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

  for (let i = 1; i <= count; i++) {
    const createdAt = randomDate(threeMonthsAgo, now);
    const status = randomElement(deviceStatuses);
    const lastSeen = status === 'online'
      ? new Date(now.getTime() - randomInt(0, 60) * 60 * 1000).toISOString()
      : randomDate(new Date(createdAt), now);

    devices.push({
      id: `device-${String(i).padStart(3, '0')}`,
      name: `${randomElement(deviceModels)}-${String(i).padStart(4, '0')}`,
      serialNumber: `SN-${String(randomInt(100000, 999999))}`,
      model: randomElement(deviceModels),
      status: status,
      firmwareVersion: randomElement(firmwareVersions),
      lastSeen: lastSeen,
      location: randomElement(locations),
      ipAddress: `192.168.${randomInt(1, 255)}.${randomInt(1, 254)}`,
      createdAt: createdAt,
      updatedAt: randomDate(new Date(createdAt), now)
    });
  }

  return devices;
}

// Generate tickets
function generateTickets(count, devices) {
  const tickets = [];
  const now = new Date();
  const twoMonthsAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

  for (let i = 1; i <= count; i++) {
    const device = randomElement(devices);
    const status = randomElement(ticketStatuses);
    const createdAt = randomDate(twoMonthsAgo, now);
    const titleIndex = randomInt(0, ticketTitles.length - 1);

    const assignee = status !== 'new' && random() > 0.3
      ? randomElement(users.filter(u => u.role !== 'viewer'))
      : null;

    tickets.push({
      id: `ticket-${String(i).padStart(4, '0')}`,
      title: ticketTitles[titleIndex],
      description: ticketDescriptions[titleIndex],
      status: status,
      priority: randomElement(ticketPriorities),
      type: randomElement(ticketTypes),
      deviceId: device.id,
      deviceName: device.name,
      assigneeId: assignee?.id || null,
      assigneeName: assignee?.displayName || null,
      createdBy: randomElement(users).displayName,
      createdAt: createdAt,
      updatedAt: randomDate(new Date(createdAt), now)
    });
  }

  return tickets;
}

// Generate audit logs
function generateAuditLogs(devices, tickets) {
  const logs = [];
  const now = new Date();
  let logId = 1;

  // Generate logs for devices
  devices.forEach(device => {
    // Creation log
    logs.push({
      id: `log-${String(logId++).padStart(5, '0')}`,
      entityType: 'device',
      entityId: device.id,
      action: 'device_created',
      changes: {},
      performedBy: randomElement(users).displayName,
      performedAt: device.createdAt,
      description: `Device ${device.name} was created`
    });

    // Some devices have update logs
    if (random() > 0.5) {
      const updateDate = randomDate(new Date(device.createdAt), now);
      logs.push({
        id: `log-${String(logId++).padStart(5, '0')}`,
        entityType: 'device',
        entityId: device.id,
        action: 'device_updated',
        changes: {
          firmwareVersion: { old: '1.0.0', new: device.firmwareVersion }
        },
        performedBy: randomElement(users.filter(u => u.role !== 'viewer')).displayName,
        performedAt: updateDate,
        description: `Device ${device.name} firmware was updated`
      });
    }

    // Status change logs
    if (device.status !== 'online' && random() > 0.3) {
      logs.push({
        id: `log-${String(logId++).padStart(5, '0')}`,
        entityType: 'device',
        entityId: device.id,
        action: 'device_status_changed',
        changes: {
          status: { old: 'online', new: device.status }
        },
        performedBy: 'System',
        performedAt: device.updatedAt,
        description: `Device ${device.name} status changed to ${device.status}`
      });
    }
  });

  // Generate logs for tickets
  tickets.forEach(ticket => {
    // Creation log
    logs.push({
      id: `log-${String(logId++).padStart(5, '0')}`,
      entityType: 'ticket',
      entityId: ticket.id,
      action: 'ticket_created',
      changes: {},
      performedBy: ticket.createdBy,
      performedAt: ticket.createdAt,
      description: `Ticket "${ticket.title}" was created`
    });

    // Status progression logs for non-new tickets
    if (ticket.status !== 'new') {
      const statusProgressionDate = randomDate(new Date(ticket.createdAt), new Date(ticket.updatedAt));
      logs.push({
        id: `log-${String(logId++).padStart(5, '0')}`,
        entityType: 'ticket',
        entityId: ticket.id,
        action: 'ticket_status_changed',
        changes: {
          status: { old: 'new', new: ticket.status === 'done' ? 'in_progress' : ticket.status }
        },
        performedBy: ticket.assigneeName || randomElement(users.filter(u => u.role !== 'viewer')).displayName,
        performedAt: statusProgressionDate,
        description: `Ticket status changed from New to ${ticket.status === 'done' ? 'In Progress' : ticket.status}`
      });

      // Additional status change for done tickets
      if (ticket.status === 'done') {
        logs.push({
          id: `log-${String(logId++).padStart(5, '0')}`,
          entityType: 'ticket',
          entityId: ticket.id,
          action: 'ticket_status_changed',
          changes: {
            status: { old: 'in_progress', new: 'done' }
          },
          performedBy: ticket.assigneeName || randomElement(users.filter(u => u.role !== 'viewer')).displayName,
          performedAt: ticket.updatedAt,
          description: 'Ticket status changed from In Progress to Done'
        });
      }
    }

    // Assignment logs
    if (ticket.assigneeId) {
      logs.push({
        id: `log-${String(logId++).padStart(5, '0')}`,
        entityType: 'ticket',
        entityId: ticket.id,
        action: 'ticket_assigned',
        changes: {
          assigneeId: { old: null, new: ticket.assigneeId },
          assigneeName: { old: null, new: ticket.assigneeName }
        },
        performedBy: randomElement(users.filter(u => u.role === 'admin')).displayName,
        performedAt: randomDate(new Date(ticket.createdAt), new Date(ticket.updatedAt)),
        description: `Ticket assigned to ${ticket.assigneeName}`
      });
    }
  });

  // Sort logs by date
  logs.sort((a, b) => new Date(b.performedAt).getTime() - new Date(a.performedAt).getTime());

  return logs;
}

// Main function
function generateDatabase() {
  console.log('Generating mock data...');

  const devices = generateDevices(30);
  const tickets = generateTickets(50, devices);
  const auditLogs = generateAuditLogs(devices, tickets);

  const db = {
    devices,
    tickets,
    auditLogs,
    users
  };

  const outputPath = path.join(__dirname, 'db.json');
  fs.writeFileSync(outputPath, JSON.stringify(db, null, 2));

  console.log(`Generated:`);
  console.log(`  - ${devices.length} devices`);
  console.log(`  - ${tickets.length} tickets`);
  console.log(`  - ${auditLogs.length} audit logs`);
  console.log(`  - ${users.length} users`);
  console.log(`\nData written to ${outputPath}`);
}

generateDatabase();
