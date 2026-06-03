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

  projectId = $state<number | undefined>(undefined);
  createdAt = $state<string>(new Date().toISOString());
  lastSavedAt = $state<number | undefined>(undefined);
  revision = $state(0);

  private bump() {
    this.isModified = true;
    this.revision++;
  }

  addDevice(device: Device) {
    this.devices = [...this.devices, device];
    this.bump();
  }

  removeDevice(id: string) {
    this.devices = this.devices.filter(d => d.id !== id);
    this.cables = this.cables.filter(c => c.from.deviceId !== id && c.to.deviceId !== id);
    this.bump();
  }

  updateDevice(id: string, updates: Partial<Device>) {
    this.devices = this.devices.map(d =>
      d.id === id ? { ...d, ...updates } as Device : d
    );
    this.bump();
  }

  addCable(cable: Cable) {
    this.cables = [...this.cables, cable];
    this.bump();
  }

  removeCable(id: string) {
    this.cables = this.cables.filter(c => c.id !== id);
    this.bump();
  }

  clearAll() {
    this.devices = [];
    this.cables = [];
    this.notes = [];
    this.selectedDeviceId = null;
    this.selectedCableId = null;
    this.bump();
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

  loadProjectFull(devs: Device[], cabs: Cable[], nots: Note[], name: string, id: number | undefined, createdAt: string) {
    this.devices = devs;
    this.cables = cabs;
    this.notes = nots;
    this.projectName = name;
    this.projectId = id;
    this.createdAt = createdAt;
    this.isModified = false;
    this.selectedDeviceId = null;
    this.selectedCableId = null;
    this.revision = 0;
  }
}

export const editor = new EditorStore();
