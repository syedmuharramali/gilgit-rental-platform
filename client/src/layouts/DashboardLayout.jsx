import {
  BedDouble,
  Bell,
  Building2,
  ClipboardList,
  FileCheck2,
  Heart,
  Home,
  Images,
  LogOut,
  Menu,
  MessageCircle,
  Settings2,
  ShieldCheck,
  Sparkles,
  Star,
  TriangleAlert,
  X,
} from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import LanguageSwitcher from '../components/LanguageSwitcher'
import { logoutUser } from '../features/auth/authSlice'
import {
  useGetUnreadCountQuery,
  useMarkNotificationTypesReadMutation,
} from '../features/notifications/notificationsApi'

const renterGroups = [
  {
    key: 'groupFind',
    links: [
      ['/dashboard', 'overview', Home],
      ['/dashboard/favorites', 'savedHomes', Heart],
      ['/dashboard/matches', 'smartMatches', Sparkles],
      ['/dashboard/applications', 'applications', ClipboardList],
      ['/dashboard/viewings', 'viewings', FileCheck2],
      ['/dashboard/trips', 'trips', BedDouble],
    ],
  },
  {
    key: 'groupCommunication',
    links: [
      ['/dashboard/messages', 'messages', MessageCircle],
      ['/dashboard/notifications', 'notifications', Bell],
    ],
  },
  {
    key: 'groupAgreement',
    links: [['/dashboard/agreements', 'agreements', FileCheck2]],
  },
  {
    key: 'groupAccount',
    links: [
      ['/dashboard/reviews', 'reviews', Star],
      ['/dashboard/reports', 'reports', TriangleAlert],
      ['/dashboard/profile', 'profile', Settings2],
    ],
  },
]

const ownerGroups = [
  {
    key: 'groupProperties',
    links: [
      ['/owner', 'ownerOverview', Home],
      ['/owner/properties', 'properties', Building2],
      ['/owner/media', 'media', Images],
      ['/owner/applications', 'applications', ClipboardList],
      ['/owner/viewings', 'viewings', FileCheck2],
      ['/owner/bookings', 'bookings', BedDouble],
    ],
  },
  {
    key: 'groupCommunication',
    links: [
      ['/owner/messages', 'messages', MessageCircle],
      ['/owner/notifications', 'notifications', Bell],
    ],
  },
  {
    key: 'groupAgreement',
    links: [['/owner/agreements', 'agreements', FileCheck2]],
  },
  {
    key: 'groupAccount',
    links: [
      ['/owner/verification', 'verification', ShieldCheck],
      ['/owner/reviews', 'reviews', Star],
      ['/owner/reports', 'reports', TriangleAlert],
      ['/owner/profile', 'profile', Settings2],
    ],
  },
]

const badgeTypesByKey = {
  applications: ['application', 'application_accepted', 'application_rejected', 'application_withdrawn'],
  viewings: ['viewing', 'viewing_confirmed', 'viewing_rejected', 'viewing_cancelled'],
  messages: ['message'],
  agreements: ['agreement'],
  // Hotel side and guest side use different types, so each badge is its own.
  bookings: ['booking_request'],
  trips: ['booking_update'],
  reviews: ['review'],
  reports: ['report'],
}

