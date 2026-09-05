import { Navigate, useLocation } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { LoaderCircle } from 'lucide-react'

function ProtectedRoute({ children }) {
  const location = useLocation()
  const { token, sessionChecked } = useSelector((state) => state.auth)

  if (!sessionChecked && token) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#07130f] text-emerald-100">
        <div className="flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-5 py-3 backdrop-blur-xl">
          <LoaderCircle className="h-5 w-5 animate-spin" />
          Restoring your session
        </div>
      </div>
    )
  }

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return children
}

export default ProtectedRoute
