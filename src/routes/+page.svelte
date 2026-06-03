<script lang="ts">
  import Toolbar from '$lib/components/toolbar/Toolbar.svelte';
  import DevicePalette from '$lib/components/device-palette/DevicePalette.svelte';
  import NetworkCanvas from '$lib/components/canvas/NetworkCanvas.svelte';
  import ConfigPanel from '$lib/components/panel/ConfigPanel.svelte';
  import CLITerminal from '$lib/components/cli/CLITerminal.svelte';
  import StatusBar from '$lib/components/toolbar/StatusBar.svelte';
</script>

<svelte:head>
  <title>CPT-web - Cisco Packet Tracer Web</title>
</svelte:head>

<div class="flex flex-col h-screen w-screen bg-gray-900 text-white overflow-hidden">
  <Toolbar />
  <div class="flex flex-1 overflow-hidden">
    <DevicePalette />
    <NetworkCanvas />
    <ConfigPanel />
  </div>
  <div class="flex flex-col">
    <CLITerminal />
    <StatusBar />
  </div>
</div>
