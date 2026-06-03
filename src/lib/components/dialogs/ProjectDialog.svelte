<script lang="ts">
  import { editor } from '$lib/stores/editor.svelte';
  import { loadProjectList, saveProject, deleteProject, getProject, getProjectList } from '$lib/stores/projects.svelte';
  import { importFromFile, createNewProject } from '$lib/storage/file';
  import { onMount } from 'svelte';

  let projects = $state<{ id: number; name: string; updatedAt: Date }[]>([]);
  let show = $state(true);
  let loading = $state(true);

  onMount(async () => {
    await loadProjectList();
    projects = getProjectList();
    loading = false;

    if (projects.length === 0) {
      handleNew();
    }
  });

  function handleNew() {
    const p = createNewProject('Untitled');
    editor.loadProjectFull([], [], [], p.name, undefined, p.createdAt);
    show = false;
  }

  async function handleOpen(id: number) {
    const data = await getProject(id);
    if (data) {
      editor.loadProjectFull(
        data.topology.devices,
        data.topology.cables,
        data.topology.notes,
        data.name,
        id,
        data.createdAt
      );
      show = false;
    }
  }

  async function handleDelete(id: number) {
    await deleteProject(id);
    projects = getProjectList();
    if (projects.length === 0) handleNew();
  }

  async function handleImport() {
    try {
      const project = await importFromFile();
      const id = await saveProject(undefined, project.name, project);
      editor.loadProjectFull(
        project.topology.devices,
        project.topology.cables,
        project.topology.notes,
        project.name,
        id,
        project.createdAt
      );
      show = false;
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Import failed';
      if (msg !== 'Import cancelled') alert(msg);
    }
  }
</script>

{#if show}
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
    <div class="bg-gray-800 border border-gray-700 rounded-lg shadow-xl w-[480px] max-h-[70vh] flex flex-col">
      <div class="p-4 border-b border-gray-700">
        <h2 class="text-lg font-semibold text-white">CPT-web Projects</h2>
      </div>
      <div class="flex-1 overflow-y-auto p-4">
        {#if loading}
          <div class="text-gray-400 text-center py-8">Loading...</div>
        {:else if projects.length === 0}
          <div class="text-gray-400 text-center py-8">No saved projects yet</div>
        {:else}
          <div class="space-y-2">
            {#each projects as project}
              <div class="flex items-center gap-2 p-2 rounded hover:bg-gray-700 group cursor-pointer" onclick={() => handleOpen(project.id)}>
                <div class="flex-1 min-w-0">
                  <div class="text-sm text-white truncate">{project.name}</div>
                  <div class="text-xs text-gray-500">{new Date(project.updatedAt).toLocaleString()}</div>
                </div>
                <button
                  class="px-2 py-1 text-xs text-red-400 opacity-0 group-hover:opacity-100 hover:bg-red-900/30 rounded"
                  onclick={(e: MouseEvent) => { e.stopPropagation(); handleDelete(project.id); }}
                >
                  Delete
                </button>
              </div>
            {/each}
          </div>
        {/if}
      </div>
      <div class="flex gap-2 p-4 border-t border-gray-700">
        <button class="flex-1 px-3 py-1.5 text-sm text-white bg-cyan-700 hover:bg-cyan-600 rounded" onclick={handleNew}>
          + New Project
        </button>
        <button class="flex-1 px-3 py-1.5 text-sm text-gray-300 bg-gray-700 hover:bg-gray-600 rounded" onclick={handleImport}>
          Import File
        </button>
      </div>
    </div>
  </div>
{/if}
