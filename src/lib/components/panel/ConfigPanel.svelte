<script lang="ts">
  import { editor } from '$lib/stores/editor.svelte';

  let selectedName = $state('');
  let selectedIP = $state('');
  let selectedMask = $state('');
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;

  function getEthernetIface(dev: typeof editor.devices[0]) {
    return dev.interfaces.find(i => i.type === 'gigabit-ethernet' || i.type === 'fast-ethernet');
  }

  $effect(() => {
    const id = editor.selectedDeviceId;
    if (!id) { selectedName = ''; selectedIP = ''; selectedMask = ''; return; }
    const dev = editor.devices.find(d => d.id === id);
    if (!dev) return;
    selectedName = dev.name;
    const eth = getEthernetIface(dev);
    selectedIP = eth?.ipAddress ?? '';
    selectedMask = eth?.subnetMask ?? '';
  });

  function debounceSave() {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(doSave, 300);
  }

  function doSave() {
    const id = editor.selectedDeviceId;
    if (!id) return;
    const dev = editor.devices.find(d => d.id === id);
    if (!dev) return;
    const ethIface = getEthernetIface(dev);
    if (!ethIface) return;

    editor.updateDevice(id, {
      name: selectedName,
      interfaces: dev.interfaces.map(iface =>
        iface.id === ethIface.id
          ? { ...iface, ipAddress: selectedIP || undefined, subnetMask: selectedMask || undefined }
          : iface
      )
    });
  }
</script>

{#if editor.selectedDeviceId}
  <aside class="w-72 bg-gray-800 border-l border-gray-700 flex flex-col overflow-y-auto shrink-0">
    <div class="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-700">
      Configuration
    </div>
    <div class="p-3 space-y-3 text-xs">
      <div>
        <label class="block text-gray-400 mb-1" for="dev-name">Device Name</label>
        <input id="dev-name"
          class="w-full bg-gray-900 border border-gray-600 rounded px-2 py-1 text-white outline-none focus:border-cyan-500"
          bind:value={selectedName}
          oninput={debounceSave}
        />
      </div>
      <div>
        <label class="block text-gray-400 mb-1" for="dev-ip">IP Address</label>
        <input id="dev-ip"
          class="w-full bg-gray-900 border border-gray-600 rounded px-2 py-1 text-white outline-none focus:border-cyan-500"
          bind:value={selectedIP}
          oninput={debounceSave}
          placeholder="192.168.1.1"
        />
      </div>
      <div>
        <label class="block text-gray-400 mb-1" for="dev-mask">Subnet Mask</label>
        <input id="dev-mask"
          class="w-full bg-gray-900 border border-gray-600 rounded px-2 py-1 text-white outline-none focus:border-cyan-500"
          bind:value={selectedMask}
          oninput={debounceSave}
          placeholder="255.255.255.0"
        />
      </div>

      <div class="border-t border-gray-700 pt-2 mt-4">
        <div class="text-gray-400 mb-1">Interfaces</div>
        {#each editor.devices.filter(d => d.id === editor.selectedDeviceId)[0]?.interfaces ?? [] as iface}
          <div class="flex items-center justify-between py-1 text-gray-300">
            <span class="text-[11px]">{iface.name}</span>
            <div class="flex items-center gap-2">
              {#if iface.type === 'gigabit-ethernet' || iface.type === 'fast-ethernet'}
                <button
                  class="text-[9px] px-1.5 py-0.5 rounded {iface.status === 'up' ? 'bg-green-800 text-green-300' : 'bg-gray-700 text-gray-400'} hover:bg-opacity-80"
                  onclick={() => {
                    const dev = editor.devices.find(d => d.id === editor.selectedDeviceId);
                    if (!dev) return;
                    editor.updateDevice(editor.selectedDeviceId!, {
                      interfaces: dev.interfaces.map(i =>
                        i.id === iface.id ? { ...i, status: i.status === 'up' ? 'down' as const : 'up' as const } : i
                      )
                    });
                  }}
                >
                  {iface.status}
                </button>
              {:else}
                <span class="text-[9px] text-gray-500">{iface.status}</span>
              {/if}
              {#if iface.ipAddress}
                <span class="text-[10px] text-gray-400">{iface.ipAddress}</span>
              {/if}
            </div>
          </div>
        {/each}
      </div>

      <div class="border-t border-gray-700 pt-3 mt-4">
        <button
          class="w-full px-3 py-1.5 text-xs text-red-400 border border-red-800 rounded hover:bg-red-900/30"
          onclick={() => { const id = editor.selectedDeviceId; if (id) { editor.removeDevice(id); editor.selectedDeviceId = null; } }}
        >
          Delete Device
        </button>
      </div>
    </div>
  </aside>
{/if}
