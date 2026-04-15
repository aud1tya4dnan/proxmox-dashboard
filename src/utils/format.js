// Utility: format bytes to human-readable
export function formatBytes(bytes, decimals = 1) {
  if (!bytes || bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`
}

// Utility: format seconds to uptime string
export function formatUptime(seconds) {
  if (!seconds) return '—'
  const d = Math.floor(seconds / 86400)
  const h = Math.floor((seconds % 86400) / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (d > 0) return `${d}d ${h}h`
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

// Utility: percent with safe fallback
export function pct(val, max) {
  if (!max || max === 0) return 0
  return Math.round((val / max) * 100)
}

// Utility: threshold color class
export function thresholdClass(pct) {
  if (pct >= 90) return 'danger'
  if (pct >= 70) return 'warn'
  return 'good'
}

// Utility: format timestamp
export function formatTime(ts) {
  if (!ts) return '—'
  return new Date(ts).toLocaleTimeString()
}

// Utility: format MHz/GHz
export function formatHz(hz) {
  if (!hz) return '—'
  if (hz >= 1e9) return `${(hz / 1e9).toFixed(2)} GHz`
  if (hz >= 1e6) return `${(hz / 1e6).toFixed(0)} MHz`
  return `${hz} Hz`
}
