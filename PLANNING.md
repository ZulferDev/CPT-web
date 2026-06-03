# CPT-web — Perencanaan

## 1. Arsitektur (Zero-Backend)

```
┌──────────────────────────────────────────────────────┐
│                   Browser (Svelte 5)                  │
│  ┌──────────┐  ┌──────────┐  ┌───────────────────┐  │
│  │ Canvas   │  │ CLI      │  │ Configuration     │  │
│  │ Editor   │  │ Terminal │  │ Panel             │  │
│  └────┬─────┘  └────┬─────┘  └────────┬──────────┘  │
│       └──────────────┼─────────────────┘             │
│  ┌───────────────────┴──────────────────────────┐    │
│  │          Simulation Engine (Web Worker)       │    │
│  │  Devices │ Protocols │ Packets │ Routing      │    │
│  └───────────────────┬──────────────────────────┘    │
│  ┌───────────────────┴──────────────────────────┐    │
│  │          Storage Layer                        │    │
│  │  IndexedDB (auto-save) + File API (export/import) │
│  └──────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────┘
```

**Tidak ada backend.** Semua 100% client-side. Aplikasi static SPA bisa di-host di mana saja (GitHub Pages, Netlify, atau buka langsung dari `file://`).

---

## 2. Tech Stack

| Komponen          | Pilihan                           |
|-------------------|-----------------------------------|
| Framework         | Svelte 5 + TypeScript             |
| Canvas/Diagram    | **Konva.js** (API deklaratif, cocok Svelte) |
| State Management  | Svelte 5 runes ($state, $derived, $effect) |
| CLI Terminal      | xterm.js                          |
| Styling           | Tailwind CSS v4                   |
| Build Tool        | SvelteKit (static adapter)        |
| Storage Lokal     | IndexedDB (via Dexie.js)          |
| Export/Import     | File System Access API + fallback download |
| Testing           | Vitest + Playwright               |
| Bundle Size       | ~150-200KB gzip (target)          |

### Kenapa Konva.js?
- Library canvas deklaratif (mirip React Fiber tapi untuk canvas)
- Hit detection built-in
- Layer system (grid, devices, cables, animations)
- Tidak perlu DOM nodes untuk setiap elemen canvas
- Performa baik untuk 50-200+ node

---

## 3. Struktur Direktori

```
cpt-web/
├── src/
│   ├── lib/
│   │   ├── components/         # Svelte 5 components
│   │   │   ├── canvas/         # Konva canvas wrapper
│   │   │   ├── panel/          # Config panels (kanan)
│   │   │   ├── toolbar/        # Top toolbar
│   │   │   ├── device-palette/ # Left sidebar device list
│   │   │   ├── cli/            # xterm.js terminal
│   │   │   └── dialogs/        # Export/Import dialogs
│   │   ├── engine/             # Simulation engine
│   │   │   ├── devices/        # Device models & logic
│   │   │   ├── protocols/      # Protocol implementations
│   │   │   ├── packets/        # Packet structures
│   │   │   ├── routing/        # Routing table & algorithms
│   │   │   ├── cables/         # Cable types & behavior
│   │   │   └── simulator.ts    # Main simulation loop
│   │   ├── stores/             # Svelte 5 runes (.svelte.ts)
│   │   ├── storage/            # IndexedDB + file I/O
│   │   ├── types/              # TypeScript type definitions
│   │   └── utils/              # Helpers (MAC gen, IP calc, etc.)
│   ├── routes/                 # SvelteKit routes (hanya 1 halaman)
│   ├── app.html
│   └── app.css
├── static/
│   └── device-icons/           # SVG icons perangkat
├── package.json
├── svelte.config.js
├── vite.config.ts
├── tsconfig.json
└── tailwind.config.ts
```

Hanya **1 halaman** (`/`). Aplikasi single-page penuh.

---

## 4. Format File Projek (.cptw)

```typescript
// File extension: .cptw (Cisco Packet Tracer Web)
interface CptwFile {
  version: string;          // "1.0.0"
  name: string;
  createdAt: string;        // ISO date
  updatedAt: string;
  metadata: {
    author?: string;
    description?: string;
  };
  topology: {
    devices: Device[];
    cables: Cable[];
    notes: Note[];          // Text annotations di canvas
  };
  // Konfigurasi perangkat disimpan di dalam Device.config
}
```

