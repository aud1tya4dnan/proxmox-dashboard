export default function StatusBadge({ status }) {
  const map = {
    running:  { label: 'Running',  cls: 'badge-running'  },
    stopped:  { label: 'Stopped',  cls: 'badge-stopped'  },
    paused:   { label: 'Paused',   cls: 'badge-paused'   },
    online:   { label: 'Online',   cls: 'badge-online'   },
    offline:  { label: 'Offline',  cls: 'badge-offline'  },
  }
  const s = map[status?.toLowerCase()] || { label: status || 'Unknown', cls: 'badge-unknown' }

  return (
    <span className={`badge ${s.cls}`}>
      <span className="badge-dot" />
      {s.label}
    </span>
  )
}
