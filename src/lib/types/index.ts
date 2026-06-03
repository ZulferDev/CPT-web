export type DeviceType = 'router' | 'switch' | 'pc' | 'server' | 'hub' | 'laptop' | 'wireless-router';
export type CableType = 'copper' | 'serial' | 'console' | 'fiber';
export type InterfaceType = 'fast-ethernet' | 'gigabit-ethernet' | 'serial' | 'console' | 'vlan';
export type DeviceStatus = 'on' | 'off';
export type InterfaceStatus = 'up' | 'down';
export type PacketProtocol = 'ICMP' | 'TCP' | 'UDP' | 'ARP' | 'DHCP';

export interface Position {
  x: number;
  y: number;
}

export interface LinkEndpoint {
  deviceId: string;
  interfaceId: string;
}

export interface Interface {
  id: string;
  name: string;
  type: InterfaceType;
  macAddress: string;
  ipAddress?: string;
  subnetMask?: string;
  status: InterfaceStatus;
  connectedTo?: LinkEndpoint;
}

export interface RouteEntry {
  network: string;
  mask: string;
  nextHop: string;
  interfaceId: string;
  metric?: number;
}

export interface DeviceConfig {
  hostname: string;
  routingTable: RouteEntry[];
  startupConfig?: string;
}

export interface Device {
  id: string;
  type: DeviceType;
  name: string;
  model: string;
  position: Position;
  interfaces: Interface[];
  config: DeviceConfig;
  status: DeviceStatus;
}

export interface Cable {
  id: string;
  type: CableType;
  from: LinkEndpoint;
  to: LinkEndpoint;
  color?: string;
}

export interface Note {
  id: string;
  text: string;
  position: Position;
  color?: string;
}

export interface CptwFile {
  version: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  metadata: {
    author?: string;
    description?: string;
  };
  topology: {
    devices: Device[];
    cables: Cable[];
    notes: Note[];
  };
}
