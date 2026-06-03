# CPT-web

Cisco Packet Tracer versi Web — simulator jaringan berbasis browser.

**100% client-side.** Tidak perlu server. Auto-save ke IndexedDB. Export/import file `.cptw`.

## Tech Stack

Svelte 5 · TypeScript · Konva.js · Dexie.js · xterm.js · Tailwind CSS v4

## Status

| Phase | Fitur | Status |
|-------|-------|--------|
| **0** | Project scaffolding | ✅ |
| **1** | Layout + Canvas + Device palette + Config panel + CLI | ✅ |
| **1** | Kabel (interaksi) | 🔄 |
| **1** | Auto-save + export/import dialog | 🔄 |
| **1** | Simulation engine (ICMP, ARP) | 📝 |

## Development

```bash
pnpm install
pnpm dev       # http://localhost:5173
pnpm build     # output ke ./build
pnpm preview   # preview build
```

## Format File

Proyek disimpan sebagai `.cptw` (JSON). Bisa di-export/download dan di-import via drag-drop atau file picker.

## Lisensi

MIT
