import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/layout/Layout'
import Dashboard from './pages/Dashboard'
import BranchDetail from './pages/BranchDetail'
import RepDetail from './pages/RepDetail'
import RepsDirectory from './pages/RepsDirectory'
import WelcomeSplash from './components/shared/WelcomeSplash'

export default function App() {
  return (
    <WelcomeSplash>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/branch/:id" element={<BranchDetail />} />
          <Route path="/reps" element={<RepsDirectory />} />
          <Route path="/rep/:id" element={<RepDetail />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </WelcomeSplash>
  )
}
