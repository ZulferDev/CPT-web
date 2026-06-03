import type { Device, Cable, Note, DeviceType, CableType, LinkEndpoint } from '$lib/types';

class EditorStore {
  devices = $state<Device[]>([]);
  cables = $state<Cable[]>([]);
  notes = $state<Note[]>([]);
  selectedDeviceId = $state<string | null>(null);
  selectedCableId = $state<string | null>(null);
  activeTool = $state<'select' | 'device' | 'cable' | 'note'>('select');
  activeDeviceType = $state<DeviceType>('router');
  activeCableType = $state<CableType>('copper');
  cableOrigin = $state<LinkEndpoint | null>(null);
  projectName = $state('Untitled');
  isModified = $state(false);
  gridSize = $state(20);

  addDevice(device: Device) {
    this.devices = [...this.devices, device];
    this.isModified = true;
  }

  removeDevice(id: string) {
    this.devices = this.devices.filter(d => d.id !== id);
    this.cables = this.cables.filter(c => c.from.deviceId !== id && c.to.deviceId !== id);
    this.isModified = true;
  }

  updateDevice(id: string, updates: Partial<Device>) {
    this.devices = this.devices.map(d =>
      d.id === id ? { ...d, ...updates } as Device : d
    );
    this.isModified = true;
  }

  addCable(cable: Cable) {
    this.cables = [...this.cables, cable];
    this.isModified = true;
  }

  removeCable(id: string) {
    this.cables = this.cables.filter(c => c.id !== id);
    this.isModified = true;
  }

  clearAll() {
    this.devices = [];
    this.cables = [];
    this.notes = [];
    this.selectedDeviceId = null;
    this.selectedCableId = null;
    this.isModified = true;
  }

  loadProject(devs: Device[], cabs: Cable[], nots: Note[], name: string) {
    this.devices = devs;
    this.cables = cabs;
    this.notes = nots;
    this.projectName = name;
    this.isModified = false;
    this.selectedDeviceId = null;
    this.selectedCableId = null;
  }
}

export const editor = new EditorStore();
