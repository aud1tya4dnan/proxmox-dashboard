import { useEffect, useState } from 'react'
import { useProxmoxStore } from '../store/useProxmoxStore'
import RefreshBar from '../components/RefreshBar'
import VMActionButtons from '../components/VMActionButtons'
import { formatBytes, pct } from '../utils/format'

console.log('VirtualMachinesPage rendered') // Debug logging

export default function VirtualMachinesPage() {
  const {
    vms,
    loading,
    lastRefresh,
    refreshAll,
    startQemu,
    stopQemu,
    rebootQemu,
    shutdownQemu,
    startLxc,
    stopLxc,
    rebootLxc,
    shutdownLxc,
    setActionLoading,
    actionLoading,
  } = useProxmoxStore()

  const [countdown, setCountdown] = useState(30)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all') // all, running, stopped, paused
  const [typeFilter, setTypeFilter] = useState('all') // all, qemu, lxc
  const [sortBy, setSortBy] = useState('vmid')
  const [sortOrder, setSortOrder] = useState('asc')

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 30))
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  // Filter and sort VMs
  const filteredVMs = vms
    .filter((vm) => {
      const matchesSearch =
        vm.name?.toLowerCase().includes(search.toLowerCase()) ||
        vm.vmid?.toString().includes(search)
      const matchesFilter =
        filter === 'all' || vm.status === filter
      const matchesType =
        typeFilter === 'all' || vm.type === typeFilter
      return matchesSearch && matchesFilter && matchesType
    })
    .sort((a, b) => {
      let comparison = 0
      if (sortBy === 'vmid') {
        comparison = a.vmid - b.vmid
      } else if (sortBy === 'name') {
        comparison = (a.name || '').localeCompare(b.name || '')
      } else if (sortBy === 'status') {
        comparison = a.status.localeCompare(b.status)
      } else if (sortBy === 'node') {
        comparison = a.node.localeCompare(b.node)
      } else if (sortBy === 'cpu') {
        comparison = (a.cpu || 0) - (b.cpu || 0)
      } else if (sortBy === 'mem') {
        comparison = (a.maxmem || 0) - (b.maxmem || 0)
      }

      return sortOrder === 'asc' ? comparison : -comparison
    })

  console.log('VMs data:', vms)
  console.log('Filtered VMs:', filteredVMs)

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('asc')
    }
  }

  const handleVMAction = async (vm, action) => {
    try {
      setActionLoading(`${vm.node}-${vm.vmid}`, true)

      if (vm.type === 'qemu') {
        switch (action) {
          case 'start':
            await startQemu(vm.node, vm.vmid)
            break
          case 'stop':
            await stopQemu(vm.node, vm.vmid)
            break
          case 'reboot':
            await rebootQemu(vm.node, vm.vmid)
            break
          case 'shutdown':
            await shutdownQemu(vm.node, vm.vmid)
            break
        }
      } else if (vm.type === 'lxc') {
        switch (action) {
          case 'start':
            await startLxc(vm.node, vm.vmid)
            break
          case 'stop':
            await stopLxc(vm.node, vm.vmid)
            break
          case 'reboot':
            await rebootLxc(vm.node, vm.vmid)
            break
          case 'shutdown':
            await shutdownLxc(vm.node, vm.vmid)
            break
        }
      }

      // Note: refreshAll is automatically called by store actions
    } catch (error) {
      console.error('VM action failed:', error)
      alert(`Failed to ${action} ${vm.name || vm.vmid}: ${error.message}`)
    } finally {
      setActionLoading(`${vm.node}-${vm.vmid}`, false)
    }
  }

  // Count VMs by status
  const totalCount = vms.length
  const runningCount = vms.filter((v) => v.status === 'running').length
  const stoppedCount = vms.filter((v) => v.status === 'stopped').length
  const pausedCount = vms.filter((v) => v.status === 'paused').length

  const qemuCount = vms.filter((v) => v.type === 'qemu').length
  const lxcCount = vms.filter((v) => v.type === 'lxc').length

  return (
    <div className="page">
      <RefreshBar
        lastRefresh={lastRefresh}
        countdown={countdown}
        onRefresh={refreshAll}
        loading={loading}
      />

      <div className="page-header">
        <h1>Virtual Machines & Containers</h1>
        <p>Manage and monitor all VMs and LXCs across the cluster</p>
      </div>

      {/* Stats Cards */}
      <div className="grid-4" style={{ marginBottom: '24px' }}>
        <div className="card" style={{ padding: '16px' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Total Instances</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>{totalCount}</div>
        </div>
        <div className="card" style={{ padding: '16px' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Running</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--green)' }}>{runningCount}</div>
        </div>
        <div className="card" style={{ padding: '16px' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Stopped</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--red)' }}>{stoppedCount}</div>
        </div>
        <div className="card" style={{ padding: '16px' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>VMs / Containers</div>
          <div style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            {qemuCount} / {lxcCount}
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="filter-bar">
        <div className="search-wrapper">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            className="input"
            placeholder="Search VMs by name or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Status Filter */}
        <button
          className={`filter-chip ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All ({totalCount})
        </button>
        <button
          className={`filter-chip ${filter === 'running' ? 'active' : ''}`}
          onClick={() => setFilter('running')}
        >
          Running ({runningCount})
        </button>
        <button
          className={`filter-chip ${filter === 'stopped' ? 'active' : ''}`}
          onClick={() => setFilter('stopped')}
        >
          Stopped ({stoppedCount})
        </button>
        <button
          className={`filter-chip ${filter === 'paused' ? 'active' : ''}`}
          onClick={() => setFilter('paused')}
        >
          Paused ({pausedCount})
        </button>

        {/* Type Filter */}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
          <button
            className={`filter-chip ${typeFilter === 'all' ? 'active' : ''}`}
            onClick={() => setTypeFilter('all')}
          >
            All Types
          </button>
          <button
            className={`filter-chip ${typeFilter === 'qemu' ? 'active' : ''}`}
            onClick={() => setTypeFilter('qemu')}
          >
            VMs ({qemuCount})
          </button>
          <button
            className={`filter-chip ${typeFilter === 'lxc' ? 'active' : ''}`}
            onClick={() => setTypeFilter('lxc')}
          >
            Containers ({lxcCount})
          </button>
        </div>
      </div>

      {/* VM Table */}
      {loading && vms.length === 0 ? (
        <div className="loading-overlay">
          <div className="spinner"></div>
          <p>Loading VMs and containers...</p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th onClick={() => handleSort('vmid')} style={{ cursor: 'pointer' }}>
                  ID {sortBy === 'vmid' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th onClick={() => handleSort('name')} style={{ cursor: 'pointer' }}>
                  Name {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th onClick={() => handleSort('type')} style={{ cursor: 'pointer' }}>
                  Type {sortBy === 'type' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th onClick={() => handleSort('status')} style={{ cursor: 'pointer' }}>
                  Status {sortBy === 'status' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th onClick={() => handleSort('node')} style={{ cursor: 'pointer' }}>
                  Node {sortBy === 'node' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th onClick={() => handleSort('cpu')} style={{ cursor: 'pointer' }}>
                  CPU {sortBy === 'cpu' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th onClick={() => handleSort('mem')} style={{ cursor: 'pointer' }}>
                  Memory {sortBy === 'mem' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredVMs.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '40px' }}>
                    <div style={{ color: 'var(--text-muted)' }}>
                      {search || filter !== 'all' || typeFilter !== 'all'
                        ? 'No VMs or containers match your filters'
                        : 'No VMs or containers found'}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredVMs.map((vm) => (
                  <tr key={`${vm.node}-${vm.vmid}`}>
                    <td className="mono">{vm.vmid}</td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{vm.name || '—'}</div>
                    </td>
                    <td>
                      <span
                        style={{
                          fontSize: '0.75rem',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          background: vm.type === 'qemu' ? 'var(--purple-bg)' : 'var(--green-bg)',
                          color: vm.type === 'qemu' ? 'var(--purple)' : 'var(--green)',
                          fontWeight: 600,
                        }}
                      >
                        {vm.type === 'qemu' ? 'VM' : 'CT'}
                      </span>
                    </td>
                    <td>
                      <div
                        className="badge"
                        style={{
                          display: 'inline-flex',
                          textTransform: 'capitalize',
                        }}
                      >
                        {vm.status}
                      </div>
                    </td>
                    <td>{vm.node}</td>
                    <td>
                      <div className="mono" style={{ fontSize: '0.85rem' }}>
                        {(vm.cpu || 0).toFixed(1)} cores
                      </div>
                      {vm.status === 'running' && (
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          {(vm.cpuusage || 0).toFixed(1)}%
                        </div>
                      )}
                    </td>
                    <td>
                      <div className="mono" style={{ fontSize: '0.85rem' }}>
                        {formatBytes(vm.maxmem)}
                      </div>
                      {vm.status === 'running' && vm.mem && (
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          {pct(vm.mem, vm.maxmem).toFixed(1)}%
                        </div>
                      )}
                    </td>
                    <td>
                      <VMActionButtons
                        vm={vm}
                        onAction={handleVMAction}
                        isLoading={actionLoading[`${vm.node}-${vm.vmid}`]}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Result count */}
      {!loading && filteredVMs.length > 0 && (
        <div style={{ marginTop: '16px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Showing {filteredVMs.length} of {totalCount} instances
        </div>
      )}
    </div>
  )
}
