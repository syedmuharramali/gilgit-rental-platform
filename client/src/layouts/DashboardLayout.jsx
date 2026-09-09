import {
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
  Wrench,
  WalletCards,
  X,
} from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { logout } from '../features/auth/authSlice'
import {
  useGetUnreadCountQuery,
  useMarkNotificationTypesReadMutation,
} from '../features/notifications/notificationsApi'

const renterLinks = [
  ['/dashboard', 'Overview', Home],
  ['/favorites', 'Saved homes', Heart],
  ['/matches', 'Smart matches', Sparkles],
  ['/dashboard/applications', 'Applications', ClipboardList],
  ['/dashboard/viewings', 'Viewings', FileCheck2],
  ['/dashboard/tenancies', 'Tenancy', Building2],
  ['/dashboard/rent', 'Rent ledger', WalletCards],
  ['/dashboard/messages', 'Messages', MessageCircle],
  ['/dashboard/agreements', 'Agreements', FileCheck2],
  ['/dashboard/condition-reports', 'Condition reports', ClipboardList],
  ['/dashboard/maintenance', 'Maintenance', Wrench],
  ['/dashboard/reviews', 'Reviews', Star],
  ['/dashboard/reports', 'Safety reports', TriangleAlert],
  ['/dashboard/notifications', 'Notifications', Bell],
  ['/dashboard/profile', 'Profile', Settings2],
]

const ownerLinks = [
  ['/owner', 'Owner overview', Home],
  ['/owner/verification', 'Verification', ShieldCheck],
  ['/owner/properties', 'Properties', Building2],
  ['/owner/media', 'Property media', Images],
  ['/owner/applications', 'Applications', ClipboardList],
  ['/owner/viewings', 'Viewings', FileCheck2],
  ['/owner/tenancies', 'Tenancies', Building2],
  ['/owner/rent', 'Rent ledger', WalletCards],
  ['/owner/messages', 'Messages', MessageCircle],
  ['/owner/agreements', 'Agreements', FileCheck2],
  ['/owner/condition-reports', 'Condition reports', ClipboardList],
  ['/owner/maintenance', 'Maintenance', Wrench],
  ['/owner/reviews', 'Reviews', Star],
  ['/owner/reports', 'Safety reports', TriangleAlert],
  ['/owner/notifications', 'Notifications', Bell],
  ['/owner/profile', 'Profile', Settings2],
]

const badgeTypesByLabel = {
  Applications: ['application', 'application_accepted', 'application_rejected', 'application_withdrawn'],
  Viewings: ['viewing', 'viewing_confirmed', 'viewing_rejected', 'viewing_cancelled'],
  Tenancy: ['tenancy', 'tenancy_ended'],
  Tenancies: ['tenancy', 'tenancy_ended'],
  'Rent ledger': ['rent'],
  Messages: ['message'],
  Agreements: ['agreement'],
  'Condition reports': ['condition_report'],
  Maintenance: ['maintenance'],
  Reviews: ['review'],
  'Safety reports': ['report'],
}

