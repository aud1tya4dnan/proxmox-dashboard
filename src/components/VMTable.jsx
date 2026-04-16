import { useMemo, useState } from 'react'
import { formatBytes, pct, thresholdClass } from '../utils/format'
import StatusBadge from './StatusBadge'
import VMActionButtons from './VMActionButtons'

const FILTERS = ['all', 'running', 'stopped', 'qemu', 'lxc']

export default function VMTable({ vms = [] }) {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [sortKey, setSortKey] = useState('name')
  const [sortAsc, setSortAsc] = useState(true)

  const handleSort = (key) => {
    if (sortKey === key) setSortAsc((a) => !a)
    else {
      setSortKey(key)
      setSortAsc(true)
    }
  }

  const filtered = useMemo(() => {
    let list = vms
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(
        (v) =>
          String(v.name || '')
            .toLowerCase()
            .includes(q) ||
          String(v.vmid).includes(q) ||
          String(v.node || '')
            .toLowerCase()
            .includes(q),
      )
    }
    if (filter === 'running') list = list.filter((v) => v.status === 'running')
    else if (filter === 'stopped') list = list.filter((v) => v.status === 'stopped')
    else if (filter === 'qemu') list = list.filter((v) => v.type === 'qemu')
    else if (filter === 'lxc') list = list.filter((v) => v.type === 'lxc')

    list = [...list].sort((a, b) => {
      let av = a[sortKey] ?? '',
        bv = b[sortKey] ?? ''
      if (typeof av === 'string') av = av.toLowerCase()
      if (typeof bv === 'string') bv = bv.toLowerCase()
      if (av < bv) return sortAsc ? -1 : 1
      if (av > bv) return sortAsc ? 1 : -1
      return 0
    })
    return list
  }, [vms, search, filter, sortKey, sortAsc])

  const SortIndicator = ({ col }) =>
    sortKey === col ? <span style={{ marginLeft: 4 }}>{sortAsc ? '↑' : '↓'}</span> : null

  return (
    <div>
      <div className="filter-bar">
        <div className="search-wrapper">
          <span className="search-icon">🔍</span>
          <input
            id="vm-search"
            className="input"
            placeholder="Search by name, VMID, node…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {FILTERS.map((f) => (
            <button
              key={f}
              className={`filter-chip ${filter === f ? 'active' : ''}`}
              onClick={() => setFilter(f)}
              id={`filter-chip-${f}`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        <span className="text-muted" style={{ fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
          {filtered.length} / {vms.length}
        </span>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🤷</div>
          <span>No VMs / containers match your filter.</span>
        </div>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th onClick={() => handleSort('vmid')}>
                  ID <SortIndicator col="vmid" />
                </th>
                <th onClick={() => handleSort('name')}>
                  Name <SortIndicator col="name" />
                </th>
                <th>Type</th>
                <th onClick={() => handleSort('node')}>
                  Node <SortIndicator col="node" />
                </th>
                <th onClick={() => handleSort('status')}>
                  Status <SortIndicator col="status" />
                </th>
                <th>CPU</th>
                <th>Memory</th>
                <th>Disk</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((vm) => {
                const cpuPct = Math.round((vm.cpu ?? 0) * 100)
                const memPct = pct(vm.mem ?? 0, vm.maxmem ?? 1)
                const diskPct = pct(vm.disk ?? 0, vm.maxdisk ?? 1)
                return (
                  <tr key={`${vm.type}-${vm.vmid}`} id={`vm-row-${vm.vmid}`}>
                    <td>
                      <span className="mono text-muted" style={{ fontSize: '0.8rem' }}>
                        {vm.vmid}
                      </span>
                    </td>
                    <td style={{ fontWeight: 500 }}>{vm.name || '—'}</td>
                    <td>
                      <span
                        className="badge"
                        style={{
                          background: vm.type === 'qemu' ? 'rgba(88,166,255,0.12)' : 'rgba(188,140,255,0.12)',
                          color: vm.type === 'qemu' ? 'var(--accent)' : 'var(--purple)',
                        }}
                      >
                        {vm.type === 'qemu' ? '🖥 VM' : '📦 CT'}
                      </span>
                    </td>
                    <td className="text-secondary">{vm.node}</td>
                    <td>
                      <StatusBadge status={vm.status} />
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 80 }}>
                        <span className="mono" style={{ fontSize: '0.8rem' }}>
                          {cpuPct}%
                        </span>
                        <div className="progress-bar">
                          <div
                            className={`progress-bar-fill ${thresholdClass(cpuPct)}`}
                            style={{ width: `${cpuPct}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 100 }}>
                        <span className="mono" style={{ fontSize: '0.8rem' }}>
                          {formatBytes(vm.mem)} / {formatBytes(vm.maxmem)}
                        </span>
                        <div className="progress-bar">
                          <div
                            className={`progress-bar-fill ${thresholdClass(memPct)}`}
                            style={{ width: `${memPct}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 100 }}>
                        <span className="mono" style={{ fontSize: '0.8rem' }}>
                          {formatBytes(vm.disk)} / {formatBytes(vm.maxdisk)}
                        </span>
                        <div className="progress-bar">
                          <div
                            className={`progress-bar-fill ${thresholdClass(diskPct)}`}
                            style={{ width: `${diskPct}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td>
                      <VMActionButtons vm={vm} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
