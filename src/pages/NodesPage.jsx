import { useEffect, useState } from 'react'
import { useProxmoxStore } from '../store/useProxmoxStore'
import RefreshBar from '../components/RefreshBar'
import DonutChart from '../components/DonutChart'
import StatusBadge from '../components/StatusBadge'
import { formatBytes, formatUptime, formatHz, pct, thresholdClass } from '../utils/format'

export default function NodesPage() {
  const {
    nodes,
    nodeStatuses,
    nodeRrd,
    loading,
    lastRefresh,
    refreshAll,
  } = useProxmoxStore()

  const [countdown, setCountdown] = useState(30)

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 30))
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  return (
    <div className="page">
      <RefreshBar
        lastRefresh={lastRefresh}
        countdown={countdown}
        onRefresh={refreshAll}
        loading={loading}
      />

      <div className="page-header">
        <h1>Nodes</h1>
        <p>Detailed metrics and performance data per node</p>
      </div>

      {loading && nodes.length === 0 && (
        <div className="loading-overlay">
          <div className="spinner"></div>
          <p>Loading node data...</p>
        </div>
      )}

      {!loading && nodes.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">🖥️</div>
          <h3>No nodes available</h3>
          <p>Check your Proxmox connection and try again</p>
        </div>
      )}

      {!loading && nodes.length > 0 && (
        <div className="grid-2" style={{ gap: '20px' }}>
          {nodes.map((node) => {
            const status = nodeStatuses[node.node]
            const rrdData = nodeRrd[node.node] || []

            if (!status) {
              return (
                <div key={node.node} className="card">
                  <div className="node-card-header">
                    <div>
                      <div className="node-card-name">{node.node}</div>
                      <div className="node-card-model">No status data available</div>
                    </div>
                    <StatusBadge status={node.status} />
                  </div>
                </div>
              )
            }

            const cpuPct = pct(status.cpu, 1) * 100
            const memPct = pct(status.mem?.used, status.mem?.total)
            const swapPct = status.swap?.total ? pct(status.swap.used, status.swap.total) : 0

            return (
              <div key={node.node} className="card node-card">
                {/* Header */}
                <div className="node-card-header">
                  <div>
                    <div className="node-card-name">{node.node}</div>
                    <div className="node-card-model">{status.cpus} cores × {formatHz(status.cpuinfo?.mhz * 1e6)}</div>
                  </div>
                  <StatusBadge status={node.status} />
                </div>

                {/* CPU Usage */}
                <div className="node-metrics">
                  <div className="node-metric-row">
                    <div className="node-metric-label-row">
                      <span className="node-metric-label">CPU Usage</span>
                      <span className={`node-metric-value text-${thresholdClass(cpuPct)}`}>
                        {cpuPct.toFixed(1)}%
                      </span>
                    </div>
                    <div className="progress-bar" style={{ height: '8px' }}>
                      <div
                        className={`progress-bar-fill ${thresholdClass(cpuPct)}`}
                        style={{ width: `${cpuPct}%` }}
                      />
                    </div>
                  </div>

                  {/* Memory Usage */}
                  <div className="node-metric-row">
                    <div className="node-metric-label-row">
                      <span className="node-metric-label">Memory</span>
                      <span className={`node-metric-value text-${thresholdClass(memPct)}`}>
                        {memPct.toFixed(1)}%
                      </span>
                    </div>
                    <div className="progress-bar" style={{ height: '8px' }}>
                      <div
                        className={`progress-bar-fill ${thresholdClass(memPct)}`}
                        style={{ width: `${memPct}%` }}
                      />
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {formatBytes(status.mem?.used)} / {formatBytes(status.mem?.total)}
                    </div>
                  </div>

                  {/* Swap Usage */}
                  {status.swap?.total > 0 && (
                    <div className="node-metric-row">
                      <div className="node-metric-label-row">
                        <span className="node-metric-label">Swap</span>
                        <span className={`node-metric-value text-${thresholdClass(swapPct)}`}>
                          {swapPct.toFixed(1)}%
                        </span>
                      </div>
                      <div className="progress-bar" style={{ height: '8px' }}>
                        <div
                          className={`progress-bar-fill ${thresholdClass(swapPct)}`}
                          style={{ width: `${swapPct}%` }}
                        />
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {formatBytes(status.swap.used)} / {formatBytes(status.swap.total)}
                      </div>
                    </div>
                  )}

                  {/* Disk Usage */}
                  {status.rootfs && (
                    <div className="node-metric-row">
                      <div className="node-metric-label-row">
                        <span className="node-metric-label">Disk Usage</span>
                        <span className="node-metric-value">
                          {pct(status.rootfs.used, status.rootfs.total).toFixed(1)}%
                        </span>
                      </div>
                      <div className="progress-bar" style={{ height: '8px' }}>
                        <div
                          className="progress-bar-fill"
                          style={{
                            width: `${pct(status.rootfs.used, status.rootfs.total)}%`,
                            background: pct(status.rootfs.used, status.rootfs.total) >= 90 ? 'var(--red)' : pct(status.rootfs.used, status.rootfs.total) >= 70 ? 'var(--yellow)' : 'var(--green)'
                          }}
                        />
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {formatBytes(status.rootfs.used)} / {formatBytes(status.rootfs.total)}
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="node-card-footer">
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Uptime:</span>{' '}
                    <span className="mono">{formatUptime(status.uptime)}</span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Load:</span>{' '}
                    <span className="mono">{status.loadavg?.[0]?.toFixed(2)} / {status.loadavg?.[1]?.toFixed(2)} / {status.loadavg?.[2]?.toFixed(2)}</span>
                  </div>
                </div>

                {/* Additional Info */}
                <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: '1px solid var(--border-light)' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', fontSize: '0.75rem' }}>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Kernel:</span>{' '}
                      <span className="mono">{status.kversion || '—'}</span>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>CPU Model:</span>{' '}
                      <span style={{ color: 'var(--text-primary)' }}>{status.cpuinfo?.model || '—'}</span>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>KVM:</span>{' '}
                      <span style={{ color: status.kvm_supported ? 'var(--green)' : 'var(--red)' }}>
                        {status.kvm_supported ? '✓' : '✗'}
                      </span>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Version:</span>{' '}
                      <span className="mono">{status.pveversion || '—'}</span>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
