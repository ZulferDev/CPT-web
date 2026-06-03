<script lang="ts">
  import { onMount } from 'svelte';
  import { editor } from '$lib/stores/editor.svelte';
  import type { Device, Position, DeviceType, Interface } from '$lib/types';

  let container: HTMLDivElement;
  let stage: import('konva').default.Stage;
  let Konva: typeof import('konva').default;
  let gridLayer: Konva.Layer;
  let deviceLayer: Konva.Layer;
  let cableLayer: Konva.Layer;
  let previewLayer: Konva.Layer;

  const GRID_SIZE = 20;

  onMount(async () => {
    const KonvaModule = await import('konva');
    Konva = KonvaModule.default;
    const rect = container.getBoundingClientRect();
    stage = new Konva.Stage({
      container,
      width: rect.width,
      height: rect.height,
    });

    gridLayer = new Konva.Layer();
    cableLayer = new Konva.Layer();
    deviceLayer = new Konva.Layer();
    previewLayer = new Konva.Layer();
    stage.add(gridLayer);
    stage.add(cableLayer);
    stage.add(deviceLayer);
    stage.add(previewLayer);

    drawGrid();

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

    let isPanning = false;
    let lastPos: Position = { x: 0, y: 0 };

    stage.on('mousedown', (e) => {
      if (e.evt.button === 1 || e.evt.shiftKey) {
        isPanning = true;
        lastPos = stage.getPointerPosition()!;
        stage.container().style.cursor = 'grabbing';
        return;
      }
      if (editor.activeTool === 'device') {
        addDeviceFromPalette(stage.getPointerPosition()!);
      }
    });

    stage.on('mousemove', (e) => {
      if (isPanning) {
        const pos = stage.getPointerPosition()!;
        stage.position({
          x: stage.x() + pos.x - lastPos.x,
          y: stage.y() + pos.y - lastPos.y,
        });
        lastPos = pos;
        stage.batchDraw();
      }
    });

    stage.on('mouseup', () => {
      isPanning = false;
      stage.container().style.cursor = 'default';
    });

    const resizeObserver = new ResizeObserver(() => {
      const r = container.getBoundingClientRect();
      stage.width(r.width);
      stage.height(r.height);
      drawGrid();
    });
    resizeObserver.observe(container);

    return () => resizeObserver.disconnect();
  });

  $effect(() => {
    if (!stage) return;
    redrawDevices();
    redrawCables();
  });

  function drawGrid() {
    if (!gridLayer) return;
    gridLayer.destroyChildren();
    const rect = container.getBoundingClientRect();

    for (let x = 0; x < rect.width; x += GRID_SIZE) {
      gridLayer.add(new Konva.Line({
        points: [x, 0, x, rect.height],
        stroke: '#2d3748',
        strokeWidth: 0.5,
      }));
    }
    for (let y = 0; y < rect.height; y += GRID_SIZE) {
      gridLayer.add(new Konva.Line({
        points: [0, y, rect.width, y],
        stroke: '#2d3748',
        strokeWidth: 0.5,
      }));
    }
    gridLayer.draw();
    gridLayer.moveToBottom();
  }

  function snapToGrid(pos: Position): Position {
    return {
      x: Math.round(pos.x / GRID_SIZE) * GRID_SIZE,
      y: Math.round(pos.y / GRID_SIZE) * GRID_SIZE,
    };
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
          { id: crypto.randomUUID(), name: 'FastEthernet0/0', type: 'fast-ethernet', macAddress: generateMAC(), status: 'down' },
          { id: crypto.randomUUID(), name: 'FastEthernet0/1', type: 'fast-ethernet', macAddress: generateMAC(), status: 'down' },
          { id: crypto.randomUUID(), name: 'Serial0/0/0', type: 'serial', macAddress: generateMAC(), status: 'down' },
        ];
      case 'switch':
        return Array.from({ length: 8 }, (_, i) => ({
          id: crypto.randomUUID(), name: `FastEthernet0/${i}`, type: 'fast-ethernet' as const,
          macAddress: generateMAC(), status: 'down' as const,
        }));
      case 'pc':
        return [
          { id: crypto.randomUUID(), name: 'FastEthernet0', type: 'fast-ethernet', macAddress: generateMAC(), status: 'down' },
        ];
      default:
        return [
          { id: crypto.randomUUID(), name: 'FastEthernet0', type: 'fast-ethernet', macAddress: generateMAC(), status: 'down' },
        ];
    }
  }

  const DEVICE_COLORS: Record<DeviceType, string> = {
    router: '#2b6cb0',
    switch: '#2f855a',
    pc: '#6b46c1',
    server: '#c05621',
    hub: '#d69e2e',
    laptop: '#6b46c1',
    'wireless-router': '#319795',
  };

  const DEVICE_SIZES: Record<DeviceType, { w: number; h: number }> = {
    router: { w: 80, h: 50 },
    switch: { w: 80, h: 40 },
    pc: { w: 60, h: 50 },
    server: { w: 60, h: 60 },
    hub: { w: 60, h: 40 },
    laptop: { w: 60, h: 45 },
    'wireless-router': { w: 70, h: 50 },
  };

  function addDeviceFromPalette(pos: Position) {
    const scale = stage.scaleX();
    const worldPos = {
      x: (pos.x - stage.x()) / scale,
      y: (pos.y - stage.y()) / scale,
    };
    const snappedWorld = snapToGrid(worldPos);

    const dev: Device = {
      id: crypto.randomUUID(),
      type: editor.activeDeviceType,
      name: `${editor.activeDeviceType.charAt(0).toUpperCase() + editor.activeDeviceType.slice(1)}-${editor.devices.length + 1}`,
      model: editor.activeDeviceType === 'router' ? '2811' : editor.activeDeviceType === 'switch' ? '2960' : 'Unknown',
      position: snappedWorld,
      interfaces: createDefaultInterfaces(editor.activeDeviceType),
      config: { hostname: `${editor.activeDeviceType.charAt(0).toUpperCase() + editor.activeDeviceType.slice(1)}${editor.devices.length + 1}`, routingTable: [] },
      status: 'on',
    };

    editor.addDevice(dev);
  }

  function createDeviceGroup(dev: Device): Konva.Group {
    const size = DEVICE_SIZES[dev.type] || { w: 60, h: 40 };
    const color = DEVICE_COLORS[dev.type] || '#666';
    const group = new Konva.Group({
      x: dev.position.x,
      y: dev.position.y,
      draggable: true,
      id: dev.id,
    });

    if (dev.type === 'router' || dev.type === 'wireless-router') {
      const circle = new Konva.Circle({
        radius: Math.max(size.w, size.h) / 2,
        fill: color,
        stroke: '#4a5568',
        strokeWidth: 2,
        opacity: 0.9,
      });
      group.add(circle);
      const text = new Konva.Text({
        text: dev.type === 'router' ? 'Router' : 'WAP',
        fontSize: 10,
        fill: 'white',
        align: 'center',
        verticalAlign: 'middle',
        width: size.w,
        height: size.h,
        x: -size.w / 2,
        y: -size.h / 2 + 2,
      });
      group.add(text);
      const label = new Konva.Text({
        text: dev.name,
        fontSize: 9,
        fill: '#a0aec0',
        align: 'center',
        width: 100,
        x: -50,
        y: Math.max(size.w, size.h) / 2 + 2,
      });
      group.add(label);
    } else {
      const rect = new Konva.Rect({
        width: size.w,
        height: size.h,
        fill: color,
        stroke: '#4a5568',
        strokeWidth: 2,
        cornerRadius: 3,
        opacity: 0.9,
        offsetX: size.w / 2,
        offsetY: size.h / 2,
      });
      group.add(rect);

      const iconMap: Record<DeviceType, string> = {
        switch: 'Switch', pc: 'PC', server: 'Server', hub: 'Hub', laptop: 'Laptop',
        router: 'Router', 'wireless-router': 'WAP',
      };
      const text = new Konva.Text({
        text: iconMap[dev.type],
        fontSize: 10,
        fill: 'white',
        align: 'center',
        verticalAlign: 'middle',
        width: size.w,
        height: size.h,
        offsetX: size.w / 2,
        offsetY: size.h / 2,
      });
      group.add(text);

      const label = new Konva.Text({
        text: dev.name,
        fontSize: 9,
        fill: '#a0aec0',
        align: 'center',
        width: 100,
        x: -50,
        y: size.h / 2 + 2,
      });
      group.add(label);
    }

    if (dev.interfaces.length > 0) {
      const portRadius = 3;
      dev.interfaces.forEach((iface, i) => {
        const port = new Konva.Circle({
          x: -size.w / 2 - 5,
          y: -size.h / 2 + 10 + i * 12,
          radius: portRadius,
          fill: iface.status === 'up' ? '#48bb78' : '#718096',
          stroke: '#2d3748',
          strokeWidth: 1,
        });
        group.add(port);
      });
    }

    group.on('click', () => {
      editor.selectedDeviceId = dev.id;
    });

    group.on('dragend', () => {
      const pos = group.position();
      const snapped = snapToGrid(pos);
      group.position(snapped);
      editor.updateDevice(dev.id, { position: snapped });
      redrawCables();
    });

    return group;
  }

  function redrawDevices() {
    deviceLayer.destroyChildren();
    editor.devices.forEach(dev => {
      const group = createDeviceGroup(dev);
      deviceLayer.add(group);
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

      const fromIFNum = fromDev.interfaces.indexOf(fromIface);
      const toIFNum = toDev.interfaces.indexOf(toIface);
      const size = DEVICE_SIZES[fromDev.type] || { w: 60, h: 40 };

      const fromPortPos = {
        x: fromDev.position.x - size.w / 2 - 5,
        y: fromDev.position.y - size.h / 2 + 10 + fromIFNum * 12,
      };
      const toSize = DEVICE_SIZES[toDev.type] || { w: 60, h: 40 };
      const toPortPos = {
        x: toDev.position.x - toSize.w / 2 - 5,
        y: toDev.position.y - toSize.h / 2 + 10 + toIFNum * 12,
      };

      const line = new Konva.Line({
        points: [fromPortPos.x, fromPortPos.y, toPortPos.x, toPortPos.y],
        stroke: cable.type === 'serial' ? '#ed8936' : cable.type === 'console' ? '#a0aec0' : '#4299e1',
        strokeWidth: 2,
        tension: 0.5,
        lineCap: 'round',
        id: cable.id,
      });
      cableLayer.add(line);
    });
    cableLayer.draw();
    cableLayer.moveToTop();
  }
</script>

<div bind:this={container} class="flex-1 bg-gray-900 overflow-hidden"></div>
