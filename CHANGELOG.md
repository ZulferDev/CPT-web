# Changelog

## [0.3.3] - 2026-06-03

### Fixed
- **Preview line mencegat klik (CRITICAL)**: `previewLayer` di atas `deviceLayer`, dan ujung preview line selalu mengikuti posisi mouse. Saat klik kedua (target device), mouse tepat berada di ujung preview line → klik mengenai preview line, bukan device. Diperbaiki dengan `listening: false` pada preview line sehingga event tembus ke device di bawahnya.
- Cable layer tetap di bawah device layer (tidak panggil `moveToTop()`).

## [0.3.2] - 2026-06-03

### Fixed
- **Cable layer menutupi device layer (CRITICAL)**: `cableLayer.moveToTop()` di `redrawCables()` membuat layer kabel berada di atas device layer. Setelah kabel pertama dibuat, klik pada device (seperti Switch) mengenai kabel, bukan device — sehingga koneksi kedua dan seterusnya gagal. Diperbaiki dengan menghapus `moveToTop()`.
- **Origin interface tidak divalidasi dengan benar**: `handleCableClick` sekarang menggunakan `getFreeInterfaces()` untuk origin device dan menolak jika interface sudah terpakai device lain.
- **Kode cable mode dibersihkan**: Ekstrak `clearCableMode()` agar cleanup konsisten di semua path.

## [0.3.1] - 2026-06-03

### Fixed
- **Double coordinate transform (CRITICAL)**: `stage.getPointerPosition()` sudah mengembalikan world coordinates. Semua kode yang melakukan `(pointer - stage.position) / scale` lagi over-transform, menyebabkan device placement, cable preview, dan semua interaksi canvas rusak saat zoom/pan. Diperbaiki dengan fungsi `getPointerWorldPos()`.
- **Cable selection tidak hilang**: `selectedCableId` sekarang di-clear saat klik empty space di select/cable mode.
- **Visual feedback cable selection**: Cable yang terpilih sekarang warna gold + stroke lebih tebal (`redrawCables()`).
- **Interface collision**: `getFreeInterfaces()` memfilter interface yang sudah terkoneksi, mencegah multi-kabel di port sama.

## [0.3.0] - 2026-06-03

### Added
- **Auto-save ke IndexedDB**: Setiap perubahan di-editor otomatis tersimpan (debounce 2 detik). Project baru langsung dibuat record pertamanya di IndexedDB.
- **Project Dialog**: Modal saat pertama kali buka app — daftar project tersimpan, bisa pilih, hapus, buat baru, atau import file.
- **Simulation Engine (ICMP Ping + ARP)**: Engine routing/simulasi pertama:
  - `ping <ip>` dari CLI (harus privileged mode, pilih device di canvas dulu)
  - BFS pathfinding melalui kabel, support switch flooding + MAC learning
  - Router routing table lookup
  - ARP resolution per hop
  - Menampilkan hop-by-hop + RTT
- **CLI `show` command**: Menampilkan info device yang sedang dipilih (nama, type, interfaces).

### Fixed
- Import via Toolbar sekarang juga langsung tersimpan ke IndexedDB.

## [0.2.1] - 2026-06-03

### Fixed
- **Import hang**: File dialog cancel sekarang reject promise (window focus listener + timeout fallback). User tidak lagi nunggu selamanya.
- **Import error feedback**: Error message tampil di toolbar (4 detik) kalau import gagal (file corrupt, format salah).
- **CLI state machine**: `enable` → prompt `#`, `configure terminal` → prompt `(config)#`, `end`/`disable` kembali. State persist untuk session.
- **Export createdAt**: Setiap re-export update `updatedAt` saja, preserve data asli.
- **Console port**: Router sekarang punya interface `Console0` (console type).
- **Invalid CSS**: Dihapus `bg-gray-850` (tidak valid di Tailwind v4).

## [0.2.0] - 2026-06-03

### Fixed
- **Bug 1**: `handleCableClick` — interface logic diperbaiki. Sekarang serial cable hanya bisa ke serial port, console ke console port, copper/fiber ke ethernet port. Ada fallback cerdas jika port yang cocok tidak tersedia.
- **Bug 2**: ConfigPanel IP sekarang simpan ke interface ethernet pertama (`gigabit-ethernet` atau `fast-ethernet`), bukan hardcoded index 0.
- **Bug 3**: `$effect` di Canvas sekarang track `editor.cableOrigin` → port highlight (warna emas) update saat cable mode aktif.
- **Bug 4**: Cable bisa di-hover (garis menebal) dan bisa di-delete via `selectedCableId` + Delete key.
- **Bug 5**: Cable preview line & cable rendering sekarang pakai `getPortPosition()` — port kiri untuk index < 4, kanan untuk >= 4.
- **Bug 6**: Fixed tipe `Konva.KonvaEventObject<MouseEvent>` dengan inline type.
- Cable line click → select cable, mouse hover → tebal garis 4px.
- Interface status toggle (up/down) dari ConfigPanel.
- Click empty space di `cable` tool → cancel cable origin.
- Cable origin cancel otomatis saat select tool atau klik kosong.

## [0.1.2] - 2026-06-03

### Fixed
- **Canvas**: Device tidak muncul setelah di-click — `$effect` dependency tracking issue. `editor.devices` tidak terbaca saat stage null, jadi Svelte tidak track sebagai dependency. Fix: baca `editor.devices` dan `editor.cables` sebelum guard clause.

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
