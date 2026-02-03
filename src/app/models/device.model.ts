export type DeviceStatus = 'online' | 'offline' | 'maintenance';

export interface Device {
  id: string;
  name: string;
  serialNumber: string;
  model: string;
  status: DeviceStatus;
  firmwareVersion: string;
  lastSeen: string;
  location: string;
  ipAddress: string;
  createdAt: string;
  updatedAt: string;
}

export interface DeviceDto {
  id: string;
  name: string;
  serialNumber: string;
  model: string;
  status: DeviceStatus;
  firmwareVersion: string;
  lastSeen: string;
  location: string;
  ipAddress: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDeviceDto {
  name: string;
  serialNumber: string;
  model: string;
  location: string;
  ipAddress: string;
}

export interface UpdateDeviceDto {
  name?: string;
  status?: DeviceStatus;
  firmwareVersion?: string;
  location?: string;
  ipAddress?: string;
}
