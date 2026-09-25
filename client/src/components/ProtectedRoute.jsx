import { LoaderCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import { hydrateCurrentUser } from '../features/auth/authSlice'
import { Navigate, useLocation } from 'react-router-dom'

function ProtectedRoute({ children }) {
  const { t } = useTranslation()
  const location = useLocation()
  const dispatch = useDispatch()
  const { isAuthenticated, sessionChecked, sessionUnavailable, status } = useSelector((state) => state.auth)

  // Couldn't reach the server to check the session: offer a retry rather
  // than sending a signed-in person to the login page.
  if (!sessionChecked && sessionUnavailable) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#070b14] px-5 text-center text-white">
        <div>
          <p className="text-lg font-black">{t('common.serverUnreachable')}</p>
          <p className="mt-2 text-sm text-white/50">{t('common.networkError')}</p>
          <button type="button" disabled={status === 'loading'} onClick={() => dispatch(hydrateCurrentUser())} className="mt-5 rounded-full bg-white px-5 py-2.5 text-sm font-black text-[#07101e] disabled:opacity-50">{t('common.tryAgain')}</button>
        </div>
      </div>
    )
  }

  if (!sessionChecked) {
    return (
      <div className="relative grid min-h-screen place-items-center overflow-hidden bg-[#070b14] px-5 text-white">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(56,189,248,.14),transparent_28%),radial-gradient(circle_at_75%_70%,rgba(139,92,246,.12),transparent_30%)]" />
        <div className="relative flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.05] px-5 py-3 text-sm font-bold text-white/70 shadow-[0_24px_80px_rgba(0,0,0,.3)] backdrop-blur-xl">
          <LoaderCircle className="h-5 w-5 animate-spin text-cyan-300" aria-hidden="true" />
          <span role="status">{t('common.restoringSession')}</span>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    const from = `${location.pathname}${location.search}${location.hash}`
    return <Navigate to="/login" replace state={{ from }} />
  }

  return children
}

export default ProtectedRoute
