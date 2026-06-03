<script lang="ts">
  import Toolbar from '$lib/components/toolbar/Toolbar.svelte';
  import DevicePalette from '$lib/components/device-palette/DevicePalette.svelte';
  import NetworkCanvas from '$lib/components/canvas/NetworkCanvas.svelte';
  import ConfigPanel from '$lib/components/panel/ConfigPanel.svelte';
  import CLITerminal from '$lib/components/cli/CLITerminal.svelte';
  import StatusBar from '$lib/components/toolbar/StatusBar.svelte';
  import ProjectDialog from '$lib/components/dialogs/ProjectDialog.svelte';
  import { editor } from '$lib/stores/editor.svelte';
  import { saveProject } from '$lib/stores/projects.svelte';
  import type { CptwFile } from '$lib/types';

  $effect(() => {
    const rev = editor.revision;
    if (rev === 0) return;

    const timer = setTimeout(async () => {
      const cptw: CptwFile = {
        version: '1.0.0',
        name: editor.projectName,
        createdAt: editor.createdAt,
        updatedAt: new Date().toISOString(),
        metadata: {},
        topology: { devices: editor.devices, cables: editor.cables, notes: editor.notes },
      };
      const id = await saveProject(editor.projectId, editor.projectName, cptw);
      editor.projectId = id;
      editor.lastSavedAt = Date.now();
      editor.isModified = false;
    }, 2000);

    return () => clearTimeout(timer);
  });
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

<ProjectDialog />
