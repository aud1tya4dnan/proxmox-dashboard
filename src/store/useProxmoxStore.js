import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  initClient,
  fetchNodes,
  fetchNodeStatus,
  fetchNodeRrd,
  fetchQemuList,
  fetchLxcList,
  fetchClusterStatus,
  fetchStorage,
  pingProxmox,
  startQemu,
  stopQemu,
  rebootQemu,
  shutdownQemu,
  startLxc,
  stopLxc,
  rebootLxc,
  shutdownLxc,
} from '../api/proxmoxClient'

const REFRESH_INTERVAL = 30000 // 30 seconds

export const useProxmoxStore = create(
  persist(
    (set, get) => ({
      // ── Connection ───────────────────────────────────────────────────
      connected: false,
      apiToken: '',
      proxmoxHost: '',
      connectionError: null,

      // ── Data ─────────────────────────────────────────────────────────
      clusterStatus: [],
      nodes: [],
      nodeStatuses: {},   // { [nodeName]: statusObj }
      nodeRrd: {},        // { [nodeName]: rrdArray }
      vms: [],            // flat array, type: 'qemu' | 'lxc', enriched with node
      storage: {},        // { [nodeName]: storageArray }

      // ── UI State ─────────────────────────────────────────────────────
      loading: false,
      lastRefresh: null,
      refreshTimer: null,
      actionLoading: {}, // { [vmid]: true }

      // ── Actions ──────────────────────────────────────────────────────

      connect: async (apiToken, proxmoxHost) => {
        set({ loading: true, connectionError: null })
        try {
          initClient(apiToken)
          await pingProxmox()
          set({ connected: true, apiToken, proxmoxHost, loading: false })
          get().startAutoRefresh()
          await get().refreshAll()
        } catch (err) {
          let msg = ''
          if (err?.response?.status === 401) {
            msg = 'Invalid API token — check your token format and value.'
          } else if (err?.response?.status === 403) {
            msg = 'API Token Permission Error: Your token needs PVEAuditor role on path "/" with Sys.Audit privilege.'
          } else if (err?.message?.includes('Network')) {
            msg = 'Cannot reach Proxmox host. Check the URL and that the proxy is running.'
          } else {
            msg = err?.message || 'Connection failed.'
          }

          console.error('Connection error:', err)
          set({ loading: false, connectionError: msg, connected: false })
        }
      },

      disconnect: () => {
        const { refreshTimer } = get()
        if (refreshTimer) clearInterval(refreshTimer)
        set({
          connected: false,
          apiToken: '',
          proxmoxHost: '',
          nodes: [],
          nodeStatuses: {},
          nodeRrd: {},
          vms: [],
          storage: {},
          clusterStatus: [],
          refreshTimer: null,
          lastRefresh: null,
        })
      },

      refreshAll: async () => {
        set({ loading: true })
        try {
          const [clusterStatus, nodes] = await Promise.all([
            fetchClusterStatus().catch((err) => {
              console.error('Failed to fetch cluster status:', err)
              return []
            }),
            fetchNodes().catch((err) => {
              console.error('Failed to fetch nodes:', err)
              return []
            }),
          ])

          // Per-node data in parallel
          const nodeDetails = await Promise.allSettled(
            nodes.map(async (n) => {
              const [status, rrd, qemuList, lxcList, storageList] = await Promise.all([
                fetchNodeStatus(n.node).catch((err) => {
                  console.error(`Failed to fetch status for node ${n.node}:`, err)
                  return null
                }),
                fetchNodeRrd(n.node).catch((err) => {
                  console.error(`Failed to fetch RRD for node ${n.node}:`, err)
                  return []
                }),
                fetchQemuList(n.node).catch((err) => {
                  console.error(`Failed to fetch QEMU list for node ${n.node}:`, err)
                  return []
                }),
                fetchLxcList(n.node).catch((err) => {
                  console.error(`Failed to fetch LXC list for node ${n.node}:`, err)
                  return []
                }),
                fetchStorage(n.node).catch((err) => {
                  console.error(`Failed to fetch storage for node ${n.node}:`, err)
                  return []
                }),
              ])
              return { node: n.node, status, rrd, qemuList, lxcList, storageList }
            })
          )

          console.log('Node details:', nodeDetails) // Debug logging

          const nodeStatuses = {}
          const nodeRrd = {}
          const storage = {}
          const vms = []

          nodeDetails.forEach((res) => {
            if (res.status !== 'fulfilled') return
            const { node, status, rrd, qemuList, lxcList, storageList } = res.value
            nodeStatuses[node] = status
            nodeRrd[node] = rrd
            storage[node] = storageList
            qemuList.forEach((vm) => vms.push({ ...vm, node, type: 'qemu' }))
            lxcList.forEach((ct) => vms.push({ ...ct, node, type: 'lxc' }))
          })

          set({
            clusterStatus,
            nodes,
            nodeStatuses,
            nodeRrd,
            vms,
            storage,
            loading: false,
            lastRefresh: Date.now(),
          })

          console.log('Refresh complete:', { clusterStatus, nodes, vms, storage })
        } catch {
          set({ loading: false })
        }
      },

      startAutoRefresh: () => {
        const existing = get().refreshTimer
        if (existing) clearInterval(existing)
        const timer = setInterval(() => get().refreshAll(), REFRESH_INTERVAL)
        set({ refreshTimer: timer })
      },

      setActionLoading: (vmid, state) =>
        set((s) => ({ actionLoading: { ...s.actionLoading, [vmid]: state } })),

      // VM Actions
      startQemu: async (node, vmid) => {
        await startQemu(node, vmid)
        await get().refreshAll()
      },
      stopQemu: async (node, vmid) => {
        await stopQemu(node, vmid)
        await get().refreshAll()
      },
      rebootQemu: async (node, vmid) => {
        await rebootQemu(node, vmid)
        await get().refreshAll()
      },
      shutdownQemu: async (node, vmid) => {
        await shutdownQemu(node, vmid)
        await get().refreshAll()
      },
      startLxc: async (node, vmid) => {
        await startLxc(node, vmid)
        await get().refreshAll()
      },
      stopLxc: async (node, vmid) => {
        await stopLxc(node, vmid)
        await get().refreshAll()
      },
      rebootLxc: async (node, vmid) => {
        await rebootLxc(node, vmid)
        await get().refreshAll()
      },
      shutdownLxc: async (node, vmid) => {
        await shutdownLxc(node, vmid)
        await get().refreshAll()
      },
    }),
    {
      name: 'proxmox-dashboard',
      partialize: (state) => ({
        apiToken: state.apiToken,
        proxmoxHost: state.proxmoxHost,
      }),
    }
  )
)
