<script lang="ts">
  import { editor } from '$lib/stores/editor.svelte';
  import type { DeviceType, CableType } from '$lib/types';

  const deviceTypes: { type: DeviceType; label: string; icon: string; ports: string }[] = [
    { type: 'router', label: 'Router', icon: '🔲', ports: '2811' },
    { type: 'switch', label: 'Switch', icon: '🔳', ports: '2960' },
    { type: 'pc', label: 'PC', icon: '🖥', ports: 'PC' },
    { type: 'server', label: 'Server', icon: '🖧', ports: 'Server' },
    { type: 'hub', label: 'Hub', icon: '◻', ports: 'Hub' },
    { type: 'laptop', label: 'Laptop', icon: '💻', ports: 'Laptop' },
    { type: 'wireless-router', label: 'Wireless', icon: '📡', ports: 'WAP' },
  ];

  const cableTypes: { type: CableType; label: string; icon: string }[] = [
    { type: 'copper', label: 'Copper', icon: '━' },
    { type: 'serial', label: 'Serial', icon: '╍' },
    { type: 'console', label: 'Console', icon: '┅' },
  ];
</script>

<aside class="w-44 bg-gray-800 border-r border-gray-700 flex flex-col overflow-y-auto shrink-0">
  <div class="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-700">
    Devices
  </div>
  <div class="p-2 space-y-1">
    {#each deviceTypes as dt}
      <button
        class="flex items-center gap-2 w-full px-2 py-2 text-xs rounded
          {editor.activeTool === 'device' && editor.activeDeviceType === dt.type
            ? 'bg-cyan-700/30 text-cyan-300 border border-cyan-700'
            : 'text-gray-300 hover:bg-gray-700 border border-transparent'}"
        onclick={() => { editor.activeDeviceType = dt.type; editor.activeTool = 'device'; }}
      >
        <span class="text-lg">{dt.icon}</span>
        <div class="flex flex-col items-start">
          <span>{dt.label}</span>
          <span class="text-[10px] text-gray-500">{dt.ports}</span>
        </div>
      </button>
    {/each}
  </div>

  <div class="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider border-t border-gray-700">
    Cables
  </div>
  <div class="p-2 space-y-1">
    {#each cableTypes as ct}
      <button
        class="flex items-center gap-2 w-full px-2 py-1.5 text-xs rounded
          {editor.activeTool === 'cable' && editor.activeCableType === ct.type
            ? 'bg-cyan-700/30 text-cyan-300 border border-cyan-700'
            : 'text-gray-300 hover:bg-gray-700 border border-transparent'}"
        onclick={() => { editor.activeCableType = ct.type; editor.activeTool = 'cable'; }}
      >
        <span>{ct.icon}</span>
        <span>{ct.label}</span>
      </button>
    {/each}
  </div>
</aside>
