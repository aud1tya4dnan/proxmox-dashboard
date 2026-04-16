import { useState } from 'react'
import RefreshBar from '../components/RefreshBar'
import { useProxmoxStore } from '../store/useProxmoxStore'
import { formatBytes, pct } from '../utils/format'

export default function StoragePage() {
  const { storage, loading } = useProxmoxStore()

  const [nodeFilter, setNodeFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')

  // Get all unique nodes
  const nodes = Object.keys(storage)

  // Flatten all storage entries for filtering
  const allStorage = []
  Object.entries(storage).forEach(([node, storageList]) => {
    if (Array.isArray(storageList)) {
      storageList.forEach((s) => {
        allStorage.push({ ...s, node })
      })
    }
  })

  // Filter storage
  const filteredStorage = allStorage.filter((s) => {
    const matchesNode = nodeFilter === 'all' || s.node === nodeFilter
    const matchesType = typeFilter === 'all' || s.type === typeFilter
    return matchesNode && matchesType
  })

  // Calculate totals
  const totalStorageCount = allStorage.length
  const totalUsed = allStorage.reduce((acc, s) => acc + (s.used || 0), 0)
  const totalCapacity = allStorage.reduce((acc, s) => acc + (s.total || 0), 0)
  const totalUsage = pct(totalUsed, totalCapacity)

  // Get storage types and counts
  const storageTypes = [...new Set(allStorage.map((s) => s.type))].sort()
  const typeCounts = {}
  storageTypes.forEach((type) => {
    typeCounts[type] = allStorage.filter((s) => s.type === type).length
  })

  // Storage type colors
  const getTypeColor = (type) => {
    const colors = {
      dir: '#58a6ff', // blue
      lvm: '#bc8cff', // purple
      zfs: '#3fb950', // green
      ceph: '#f0883e', // orange
      nfs: '#e3b341', // yellow
      cifs: '#f85149', // red
      glusterfs: '#ff7b72', // pink
      btrfs: '#7ee787', // light green
    }
    return colors[type] || '#8b949e' // gray for unknown
  }

  // Get type display name
  const getTypeName = (type) => {
    const names = {
      dir: 'Directory',
      lvm: 'LVM',
      zfs: 'ZFS',
      ceph: 'Ceph',
      nfs: 'NFS',
      cifs: 'CIFS',
      glusterfs: 'GlusterFS',
      btrfs: 'Btrfs',
    }
    return names[type] || type.toUpperCase()
  }

  return (
    <div className="page">
      <RefreshBar />

      <div className="page-header">
        <h1>Storage</h1>
        <p>Monitor storage pools and usage across the cluster</p>
      </div>

      {loading && totalStorageCount === 0 && (
        <div className="loading-overlay">
          <div className="spinner"></div>
          <p>Loading storage data...</p>
        </div>
      )}

      {!loading && totalStorageCount === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">💾</div>
          <h3>No storage pools available</h3>
          <p>Check your Proxmox connection and try again</p>
        </div>
      )}

      {!loading && totalStorageCount > 0 && (
        <>
          {/* Summary Cards */}
          <div className="grid-4" style={{ marginBottom: '24px' }}>
            <div className="card" style={{ padding: '16px' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                Total Storage Pools
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {totalStorageCount}
              </div>
            </div>
            <div className="card" style={{ padding: '16px' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Total Used</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                {formatBytes(totalUsed)}
              </div>
            </div>
            <div className="card" style={{ padding: '16px' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Total Capacity</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                {formatBytes(totalCapacity)}
              </div>
            </div>
            <div className="card" style={{ padding: '16px' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Overall Usage</div>
              <div
                style={{
                  fontSize: '1.8rem',
                  fontWeight: 700,
                  color: totalUsage >= 90 ? 'var(--red)' : totalUsage >= 70 ? 'var(--yellow)' : 'var(--green)',
                }}
              >
                {totalUsage.toFixed(1)}%
              </div>
            </div>
          </div>

          {/* Storage Types Overview */}
          <div className="card" style={{ marginBottom: '24px' }}>
            <h3 style={{ marginBottom: '16px', fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Storage Types Distribution
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
              {storageTypes.map((type) => (
                <div
                  key={type}
                  style={{
                    padding: '8px 14px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border)',
                    background: 'var(--bg-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <div
                    style={{
                      width: '12px',
                      height: '12px',
                      borderRadius: '50%',
                      background: getTypeColor(type),
                    }}
                  />
                  <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>{getTypeName(type)}</span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>({typeCounts[type]})</span>
                </div>
              ))}
            </div>
          </div>

          {/* Filters */}
          <div className="filter-bar" style={{ marginBottom: '24px' }}>
            <div style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Filter by:</div>

            {/* Node Filter */}
            <select
              className="input"
              style={{ width: 'auto', minWidth: '150px' }}
              value={nodeFilter}
              onChange={(e) => setNodeFilter(e.target.value)}
            >
              <option value="all">All Nodes ({nodes.length})</option>
              {nodes.map((node) => (
                <option key={node} value={node}>
                  {node}
                </option>
              ))}
            </select>

            {/* Type Filter */}
            <select
              className="input"
              style={{ width: 'auto', minWidth: '150px' }}
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="all">All Types</option>
              {storageTypes.map((type) => (
                <option key={type} value={type}>
                  {getTypeName(type)}
                </option>
              ))}
            </select>
          </div>

          {/* Storage Grid */}
          <div className="grid-3">
            {filteredStorage.length === 0 ? (
              <div className="empty-state" style={{ gridColumn: '1 / -1' }}>
                <div className="empty-state-icon">💾</div>
                <h3>No storage pools match your filters</h3>
                <p>Try adjusting the filters to see more results</p>
              </div>
            ) : (
              filteredStorage.map((s) => {
                const usage = pct(s.used, s.total)
                const isShared = s.shared === 1
                const isActive = s.active === 1

                return (
                  <div key={`${s.node}-${s.storage}`} className="card storage-card">
                    {/* Header */}
                    <div className="storage-card-header">
                      <div>
                        <div className="storage-card-name">{s.storage}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                          {s.node}
                        </div>
                      </div>
                      <div>
                        <div
                          className="storage-card-type"
                          style={{
                            background: `${getTypeColor(s.type)}20`,
                            color: getTypeColor(s.type),
                            borderColor: getTypeColor(s.type),
                          }}
                        >
                          {getTypeName(s.type)}
                        </div>
                      </div>
                    </div>

                    {/* Usage Bar */}
                    <div style={{ marginBottom: '16px' }}>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          fontSize: '0.8rem',
                          marginBottom: '6px',
                        }}
                      >
                        <span style={{ color: 'var(--text-muted)' }}>Usage</span>
                        <span
                          style={{
                            fontWeight: 600,
                            color: usage >= 90 ? 'var(--red)' : usage >= 70 ? 'var(--yellow)' : 'var(--green)',
                          }}
                        >
                          {usage.toFixed(1)}%
                        </span>
                      </div>
                      <div className="progress-bar" style={{ height: '8px' }}>
                        <div
                          className="progress-bar-fill"
                          style={{
                            width: `${usage}%`,
                            background: usage >= 90 ? 'var(--red)' : usage >= 70 ? 'var(--yellow)' : 'var(--green)',
                          }}
                        />
                      </div>
                    </div>

                    {/* Sizes */}
                    <div className="storage-sizes">
                      <span>
                        Used: <strong>{formatBytes(s.used)}</strong>
                      </span>
                      <span>
                        Total: <strong>{formatBytes(s.total)}</strong>
                      </span>
                    </div>

                    {/* Additional Info */}
                    <div
                      style={{
                        marginTop: '16px',
                        paddingTop: '14px',
                        borderTop: '1px solid var(--border-light)',
                        fontSize: '0.75rem',
                      }}
                    >
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                        <div>
                          <span style={{ color: 'var(--text-muted)' }}>Status:</span>{' '}
                          <span style={{ color: isActive ? 'var(--green)' : 'var(--red)' }}>
                            {isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <div>
                          <span style={{ color: 'var(--text-muted)' }}>Shared:</span>{' '}
                          <span style={{ color: isShared ? 'var(--green)' : 'var(--text-muted)' }}>
                            {isShared ? 'Yes' : 'No'}
                          </span>
                        </div>
                        {s.content && (
                          <div style={{ gridColumn: '1 / -1' }}>
                            <span style={{ color: 'var(--text-muted)' }}>Content:</span>{' '}
                            <span>{Array.isArray(s.content) ? s.content.join(', ') : s.content}</span>
                          </div>
                        )}
                        {s.available !== undefined && (
                          <div style={{ gridColumn: '1 / -1' }}>
                            <span style={{ color: 'var(--text-muted)' }}>Available:</span>{' '}
                            <span className="mono">{formatBytes(s.available)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Legend */}
          <div className="card" style={{ marginTop: '24px' }}>
            <h3 style={{ marginBottom: '12px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Storage Types Legend
            </h3>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                gap: '12px',
                fontSize: '0.8rem',
              }}
            >
              {storageTypes.map((type) => (
                <div key={type} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div
                    style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '2px',
                      background: getTypeColor(type),
                    }}
                  />
                  <span>
                    <strong>{type.toUpperCase()}</strong>: {getTypeName(type)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
