<script lang="ts">
  import { editor } from '$lib/stores/editor.svelte';

  let selectedName = $state('');
  let selectedIP = $state('');
  let selectedMask = $state('');

  $effect(() => {
    const id = editor.selectedDeviceId;
    if (id) {
      const dev = editor.devices.find(d => d.id === id);
      if (dev) {
        selectedName = dev.name;
        const mainIface = dev.interfaces.find(i => i.ipAddress);
        selectedIP = mainIface?.ipAddress ?? '';
        selectedMask = mainIface?.subnetMask ?? '';
      }
    }
  });

  function onChange() {
    const id = editor.selectedDeviceId;
    if (!id) return;
    const dev = editor.devices.find(d => d.id === id);
    if (!dev) return;

    editor.updateDevice(id, {
      name: selectedName,
      interfaces: dev.interfaces.map((iface, i) => {
        if (i === 0) return { ...iface, ipAddress: selectedIP || undefined, subnetMask: selectedMask || undefined };
        return iface;
      })
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
          class="w-full bg-gray-900 border border-gray-600 rounded px-2 py-1 text-white"
          bind:value={selectedName}
          oninput={onChange}
        />
      </div>
      <div>
        <label class="block text-gray-400 mb-1" for="dev-ip">IP Address</label>
        <input id="dev-ip"
          class="w-full bg-gray-900 border border-gray-600 rounded px-2 py-1 text-white"
          bind:value={selectedIP}
          oninput={onChange}
          placeholder="192.168.1.1"
        />
      </div>
      <div>
        <label class="block text-gray-400 mb-1" for="dev-mask">Subnet Mask</label>
        <input id="dev-mask"
          class="w-full bg-gray-900 border border-gray-600 rounded px-2 py-1 text-white"
          bind:value={selectedMask}
          oninput={onChange}
          placeholder="255.255.255.0"
        />
      </div>

      <div class="border-t border-gray-700 pt-2 mt-4">
        <div class="text-gray-400 mb-1">Interfaces</div>
        {#each editor.devices.filter(d => d.id === editor.selectedDeviceId)[0]?.interfaces ?? [] as iface}
          <div class="flex justify-between py-1 text-gray-300">
            <span>{iface.name}</span>
            <span class="{iface.status === 'up' ? 'text-green-400' : 'text-red-400'}">
              {iface.status}
              {#if iface.ipAddress} ({iface.ipAddress}){/if}
            </span>
          </div>
        {/each}
      </div>
    </div>
  </aside>
{/if}
