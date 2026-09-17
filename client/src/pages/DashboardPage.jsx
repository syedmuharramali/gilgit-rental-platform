import { motion } from 'motion/react'
import { Bell, Building2, Compass, Heart, Home, LogOut, MessageCircle, ShieldCheck, Sparkles } from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { logout } from '../features/auth/authSlice'

const actions = [
  { icon: Compass, title: 'Explore rentals', text: 'Browse verified listings across Gilgit.', to: '/properties' },
  { icon: Heart, title: 'Saved homes', text: 'Keep your favourite options close.', to: '/dashboard/favorites' },
  { icon: MessageCircle, title: 'Messages', text: 'Continue conversations with owners and renters.', to: '/dashboard/messages' },
  { icon: Bell, title: 'Notifications', text: 'Track every important rental update.', to: '/dashboard/notifications' },
]

function DashboardPage() {
  const dispatch = useDispatch()
  const user = useSelector((state) => state.auth.user)

  return (
    <main className="min-h-screen bg-[#f4f7f5] text-slate-950">
      <header className="border-b border-slate-200 bg-white/88 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
          <Link to="/" className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-[#102f26] text-white"><Home className="h-4.5 w-4.5" /></div>
            <div><p className="text-sm font-black tracking-[-0.02em]">Gilgit Rental</p><p className="text-[10px] uppercase tracking-[0.14em] text-slate-400">Your rental workspace</p></div>
          </Link>
          <button type="button" onClick={() => dispatch(logout())} className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-600 transition hover:bg-slate-50 hover:text-slate-950"><LogOut className="h-4 w-4" /> Sign out</button>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-5 py-10 sm:px-8 lg:py-14">
        <div className="grid gap-6 lg:grid-cols-[1.35fr_.65fr]">
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="relative overflow-hidden rounded-[32px] bg-[#102f26] p-7 text-white shadow-[0_30px_80px_rgba(16,47,38,.18)] sm:p-9">
            <div className="relative z-10 max-w-2xl">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold text-emerald-100"><ShieldCheck className="h-3.5 w-3.5" /> Secure session active</span>
              <h1 className="mt-6 text-4xl font-black tracking-[-0.055em] sm:text-5xl">Welcome, {user?.name?.split(' ')[0] || 'there'}.</h1>
              <p className="mt-4 max-w-xl text-sm leading-7 text-white/55">Your renter workspace will connect saved homes, applications, viewings, messages and tenancy actions as we build the remaining dashboard modules.</p>
            </div>
            <div className="absolute -bottom-10 -right-8 grid h-56 w-56 place-items-center rounded-full border border-white/10 bg-white/[0.05]"><Building2 className="h-20 w-20 text-emerald-200/35" /></div>
          </motion.div>

          <motion.aside initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-[0_20px_55px_rgba(15,23,42,.06)]">
            <div className="flex items-center gap-4">
              {user?.avatar?.url ? <img src={user.avatar.url} alt="" className="h-14 w-14 rounded-2xl object-cover ring-1 ring-slate-200" /> : <div className="grid h-14 w-14 place-items-center rounded-2xl bg-[#e8f2ed] text-xl font-black text-[#245545]">{user?.name?.[0]?.toUpperCase() || 'U'}</div>}
              <div className="min-w-0"><p className="truncate font-black">{user?.name}</p><p className="truncate text-sm text-slate-400">{user?.email}</p></div>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3"><div className="rounded-2xl bg-slate-50 p-4 text-xs text-slate-400"><span>Role</span><strong className="mt-1 block capitalize text-slate-900">{user?.role || 'user'}</strong></div><div className="rounded-2xl bg-slate-50 p-4 text-xs text-slate-400"><span>Email</span><strong className="mt-1 block text-slate-900">{user?.emailVerified ? 'Verified' : 'Pending'}</strong></div></div>
          </motion.aside>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {actions.map(({ icon: Icon, title, text, to }, index) => (
            <motion.div key={title} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 + index * 0.06 }} whileHover={{ y: -6, rotateX: 1.5 }}>
              <Link to={to} className="block min-h-48 rounded-[26px] border border-slate-200 bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,.05)]">
                <div className="grid h-10 w-10 place-items-center rounded-2xl bg-[#e8f2ed] text-[#245545]"><Icon className="h-5 w-5" /></div>
                <h2 className="mt-5 font-black tracking-[-0.02em]">{title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">{text}</p>
              </Link>
            </motion.div>
          ))}
        </div>

        <div className="mt-6 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-semibold text-emerald-800"><Sparkles className="h-4 w-4 shrink-0" /> Public discovery and authentication are now moving onto the final visual system; renter modules follow next.</div>
      </section>
    </main>
  )
}

export default DashboardPage
