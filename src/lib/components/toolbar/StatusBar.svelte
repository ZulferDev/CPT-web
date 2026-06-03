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
    <span>Devices: {editor.devices.length}</span>
    <span>Cables: {editor.cables.length}</span>
  </div>
  <div class="flex items-center gap-3">
    <span>{time}</span>
  </div>
</footer>
