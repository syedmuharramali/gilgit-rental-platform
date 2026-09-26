import { LoaderCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import { Navigate, useLocation } from 'react-router-dom'
import { checkSession } from '../features/auth/authSlice'

const screen = 'relative grid min-h-screen place-items-center overflow-hidden bg-[#070b14] px-5 text-center text-white'

/*
 * Pages that need a signed-in user. While the page-load session check is
 * running, show a spinner; if the server couldn't be reached, say what
 * failed (App.jsx keeps retrying) instead of sending a signed-in person to
 * the login page; otherwise let them in or redirect to /login.
 */
function ProtectedRoute({ children }) {
  const { t } = useTranslation()
  const location = useLocation()
  const dispatch = useDispatch()
  const { isAuthenticated, session } = useSelector((state) => state.auth)

  if (!session.checked && session.error && !session.checking) {
    return (
      <div className={screen}>
        <div>
          <p className="text-lg font-black">{t('common.serverUnreachable')}</p>
          <p className="mt-2 text-sm text-white/50">{session.error.message || t('common.networkError')}</p>
          {session.error.url && (
            <p className="force-ltr mt-3 font-mono text-xs text-white/35">
              GET {session.error.url} → {session.error.status ?? t('common.noResponse')}
            </p>
          )}
          <p className="mt-3 text-xs text-white/35">{t('common.retryingAutomatically')}</p>
          <button type="button" onClick={() => dispatch(checkSession())} className="mt-5 rounded-full bg-white px-5 py-2.5 text-sm font-black text-[#07101e]">
            {t('common.tryAgain')}
          </button>
        </div>
      </div>
    )
  }

  if (!session.checked) {
    return (
      <div className={screen}>
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(56,189,248,.14),transparent_28%),radial-gradient(circle_at_75%_70%,rgba(139,92,246,.12),transparent_30%)]" />
        <div className="relative flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.05] px-5 py-3 text-sm font-bold text-white/70 shadow-[0_24px_80px_rgba(0,0,0,.3)] backdrop-blur-xl">
          <LoaderCircle className="h-5 w-5 animate-spin text-cyan-300" aria-hidden="true" />
          <span role="status">{t('common.restoringSession')}</span>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: `${location.pathname}${location.search}${location.hash}` }} />
  }

  return children
}

export default ProtectedRoute
