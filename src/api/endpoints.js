export const EP = {
  // Cluster
  CLUSTER_STATUS: '/cluster/status',
  CLUSTER_TASKS: '/cluster/tasks',

  // Nodes
  NODES: '/nodes',
  NODE_STATUS: (node) => `/nodes/${node}/status`,
  NODE_RRD: (node) => `/nodes/${node}/rrddata`,

  // QEMU (VMs)
  QEMU_LIST: (node) => `/nodes/${node}/qemu`,
  QEMU_STATUS: (node, vmid) => `/nodes/${node}/qemu/${vmid}/status/current`,
  QEMU_START: (node, vmid) => `/nodes/${node}/qemu/${vmid}/status/start`,
  QEMU_STOP: (node, vmid) => `/nodes/${node}/qemu/${vmid}/status/stop`,
  QEMU_REBOOT: (node, vmid) => `/nodes/${node}/qemu/${vmid}/status/reboot`,
  QEMU_SHUTDOWN: (node, vmid) => `/nodes/${node}/qemu/${vmid}/status/shutdown`,

  // LXC (Containers)
  LXC_LIST: (node) => `/nodes/${node}/lxc`,
  LXC_STATUS: (node, vmid) => `/nodes/${node}/lxc/${vmid}/status/current`,
  LXC_START: (node, vmid) => `/nodes/${node}/lxc/${vmid}/status/start`,
  LXC_STOP: (node, vmid) => `/nodes/${node}/lxc/${vmid}/status/stop`,
  LXC_REBOOT: (node, vmid) => `/nodes/${node}/lxc/${vmid}/status/reboot`,
  LXC_SHUTDOWN: (node, vmid) => `/nodes/${node}/lxc/${vmid}/status/shutdown`,

  // Storage
  STORAGE: (node) => `/nodes/${node}/storage`,
}
