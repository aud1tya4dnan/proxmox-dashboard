import StatusBadge from './StatusBadge'
import DonutChart from './DonutChart'
import { pct, formatBytes, formatUptime, thresholdClass } from '../utils/format'
import { useNavigate } from 'react-router-dom'

export default function NodeCard({ node, status }) {
  const navigate = useNavigate()
  const isOnline = node.status === 'online'

  const cpuPct  = isOnline ? Math.round((status?.cpu ?? 0) * 100) : 0
  const memPct  = isOnline ? pct(status?.memory?.used ?? 0, status?.memory?.total ?? 1) : 0
  const diskPct = isOnline ? pct(status?.rootfs?.used ?? 0, status?.rootfs?.total ?? 1) : 0

  return (
    <div
      className="node-card fade-in"
      style={{ cursor: 'pointer' }}
      onClick={() => navigate(`/nodes/${node.node}`)}
      id={`node-card-${node.node}`}
    >
      <div className="node-card-header">
        <div>
          <div className="node-card-name">🖥 {node.node}</div>
          {status?.cpuinfo?.model && (
            <div className="node-card-model">{status.cpuinfo.model}</div>
          )}
        </div>
        <StatusBadge status={node.status} />
      </div>

      {isOnline ? (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-around', margin: '8px 0' }}>
            <DonutChart pct={cpuPct}  size={90} sublabel="CPU"  colorKey={thresholdClass(cpuPct)} />
            <DonutChart pct={memPct}  size={90} sublabel="RAM"  colorKey={thresholdClass(memPct)} />
            <DonutChart pct={diskPct} size={90} sublabel="Disk" colorKey={thresholdClass(diskPct)} />
          </div>

          <div className="node-metrics">
            <div className="node-metric-row">
              <div className="node-metric-label-row">
                <span className="node-metric-label">Memory</span>
                <span className="node-metric-value">
                  {formatBytes(status?.memory?.used)} / {formatBytes(status?.memory?.total)}
                </span>
              </div>
              <div className="progress-bar">
                <div className={`progress-bar-fill ${thresholdClass(memPct)}`} style={{ width: `${memPct}%` }} />
              </div>
            </div>
          </div>

          <div className="node-card-footer">
            <span>⬆ Uptime: {formatUptime(status?.uptime)}</span>
            <span>{status?.cpuinfo?.cpus ?? '?'} vCPUs</span>
            <span>PVE {node.pveversion?.split('/')[0] ?? '—'}</span>
          </div>
        </>
      ) : (
        <div className="empty-state" style={{ padding: '20px' }}>
          <div className="empty-state-icon">⚠️</div>
          <span style={{ fontSize: '0.85rem' }}>Node unreachable</span>
        </div>
      )}
    </div>
  )
}
