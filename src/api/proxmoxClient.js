import axios from 'axios'
import { EP } from './endpoints'

// ─── Axios Instance ────────────────────────────────────────────────────────────
// In dev, Vite proxies /api/* → https://{host}:8006/api2/json/*
// In production, the Express server proxies the same path.

let client = axios.create({ baseURL: '/api' })

/**
 * Reconfigure the client with a new API token.
 * Called from the store on first connect or settings change.
 */
export function initClient(apiToken) {
  client = axios.create({
    baseURL: '/api',
    headers: {
      Authorization: `PVEAPIToken=${apiToken}`,
    },
    timeout: 15000,
  })
}

// ─── Helpers ───────────────────────────────────────────────────────────────────
const get = (url, params = {}) => client.get(url, { params }).then((r) => r.data.data)
const post = (url, data = {}) => client.post(url, data).then((r) => r.data.data)

// ─── Cluster ──────────────────────────────────────────────────────────────────
export const fetchClusterStatus = () => get(EP.CLUSTER_STATUS)
export const fetchClusterTasks = () => get(EP.CLUSTER_TASKS)

// ─── Nodes ────────────────────────────────────────────────────────────────────
export const fetchNodes = () => get(EP.NODES)
export const fetchNodeStatus = (node) => get(EP.NODE_STATUS(node))
export const fetchNodeRrd = (node, timeframe = 'hour') => get(EP.NODE_RRD(node), { timeframe, cf: 'AVERAGE' })

// ─── VMs (QEMU) ───────────────────────────────────────────────────────────────
export const fetchQemuList = (node) => get(EP.QEMU_LIST(node))
export const fetchQemuStatus = (node, vmid) => get(EP.QEMU_STATUS(node, vmid))
export const startQemu = (node, vmid) => post(EP.QEMU_START(node, vmid))
export const stopQemu = (node, vmid) => post(EP.QEMU_STOP(node, vmid))
export const rebootQemu = (node, vmid) => post(EP.QEMU_REBOOT(node, vmid))
export const shutdownQemu = (node, vmid) => post(EP.QEMU_SHUTDOWN(node, vmid))

// ─── Containers (LXC) ─────────────────────────────────────────────────────────
export const fetchLxcList = (node) => get(EP.LXC_LIST(node))
export const fetchLxcStatus = (node, vmid) => get(EP.LXC_STATUS(node, vmid))
export const startLxc = (node, vmid) => post(EP.LXC_START(node, vmid))
export const stopLxc = (node, vmid) => post(EP.LXC_STOP(node, vmid))
export const rebootLxc = (node, vmid) => post(EP.LXC_REBOOT(node, vmid))
export const shutdownLxc = (node, vmid) => post(EP.LXC_SHUTDOWN(node, vmid))

// ─── Storage ──────────────────────────────────────────────────────────────────
export const fetchStorage = (node) => get(EP.STORAGE(node))

// ─── Validation ping ──────────────────────────────────────────────────────────
export const pingProxmox = () => get('/nodes')
