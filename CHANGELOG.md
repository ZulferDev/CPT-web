# Changelog

## [0.1.1] - 2026-06-03

### Fixed
- **Canvas**: Click on empty space only places device (not on existing devices)
- **Canvas**: Seleksi device klik — gold border highlight on selected
- **Canvas**: Cable interaction — klik port A → dashed preview → klik port B to connect. Escape/Ctrl+Z to cancel
- **Canvas**: Delete device with Delete/Backspace key
- **Canvas**: Right-click context menu disabled (no browser menu)
- **ConfigPanel**: Debounced save (300ms) untuk hindari re-render loop
- **ConfigPanel**: Added Delete Device button
- **ConfigPanel**: Fixed `$effect` reactivity for form field sync
- **StatusBar**: Contextual hints (tool mode, cable origin state)

## [0.1.0] - 2026-06-03

### Added
- **Phase 1 — Layout & Canvas:** Toolbar, Device Palette, Canvas (Konva.js), Config Panel, CLI Terminal, Status Bar
- Toolbar: tool selector (Select/Device/Cable/Note), New/Import/Export actions
- Device Palette: 7 device types (Router, Switch, PC, Server, Hub, Laptop, Wireless) + 3 cable types
- Canvas: grid rendering, scroll zoom, shift+drag pan, snap-to-grid
- Click-to-place devices from palette onto canvas
- Device config panel: name, IP, subnet mask, interface list
- CLI Terminal: xterm.js integrated, collapsible, basic command parser
- Cable rendering: color-coded lines (Copper=blue, Serial=orange, Console=gray)
- Editor store refactored to class pattern (Svelte 5 runes)
- Dynamic import for Konva.js (reduced initial bundle to 26KB)

## [0.0.1] - 2026-06-03

### Added
- Project scaffolding: SvelteKit + TypeScript + Tailwind CSS v4
- Static adapter SPA configuration (zero-backend)
- Dependencies: Konva.js, Dexie.js, @xterm/xterm
- Type definitions: Device, Cable, Interface, CptwFile, dll.
- Editor store (Svelte 5 runes): device/cable/note state management
- Project store: IndexedDB CRUD via Dexie.js
- File I/O: export/import `.cptw` format
- Directory structure for components, engine, stores, storage, types
