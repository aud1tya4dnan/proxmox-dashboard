import { NavLink, useNavigate } from 'react-router-dom'
import { useProxmoxStore } from '../store/useProxmoxStore'

const NAV_ITEMS = [
  { to: '/overview', icon: '⬡', label: 'Overview' },
  { to: '/nodes', icon: '🖥', label: 'Nodes' },
  { to: '/vms', icon: '💻', label: 'VMs & CTs' },
  { to: '/storage', icon: '💾', label: 'Storage' },
]

export default function Sidebar() {
  const { nodes, vms, disconnect, connected, proxmoxHost } = useProxmoxStore()
  const navigate = useNavigate()

  const vmCount = vms.filter((v) => v.status === 'running').length
  const onlineNodes = nodes.filter((n) => n.status === 'online').length

  const handleDisconnect = () => {
    disconnect()
    navigate('/')
  }

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">⬡</div>
        <div className="sidebar-logo-text">
          <h2>PVE Dashboard</h2>
          <span>External Monitor</span>
        </div>
      </div>

      {/* Connected host info */}
      {connected && proxmoxHost && (
        <div
          style={{
            padding: '10px 16px',
            margin: '8px 10px',
            background: 'var(--accent-glow)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid rgba(88,166,255,0.2)',
          }}
        >
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 2 }}>Connected to</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--accent)', fontWeight: 600, wordBreak: 'break-all' }}>
            {proxmoxHost.replace('https://', '').replace('http://', '')}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--green)', marginTop: 4 }}>
            ● {onlineNodes}/{nodes.length} nodes online
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="sidebar-nav">
        <div className="sidebar-section-label">Navigation</div>
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            id={`nav-${item.label.toLowerCase().replace(/[^a-z]/g, '-')}`}
            className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
          >
            <span className="nav-icon">{item.icon}</span>
            <span>{item.label}</span>
            {item.to === '/vms' && vmCount > 0 && <span className="nav-badge">{vmCount} ▶</span>}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        {connected && (
          <button
            className="btn btn-ghost btn-sm"
            style={{ width: '100%' }}
            onClick={handleDisconnect}
            id="btn-disconnect"
          >
            ⏻ Disconnect
          </button>
        )}
        <div style={{ textAlign: 'center', fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 10 }}>
          Proxmox Dashboard v1.0
        </div>
      </div>
    </aside>
  )
}
