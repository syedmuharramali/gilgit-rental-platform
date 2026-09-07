import { LoaderCircle } from 'lucide-react'
import { useSelector } from 'react-redux'
import { Navigate, useLocation } from 'react-router-dom'

function ProtectedRoute({ children }) {
  const location = useLocation()
  const { token, sessionChecked } = useSelector((state) => state.auth)

  if (!sessionChecked && token) {
    return (
      <div className="relative grid min-h-screen place-items-center overflow-hidden bg-[#070b14] px-5 text-white">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(56,189,248,.14),transparent_28%),radial-gradient(circle_at_75%_70%,rgba(139,92,246,.12),transparent_30%)]" />
        <div className="relative flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.05] px-5 py-3 text-sm font-bold text-white/70 shadow-[0_24px_80px_rgba(0,0,0,.3)] backdrop-blur-xl">
          <LoaderCircle className="h-5 w-5 animate-spin text-cyan-300" aria-hidden="true" />
          <span role="status">Restoring your session</span>
        </div>
      </div>
    )
  }

  if (!token) {
    const from = `${location.pathname}${location.search}${location.hash}`
    return <Navigate to="/login" replace state={{ from }} />
  }

  return children
}

export default ProtectedRoute
