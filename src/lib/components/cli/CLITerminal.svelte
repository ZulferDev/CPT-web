<script lang="ts">
  import { onMount } from 'svelte';
  import { Terminal } from '@xterm/xterm';
  import { FitAddon } from '@xterm/addon-fit';
  import '@xterm/xterm/css/xterm.css';
  import { editor } from '$lib/stores/editor.svelte';
  import { simulator } from '$lib/engine/simulator';

  let terminalContainer: HTMLDivElement = $state(null!);
  let term: Terminal;
  let fitAddon: FitAddon;
  let isOpen = $state(true);

  type CliMode = 'user' | 'privileged' | 'config';
  let mode = $state<CliMode>('user');

  const PROMPTS: Record<CliMode, string> = {
    user: '\r\n\x1b[32mSwitch>\x1b[0m ',
    privileged: '\r\n\x1b[32mSwitch#\x1b[0m ',
    config: '\r\n\x1b[32mSwitch(config)#\x1b[0m ',
  };

  function toggle() {
    isOpen = !isOpen;
    if (isOpen && fitAddon) setTimeout(() => fitAddon.fit(), 50);
  }

  function handlePing(cmd: string) {
    const parts = cmd.split(/\s+/);
    const ip = parts[1];

    if (!ip) {
      term.writeln('\r\n\x1b[31mUsage: ping <ip-address>\x1b[0m');
      return;
    }

    if (!editor.selectedDeviceId) {
      term.writeln('\r\n\x1b[31mSelect a device on the canvas first.\x1b[0m');
      return;
    }

    const dev = editor.devices.find(d => d.id === editor.selectedDeviceId);
    if (!dev) return;

    if (dev.type !== 'pc' && dev.type !== 'laptop' && dev.type !== 'server' && dev.type !== 'router') {
      term.writeln(`\r\n\x1b[31m${dev.name} does not support ping.\x1b[0m`);
      return;
    }

    simulator.initialize(editor.devices, editor.cables);
    const result = simulator.ping(editor.selectedDeviceId, ip);

    term.writeln('');
    for (const step of result.steps) {
      if (step.type === 'result') {
        if (result.success) {
          term.writeln(`\x1b[36m${step.detail}\x1b[0m`);
        } else {
          term.writeln(`\x1b[31m${step.detail}\x1b[0m`);
        }
      } else {
        term.writeln(`  ${step.detail}`);
      }
    }

    if (result.success) {
      term.writeln(`\r\n\x1b[36mPing statistics: round-trip time = ${result.roundTripTime}ms\x1b[0m`);
    }
  }

  function showDeviceInfo() {
    if (!editor.selectedDeviceId) {
      term.writeln('\x1b[31mNo device selected.\x1b[0m');
      return;
    }
    const dev = editor.devices.find(d => d.id === editor.selectedDeviceId);
    if (!dev) return;

    term.writeln(`Device: ${dev.name}`);
    term.writeln(`Type: ${dev.type}`);
    term.writeln(`Model: ${dev.model}`);
    term.writeln(`Status: ${dev.status}`);

    if (dev.type === 'switch') {
      term.writeln(`MAC table entries: 0`);
    }
    if (dev.type === 'router') {
      term.writeln(`Routing table entries: ${dev.config.routingTable.length}`);
      for (const r of dev.config.routingTable) {
        term.writeln(`  ${r.network}/${r.mask} via ${r.nextHop} (${r.interfaceId})`);
      }
    }

    term.writeln('Interfaces:');
    for (const iface of dev.interfaces) {
      const ip = iface.ipAddress && iface.subnetMask
        ? `${iface.ipAddress}/${iface.subnetMask}`
        : 'unassigned';
      term.writeln(`  ${iface.name} - ${ip} (${iface.status})${iface.type === 'console' ? ' [console]' : ''}${iface.type === 'serial' ? ' [serial]' : ''}`);
    }
  }

  onMount(() => {
    term = new Terminal({
      cursorBlink: true,
      fontSize: 12,
      fontFamily: 'Menlo, Monaco, monospace',
      theme: {
        background: '#1a202c',
        foreground: '#e2e8f0',
        cursor: '#e2e8f0',
        black: '#2d3748',
      },
    });

    fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(terminalContainer);
    fitAddon.fit();

    term.writeln('\x1b[36mCPT-web CLI Terminal\x1b[0m');
    term.writeln('Type "help" for available commands.\r\n');

    let inputBuffer = '';
    term.write(PROMPTS[mode]);

    term.onKey(({ key, domEvent }) => {
      if (domEvent.key === 'Enter') {
        const cmd = inputBuffer.trim().toLowerCase();
        const rawCmd = inputBuffer.trim();
        inputBuffer = '';
        term.writeln('');

        if (cmd === 'help') {
          term.writeln('Available commands:');
          term.writeln('  help            - Show this message');
          term.writeln('  enable          - Enter privileged mode');
          term.writeln('  disable         - Exit privileged mode');
          term.writeln('  configure       - Enter configuration mode');
          term.writeln('  end             - Exit to privileged mode');
          term.writeln('  show            - Show device info');
          term.writeln('  ping <ip>       - Ping an IP (select device first)');
          term.writeln('  clear           - Clear terminal');
        } else if (cmd === 'enable') {
          mode = 'privileged';
          term.writeln('\x1b[33mPrivileged mode enabled.\x1b[0m');
        } else if (cmd === 'disable') {
          mode = 'user';
        } else if (cmd === 'configure' || cmd === 'configure terminal') {
          if (mode === 'privileged') {
            mode = 'config';
            term.writeln('\x1b[33mEntering configuration mode.\x1b[0m');
          } else {
            term.writeln('\x1b[31mMust be in privileged mode (enable first).\x1b[0m');
          }
        } else if (cmd === 'end') {
          mode = 'privileged';
        } else if (cmd === 'clear') {
          term.clear();
        } else if (cmd.startsWith('ping')) {
          if (mode === 'user') {
            term.writeln('\x1b[31mMust be in privileged mode (enable first).\x1b[0m');
          } else {
            handlePing(rawCmd);
          }
        } else if (cmd === 'show') {
          showDeviceInfo();
        } else if (cmd) {
          term.writeln(`\x1b[31mUnknown command or invalid: ${cmd}\x1b[0m`);
        }

        term.write(PROMPTS[mode]);
      } else if (domEvent.key === 'Backspace') {
        if (inputBuffer.length > 0) {
          inputBuffer = inputBuffer.slice(0, -1);
          term.write('\b \b');
        }
      } else if (!domEvent.ctrlKey && !domEvent.altKey && key.length === 1) {
        inputBuffer += key;
        term.write(key);
      }
    });

    const ro = new ResizeObserver(() => {
      if (fitAddon) fitAddon.fit();
    });
    ro.observe(terminalContainer);

    return () => {
      ro.disconnect();
      term?.dispose();
    };
  });
</script>

<div class="flex flex-col border-t border-gray-700 shrink-0" class:flex-1={isOpen} style:flex={isOpen ? '1' : '0'}>
  <button
    class="flex items-center gap-2 px-3 py-1 text-xs text-gray-400 hover:text-white bg-gray-800 border-b border-gray-700 select-none"
    onclick={toggle}
  >
    <span class="transform transition-transform {isOpen ? '' : '-rotate-90'}">▼</span>
    CLI Terminal
  </button>
  <div bind:this={terminalContainer} class="flex-1 min-h-[100px]" class:hidden={!isOpen}></div>
</div>