**File adalah JSON** (gzip-compressed). Contoh:
```json
{
  "version": "1.0.0",
  "name": "Lab 1 - Dua Router",
  "topology": {
    "devices": [
      {
        "id": "r1",
        "type": "router",
        "name": "Router-1",
        "model": "2811",
        "position": { "x": 200, "y": 300 },
        "interfaces": [
          { "id": "f0/0", "name": "FastEthernet0/0", "type": "fast-ethernet", "ip": "192.168.1.1", "mask": "255.255.255.0", "status": "up" }
        ],
        "config": {
          "hostname": "R1",
          "routingTable": [...],
          "startupConfig": "enable\nconfigure terminal\n..."
        }
      }
    ],
    "cables": [
      { "id": "c1", "type": "copper", "from": { "device": "r1", "interface": "f0/0" }, "to": { "device": "sw1", "interface": "f0/1" } }
    ]
  }
}
```

**Export:** Download file `.cptw` via browser download / File System Access API.

**Import:** Drag & drop `.cptw` file ke halaman, atau pilih via file picker.

---

## 5. Storage Lokal (IndexedDB)

Untuk auto-save dan session recovery:

| Store        | Key          | Value                      |
|-------------|--------------|----------------------------|
| `projects`  | id (string)  | `{ name, data: CptwFile, updatedAt }` |
| `settings`  | key (string) | `{ value }` (theme, grid, dll) |

**Flow:**
1. Setiap perubahan → auto-save ke IndexedDB (debounce 2 detik)
2. Buka app → daftar project tersimpan muncul → pilih salah satu
3. Bisa export ke file `.cptw` dari daftar
4. Import `.cptw` → masuk ke IndexedDB

Tidak perlu login, tidak perlu server.

---

## 6. Fitur & Prioritas

### Phase 0 — Project Scaffolding ✅ (Selesai)
- [x] SvelteKit + TypeScript + Tailwind CSS v4
- [x] Static adapter SPA config (zero-backend)
- [x] Dependencies: Konva.js, Dexie.js, @xterm/xterm
- [x] Type definitions (Device, Cable, Interface, CptwFile)
- [x] Editor store (Svelte 5 runes)
- [x] Projects store (IndexedDB CRUD via Dexie)
- [x] File export/import (.cptw)
- [x] Directory structure siap

### MVP (Phase 1 — Target: 2 bulan)
- [x] Toolbar + device palette (sidebar kiri)
- [x] Canvas drag-and-drop perangkat (Konva.js)
- [ ] Koneksi kabel (copper, serial, console) — render done, interaksi menyusul
- [x] Device library: Router 2811, Switch 2960, PC, Server, Hub, Laptop, Wireless
- [x] Konfigurasi IP via panel
- [x] CLI terminal (xterm.js) — dasar, collapsible
- [ ] Simulasi: ICMP ping, ARP resolution
- [ ] Auto-save ke IndexedDB (terintegrasi)
- [x] Export/Import file `.cptw`
- [x] Snapping grid + zoom + pan

### Phase 2
- [ ] Routing: Static, OSPF, EIGRP, RIP
- [ ] VLAN, Trunking, STP
- [ ] ACL, NAT/PAT
- [ ] DHCP, DNS simulation
- [ ] Animasi packet (real-time & step mode)
- [ ] Export topology PNG/PDF
- [ ] Undo/redo

### Phase 3
- [ ] Wireless (WPA2, SSID)
- [ ] IoT devices
- [ ] Packet Tracer (.pkt) import
- [ ] Multi-tab projects
- [ ] PWA (offline support)

---

## 7. Simulation Engine

### Arsitektur Engine
```
┌─────────────┐    ┌──────────────┐    ┌──────────────┐
│ User Action │───>│ Event Queue  │───>│  Simulator   │
│ (ping GUI)  │    │              │    │  (main loop) │
└─────────────┘    └──────────────┘    ───┬───────────┘
                        │                 │
                  ┌─────┴─────┐    ┌──────┴──────┐
                  │ CLI Engine │    │ Packet Flow │
                  │ (parser)   │    │  Resolver   │
                  └───────────┘    └─────────────┘
```

**Pakai Web Worker** agar simulasi tidak nge-block UI.

### Device Model
```typescript
type DeviceType = 'router' | 'switch' | 'pc' | 'server' | 'hub' | 'laptop' | 'wireless-router';

interface Device {
  id: string;
  type: DeviceType;
  name: string;
  model: string;
  position: { x: number; y: number };
  interfaces: Interface[];
  config: DeviceConfig;
  status: 'on' | 'off';
  ios?: string;          // CLI startup config
}

interface Interface {
  id: string;
  name: string;           // "FastEthernet0/0", "GigabitEthernet1/0/1", "Serial0/0/0"
  type: 'fast-ethernet' | 'gigabit-ethernet' | 'serial' | 'console' | 'vlan';
  macAddress: string;
  ipAddress?: string;
  subnetMask?: string;
  status: 'up' | 'down';
  connectedTo?: LinkEndpoint;
}
```