function DashboardLayout({ mode = 'renter' }) {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const location = useLocation()
  const navigate = useNavigate()
  const user = useSelector((state) => state.auth.user)
  const { data: unread } = useGetUnreadCountQuery(undefined, { pollingInterval: 30000 })
  const [markNotificationTypesRead] = useMarkNotificationTypesReadMutation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const groups = mode === 'owner' ? ownerGroups : renterGroups
  const links = useMemo(() => groups.flatMap((group) => group.links), [groups])
  const notificationPath = mode === 'owner' ? '/owner/notifications' : '/dashboard/notifications'
  const workspaceLabel = mode === 'owner' ? t('ws.ownerWorkspace') : t('ws.renterWorkspace')
  const primaryMobileLinks = mode === 'owner'
    ? [links[0], links[1], links.find(([, key]) => key === 'applications'), links.find(([, key]) => key === 'messages')].filter(Boolean)
    : [links[0], links.find(([, key]) => key === 'savedHomes'), links.find(([, key]) => key === 'applications'), links.find(([, key]) => key === 'messages')].filter(Boolean)
  const primaryPaths = new Set(primaryMobileLinks.map(([to]) => to))
  const secondaryMobileLinks = links.filter(([to]) => !primaryPaths.has(to))
  const isMoreActive = secondaryMobileLinks.some(([to]) => location.pathname === to || location.pathname.startsWith(`${to}/`))

  const getBadgeCount = (key) => {
    if (key === 'notifications') return unread?.unreadCount || 0
    const types = badgeTypesByKey[key]
    if (!types?.length) return 0
    return types.reduce((total, type) => total + (unread?.byType?.[type] || 0), 0)
  }

  const moreBadgeCount = secondaryMobileLinks.reduce((total, [, key]) => {
    if (key === 'notifications') return total
    return total + getBadgeCount(key)
  }, 0)

  useEffect(() => {
    const currentLink = links.find(([to, key]) => {
      if (key === 'notifications') return false
      return location.pathname === to || location.pathname.startsWith(`${to}/`)
    })
    if (!currentLink) return
    const [, key] = currentLink
    const types = badgeTypesByKey[key]
    if (!types?.length || getBadgeCount(key) === 0) return
    markNotificationTypesRead(types).catch(() => {})
  }, [location.pathname, unread?.unreadCount, unread?.byType, links, markNotificationTypesRead])

  const signOut = () => {
    setMobileMenuOpen(false)
    // Leave first: otherwise ProtectedRoute redirects to /login carrying this
    // page as "from", and the next person to sign in lands on it.
    navigate('/login', { replace: true })
    dispatch(logoutUser())
  }

  const renderNavLink = ([to, key, Icon], mobile = false) => {
    const badgeCount = getBadgeCount(key)
    const label = t(`ws.${key}`)
    return (
      <NavLink
        key={to}
        to={to}
        end={to === '/dashboard' || to === '/owner'}
        onClick={mobile ? () => setMobileMenuOpen(false) : undefined}
        className={({ isActive }) => mobile
          ? `flex min-h-12 items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-bold transition ${isActive ? 'border-cyan-300/20 bg-cyan-300/[0.08] text-cyan-100' : 'border-white/[0.07] bg-white/[0.025] text-slate-400'}`
          : `group flex items-center gap-3 rounded-2xl px-4 py-2.5 text-sm font-bold transition ${isActive ? 'bg-gradient-to-r from-cyan-300/15 via-blue-400/10 to-violet-500/10 text-white ring-1 ring-cyan-300/20' : 'text-slate-500 hover:bg-white/[0.045] hover:text-white'}`}
      >
        <span className={`${mobile ? '' : 'grid h-8 w-8 place-items-center rounded-xl bg-white/[0.04] text-slate-400 transition group-hover:text-cyan-300'}`}><Icon className="h-4 w-4 shrink-0" /></span>
        <span className="min-w-0 flex-1 truncate">{label}</span>
        {badgeCount > 0 && <span className={`rounded-full px-2 py-0.5 text-[10px] font-black text-white ${key === 'notifications' ? 'bg-rose-500' : 'bg-cyan-500'}`}>{badgeCount}</span>}
      </NavLink>
    )
  }

  return (
    <div className="min-h-screen bg-[#070b14] pb-20 text-white lg:pb-0">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(56,189,248,.08),transparent_22%),radial-gradient(circle_at_85%_80%,rgba(139,92,246,.08),transparent_25%)]" />

      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 border-r border-white/[0.07] bg-[#090f1b]/95 backdrop-blur-2xl lg:flex lg:flex-col">
        <div className="flex h-20 items-center gap-3 border-b border-white/[0.06] px-6">
          <Link to="/" className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-cyan-300 via-blue-400 to-violet-500 text-[#07101e] shadow-[0_12px_35px_rgba(56,189,248,.18)]" aria-label={t('ws.homeAria')}><Sparkles className="h-4 w-4" /></Link>
          <div><p className="font-black tracking-[-.03em]">{t('common.brand')}</p><p className="text-xs text-slate-500">{workspaceLabel}</p></div>
        </div>

        <nav className="flex-1 overflow-y-auto px-4 py-4" aria-label={t('ws.navigationLabel', { workspace: workspaceLabel })}>
          {groups.map((group, groupIndex) => (
            <div key={group.key} className={groupIndex ? 'mt-5' : ''}>
              <p className="mb-2 px-3 text-[9px] font-black uppercase tracking-[.18em] text-slate-700">{t(`ws.${group.key}`)}</p>
              <div className="space-y-1">{group.links.map((link) => renderNavLink(link))}</div>
            </div>
          ))}
          {user?.role === 'admin' && <NavLink to="/admin" className="mt-5 flex items-center gap-3 rounded-2xl border border-violet-400/20 bg-violet-500/10 px-4 py-3 text-sm font-bold text-violet-200"><ShieldCheck className="h-4 w-4" /> {t('ws.adminConsole')}</NavLink>}
        </nav>

        <div className="border-t border-white/[0.06] p-4">
          <div className="mb-3 flex items-center gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-3">
            {user?.avatar?.url ? <img src={user.avatar.url} alt="" className="h-10 w-10 rounded-xl object-cover ring-1 ring-white/10" /> : <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-cyan-300/20 to-violet-500/20 font-black text-cyan-200">{user?.name?.[0] || 'U'}</div>}
            <div className="min-w-0"><p className="truncate text-sm font-black">{user?.name}</p><p className="truncate text-xs text-slate-500">{user?.email}</p></div>
          </div>
          <button type="button" onClick={signOut} className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-bold text-slate-400 transition hover:bg-white/[0.06] hover:text-white"><LogOut className="h-4 w-4" /> {t('ws.signOut')}</button>
        </div>
      </aside>

      <div className="relative z-10 lg:pl-72">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-white/[0.07] bg-[#070b14]/82 px-5 backdrop-blur-2xl sm:px-8 lg:h-20">
          <div className="min-w-0"><p className="truncate text-[10px] font-black uppercase tracking-[.2em] text-cyan-300">{mode === 'owner' ? t('ws.manageRentals') : t('ws.yourJourney')}</p><p className="mt-1 truncate text-sm font-black text-white/90">{workspaceLabel}</p></div>
          <div className="flex shrink-0 items-center gap-2">
            <LanguageSwitcher compact className="hidden sm:inline-flex" />
            {mode === 'renter' ? <Link to="/owner" className="hidden rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-black text-slate-300 transition hover:border-cyan-300/30 hover:text-white sm:block">{t('ws.ownerMode')}</Link> : <Link to="/dashboard" className="hidden rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-black text-slate-300 transition hover:border-cyan-300/30 hover:text-white sm:block">{t('ws.renterMode')}</Link>}
            <Link to={notificationPath} aria-label={t('ws.notifications')} className="relative grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-white/[0.04] text-slate-300 transition hover:text-white"><Bell className="h-4 w-4" />{unread?.unreadCount > 0 && <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-rose-500 px-1 text-[9px] font-black text-white">{unread.unreadCount}</span>}</Link>
          </div>
        </header>
        <motion.main initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="p-5 sm:p-8 lg:p-10"><Outlet /></motion.main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-5 border-t border-white/[0.07] bg-[#090f1b]/95 px-2 py-2 backdrop-blur-2xl lg:hidden" aria-label={t('ws.mobileNavigationLabel', { workspace: workspaceLabel })}>
        {primaryMobileLinks.map(([to, key, Icon]) => {
          const badgeCount = getBadgeCount(key)
          return (
            <NavLink key={to} to={to} end={to === '/dashboard' || to === '/owner'} className={({ isActive }) => `relative flex min-w-0 flex-col items-center gap-1 rounded-xl px-1 py-2 text-[9px] font-bold transition ${isActive ? 'bg-cyan-300/10 text-cyan-200' : 'text-slate-500'}`}>
              <span className="relative"><Icon className="h-4 w-4" />{badgeCount > 0 && <span className="absolute -right-3 -top-2 grid h-4 min-w-4 place-items-center rounded-full bg-cyan-500 px-1 text-[8px] font-black text-white">{badgeCount}</span>}</span>
              <span className="max-w-full truncate">{t(`ws.${key}`).split(' ')[0]}</span>
            </NavLink>
          )
        })}
        <button type="button" onClick={() => setMobileMenuOpen(true)} aria-expanded={mobileMenuOpen} aria-controls="mobile-workspace-menu" className={`relative flex min-w-0 flex-col items-center gap-1 rounded-xl px-1 py-2 text-[9px] font-bold transition ${isMoreActive ? 'bg-cyan-300/10 text-cyan-200' : 'text-slate-500'}`}><span className="relative"><Menu className="h-4 w-4" />{moreBadgeCount > 0 && <span className="absolute -right-3 -top-2 grid h-4 min-w-4 place-items-center rounded-full bg-cyan-500 px-1 text-[8px] font-black text-white">{moreBadgeCount}</span>}</span>{t('ws.more')}</button>
      </nav>

      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.button type="button" aria-label={t('ws.closeMenu')} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setMobileMenuOpen(false)} className="fixed inset-0 z-[60] bg-black/65 backdrop-blur-sm lg:hidden" />
            <motion.aside id="mobile-workspace-menu" role="dialog" aria-modal="true" aria-label={t('ws.menuLabel', { workspace: workspaceLabel })} initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', stiffness: 320, damping: 32 }} className="fixed inset-x-0 bottom-0 z-[70] max-h-[82vh] overflow-y-auto rounded-t-[30px] border-t border-white/10 bg-[#0a101c] p-5 pb-8 shadow-[0_-30px_90px_rgba(0,0,0,.45)] lg:hidden">
              <div className="mb-4 flex items-center justify-between"><div><p className="text-[10px] font-black uppercase tracking-[.18em] text-cyan-300">{t('ws.allTools')}</p><h2 className="mt-1 text-lg font-black">{workspaceLabel}</h2></div><button type="button" onClick={() => setMobileMenuOpen(false)} aria-label={t('ws.closeMenu')} className="grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-white/[0.04] text-slate-300"><X className="h-4 w-4" /></button></div>
              <div className="space-y-5">
                {groups.map((group) => (
                  <div key={group.key}>
                    <p className="mb-2 px-1 text-[9px] font-black uppercase tracking-[.18em] text-slate-600">{t(`ws.${group.key}`)}</p>
                    <nav className="grid gap-2 sm:grid-cols-2">{group.links.map((link) => renderNavLink(link, true))}</nav>
                  </div>
                ))}
                {user?.role === 'admin' && <NavLink to="/admin" onClick={() => setMobileMenuOpen(false)} className="flex min-h-12 items-center gap-3 rounded-2xl border border-violet-400/20 bg-violet-500/10 px-4 py-3 text-sm font-bold text-violet-200"><ShieldCheck className="h-4 w-4" /> {t('ws.adminConsole')}</NavLink>}
              </div>
              <div className="mt-5"><LanguageSwitcher className="w-full justify-center" /></div>
              <div className="mt-3 grid grid-cols-2 gap-2"><Link to={mode === 'owner' ? '/dashboard' : '/owner'} onClick={() => setMobileMenuOpen(false)} className="flex min-h-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.035] px-3 text-xs font-black text-slate-300">{mode === 'owner' ? t('ws.renterMode') : t('ws.ownerMode')}</Link><button type="button" onClick={signOut} className="flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-rose-300/15 bg-rose-400/[0.06] px-3 text-xs font-black text-rose-300"><LogOut className="h-4 w-4" /> {t('ws.signOut')}</button></div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

export default DashboardLayout
