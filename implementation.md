# Proxmox External Dashboard — Implementation Plan

A modern, standalone web dashboard that connects to the Proxmox VE REST API and displays real-time cluster health, node metrics, and VM/LXC status — all from a browser outside the Proxmox host.

---

## Architecture Overview

```
Browser (Dashboard UI)
        │  HTTPS + API Token / Ticket Auth
        ▼
Proxmox VE REST API  (:8006/api2/json/...)
```

Because the Proxmox API runs on `https://host:8006`, browsers will receive a **CORS** error when calling it directly from a different origin. Two strategies:

| Strategy | Pros | Cons |
|---|---|---|
| **Vite Dev Proxy** (dev-only `/api` → Proxmox) | Zero extra code, easy | Only works in dev |
| **Thin Node.js Express proxy server** | Works in prod, hides credentials | Extra process |

**Decision**: Use a **Vite proxy** for development and an optional **lightweight Express proxy** (`server/`) for production deployment — both included in the project so the user can choose.

---

## Tech Stack

| Layer | Choice | Reason |
|---|---|---|
| Framework | **React + Vite** | Fast HMR, excellent ecosystem |
| Styling | **Vanilla CSS** (design tokens + components) | Full control, no Tailwind dependency |
| Charts | **Chart.js** via `react-chartjs-2` | Lightweight, great doughnut/line support |
| Auth | Proxmox **API Token** (primary) + ticket login fallback | Stateless, no session management |
| HTTP client | **axios** | Interceptors for auth headers |

---

## Key Proxmox API Endpoints Used

| Purpose | Endpoint |
|---|---|
| Auth ticket | `POST /access/ticket` |
| Cluster status | `GET /cluster/status` |
| All nodes list | `GET /nodes` |
| Node status/metrics | `GET /nodes/{node}/status` |
| Node RRD data (charts) | `GET /nodes/{node}/rrddata` |
| VMs on a node | `GET /nodes/{node}/qemu` |
| LXCs on a node | `GET /nodes/{node}/lxc` |
| VM/LXC status detail | `GET /nodes/{node}/qemu/{vmid}/status/current` |
| Storage list | `GET /nodes/{node}/storage` |
| Tasks/logs | `GET /cluster/tasks` |

Auth header: `Authorization: PVEAPIToken=USER@REALM!TOKENID=UUID`

---

## Proposed Changes

### Project Root

#### [NEW] `package.json`
React + Vite project. Dependencies: `react`, `react-dom`, `axios`, `chart.js`, `react-chartjs-2`, `react-router-dom`. Dev: `vite`, `@vitejs/plugin-react`.

#### [NEW] `vite.config.js`
Configures Vite dev proxy: routes `/api/*` → `https://{PROXMOX_HOST}:8006/api2/json/*` with SSL ignore (self-signed certs).

