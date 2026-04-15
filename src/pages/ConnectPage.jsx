import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProxmoxStore } from '../store/useProxmoxStore'

export default function ConnectPage() {
  const navigate = useNavigate()
  const { connect, connectionError, loading } = useProxmoxStore()

  const [host, setHost] = useState('https://192.168.1.100:8006')
  const [token, setToken] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    await connect(token, host)
    // If connection successful, the store will update and App.jsx will navigate
    if (useProxmoxStore.getState().connected) {
      navigate('/overview')
    }
  }

  const handleQuickConnect = () => {
    // Auto-fill with environment variables if available
    if (import.meta.env.VITE_PROXMOX_HOST) {
      setHost(import.meta.env.VITE_PROXMOX_HOST)
    }
    if (import.meta.env.VITE_API_TOKEN) {
      setToken(import.meta.env.VITE_API_TOKEN)
    }
  }

  return (
    <div className="connect-page">
      <div className="connect-card">
        {/* Logo */}
        <div className="connect-logo">
          <div className="connect-logo-icon">⬡</div>
          <div>
            <h1>PVE Dashboard</h1>
            <p>External Monitor</p>
          </div>
        </div>

        {/* Connection form */}
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label htmlFor="proxmox-host">Proxmox Host URL</label>
            <input
              id="proxmox-host"
              type="url"
              className="input"
              placeholder="https://192.168.1.100:8006"
              value={host}
              onChange={(e) => setHost(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="input-group">
            <label htmlFor="api-token">API Token</label>
            <input
              id="api-token"
              type="password"
              className="input"
              placeholder="root@pam!dashboard=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          {connectionError && (
            <div className="connect-error">
              <strong>Connection Error:</strong> {connectionError}
              {connectionError.includes('403') && (
                <div style={{ marginTop: '8px', fontSize: '0.8rem' }}>
                  <strong>Solution:</strong> Update your API token permissions in Proxmox UI:
                  <ul style={{ marginLeft: '20px', marginTop: '4px' }}>
                    <li>Go to <strong>Datacenter → API Tokens</strong></li>
                    <li>Edit your token and set <strong>Role: PVEAuditor</strong></li>
                    <li>Set <strong>Path: /</strong> (root, not /nodes)</li>
                    <li>Ensure <strong>Sys.Audit</strong> privilege is enabled</li>
                  </ul>
                </div>
              )}
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary btn-lg"
            style={{ width: '100%' }}
            disabled={loading || !host || !token}
          >
            {loading ? 'Connecting...' : 'Connect to Proxmox'}
          </button>

          <button
            type="button"
            className="btn btn-ghost"
            style={{ width: '100%', marginTop: '10px' }}
            onClick={handleQuickConnect}
            disabled={loading}
          >
            Auto-fill from Environment
          </button>
        </form>

        {/* Connection hints */}
        <div className="connect-hint">
          <strong>📋 Quick Setup:</strong>
          <ol style={{ marginLeft: '20px', marginTop: '8px' }}>
            <li>Create an API token in Proxmox: <strong>Datacenter → API Tokens</strong></li>
            <li>Use format: <code>root@pam!dashboard=&lt;UUID&gt;</code></li>
            <li><strong>IMPORTANT:</strong> Assign <code>PVEAuditor</code> role on path <code>/</code> (root)</li>
            <li>Ensure token has <code>Sys.Audit</code> privilege</li>
            <li>Or set environment variables in <code>.env</code> file</li>
          </ol>
          <p style={{ marginTop: '12px', marginBottom: '4px' }}>
            <strong>🔑 Required Token Permissions:</strong>
          </p>
          <ul style={{ marginLeft: '20px' }}>
            <li><strong>Role:</strong> <code>PVEAuditor</code> (read-only)</li>
            <li><strong>Path:</strong> <code>/</code> (all resources)</li>
            <li><strong>Privileges:</strong> <code>Sys.Audit</code>, VM.Audit, Node.Audit, Storage.Audit</li>
          </ul>
          <p style={{ marginTop: '12px', marginBottom: '4px' }}>
            <strong>⚙️ Requirements:</strong>
          </p>
          <ul style={{ marginLeft: '20px' }}>
            <li>Proxmox VE 7.x or 8.x</li>
            <li>API token with <strong>PVEAuditor</strong> role</li>
            <li>Network connectivity to Proxmox host</li>
          </ul>
          <div style={{
            marginTop: '16px',
            padding: '12px',
            background: 'rgba(88, 166, 255, 0.1)',
            border: '1px solid rgba(88, 166, 255, 0.3)',
            borderRadius: 'var(--radius-sm)',
          }}>
            <strong style={{ color: 'var(--accent)' }}>💡 Having 403 Permission Errors?</strong>
            <ul style={{ marginLeft: '20px', marginTop: '8px' }}>
              <li>Edit your API token in Proxmox UI</li>
              <li>Check "Privilege Separation" settings</li>
              <li>Ensure path is set to <code>/</code> (not <code>/nodes</code>)</li>
              <li>Verify <code>PVEAuditor</code> role is assigned</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
