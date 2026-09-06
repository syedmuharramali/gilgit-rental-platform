import {
  Bell,
  Building2,
  ClipboardList,
  FileCheck2,
  Heart,
  Home,
  Images,
  LogOut,
  MessageCircle,
  Settings2,
  ShieldCheck,
  Sparkles,
  Star,
  TriangleAlert,
  Wrench,
  WalletCards,
} from 'lucide-react'
import { motion } from 'motion/react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { logout } from '../features/auth/authSlice'
import { useGetUnreadCountQuery } from '../features/notifications/notificationsApi'

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

function DashboardLayout({ mode = 'renter' }) {
  const dispatch = useDispatch()
  const user = useSelector((state) => state.auth.user)
  const { data: unread } = useGetUnreadCountQuery(undefined, { pollingInterval: 30000 })
  const links = mode === 'owner' ? ownerLinks : renterLinks
  const notificationPath = mode === 'owner' ? '/owner/notifications' : '/dashboard/notifications'

  return (
    <div className="min-h-screen bg-[#f4f6f5] pb-20 text-slate-950 lg:pb-0">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 border-r border-slate-200 bg-white lg:flex lg:flex-col">
        <div className="flex h-20 items-center gap-3 border-b border-slate-100 px-6">
          <Link to="/" className="grid h-10 w-10 place-items-center rounded-2xl bg-[#102f26] text-white"><Sparkles className="h-4 w-4" /></Link>
          <div><p className="font-black tracking-[-.03em]">Gilgit Rental</p><p className="text-xs text-slate-400">{mode === 'owner' ? 'Owner workspace' : 'Renter workspace'}</p></div>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-4">
          {links.map(([to, label, Icon]) => (
            <NavLink key={to} to={to} end={to === '/dashboard' || to === '/owner'} className={({ isActive }) => `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition ${isActive ? 'bg-[#e8f2ed] text-[#102f26]' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-950'}`}>
              <Icon className="h-4 w-4" /> {label}
              {label === 'Notifications' && unread?.unreadCount > 0 && <span className="ml-auto rounded-full bg-rose-500 px-2 py-0.5 text-[10px] text-white">{unread.unreadCount}</span>}
            </NavLink>
          ))}
          {user?.role === 'admin' && <NavLink to="/admin" className="mt-3 flex items-center gap-3 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-bold text-white"><ShieldCheck className="h-4 w-4" /> Admin console</NavLink>}
        </nav>
        <div className="border-t border-slate-100 p-4">
          <div className="mb-3 flex items-center gap-3 rounded-2xl bg-slate-50 p-3">
            {user?.avatar?.url ? <img src={user.avatar.url} alt="" className="h-10 w-10 rounded-xl object-cover" /> : <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#dfece6] font-black text-[#245545]">{user?.name?.[0] || 'U'}</div>}
            <div className="min-w-0"><p className="truncate text-sm font-black">{user?.name}</p><p className="truncate text-xs text-slate-400">{user?.email}</p></div>
          </div>
          <button onClick={() => dispatch(logout())} className="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-600"><LogOut className="h-4 w-4" /> Sign out</button>
        </div>
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200/80 bg-white/90 px-5 backdrop-blur-xl sm:px-8 lg:h-20">
          <div><p className="text-xs font-black uppercase tracking-[.18em] text-emerald-700">{mode === 'owner' ? 'Manage your rentals' : 'Your rental journey'}</p></div>
          <div className="flex items-center gap-2">
            {mode === 'renter' ? <Link to="/owner" className="rounded-full border border-slate-200 px-4 py-2 text-xs font-black text-slate-700">Owner mode</Link> : <Link to="/dashboard" className="rounded-full border border-slate-200 px-4 py-2 text-xs font-black text-slate-700">Renter mode</Link>}
            <Link to={notificationPath} className="relative grid h-10 w-10 place-items-center rounded-full border border-slate-200 bg-white"><Bell className="h-4 w-4" />{unread?.unreadCount > 0 && <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-rose-500 px-1 text-[9px] font-black text-white">{unread.unreadCount}</span>}</Link>
          </div>
        </header>
        <motion.main initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="p-5 sm:p-8 lg:p-10"><Outlet /></motion.main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-50 flex justify-around border-t border-slate-200 bg-white/95 p-2 backdrop-blur-xl lg:hidden">
        {(mode === 'owner' ? ownerLinks.slice(0, 5) : renterLinks.slice(0, 5)).map(([to, label, Icon]) => <NavLink key={to} to={to} className={({ isActive }) => `flex min-w-14 flex-col items-center gap-1 rounded-xl px-2 py-2 text-[10px] font-bold ${isActive ? 'bg-[#e8f2ed] text-[#102f26]' : 'text-slate-400'}`}><Icon className="h-4 w-4" />{label.split(' ')[0]}</NavLink>)}
      </nav>
    </div>
  )
}

export default DashboardLayout