#### [NEW] `.env.example`
```
VITE_PROXMOX_HOST=https://192.168.1.100:8006
VITE_API_TOKEN=root@pam!dashboard=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

#### [NEW] `README.md`
Setup guide: create API token in Proxmox, copy `.env.example` → `.env`, `npm install`, `npm run dev`.

---

### `src/api/`

#### [NEW] `src/api/proxmoxClient.js`
Axios instance with base URL and `Authorization` header from env. Handles both API token auth and cookie/ticket auth. Exports typed helper functions for every endpoint group.

#### [NEW] `src/api/endpoints.js`
Named constants for all API endpoints to keep fetch calls clean.

---

### `src/store/`

#### [NEW] `src/store/useProxmoxStore.js`
Lightweight Zustand store (or React Context) holding:
- Connection config (host, token)
- Nodes list
- VMs + LXCs (flat, enriched with node name)
- Global loading / error state
- Auto-refresh interval logic (every 30 s)

---

### `src/pages/`

#### [NEW] `src/pages/ConnectPage.jsx`
Landing screen — input form for Proxmox host URL + API token. On submit, validates connection and navigates to overview.

#### [NEW] `src/pages/OverviewPage.jsx`
Main dashboard: cluster summary cards, node grid, recent tasks.

#### [NEW] `src/pages/NodesPage.jsx`
Detail view per node: CPU/RAM/disk usage with mini charts, uptime, kernel.

#### [NEW] `src/pages/VirtualMachinesPage.jsx`
Searchable + filterable table of all VMs and LXCs across all nodes. Status badges, resource bars.

#### [NEW] `src/pages/StoragePage.jsx`
Storage pool cards showing used/total, type (dir/ZFS/LVM/Ceph).

---

### `src/components/`

#### [NEW] `src/components/Sidebar.jsx`
Collapsible navigation sidebar with icon links to each page.

#### [NEW] `src/components/MetricCard.jsx`
Reusable card: title, value, unit, optional sparkline, color-coded thresholds.

#### [NEW] `src/components/NodeCard.jsx`
Summary card for a single node: online/offline badge, CPU %, RAM %, uptime.

#### [NEW] `src/components/DonutChart.jsx`
Wraps Chart.js doughnut to show CPU / memory / disk usage percentage.

#### [NEW] `src/components/VMTable.jsx`
Responsive table of VMs/LXCs with search, status filter, sortable columns.

#### [NEW] `src/components/StatusBadge.jsx`
Pill badge: running (green), stopped (red), paused (yellow).

#### [NEW] `src/components/RefreshBar.jsx`
Top bar showing last-refresh timestamp and countdown with manual refresh button.

---

### `src/` root files

#### [NEW] `src/main.jsx`
Vite/React entry.

#### [NEW] `src/App.jsx`
Router setup with `<ConnectPage>` as default, then protected routes for dashboard pages.

#### [NEW] `src/index.css`
Full design system: CSS custom properties (dark mode), typography (Inter via Google Fonts), layout utilities, animation keyframes.

---

### Optional — `server/` (Express proxy for production)

#### [NEW] `server/index.js`
Express app with `http-proxy-middleware` forwarding `/api/*` → Proxmox, adding auth header server-side. Serves the built Vite bundle from `dist/`.

#### [NEW] `server/package.json`

---

## Visual Design System

| Token | Value |
|---|---|
| `--bg-primary` | `#0d1117` |
| `--bg-secondary` | `#161b22` |
| `--bg-card` | `#1c2128` |
| `--accent-primary` | `#58a6ff` |
| `--accent-green` | `#3fb950` |
| `--accent-yellow` | `#d29922` |
| `--accent-red` | `#f85149` |
| Font | Inter (Google Fonts) |

Glassmorphism cards, smooth hover animations, gradient header, animated metric gauges.

---

## User Review Required

> [!IMPORTANT]
> **CORS / API Proxy**: Browsers block direct cross-origin calls to the Proxmox API. The Vite proxy handles this in dev. For production, you need either the included Express proxy or to configure Proxmox with a CORS header (non-trivial). Please confirm whether you need a production-ready proxy server included.

> [!IMPORTANT]
> **SSL**: Proxmox uses a self-signed TLS cert by default. The Vite proxy already sets `secure: false`. If you have a valid cert, set `VITE_PROXMOX_SECURE=true` in `.env`.

> [!WARNING]
> **API Token Permissions**: The token needs at minimum `PVEAuditor` role on `/` to read all node and VM data. No write permissions are needed for the read-only dashboard.

---

## Open Questions

Before I start building, a few quick things to confirm:

1. **Auth mode**: Do you want the dashboard to support both **API token** (recommended) and **username/password login**, or API token only?
2. **Production proxy**: Should I include the Express proxy server (`server/`) so the dashboard can be deployed standalone, or is the Vite dev proxy sufficient for now?
3. **VM actions**: Read-only dashboard, or should there be basic controls (start/stop/reboot VMs)?
4. **Multi-cluster**: Single Proxmox host, or ability to add multiple hosts?

---

## Verification Plan

### Automated
- `npm run dev` → dashboard loads at `http://localhost:5173`
- Connection form → enter Proxmox host + token → verify data loads

### Manual
- Overview cards display node count, CPU, RAM, VM count
- Refresh counter ticks every 30 s and data updates
- VM table searchable, filterable by status
- Error state shown when host is unreachable
