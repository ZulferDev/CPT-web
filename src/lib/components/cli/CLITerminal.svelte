<script lang="ts">
  import { onMount } from 'svelte';
  import { Terminal } from '@xterm/xterm';
  import { FitAddon } from '@xterm/addon-fit';
  import '@xterm/xterm/css/xterm.css';

  let terminalContainer: HTMLDivElement = $state(null!);
  let term: Terminal;
  let fitAddon: FitAddon;
  let isOpen = $state(true);

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
    const prompt = '\r\n\x1b[32mSwitch>\x1b[0m ';

    function updatePrompt() {
      term.write(prompt);
    }

    term.onKey(({ key, domEvent }) => {
      const char = domEvent.key;

      if (domEvent.key === 'Enter') {
        const cmd = inputBuffer.trim();
        inputBuffer = '';
        term.writeln('');
        if (cmd === 'help') {
          term.writeln('Available commands:');
          term.writeln('  help       - Show this message');
          term.writeln('  enable     - Enter privileged mode');
          term.writeln('  show       - Show device info');
          term.writeln('  clear      - Clear terminal');
        } else if (cmd === 'enable') {
          term.writeln('\x1b[32mSwitch#\x1b[0m ');
          return;
        } else if (cmd === 'clear') {
          term.clear();
        } else if (cmd) {
          term.writeln(`\x1b[31mUnknown command: ${cmd}\x1b[0m`);
        }
        term.write(prompt);
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

    updatePrompt();

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
    class="flex items-center gap-2 px-3 py-1 text-xs text-gray-400 hover:text-white bg-gray-850 border-b border-gray-700 select-none"
    onclick={toggle}
  >
    <span class="transform transition-transform {isOpen ? '' : '-rotate-90'}">▼</span>
    CLI Terminal
  </button>
  {#if isOpen}
    <div bind:this={terminalContainer} class="flex-1 min-h-[100px]"></div>
  {/if}
</div>