### Packet Flow
```
[PC-A] --ping--> [Switch1] --ping--> [Router1] --ping--> [Router2] --> [PC-B]

Step-by-step:
1. PC-A cek ARP table → ARP request broadcast
2. Switch1 learn MAC → forward ke semua port
3. Router1 reply ARP → PC-A tahu MAC Router1
4. PC-A kirim ICMP echo ke Router1
5. Router1 cek routing table → forward ke Router2
6. Router2 cek routing table → forward ke PC-B via Switch2
7. PC-B reply ICMP echo-reply (jalur balik sama)
```

---

## 8. CLI Cisco IOS (Subset)

Target: cover 80% command yang dipakai di CCNA.

| Mode        | Commands                                    |
|-------------|---------------------------------------------|
| User EXEC   | `enable`, `exit`, `ping`, `traceroute`, `show` |
| Privileged  | `configure terminal`, `show running-config`, `show ip route`, `show interfaces`, `show vlan`, `debug` |
| Config      | `hostname`, `interface`, `ip address`, `no shutdown`, `shutdown`, `router ospf`, `router rip`, `vlan`, `line console` |
| Interface   | `ip address`, `no shutdown`, `speed`, `duplex`, `description` |
| Routing     | `ip route`, `network` (OSPF/RIP), `default-information originate` |

Parser ditulis custom (tidak pakai library parser generator — cukup regex + state machine).

---

## 9. UI Layout

```
┌──────────────────────────────────────────────────────────┐
│ [File] [Edit] [View] [Tools] [Help]       [?] [⚙]      │ ← Toolbar
├──────┬────────────────────────────────────┬──────────────┤
│      │                                    │              │
│      │                                    │   Panel      │
│      │         Canvas Area                │   Config     │
│Palette│         (Konva.js)                │   (IP,       │
│Devices│                                    │    Routing,  │
│       │                                    │    VLAN)     │
│       │                                    │              │
│       │                                    │              │
│       │                                    │              │
├──────┴────────────────────────────────────┴──────────────┤
│ [CLI Terminal - xterm.js]               [Status Bar]    │ ← Bottom
└──────────────────────────────────────────────────────────┘
```

- **Resizable panels** — pengguna bisa atur lebar palette/panel config
- **CLI di bawah** — bisa di-toggle / di-resize tingginya

---

## 10. Database IndexedDB Schema (Dexie.js)

```typescript
import Dexie from 'dexie';

const db = new Dexie('cpt-web');
db.version(1).stores({
  projects: '++id, name, updatedAt',
  settings: '&key',
});
```

Operasi:
- `db.projects.add(project)` — simpan baru
- `db.projects.put(project)` — update
- `db.projects.toArray()` — list semua
- `db.projects.delete(id)` — hapus
- Export: `project.data` → JSON.stringify → download
- Import: file → JSON.parse → `db.projects.add()`

---

## 11. Progress Pengerjaan

### ✅ Done (Phase 0)
1. ✅ SvelteKit skeleton + TypeScript
2. ✅ Tailwind CSS v4 + Vite plugin
3. ✅ SvelteKit static adapter (SPA fallback)
4. ✅ Konva.js terinstall (dynamic import, lazy loaded)
5. ✅ Dexie.js untuk IndexedDB
6. ✅ @xterm/xterm + addon-fit
7. ✅ Type definitions (Device, Cable, Interface, CptwFile, dll)
8. ✅ Editor store (Svelte 5 runes — class pattern)
9. ✅ Projects store (IndexedDB CRUD)
10. ✅ File export/import (.cptw)
11. ✅ Directory structure siap

### ✅ Done (Phase 1 — Layout + Canvas)
12. ✅ Layout utama: Toolbar + Palette + Canvas + Panel + CLI
13. ✅ Toolbar: Select/Device/Cable/Note tools, New/Import/Export
14. ✅ Device Palette: 7 device types + 3 cable types
15. ✅ Canvas dengan Konva.js: grid, zoom (scroll), pan (shift+drag)
16. ✅ Drag device dari palette → canvas (snap to grid)
17. ✅ Klik device → config panel muncul (sidebar kanan)
18. ✅ Config Panel: nama device, IP, subnet mask, interface list
19. ✅ CLI Terminal (xterm.js) — collapsible, basic command parser
20. ✅ Status Bar: project name, device/cable count, clock
21. ✅ Kabel: render lines antar device (Copper/Serial/Console warna beda)
11. CLI: xterm.js + command parser
12. Storage: auto-save IndexedDB + export/import file
