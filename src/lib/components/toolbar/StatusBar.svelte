<script lang="ts">
  import { editor } from '$lib/stores/editor.svelte';

  let time = $state(new Date().toLocaleTimeString());
  $effect(() => {
    const interval = setInterval(() => { time = new Date().toLocaleTimeString(); }, 1000);
    return () => clearInterval(interval);
  });
</script>

<footer class="flex items-center justify-between h-6 px-3 bg-gray-800 border-t border-gray-700 text-[10px] text-gray-500 select-none shrink-0">
  <div class="flex items-center gap-3">
    <span>{editor.projectName}{editor.isModified ? '*' : ''}</span>
    <span class="w-px h-3 bg-gray-700"></span>
    <span>Devices: {editor.devices.length}</span>
    <span>Cables: {editor.cables.length}</span>
    <span class="w-px h-3 bg-gray-700"></span>
    {#if editor.activeTool === 'cable'}
      <span class="text-cyan-400">
        {editor.cableOrigin ? '→ Click target device' : '→ Click source device'}
      </span>
    {:else if editor.activeTool === 'device'}
      <span class="text-yellow-400">→ Click canvas to place {editor.activeDeviceType}</span>
    {:else if editor.activeTool === 'select'}
      <span class="text-gray-400">→ Click to select · Del to delete</span>
    {/if}
  </div>
  <div class="flex items-center gap-3">
    <span>{time}</span>
  </div>
</footer>
