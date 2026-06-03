<script lang="ts">
  import { onMount } from 'svelte';
  import { editor } from '$lib/stores/editor.svelte';
  import type { Device, Position, DeviceType, Interface, Cable, LinkEndpoint } from '$lib/types';

  let container: HTMLDivElement;
  let stage: import('konva').default.Stage;
  let Konva: typeof import('konva').default;
  let gridLayer: Konva.Layer;
  let deviceLayer: Konva.Layer;
  let cableLayer: Konva.Layer;
  let previewLayer: Konva.Layer;
  let previewLine: Konva.Line | null = null;

  const GRID = 20;

  onMount(async () => {
    const KonvaModule = await import('konva');
    Konva = KonvaModule.default;
    const rect = container.getBoundingClientRect();
    stage = new Konva.Stage({ container, width: rect.width, height: rect.height });

    gridLayer = new Konva.Layer(); gridLayer.name('grid');
    cableLayer = new Konva.Layer(); cableLayer.name('cables');
    deviceLayer = new Konva.Layer(); deviceLayer.name('devices');
    previewLayer = new Konva.Layer(); previewLayer.name('preview');
    stage.add(gridLayer);
    stage.add(cableLayer);
    stage.add(deviceLayer);
    stage.add(previewLayer);

    drawGrid();
    bindEvents();

    const ro = new ResizeObserver(() => {
      const r = container.getBoundingClientRect();
      stage.width(r.width);
      stage.height(r.height);
      drawGrid();
    });
    ro.observe(container);

    document.addEventListener('keydown', handleKeydown);

    return () => {
      ro.disconnect();
      document.removeEventListener('keydown', handleKeydown);
      stage?.destroy();
    };
  });

  $effect(() => {
    const devs = editor.devices;
    const cabs = editor.cables;
    const sel = editor.selectedDeviceId;
    if (!stage || !deviceLayer) return;
    redrawDevices();
    redrawCables();
  });

  function bindEvents() {
    let isPanning = false;
    let lastPos: Position = { x: 0, y: 0 };

    stage.on('wheel', (e) => {
      e.evt.preventDefault();
      const oldScale = stage.scaleX();
      const pointer = stage.getPointerPosition()!;
      const scaleBy = 1.1;
      const newScale = e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy;
      stage.scale({ x: newScale, y: newScale });
      const newPos = {
        x: pointer.x - (pointer.x - stage.x()) / oldScale * newScale,
        y: pointer.y - (pointer.y - stage.y()) / oldScale * newScale,
      };
      stage.position(newPos);
      stage.batchDraw();
    });

    stage.on('mousedown', (e) => {
      if (e.evt.button === 1 || e.evt.shiftKey) {
        isPanning = true;
        lastPos = stage.getPointerPosition()!;
        stage.container().style.cursor = 'grabbing';
        return;
      }

      const targetLayer = e.target.getLayer?.();
      const clickedOnEmpty = targetLayer === gridLayer || e.target === stage;

      if (clickedOnEmpty && editor.activeTool === 'device') {
        addDeviceFromPalette(stage.getPointerPosition()!);
        return;
      }

      if (clickedOnEmpty && editor.activeTool === 'select') {
        editor.selectedDeviceId = null;
        editor.cableOrigin = null;
      }
    });

    stage.on('mousemove', () => {
      if (isPanning) {
        const pos = stage.getPointerPosition()!;
        stage.position({
          x: stage.x() + pos.x - lastPos.x,
          y: stage.y() + pos.y - lastPos.y,
        });
        lastPos = pos;
        stage.batchDraw();
      }

      if (editor.activeTool === 'cable' && editor.cableOrigin && previewLine) {
        const pos = stage.getPointerPosition()!;
        const scale = stage.scaleX();
        const worldPos = {
          x: (pos.x - stage.x()) / scale,
          y: (pos.y - stage.y()) / scale,
        };
        const points = previewLine.points();
        previewLine.points([points[0], points[1], worldPos.x, worldPos.y]);
        previewLayer.batchDraw();
      }
    });

    stage.on('mouseup', () => {
      isPanning = false;
      stage.container().style.cursor = 'default';
    });

    stage.on('contextmenu', (e) => {
      e.evt.preventDefault();
    });
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Delete' || e.key === 'Backspace') {
      if (editor.selectedDeviceId) {
        editor.removeDevice(editor.selectedDeviceId);
        editor.selectedDeviceId = null;
      }
    }
    if (e.key === 'Escape') {
      editor.cableOrigin = null;
      if (previewLine) { previewLine.destroy(); previewLine = null; previewLayer.draw(); }
    }
  }

  function handleDeviceClick(dev: Device, e: Konva.KonvaEventObject<MouseEvent>) {
    if (editor.activeTool === 'cable') {
      handleCableClick(dev, e);
      return;
    }
    editor.selectedDeviceId = dev.id;
  }

  const CABLE_IFACE_MAP: Record<CableType, InterfaceType> = {
    copper: 'fast-ethernet',
    serial: 'serial',
    console: 'console',
    fiber: 'gigabit-ethernet',
  };

  function handleCableClick(dev: Device, e: Konva.KonvaEventObject<MouseEvent>) {
    const origin = editor.cableOrigin;
    const targetIface = dev.interfaces.find(i => i.type === CABLE_IFACE_MAP[editor.activeCableType] || i.type === 'fast-ethernet');
    if (!targetIface) return;

    if (!origin) {
      editor.cableOrigin = { deviceId: dev.id, interfaceId: targetIface.id };
      const pos = stage.getPointerPosition()!;
      const scale = stage.scaleX();
      const worldPos = {
        x: (pos.x - stage.x()) / scale,
        y: (pos.y - stage.y()) / scale,
      };
      previewLine = new Konva.Line({
        points: [dev.position.x, dev.position.y, worldPos.x, worldPos.y],
        stroke: editor.activeCableType === 'serial' ? '#ed8936' : editor.activeCableType === 'console' ? '#a0aec0' : '#4299e1',
        strokeWidth: 2,
        dash: [5, 5],
        lineCap: 'round',
      });
      previewLayer.add(previewLine);
      previewLayer.draw();
    } else if (origin.deviceId !== dev.id) {
      const cable: Cable = {
        id: crypto.randomUUID(),
        type: editor.activeCableType,
        from: origin,
        to: { deviceId: dev.id, interfaceId: targetIface.id },
      };
      editor.addCable(cable);
      editor.cableOrigin = null;
      if (previewLine) { previewLine.destroy(); previewLine = null; previewLayer.draw(); }
    }
  }

  function drawGrid() {
    if (!gridLayer) return;
    gridLayer.destroyChildren();
    const rect = container.getBoundingClientRect();

    gridLayer.add(new Konva.Rect({
      x: 0, y: 0, width: rect.width, height: rect.height,
      fill: '#1a202c', name: 'bg',
    }));

    for (let x = 0; x < rect.width; x += GRID) {
      gridLayer.add(new Konva.Line({ points: [x, 0, x, rect.height], stroke: '#2d3748', strokeWidth: 0.5 }));
    }
    for (let y = 0; y < rect.height; y += GRID) {
      gridLayer.add(new Konva.Line({ points: [0, y, rect.width, y], stroke: '#2d3748', strokeWidth: 0.5 }));
    }
    gridLayer.draw();
    gridLayer.moveToBottom();
  }

  function snapToGrid(pos: Position): Position {
    return { x: Math.round(pos.x / GRID) * GRID, y: Math.round(pos.y / GRID) * GRID };
  }

  function generateMAC(): string {
    const hex = '0123456789ABCDEF';
    let mac = '';
    for (let i = 0; i < 6; i++) {
      mac += hex[Math.floor(Math.random() * 16)] + hex[Math.floor(Math.random() * 16)];
      if (i < 5) mac += ':';
    }
    return mac;
  }

  function createDefaultInterfaces(type: DeviceType): Interface[] {
    switch (type) {
      case 'router':
        return [
          { id: crypto.randomUUID(), name: 'GigabitEthernet0/0', type: 'gigabit-ethernet', macAddress: generateMAC(), status: 'down' },
          { id: crypto.randomUUID(), name: 'GigabitEthernet0/1', type: 'gigabit-ethernet', macAddress: generateMAC(), status: 'down' },
          { id: crypto.randomUUID(), name: 'Serial0/0/0', type: 'serial', macAddress: generateMAC(), status: 'down' },
        ];
      case 'switch':
        return Array.from({ length: 8 }, (_, i) => ({
          id: crypto.randomUUID(), name: `FastEthernet0/${i}`, type: 'fast-ethernet' as const,
          macAddress: generateMAC(), status: 'down' as const,
        }));
      case 'server':
        return [
          { id: crypto.randomUUID(), name: 'GigabitEthernet0', type: 'gigabit-ethernet', macAddress: generateMAC(), status: 'down' },
        ];
      case 'hub':
        return Array.from({ length: 4 }, (_, i) => ({
          id: crypto.randomUUID(), name: `Port${i}`, type: 'fast-ethernet' as const,
          macAddress: generateMAC(), status: 'down' as const,
        }));
      default:
        return [
          { id: crypto.randomUUID(), name: 'FastEthernet0', type: 'fast-ethernet', macAddress: generateMAC(), status: 'down' },
        ];
    }
  }

  const DEVICE_COLORS: Record<DeviceType, string> = {
    router: '#2b6cb0', switch: '#2f855a', pc: '#6b46c1',
    server: '#c05621', hub: '#d69e2e', laptop: '#6b46c1',
    'wireless-router': '#319795',
  };

  const DEVICE_SIZES: Record<DeviceType, { w: number; h: number }> = {
    router: { w: 80, h: 50 }, switch: { w: 80, h: 40 }, pc: { w: 60, h: 50 },
    server: { w: 60, h: 60 }, hub: { w: 60, h: 40 }, laptop: { w: 60, h: 45 },
    'wireless-router': { w: 70, h: 50 },
  };

  function addDeviceFromPalette(pos: Position) {
    const scale = stage.scaleX();
    const worldPos = {
      x: (pos.x - stage.x()) / scale,
      y: (pos.y - stage.y()) / scale,
    };
    const snapped = snapToGrid(worldPos);

    const dev: Device = {
      id: crypto.randomUUID(),
      type: editor.activeDeviceType,
      name: `${editor.activeDeviceType.charAt(0).toUpperCase() + editor.activeDeviceType.slice(1)}-${editor.devices.length + 1}`,
      model: editor.activeDeviceType === 'router' ? '2811' : editor.activeDeviceType === 'switch' ? '2960' : 'Unknown',
      position: snapped,
      interfaces: createDefaultInterfaces(editor.activeDeviceType),
      config: { hostname: `Device${editor.devices.length + 1}`, routingTable: [] },
      status: 'on',
    };
    editor.addDevice(dev);
  }

  function createDeviceGroup(dev: Device): Konva.Group {
    const size = DEVICE_SIZES[dev.type] || { w: 60, h: 40 };
    const color = DEVICE_COLORS[dev.type] || '#666';
    const isSelected = editor.selectedDeviceId === dev.id;
    const group = new Konva.Group({
      x: dev.position.x, y: dev.position.y,
      draggable: true, id: dev.id,
    });

    const iconMap: Record<DeviceType, string> = {
      router: 'Router', switch: 'SW', pc: 'PC', server: 'Server',
      hub: 'Hub', laptop: 'Laptop', 'wireless-router': 'WAP',
    };

    if (dev.type === 'router' || dev.type === 'wireless-router') {
      group.add(new Konva.Circle({
        radius: Math.max(size.w, size.h) / 2,
        fill: color, stroke: isSelected ? '#ffd700' : '#4a5568',
        strokeWidth: isSelected ? 3 : 2, opacity: 0.9,
      }));
      group.add(new Konva.Text({
        text: iconMap[dev.type], fontSize: 10, fill: 'white',
        align: 'center', verticalAlign: 'middle', width: size.w, height: size.h,
        x: -size.w / 2, y: -size.h / 2 + 2,
      }));
    } else {
      group.add(new Konva.Rect({
        width: size.w, height: size.h, fill: color,
        stroke: isSelected ? '#ffd700' : '#4a5568',
        strokeWidth: isSelected ? 3 : 2, cornerRadius: 3, opacity: 0.9,
        offsetX: size.w / 2, offsetY: size.h / 2,
      }));
      group.add(new Konva.Text({
        text: iconMap[dev.type], fontSize: 10, fill: 'white',
        align: 'center', verticalAlign: 'middle', width: size.w, height: size.h,
        offsetX: size.w / 2, offsetY: size.h / 2,
      }));
    }

    group.add(new Konva.Text({
      text: dev.name, fontSize: 9, fill: '#a0aec0',
      align: 'center', width: 100, x: -50,
      y: DEVICE_SIZES[dev.type] ? DEVICE_SIZES[dev.type].h / 2 + 2 : 27,
    }));

    dev.interfaces.forEach((iface, i) => {
      group.add(new Konva.Circle({
        x: -size.w / 2 - 5, y: -size.h / 2 + 10 + i * 12,
        radius: 3,
        fill: iface.status === 'up' ? '#48bb78' : '#718096',
        stroke: editor.cableOrigin?.interfaceId === iface.id ? '#ffd700' : '#2d3748',
        strokeWidth: 1,
      }));
    });

    group.on('click', (e) => handleDeviceClick(dev, e));
    group.on('dragend', () => {
      const pos = group.position();
      const snapped = snapToGrid(pos);
      group.position(snapped);
      editor.updateDevice(dev.id, { position: snapped });
      redrawCables();
    });
    group.on('dblclick', () => { editor.selectedDeviceId = dev.id; editor.activeTool = 'select'; });

    return group;
  }

  function redrawDevices() {
    deviceLayer.destroyChildren();
    editor.devices.forEach(dev => {
      deviceLayer.add(createDeviceGroup(dev));
    });
    deviceLayer.draw();
  }

  function redrawCables() {
    cableLayer.destroyChildren();
    editor.cables.forEach(cable => {
      const fromDev = editor.devices.find(d => d.id === cable.from.deviceId);
      const toDev = editor.devices.find(d => d.id === cable.to.deviceId);
      if (!fromDev || !toDev) return;
      const fromIface = fromDev.interfaces.find(i => i.id === cable.from.interfaceId);
      const toIface = toDev.interfaces.find(i => i.id === cable.to.interfaceId);
      if (!fromIface || !toIface) return;

      const fromIdx = fromDev.interfaces.indexOf(fromIface);
      const toIdx = toDev.interfaces.indexOf(toIface);
      const fs = DEVICE_SIZES[fromDev.type] || { w: 60, h: 40 };
      const ts = DEVICE_SIZES[toDev.type] || { w: 60, h: 40 };

      const p1 = { x: fromDev.position.x - fs.w / 2 - 5, y: fromDev.position.y - fs.h / 2 + 10 + fromIdx * 12 };
      const p2 = { x: toDev.position.x - ts.w / 2 - 5, y: toDev.position.y - ts.h / 2 + 10 + toIdx * 12 };

      cableLayer.add(new Konva.Line({
        points: [p1.x, p1.y, p2.x, p2.y],
        stroke: cable.type === 'serial' ? '#ed8936' : cable.type === 'console' ? '#a0aec0' : '#4299e1',
        strokeWidth: 2, tension: 0.5, lineCap: 'round', id: cable.id,
      }));
    });
    cableLayer.draw();
    cableLayer.moveToTop();
  }
</script>

<div bind:this={container} class="flex-1 bg-gray-900 overflow-hidden cursor-crosshair"></div>
