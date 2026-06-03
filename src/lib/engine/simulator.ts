import type { Device, Cable, Interface } from '$lib/types';

export interface PingStep {
  type: 'arp' | 'icmp' | 'routing' | 'result';
  fromDevice: string;
  fromInterface?: string;
  toDevice?: string;
  toInterface?: string;
  detail: string;
}

export interface PingResult {
  success: boolean;
  steps: PingStep[];
  roundTripTime?: number;
}

interface ArpEntry {
  ip: string;
  mac: string;
  age: number;
}

interface MacTableEntry {
  mac: string;
  interfaceId: string;
}

interface Neighbor {
  deviceId: string;
  interfaceId: string;
  peerDeviceId: string;
  peerInterfaceId: string;
}

function findInterface(device: Device, interfaceId: string): Interface | undefined {
  return device.interfaces.find(i => i.id === interfaceId);
}

function findInterfaceByIp(device: Device, ip: string): Interface | undefined {
  return device.interfaces.find(i => i.ipAddress === ip);
}

function ipInSubnet(ip: string, network: string, mask: string): boolean {
  const ipNum = ip.split('.').reduce((a, b) => (a << 8) + parseInt(b), 0) >>> 0;
  const netNum = network.split('.').reduce((a, b) => (a << 8) + parseInt(b), 0) >>> 0;
  const maskNum = mask.split('.').reduce((a, b) => (a << 8) + parseInt(b), 0) >>> 0;
  return (ipNum & maskNum) === (netNum & maskNum);
}

export class Simulator {
  private devices: Device[] = [];
  private cables: Cable[] = [];
  private adjacency: Map<string, Neighbor[]> = new Map();
  private arpTables: Map<string, ArpEntry[]> = new Map();
  private macTables: Map<string, MacTableEntry[]> = new Map();

  initialize(devices: Device[], cables: Cable[]) {
    this.devices = devices;
    this.cables = cables;
    this.adjacency = new Map();
    this.arpTables = new Map();
    this.macTables = new Map();

    for (const d of devices) {
      this.adjacency.set(d.id, []);
      this.arpTables.set(d.id, []);
      if (d.type === 'switch') this.macTables.set(d.id, []);
    }

    for (const cable of cables) {
      const n1: Neighbor = {
        deviceId: cable.from.deviceId,
        interfaceId: cable.from.interfaceId,
        peerDeviceId: cable.to.deviceId,
        peerInterfaceId: cable.to.interfaceId,
      };
      const n2: Neighbor = {
        deviceId: cable.to.deviceId,
        interfaceId: cable.to.interfaceId,
        peerDeviceId: cable.from.deviceId,
        peerInterfaceId: cable.from.interfaceId,
      };

      const list1 = this.adjacency.get(cable.from.deviceId);
      const list2 = this.adjacency.get(cable.to.deviceId);
      if (list1) list1.push(n1);
      if (list2) list2.push(n2);
    }
  }

