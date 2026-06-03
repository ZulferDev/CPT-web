<script lang="ts">
  import { editor } from '$lib/stores/editor.svelte';
  import { exportToFile, importFromFile, createNewProject } from '$lib/storage/file';
  import type { CptwFile } from '$lib/types';

  const tools = [
    { id: 'select', label: 'Select', icon: '⬆' },
    { id: 'device', label: 'Device', icon: '⊞' },
    { id: 'cable', label: 'Cable', icon: '━━' },
    { id: 'note', label: 'Note', icon: '📝' },
  ] as const;

  function handleNew() {
    if (confirm('Create new project? Unsaved changes will be lost.')) {
      const p = createNewProject('Untitled');
      editor.loadProject([], [], [], p.name);
    }
  }

  async function handleImport() {
    try {
      const project = await importFromFile();
      editor.loadProject(project.topology.devices, project.topology.cables, project.topology.notes, project.name);
    } catch (e) {
      // user cancelled or error
    }
  }

  function handleExport() {
    const cptw: CptwFile = {
      version: '1.0.0',
      name: editor.projectName,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      metadata: {},
      topology: { devices: editor.devices, cables: editor.cables, notes: editor.notes },
    };
    exportToFile(cptw);
  }
</script>

<nav class="flex items-center gap-1 px-2 h-10 bg-gray-800 border-b border-gray-700 select-none shrink-0">
  <span class="font-bold text-sm text-cyan-400 mr-3">CPT-web</span>

  <div class="flex gap-0.5">
    {#each tools as tool}
      <button
        class="px-2 py-1 text-xs rounded {editor.activeTool === tool.id ? 'bg-cyan-700 text-white' : 'text-gray-300 hover:bg-gray-700'}"
        onclick={() => editor.activeTool = tool.id}
      >
        {tool.icon} {tool.label}
      </button>
    {/each}
  </div>

  <div class="w-px h-5 bg-gray-600 mx-2"></div>

  <button class="px-2 py-1 text-xs text-gray-300 hover:bg-gray-700 rounded" onclick={handleNew}>New</button>
  <button class="px-2 py-1 text-xs text-gray-300 hover:bg-gray-700 rounded" onclick={handleImport}>Import</button>
  <button class="px-2 py-1 text-xs text-gray-300 hover:bg-gray-700 rounded" onclick={handleExport}>Export</button>

  <div class="ml-auto flex items-center gap-2">
    <span class="text-xs text-gray-500">{editor.projectName}</span>
  </div>
</nav>