function DashboardLayout({ mode = 'renter' }) {
  const dispatch = useDispatch()
  const location = useLocation()
  const user = useSelector((state) => state.auth.user)
  const { data: unread } = useGetUnreadCountQuery(undefined, { pollingInterval: 30000 })
  const [markNotificationTypesRead] = useMarkNotificationTypesReadMutation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const links = mode === 'owner' ? ownerLinks : renterLinks
  const notificationPath = mode === 'owner' ? '/owner/notifications' : '/dashboard/notifications'
  const workspaceLabel = mode === 'owner' ? 'Owner workspace' : 'Renter workspace'
  const primaryMobileLinks = links.slice(0, 4)
  const secondaryMobileLinks = links.slice(4)
  const isMoreActive = secondaryMobileLinks.some(([to]) => location.pathname === to || location.pathname.startsWith(`${to}/`))

  const getBadgeCount = (label) => {
    if (label === 'Notifications') return unread?.unreadCount || 0

    const types = badgeTypesByLabel[label]
    if (!types?.length) return 0

    return types.reduce((total, type) => total + (unread?.byType?.[type] || 0), 0)
  }

  const moreBadgeCount = secondaryMobileLinks.reduce((total, [, label]) => {
    if (label === 'Notifications') return total
    return total + getBadgeCount(label)
  }, 0)

  useEffect(() => {
    const currentLink = links.find(([to, label]) => {
      if (label === 'Notifications') return false
      return location.pathname === to || location.pathname.startsWith(`${to}/`)
    })

    if (!currentLink) return

    const [, label] = currentLink
    const types = badgeTypesByLabel[label]
    if (!types?.length || getBadgeCount(label) === 0) return

    markNotificationTypesRead(types).catch(() => {})
  }, [location.pathname, unread?.unreadCount, unread?.byType, links, markNotificationTypesRead])

  const signOut = () => {
    setMobileMenuOpen(false)
    dispatch(logout())
  }

  return (
    <div className="min-h-screen bg-[#070b14] pb-20 text-white lg:pb-0">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(56,189,248,.08),transparent_22%),radial-gradient(circle_at_85%_80%,rgba(139,92,246,.08),transparent_25%)]" />

      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 border-r border-white/[0.07] bg-[#090f1b]/95 backdrop-blur-2xl lg:flex lg:flex-col">
        <div className="flex h-20 items-center gap-3 border-b border-white/[0.06] px-6">
          <Link to="/" className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-cyan-300 via-blue-400 to-violet-500 text-[#07101e] shadow-[0_12px_35px_rgba(56,189,248,.18)]" aria-label="Gilgit Rental home"><Sparkles className="h-4 w-4" /></Link>
          <div><p className="font-black tracking-[-.03em]">Gilgit Rental</p><p className="text-xs text-slate-500">{workspaceLabel}</p></div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-4" aria-label={`${workspaceLabel} navigation`}>
          {links.map(([to, label, Icon]) => {
            const badgeCount = getBadgeCount(label)
            return (
              <NavLink key={to} to={to} end={to === '/dashboard' || to === '/owner'} className={({ isActive }) => `group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition ${isActive ? 'bg-gradient-to-r from-cyan-300/15 via-blue-400/10 to-violet-500/10 text-white ring-1 ring-cyan-300/20' : 'text-slate-500 hover:bg-white/[0.045] hover:text-white'}`}>
                <span className="grid h-8 w-8 place-items-center rounded-xl bg-white/[0.04] text-slate-400 transition group-hover:text-cyan-300"><Icon className="h-4 w-4" /></span>
                <span className="min-w-0 flex-1 truncate">{label}</span>
                {badgeCount > 0 && <span className={`ml-auto rounded-full px-2 py-0.5 text-[10px] font-black text-white ${label === 'Notifications' ? 'bg-rose-500' : 'bg-cyan-500'}`}>{badgeCount}</span>}
              </NavLink>
            )
          })}
          {user?.role === 'admin' && <NavLink to="/admin" className="mt-3 flex items-center gap-3 rounded-2xl border border-violet-400/20 bg-violet-500/10 px-4 py-3 text-sm font-bold text-violet-200"><ShieldCheck className="h-4 w-4" /> Admin console</NavLink>}
        </nav>

        <div className="border-t border-white/[0.06] p-4">
          <div className="mb-3 flex items-center gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-3">
            {user?.avatar?.url ? <img src={user.avatar.url} alt="" className="h-10 w-10 rounded-xl object-cover ring-1 ring-white/10" /> : <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-cyan-300/20 to-violet-500/20 font-black text-cyan-200">{user?.name?.[0] || 'U'}</div>}
            <div className="min-w-0"><p className="truncate text-sm font-black">{user?.name}</p><p className="truncate text-xs text-slate-500">{user?.email}</p></div>
          </div>
          <button type="button" onClick={signOut} className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-bold text-slate-400 transition hover:bg-white/[0.06] hover:text-white"><LogOut className="h-4 w-4" /> Sign out</button>
        </div>
      </aside>

      <div className="relative z-10 lg:pl-72">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-white/[0.07] bg-[#070b14]/82 px-5 backdrop-blur-2xl sm:px-8 lg:h-20">
          <div className="min-w-0"><p className="truncate text-[10px] font-black uppercase tracking-[.2em] text-cyan-300">{mode === 'owner' ? 'Manage your rentals' : 'Your rental journey'}</p><p className="mt-1 truncate text-sm font-black text-white/90">{workspaceLabel}</p></div>
          <div className="flex shrink-0 items-center gap-2">
            {mode === 'renter' ? <Link to="/owner" className="hidden rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-black text-slate-300 transition hover:border-cyan-300/30 hover:text-white sm:block">Owner mode</Link> : <Link to="/dashboard" className="hidden rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-black text-slate-300 transition hover:border-cyan-300/30 hover:text-white sm:block">Renter mode</Link>}
            <Link to={notificationPath} aria-label="Notifications" className="relative grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-white/[0.04] text-slate-300 transition hover:text-white"><Bell className="h-4 w-4" />{unread?.unreadCount > 0 && <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-rose-500 px-1 text-[9px] font-black text-white">{unread.unreadCount}</span>}</Link>
          </div>
        </header>
        <motion.main initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="p-5 sm:p-8 lg:p-10"><Outlet /></motion.main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-5 border-t border-white/[0.07] bg-[#090f1b]/95 px-2 py-2 backdrop-blur-2xl lg:hidden" aria-label={`${workspaceLabel} mobile navigation`}>
        {primaryMobileLinks.map(([to, label, Icon]) => {
          const badgeCount = getBadgeCount(label)
          return (
            <NavLink key={to} to={to} end={to === '/dashboard' || to === '/owner'} className={({ isActive }) => `relative flex min-w-0 flex-col items-center gap-1 rounded-xl px-1 py-2 text-[9px] font-bold transition ${isActive ? 'bg-cyan-300/10 text-cyan-200' : 'text-slate-500'}`}>
              <span className="relative"><Icon className="h-4 w-4" />{badgeCount > 0 && <span className="absolute -right-3 -top-2 grid h-4 min-w-4 place-items-center rounded-full bg-cyan-500 px-1 text-[8px] font-black text-white">{badgeCount}</span>}</span>
              <span className="max-w-full truncate">{label.split(' ')[0]}</span>
            </NavLink>
          )
        })}
        <button type="button" onClick={() => setMobileMenuOpen(true)} aria-expanded={mobileMenuOpen} aria-controls="mobile-workspace-menu" className={`relative flex min-w-0 flex-col items-center gap-1 rounded-xl px-1 py-2 text-[9px] font-bold transition ${isMoreActive ? 'bg-cyan-300/10 text-cyan-200' : 'text-slate-500'}`}><span className="relative"><Menu className="h-4 w-4" />{moreBadgeCount > 0 && <span className="absolute -right-3 -top-2 grid h-4 min-w-4 place-items-center rounded-full bg-cyan-500 px-1 text-[8px] font-black text-white">{moreBadgeCount}</span>}</span>More</button>
      </nav>

      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.button type="button" aria-label="Close workspace menu" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setMobileMenuOpen(false)} className="fixed inset-0 z-[60] bg-black/65 backdrop-blur-sm lg:hidden" />
            <motion.aside id="mobile-workspace-menu" role="dialog" aria-modal="true" aria-label={`${workspaceLabel} menu`} initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', stiffness: 320, damping: 32 }} className="fixed inset-x-0 bottom-0 z-[70] max-h-[82vh] overflow-y-auto rounded-t-[30px] border-t border-white/10 bg-[#0a101c] p-5 pb-8 shadow-[0_-30px_90px_rgba(0,0,0,.45)] lg:hidden">
              <div className="mb-4 flex items-center justify-between"><div><p className="text-[10px] font-black uppercase tracking-[.18em] text-cyan-300">All tools</p><h2 className="mt-1 text-lg font-black">{workspaceLabel}</h2></div><button type="button" onClick={() => setMobileMenuOpen(false)} aria-label="Close menu" className="grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-white/[0.04] text-slate-300"><X className="h-4 w-4" /></button></div>
              <nav className="grid gap-2 sm:grid-cols-2">
                {links.map(([to, label, Icon]) => {
                  const badgeCount = getBadgeCount(label)
                  return (
                    <NavLink key={to} to={to} end={to === '/dashboard' || to === '/owner'} onClick={() => setMobileMenuOpen(false)} className={({ isActive }) => `flex min-h-12 items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-bold transition ${isActive ? 'border-cyan-300/20 bg-cyan-300/[0.08] text-cyan-100' : 'border-white/[0.07] bg-white/[0.025] text-slate-400'}`}>
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="min-w-0 flex-1 truncate">{label}</span>
                      {badgeCount > 0 && <span className={`rounded-full px-2 py-0.5 text-[10px] font-black text-white ${label === 'Notifications' ? 'bg-rose-500' : 'bg-cyan-500'}`}>{badgeCount}</span>}
                    </NavLink>
                  )
                })}
                {user?.role === 'admin' && <NavLink to="/admin" onClick={() => setMobileMenuOpen(false)} className="flex min-h-12 items-center gap-3 rounded-2xl border border-violet-400/20 bg-violet-500/10 px-4 py-3 text-sm font-bold text-violet-200"><ShieldCheck className="h-4 w-4" /> Admin console</NavLink>}
              </nav>
              <div className="mt-4 grid grid-cols-2 gap-2"><Link to={mode === 'owner' ? '/dashboard' : '/owner'} onClick={() => setMobileMenuOpen(false)} className="flex min-h-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.035] px-3 text-xs font-black text-slate-300">{mode === 'owner' ? 'Renter mode' : 'Owner mode'}</Link><button type="button" onClick={signOut} className="flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-rose-300/15 bg-rose-400/[0.06] px-3 text-xs font-black text-rose-300"><LogOut className="h-4 w-4" /> Sign out</button></div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

export default DashboardLayout
