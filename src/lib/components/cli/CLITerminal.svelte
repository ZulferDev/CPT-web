<script lang="ts">
  import { onMount } from 'svelte';
  import { Terminal } from '@xterm/xterm';
  import { FitAddon } from '@xterm/addon-fit';
  import '@xterm/xterm/css/xterm.css';

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
        inputBuffer = '';
        term.writeln('');

        if (cmd === 'help') {
          term.writeln('Available commands:');
          term.writeln('  help       - Show this message');
          term.writeln('  enable     - Enter privileged mode');
          term.writeln('  disable    - Exit privileged mode');
          term.writeln('  configure  - Enter configuration mode');
          term.writeln('  end        - Exit to privileged mode');
          term.writeln('  show       - Show device info');
          term.writeln('  clear      - Clear terminal');
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
  {#if isOpen}
    <div bind:this={terminalContainer} class="flex-1 min-h-[100px]"></div>
  {/if}
</div>
