import { useEffect, useState } from 'react'
import { useProxmoxStore } from '../store/useProxmoxStore'
import MetricCard from '../components/MetricCard'
import NodeCard from '../components/NodeCard'
import DonutChart from '../components/DonutChart'
import RefreshBar from '../components/RefreshBar'
import { formatBytes, formatUptime } from '../utils/format'

console.log('OverviewPage rendered') // Debug logging

export default function OverviewPage() {
  const {
    clusterStatus,
    nodes,
    nodeStatuses,
    vms,
    storage,
    loading,
    lastRefresh,
    refreshAll,
  } = useProxmoxStore()

  const [countdown, setCountdown] = useState(30)

  useEffect(() => {
    // Countdown timer for auto-refresh
    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 30))
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  // Calculate summary metrics
  const totalNodes = nodes.length
  const onlineNodes = nodes.filter((n) => n.status === 'online').length
  const totalVMs = vms.filter((v) => v.type === 'qemu').length
  const totalLXCs = vms.filter((v) => v.type === 'lxc').length
  const runningVMs = vms.filter((v) => v.status === 'running').length

  // Calculate cluster-wide CPU and memory usage
  let totalCpuUsed = 0
  let totalCpuMax = 0
  let totalMemUsed = 0
  let totalMemMax = 0
  let totalUptime = 0

  Object.entries(nodeStatuses).forEach(([nodeName, status]) => {
    if (status) {
      // CPU usage - Proxmox returns CPU usage as a percentage (0-1)
      const cpuUsage = status.cpu || 0
      const cpuCores = status.cpus || 1
      totalCpuUsed += cpuUsage * cpuCores // Calculate actual CPU usage considering cores
      totalCpuMax += cpuCores // Each node contributes its number of cores

      // Memory usage
      totalMemUsed += status.mem?.used || 0
      totalMemMax += status.mem?.total || 0

      // Uptime (sum of all nodes)
      totalUptime += status.uptime || 0
    }
  })

  const clusterCpuUsage = totalCpuMax > 0 ? (totalCpuUsed / totalCpuMax) * 100 : 0
  const clusterMemUsage = totalMemMax > 0 ? (totalMemUsed / totalMemMax) * 100 : 0
  const avgUptime = totalUptime / (Object.keys(nodeStatuses).length || 1)

  // Calculate total storage usage
  let totalStorageUsed = 0
  let totalStorageTotal = 0

  Object.values(storage).forEach((storageList) => {
    storageList.forEach((s) => {
      if (s.used !== undefined && s.total !== undefined) {
        totalStorageUsed += s.used
        totalStorageTotal += s.total
      }
    })
  })

  const storageUsage = totalStorageTotal > 0 ? (totalStorageUsed / totalStorageTotal) * 100 : 0

  return (
    <div className="page">
      {/* Header */}
      <RefreshBar
        lastRefresh={lastRefresh}
        countdown={countdown}
        onRefresh={refreshAll}
        loading={loading}
      />

      <div className="page-header">
        <h1>Overview</h1>
        <p>Cluster-wide summary and real-time metrics</p>
      </div>

      {/* Loading state */}
      {loading && nodes.length === 0 && (
        <div className="loading-overlay">
          <div className="spinner"></div>
          <p>Loading cluster data...</p>
        </div>
      )}

      {/* Empty state */}
      {!loading && nodes.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">📊</div>
          <h3>No cluster data available</h3>
          <p>Check your Proxmox connection and try again</p>
        </div>
      )}

      {/* Dashboard content */}
      {!loading && nodes.length > 0 && (
        <>
          {/* Summary Cards */}
          <div className="grid-3" style={{ marginBottom: '24px' }}>
            <MetricCard
              title="Nodes"
              value={onlineNodes}
              total={totalNodes}
              icon="🖥️"
              color="#58a6ff"
              subtext={`${totalNodes - onlineNodes} offline`}
            />
            <MetricCard
              title="Virtual Machines"
              value={runningVMs}
              total={totalVMs}
              icon="💻"
              color="#bc8cff"
              subtext={`${totalVMs - runningVMs} stopped`}
            />
            <MetricCard
              title="Containers"
              value={totalLXCs}
              icon="📦"
              color="#3fb950"
              subtext="LXC instances"
            />
            <MetricCard
              title="Cluster Uptime"
              value={formatUptime(avgUptime)}
              icon="⏱️"
              color="#e3b341"
              subtext="Average across nodes"
            />
            <MetricCard
              title="Storage"
              value={`${storageUsage.toFixed(1)}%`}
              icon="💾"
              color="#f0883e"
              subtext={`${((totalStorageUsed / 1024 ** 4).toFixed(2))} / ${((totalStorageTotal / 1024 ** 4).toFixed(2))} TB`}
            />
          </div>

          {/* Cluster-wide resource usage */}
          <div className="grid-2" style={{ marginBottom: '24px' }}>
            <div className="card">
              <h3 style={{ marginBottom: '16px', fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                Cluster CPU Usage
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <DonutChart
                  pct={clusterCpuUsage}
                  colorKey={clusterCpuUsage >= 90 ? 'danger' : clusterCpuUsage >= 70 ? 'warn' : 'good'}
                  size={100}
                  sublabel="CPU"
                />
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Across {onlineNodes} online nodes
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Total cores: {totalCpuMax}
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <h3 style={{ marginBottom: '16px', fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                Cluster Memory Usage
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <DonutChart
                  pct={clusterMemUsage}
                  colorKey={clusterMemUsage >= 90 ? 'danger' : clusterMemUsage >= 70 ? 'warn' : 'good'}
                  size={100}
                  sublabel="RAM"
                />
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {(totalMemUsed / 1024 ** 3).toFixed(1)} / {(totalMemMax / 1024 ** 3).toFixed(1)} GB
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Total: {formatBytes(totalMemMax)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Node Grid */}
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ marginBottom: '16px', fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              Node Status
            </h3>
            <div className="grid-3">
              {nodes.map((node) => (
                <NodeCard key={node.node} node={node} status={nodeStatuses[node.node]} />
              ))}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="card">
            <h3 style={{ marginBottom: '16px', fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Cluster Quick Stats
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Total Nodes</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)' }}>{totalNodes}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Online Nodes</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--green)' }}>{onlineNodes}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Total VMs</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)' }}>{totalVMs}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Total Containers</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)' }}>{totalLXCs}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Running Instances</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--green)' }}>{runningVMs}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Storage Pools</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {Object.values(storage).reduce((acc, list) => acc + list.length, 0)}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
