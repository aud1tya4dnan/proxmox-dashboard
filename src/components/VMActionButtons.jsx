import { useState } from 'react'
import { useProxmoxStore } from '../store/useProxmoxStore'
import {
  startQemu, stopQemu, rebootQemu, shutdownQemu,
  startLxc, stopLxc, rebootLxc, shutdownLxc,
} from '../api/proxmoxClient'

export default function VMActionButtons({ vm }) {
  const { refreshAll } = useProxmoxStore()
  const [busy, setBusy] = useState(false)
  const [confirm, setConfirm] = useState(null) // 'stop' | 'shutdown' | null

  const isRunning = vm.status === 'running'
  const isStopped = vm.status === 'stopped'
  const isQemu = vm.type === 'qemu'

  const action = async (fn) => {
    setBusy(true)
    try {
      await fn(vm.node, vm.vmid)
      // Give Proxmox a moment then refresh
      setTimeout(() => refreshAll().finally(() => setBusy(false)), 1500)
    } catch {
      setBusy(false)
    }
    setConfirm(null)
  }

  const start   = () => action(isQemu ? startQemu   : startLxc)
  const stop    = () => action(isQemu ? stopQemu    : stopLxc)
  const reboot  = () => action(isQemu ? rebootQemu  : rebootLxc)
  const shutdown = () => action(isQemu ? shutdownQemu : shutdownLxc)

  if (confirm) {
    return (
      <div className="vm-actions">
        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
          {confirm === 'stop' ? 'Force stop?' : 'Shutdown?'}
        </span>
        <button
          className="btn btn-danger btn-sm"
          onClick={confirm === 'stop' ? stop : shutdown}
          disabled={busy}
          id={`btn-confirm-${confirm}-${vm.vmid}`}
        >
          {busy ? '…' : 'Yes'}
        </button>
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => setConfirm(null)}
          id={`btn-cancel-${vm.vmid}`}
        >
          Cancel
        </button>
      </div>
    )
  }

  return (
    <div className="vm-actions">
      {isStopped && (
        <button
          className="btn btn-success btn-sm"
          onClick={start}
          disabled={busy}
          title="Start"
          id={`btn-start-${vm.vmid}`}
        >
          {busy ? '…' : '▶ Start'}
        </button>
      )}

      {isRunning && (
        <>
          <button
            className="btn btn-warning btn-sm"
            onClick={reboot}
            disabled={busy}
            title="Reboot"
            id={`btn-reboot-${vm.vmid}`}
          >
            {busy ? '…' : '↺ Reboot'}
          </button>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => setConfirm('shutdown')}
            disabled={busy}
            title="Graceful shutdown"
            id={`btn-shutdown-${vm.vmid}`}
          >
            ⏹ Shutdown
          </button>
          <button
            className="btn btn-danger btn-sm"
            onClick={() => setConfirm('stop')}
            disabled={busy}
            title="Force stop"
            id={`btn-stop-${vm.vmid}`}
          >
            ⏹ Stop
          </button>
        </>
      )}

      {!isStopped && !isRunning && (
        <span className="text-muted" style={{ fontSize: '0.8rem' }}>—</span>
      )}
    </div>
  )
}
