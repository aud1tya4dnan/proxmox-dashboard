# Proxmox Dashboard Manager

A real-time monitoring dashboard for Proxmox VE clusters. Connects to the Proxmox REST API to display node health, VM/LXC status, storage usage, and cluster metrics from any browser.

## Features

- **Cluster Overview** — At-a-glance cluster health, resource usage, and recent tasks
- **Node Monitoring** — Per-node CPU, memory, disk, and uptime metrics with donut charts
- **VM & LXC Management** — Searchable table of all virtual machines and containers across nodes
- **Storage Pools** — Usage breakdown for each storage backend
- **Auto-Refresh** — 30-second polling keeps data current without manual reloads
- **Dark Theme** — Glassmorphism design system with responsive layout
- **API Token Auth** — Read-only access via Proxmox API tokens (no credentials stored server-side)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| UI | React 19, React Router 7 |
| State | Zustand 5 with persistence |
| HTTP | Axios with Vite dev proxy |
| Charts | Chart.js 4 + react-chartjs-2 |
| Build | Vite 8 |
| Lint | Biome |

## Quick Start

### Prerequisites

- Node.js 18+
- A Proxmox VE server with API access
- API token with `PVEAuditor` role (minimum) on `/`

### 1. Create a Proxmox API Token

In the Proxmox web UI:

1. Go to **Datacenter > Permissions > API Tokens**
2. Select the user (e.g., `root@pam`)
3. Click **Add**, give it an ID (e.g., `dashboard`)
4. **Uncheck** "Privilege Separation" if you want the token to inherit user permissions
5. Copy the full token string: `USER@REALM!TOKENID=UUID`

Assign permissions:

1. Go to **Datacenter > Permissions**
2. Add path `/`, user `root@pam`, role `PVEAuditor` (read-only) or `PVEVMAdmin` (for VM controls)

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env`:

```env
VITE_PROXMOX_HOST=https://192.168.1.100:8006
VITE_API_TOKEN=root@pam!dashboard=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

### 3. Install and Run

```bash
npm install
npm run dev
```

Open http://localhost:5173. Enter your Proxmox host and API token on the connect page.

## Project Structure

```
src/
├── api/
│   ├── endpoints.js          # Proxmox API endpoint constants
│   └── proxmoxClient.js      # Axios client with auth helpers
├── components/
│   ├── DonutChart.jsx        # Chart.js donut wrapper
│   ├── MetricCard.jsx        # Reusable metric display card
│   ├── NodeCard.jsx          # Node status card with charts
│   ├── RefreshBar.jsx        # Auto-refresh timer indicator
│   ├── Sidebar.jsx           # Collapsible navigation sidebar
│   ├── StatusBadge.jsx       # Color-coded status indicator
│   ├── VMActionButtons.jsx   # VM control action buttons
│   └── VMTable.jsx           # Searchable VM/LXC data table
├── pages/
│   ├── ConnectPage.jsx       # Login/connection form
│   ├── OverviewPage.jsx      # Cluster dashboard overview
│   ├── NodesPage.jsx         # Node detail metrics
│   ├── StoragePage.jsx       # Storage pool usage
│   └── VirtualMachinesPage.jsx # VM & LXC listing
├── store/
│   └── useProxmoxStore.js    # Zustand state management
├── utils/
│   └── format.js             # formatBytes, formatUptime, pct, thresholdClass
├── App.jsx                   # Router + layout
├── App.css                   # Component styles
├── index.css                 # Design system (CSS custom properties)
└── main.jsx                  # Entry point
```

## Architecture

### API Proxy

Browser-to-Proxmox calls fail due to CORS and self-signed SSL certificates. The app uses a Vite dev proxy to handle this:

```
Browser → /api/* → Vite Proxy → https://PROXMOX_HOST:8006/api2/json/*
```

- `secure: false` — accepts self-signed certificates
- `changeOrigin: true` — rewrites Origin header
- Path rewrite: `/api/nodes` → `/api2/json/nodes`

### Authentication

Uses Proxmox API tokens passed as `Authorization: PVEAPIToken=...` header. The token and host are persisted in Zustand (via `zustand/middleware`) so the dashboard reconnects automatically on reload.

### State Management

Single Zustand store (`useProxmoxStore.js`) manages:

- **Connection** — host, token, connected status
- **Data** — nodes, VMs, storage, cluster status
- **Refresh** — 30-second auto-polling with `Promise.allSettled` for resilient parallel fetches
- **Per-node metrics** — CPU/memory RRD data for charts

### Routing

| Path | Page | Auth Required |
|------|------|:------------:|
| `/` | ConnectPage | No |
| `/overview` | OverviewPage | Yes |
| `/nodes` | NodesPage | Yes |
| `/nodes/:nodeName` | NodesPage (filtered) | Yes |
| `/vms` | VirtualMachinesPage | Yes |
| `/storage` | StoragePage | Yes |

Unauthenticated users redirect to `/`. Unknown paths redirect to `/`.

### Design System

Built with CSS custom properties in `index.css`:

- **Colors**: `--bg-base`, `--bg-primary`, `--green`, `--yellow`, `--red`
- **Components**: `.card`, `.btn`, `.badge`, `.progress-bar`
- **Layout**: `.grid-2`, `.grid-3`, `.grid-4` with responsive breakpoints (1200px, 900px, 600px)
- **Effects**: Glassmorphism (`backdrop-filter`), smooth transitions (`0.18s ease`)

## Available Scripts

| Command | Description |
|---------|------------|
| `npm run dev` | Start dev server on http://localhost:5173 |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Check code with Biome |
| `npm run lint:fix` | Auto-fix lint issues |

## CORS & SSL Notes

- **Development**: Vite proxy handles CORS and accepts self-signed certs. No browser configuration needed.
- **Production**: Requires a reverse proxy (nginx, Caddy, or Express) to handle CORS. Configure your proxy to forward `/api/*` to the Proxmox host.
- **Proxmox-side CORS**: You can alternatively configure CORS headers in `/etc/default/pveproxy` on the Proxmox host, but the proxy approach is simpler and more secure.

## Deployment

### Build

```bash
npm run build
```

Output in `dist/`. Serve with any static file server plus a reverse proxy for API calls.

### Example nginx Configuration

```nginx
server {
    listen 80;
    server_name proxmox-dashboard.example.com;
    root /var/www/proxmox-dashboard;
    index index.html;

    # SPA fallback
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy API calls to Proxmox
    location /api/ {
        proxy_pass https://192.168.1.100:8006/api2/json/;
        proxy_ssl_verify off;
        proxy_set_header Host $proxy_host;
    }
}
```

## Troubleshooting

| Issue | Cause | Fix |
|-------|-------|-----|
| "Network error" on connect | Proxy not running or wrong host | Verify `VITE_PROXMOX_HOST` in `.env`, restart dev server |
| "401 Unauthorized" | Invalid or expired token | Regenerate API token in Proxmox UI |
| "403 Forbidden" | Token lacks permissions | Assign `PVEAuditor` role on `/` path |
| Blank page after reload | Token not persisted | Check browser localStorage is enabled |
| SSL errors in production | Missing proxy config | Add `proxy_ssl_verify off` to nginx config |

## License

Private project. All rights reserved.
