# AGENT — Aturan dan Konvensi Proyek CPT-web

## Workflow
- Setiap selesai satu pekerjaan, update **CHANGELOG.md**, **README.md**, dan **PLANNING.md** (progress).
- Setiap CHANGELOG.md diubah, lakukan **git add, commit, push**.
- Label commit: `v<major>.<minor>.<patch>` atau deskriptif.

## Arsitektur
- **Zero-backend** — 100% client-side. Tidak ada server.
- **SPA** — SvelteKit static adapter, `ssr=false`, `prerender=true`.
- **Storage** — IndexedDB via Dexie.js (auto-save). Export/import file `.cptw`.
- **Canvas** — Konva.js (dynamic import untuk bundle splitting).

## Tech Stack
- Svelte 5 (runes mode, class-based stores)
- TypeScript
- Tailwind CSS v4
- Konva.js (canvas)
- Dexie.js (IndexedDB)
- @xterm/xterm (CLI terminal)

## Store Pattern (Svelte 5)
- Gunakan **class** dengan properti `$state`, jangan export `$state` langsung.
- Export instance: `export const editor = new EditorStore();`
- Akses dari komponen: `editor.devices`, `editor.activeTool`, dll.

## Struktur Direktori
```
src/
├── lib/
│   ├── components/
│   │   ├── canvas/
│   │   ├── panel/
│   │   ├── toolbar/
│   │   ├── device-palette/
│   │   ├── cli/
│   │   └── dialogs/
│   ├── engine/         # Simulation engine
│   ├── stores/         # .svelte.ts (runes)
│   ├── storage/        # IndexedDB + file I/O
│   ├── types/          # TypeScript types
│   └── utils/
├── routes/
├── app.html
└── static/
```

## File Format (.cptw)
- JSON structure dengan `version`, `name`, `topology: { devices, cables, notes }`.
- Export via File System Access API, import via file picker.

## Code Conventions
- No comments in code.
- Svelte 5 runes (`$state`, `$derived`, `$effect`) — jangan pakai Svelte 4 syntax (`$:`, `export let`, `on:click`).
- Event handler: `onclick={handler}`, bukan `on:click={handler}`.
- Two-way binding: `bind:value={var}`.
- Imports: path relatif atau `$lib/` alias.
