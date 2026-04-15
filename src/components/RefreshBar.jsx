import { useEffect, useState } from 'react'
import { useProxmoxStore } from '../store/useProxmoxStore'
import { formatTime } from '../utils/format'

const REFRESH_INTERVAL = 30 // seconds

export default function RefreshBar() {
  const { lastRefresh, refreshAll, loading, connected } = useProxmoxStore()
  const [countdown, setCountdown] = useState(REFRESH_INTERVAL)

  useEffect(() => {
    if (!lastRefresh) return
    setCountdown(REFRESH_INTERVAL)
    const interval = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) return REFRESH_INTERVAL
        return c - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [lastRefresh])

  const progress = ((REFRESH_INTERVAL - countdown) / REFRESH_INTERVAL) * 100

  return (
    <div className="topbar">
      <div className="topbar-left">
        <span className="refresh-info">
          Last updated: <strong>{lastRefresh ? formatTime(lastRefresh) : '—'}</strong>
        </span>
        {connected && (
          <div className="refresh-countdown">
            <div className="refresh-progress">
              <div
                className="refresh-progress-fill"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span>Refresh in {countdown}s</span>
          </div>
        )}
      </div>
      <div className="topbar-right">
        <button
          className="btn btn-ghost btn-sm"
          onClick={refreshAll}
          disabled={loading || !connected}
          id="btn-manual-refresh"
        >
          {loading ? <span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> : '↺'}
          Refresh
        </button>
      </div>
    </div>
  )
}
