import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import ConnectPage from './pages/ConnectPage'
import NodesPage from './pages/NodesPage'
import OverviewPage from './pages/OverviewPage'
import StoragePage from './pages/StoragePage'
import VirtualMachinesPage from './pages/VirtualMachinesPage'
import { useProxmoxStore } from './store/useProxmoxStore'
import './App.css'

function App() {
  const { connected } = useProxmoxStore()

  return (
    <BrowserRouter>
      <div className="app-layout">
        {connected && <Sidebar />}
        <div className="main-content">
          <Routes>
            {/* Public route - connection page */}
            <Route path="/" element={connected ? <Navigate to="/overview" replace /> : <ConnectPage />} />

            {/* Protected routes - require authentication */}
            <Route path="/overview" element={connected ? <OverviewPage /> : <Navigate to="/" replace />} />
            <Route path="/nodes" element={connected ? <NodesPage /> : <Navigate to="/" replace />} />
            <Route path="/nodes/:nodeName" element={connected ? <NodesPage /> : <Navigate to="/" replace />} />
            <Route path="/vms" element={connected ? <VirtualMachinesPage /> : <Navigate to="/" replace />} />
            <Route path="/storage" element={connected ? <StoragePage /> : <Navigate to="/" replace />} />

            {/* Fallback - redirect to home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  )
}

export default App
