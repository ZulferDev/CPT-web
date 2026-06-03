# CPT-web

Cisco Packet Tracer versi Web — simulator jaringan berbasis browser.

**100% client-side.** Tidak perlu server. Auto-save ke IndexedDB. Export/import file `.cptw`.

## Tech Stack

Svelte 5 · TypeScript · Konva.js · Dexie.js · xterm.js · Tailwind CSS v4

## Status

| Fitur | Status |
|-------|--------|
| Toolbar + device palette | ✅ Berfungsi |
| Canvas device placement (click-to-place) | ✅ Berfungsi |
| Device drag on canvas + snap to grid | ✅ Berfungsi |
| Zoom (scroll) + Pan (shift+drag) | ✅ Berfungsi |
| Device selection + highlight | ✅ Berfungsi |
| Config panel (name, IP, mask) | ✅ Berfungsi |
| Kabel klik-to-connect (copper/serial/console) | ✅ Berfungsi |
| Delete device (Del key / button) | ✅ Berfungsi |
| CLI terminal (xterm.js) | ✅ UI, basic parser |
| Export/Import `.cptw` | ✅ Berfungsi |
| Simulation engine (ICMP, ARP) | 📝 Belum |
| Auto-save IndexedDB | 📝 Belum |

## Development

```bash
pnpm install
pnpm dev       # http://localhost:5173
pnpm build     # output ke ./build
pnpm preview   # preview build
```

## Format File

Proyek disimpan sebagai `.cptw` (JSON). Bisa di-export/download dan di-import via file picker.

## Lisensi

MIT
