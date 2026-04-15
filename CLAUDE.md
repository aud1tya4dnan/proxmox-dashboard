# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Proxmox Dashboard Manager is a React + Vite web application that connects to Proxmox VE REST API to display real-time cluster health, node metrics, and VM/LXC status from an external browser interface.

## Development Commands

```bash
# Install dependencies
npm install

# Start development server (runs on http://localhost:5173)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

## Architecture

### API Communication
The application uses a two-tier proxy architecture:
- **Development**: Vite proxy (configured in `vite.config.js`) routes `/api/*` → `https://{PROXMOX_HOST}:8006/api2/json/*`
- **Production**: Requires Express proxy server (not yet implemented)

**Critical**: The Vite proxy handles CORS issues and SSL certificate validation. Direct browser-to-Proxmox calls will fail due to CORS.

### State Management
Zustand store (`src/store/useProxmoxStore.js`) manages:
- Connection state and authentication
- Real-time data (nodes, VMs, storage, cluster status)
- Auto-refresh interval (30 seconds default)
- Per-node metrics and RRD data

The store persists API token and host configuration via `zustand/middleware` for reconnection.

### API Client
Axios client in `src/api/proxmoxClient.js` with:
- `initClient(apiToken)` - configures auth header for all requests
- Typed helper functions for each Proxmox API endpoint
- Automatic response parsing (extracts `data.data` from Proxmox API)

**Authentication**: Uses Proxmox API tokens (`PVEAPIToken=USER@REALM!TOKENID=UUID`)

### Component Structure
```
src/
├── api/           # API client and endpoint definitions
├── components/    # Reusable UI components
├── store/         # Zustand state management
├── utils/         # Utility functions (formatBytes, formatUptime, etc.)
└── index.css      # Complete design system with CSS custom properties
```

## Environment Variables

Required in `.env` (see `.env.example`):
- `VITE_PROXMOX_HOST` - Proxmox host URL (e.g., `https://192.168.1.100:8006`)
- `VITE_API_TOKEN` - Proxmox API token in format `root@pam!dashboard=<UUID>`

**Important**: API tokens require `PVEAuditor` role minimum on `/` for read-only access.

## Design System

Complete design system defined in `src/index.css` using CSS custom properties:
- Dark theme (`--bg-base`, `--bg-primary`, etc.)
- Semantic colors (`--green`, `--yellow`, `--red`)
- Component classes: `.card`, `.btn`, `.badge`, `.progress-bar`, etc.
- Responsive grid system: `.grid-2`, `.grid-3`, `.grid-4`

Key patterns:
- Glassmorphism effects with `backdrop-filter`
- Smooth transitions via `--transition: 0.18s ease`
- Responsive breakpoints at 1200px, 900px, and 600px

## Key Implementation Details

### Auto-Refresh Pattern
The store uses `setInterval` for 30-second auto-refresh. When modifying refresh logic:
- Clear existing timer before setting new one
- Handle `loading` state to prevent overlapping refreshes
- Use `Promise.allSettled` for parallel node data fetching

### Error Handling
- API errors display user-friendly messages in connection flow
- Individual node fetch failures don't break entire refresh
- Network errors distinguished from auth failures

### Utility Functions
Located in `src/utils/format.js`:
- `formatBytes(bytes, decimals)` - human-readable file sizes
- `formatUptime(seconds)` - uptime string (e.g., "5d 12h")
- `pct(val, max)` - safe percentage calculation
- `thresholdClass(pct)` - CSS class for color coding ('danger', 'warn', 'good')

## CORS and SSL Considerations

- **Development**: Vite proxy handles CORS with `secure: false` for self-signed certs
- **Production**: Will need Express proxy server or CORS configuration on Proxmox
- **SSL**: Proxmox self-signed certificates require `secure: false` in axios config

## Current Implementation Status

✅ Implemented:
- API client with Proxmox endpoints
- Zustand store with auto-refresh
- Core UI components (Sidebar, MetricCard, NodeCard, VMTable, etc.)
- Design system and responsive layouts
- Connection flow and auth

⏳ Not yet implemented:
- Page routing (no pages directory)
- Production proxy server
- Complete dashboard pages (Overview, Nodes, VMs & CTs, Storage)

## Development Notes

- All Proxmox API calls go through `/api` prefix (handled by proxy)
- State mutations in Zustand store use immutable patterns
- Components use React Router NavLink for navigation
- Chart.js integration for donut/line visualizations
- API token permissions should be read-only for dashboard safety