  ping(sourceDeviceId: string, destIp: string): PingResult {
    const steps: PingStep[] = [];
    const source = this.devices.find(d => d.id === sourceDeviceId);
    if (!source) return { success: false, steps: [{ type: 'result', fromDevice: '?', detail: 'Source device not found' }] };

    const sourceIp = source.interfaces.find(i => i.ipAddress && i.status === 'up')?.ipAddress;
    const sourceIf = source.interfaces.find(i => i.ipAddress && i.status === 'up');
    if (!sourceIp || !sourceIf) {
      return { success: false, steps: [{ type: 'result', fromDevice: source.name, detail: `${source.name} has no IP configured` }] };
    }

    const dest = this.findDeviceByIp(destIp);
    if (!dest) {
      return { success: false, steps: [{ type: 'result', fromDevice: source.name, detail: `Destination ${destIp} not found in topology` }] };
    }

    const destIf = findInterfaceByIp(dest, destIp);

    steps.push({ type: 'icmp', fromDevice: source.name, fromInterface: sourceIf.name, detail: `${source.name} sending ICMP Echo Request to ${destIp}` });

    const path = this.findPath(sourceDeviceId, dest.id, steps);
    if (!path) {
      return { success: false, steps: [...steps, { type: 'result', fromDevice: source.name, detail: `No path to ${destIp}` }] };
    }

    const startTime = performance.now();

    for (let i = 0; i < path.length; i++) {
      const current = this.devices.find(d => d.id === path[i]);
      if (!current) continue;

      const isDest = current.id === dest.id;
      const isSource = current.id === sourceDeviceId;

      if (current.type === 'switch' && !isSource && !isDest) {
        const prevDeviceId = i > 0 ? path[i - 1] : null;
        const prevNeighbor = this.adjacency.get(current.id)?.find(
          n => n.peerDeviceId === prevDeviceId
        );
        const ingressIf = prevNeighbor?.interfaceId;
        if (ingressIf) {
          let macEntry = this.macTables.get(current.id)?.find(e => e.interfaceId === ingressIf);
          if (!macEntry) {
            const entry: MacTableEntry = { mac: 'dynamic', interfaceId: ingressIf };
            this.macTables.get(current.id)?.push(entry);
            steps.push({ type: 'routing', fromDevice: current.name, fromInterface: ingressIf, detail: `${current.name} learned MAC on ${ingressIf}, flooding to all ports` });
          } else {
            steps.push({ type: 'routing', fromDevice: current.name, fromInterface: ingressIf, detail: `${current.name} forwards to known port` });
          }
        }
        continue;
      }

      if (current.type === 'router' && !isDest && !isSource) {
        const nextDeviceId = i < path.length - 1 ? path[i + 1] : null;
        const route = current.config.routingTable.find(r => ipInSubnet(destIp, r.network, r.mask));

        if (route) {
          steps.push({ type: 'routing', fromDevice: current.name, fromInterface: route.interfaceId, detail: `${current.name} routing ${destIp} via ${route.nextHop} (${route.interfaceId})` });
        } else {
          const connectedIf = current.interfaces.find(iface =>
            iface.ipAddress && iface.status === 'up' && ipInSubnet(destIp, iface.ipAddress, iface.subnetMask || '255.255.255.0')
          );
          if (connectedIf) {
            steps.push({ type: 'routing', fromDevice: current.name, fromInterface: connectedIf.name, detail: `${current.name} directly connected via ${connectedIf.name}` });
          } else if (nextDeviceId) {
            const neighbor = this.adjacency.get(current.id)?.find(n => n.peerDeviceId === nextDeviceId);
            if (neighbor) {
              const outIf = findInterface(current, neighbor.interfaceId);
              steps.push({ type: 'routing', fromDevice: current.name, fromInterface: outIf?.name || neighbor.interfaceId, detail: `${current.name} forwarding to ${this.devices.find(d => d.id === nextDeviceId)?.name || nextDeviceId}` });
            }
          }
        }
      }
    }

    const endTime = performance.now();
    const rtt = Math.round((endTime - startTime) * 100) / 100;

    steps.push({
      type: 'result',
      fromDevice: dest.name,
      fromInterface: destIf?.name,
      detail: `Reply from ${destIp}: bytes=64 time=${rtt}ms TTL=64`,
    });

    return { success: true, steps, roundTripTime: rtt };
  }

  private findDeviceByIp(ip: string): Device | undefined {
    return this.devices.find(d =>
      d.interfaces.some(i => i.ipAddress === ip && i.status === 'up')
    );
  }

  private findPath(fromId: string, toId: string, steps: PingStep[]): string[] | null {
    if (fromId === toId) return [fromId];

    const visited = new Set<string>();
    const queue: { id: string; path: string[] }[] = [{ id: fromId, path: [fromId] }];
    visited.add(fromId);

    while (queue.length > 0) {
      const { id, path } = queue.shift()!;

      const neighbors = this.adjacency.get(id) || [];
      for (const neighbor of neighbors) {
        if (visited.has(neighbor.peerDeviceId)) continue;
        visited.add(neighbor.peerDeviceId);

        const a = this.devices.find(d => d.id === id);
        const b = this.devices.find(d => d.id === neighbor.peerDeviceId);
        const aIf = findInterface(a!, neighbor.interfaceId);
        const bIf = findInterface(b!, neighbor.peerInterfaceId);

        const status = aIf?.status === 'up' && bIf?.status === 'up' ? '⬆' : '⬇';
        steps.push({
          type: 'icmp',
          fromDevice: a?.name || id,
          fromInterface: aIf?.name || neighbor.interfaceId,
          toDevice: b?.name || neighbor.peerDeviceId,
          toInterface: bIf?.name || neighbor.peerInterfaceId,
          detail: `${a?.name || id} → ${b?.name || neighbor.peerDeviceId} via ${aIf?.name || neighbor.interfaceId} ${status}`,
        });

        if (aIf?.status !== 'up' || bIf?.status !== 'up') continue;

        const newPath = [...path, neighbor.peerDeviceId];
        if (neighbor.peerDeviceId === toId) return newPath;
        queue.push({ id: neighbor.peerDeviceId, path: newPath });
      }
    }

    return null;
  }
}

export const simulator = new Simulator();
