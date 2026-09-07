import { Building2, ChevronLeft, LayoutDashboard, ShieldCheck, Sparkles, TriangleAlert } from 'lucide-react'
import { motion } from 'motion/react'
import { Link, NavLink, Outlet } from 'react-router-dom'

const links = [
  ['/admin', 'Overview', LayoutDashboard],
  ['/admin/verifications', 'Owner verifications', ShieldCheck],
  ['/admin/properties', 'Property reviews', Building2],
  ['/admin/reports', 'Safety reports', TriangleAlert],
]

export default function AdminLayout() {
  return (
    <div className="min-h-screen bg-[#070b14] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_15%_12%,rgba(139,92,246,.11),transparent_26%),radial-gradient(circle_at_80%_80%,rgba(56,189,248,.08),transparent_25%)]" />

      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 border-r border-white/[0.07] bg-[#090e19]/95 p-5 backdrop-blur-2xl lg:block">
        <Link to="/" className="flex items-center gap-3 px-3 py-4">
          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-violet-400 via-blue-400 to-cyan-300 text-[#07101e] shadow-[0_12px_35px_rgba(139,92,246,.18)]"><Sparkles className="h-4 w-4" /></span>
          <div><p className="font-black tracking-[-.03em]">Gilgit Rental</p><p className="text-[10px] font-bold uppercase tracking-[.17em] text-violet-300/60">Administration</p></div>
        </Link>

        <div className="mx-3 mt-4 rounded-[24px] border border-violet-400/15 bg-violet-500/[0.08] p-4">
          <p className="text-[10px] font-black uppercase tracking-[.18em] text-violet-300">Control centre</p>
          <p className="mt-2 text-sm font-black">Trust, moderation & safety</p>
          <p className="mt-1 text-xs leading-5 text-slate-500">Review owners, listings and safety reports from one protected workspace.</p>
        </div>

        <nav className="mt-6 space-y-1">
          {links.map(([to,label,Icon]) => (
            <NavLink key={to} to={to} end={to === '/admin'} className={({isActive}) => `group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition ${isActive ? 'bg-gradient-to-r from-violet-400/15 to-cyan-300/10 text-white ring-1 ring-violet-300/20' : 'text-slate-500 hover:bg-white/[0.045] hover:text-white'}`}>
              <span className="grid h-8 w-8 place-items-center rounded-xl bg-white/[0.04] text-slate-400 transition group-hover:text-violet-300"><Icon className="h-4 w-4" /></span>
              {label}
            </NavLink>
          ))}
        </nav>

        <Link to="/dashboard" className="absolute bottom-6 left-5 right-5 flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-bold text-slate-400 transition hover:bg-white/[0.06] hover:text-white"><ChevronLeft className="h-4 w-4" /> Back to account</Link>
      </aside>

      <div className="relative z-10 lg:pl-72">
        <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-white/[0.07] bg-[#070b14]/82 px-5 backdrop-blur-2xl sm:px-8">
          <div><p className="text-[10px] font-black uppercase tracking-[.2em] text-violet-300">Protected workspace</p><p className="mt-1 text-sm font-black">Administration Console</p></div>
          <span className="inline-flex items-center gap-2 rounded-full border border-violet-300/15 bg-violet-500/10 px-3 py-2 text-[10px] font-black uppercase tracking-[.12em] text-violet-200"><ShieldCheck className="h-3.5 w-3.5" /> Admin access</span>
        </header>
        <motion.main initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="p-5 sm:p-8 lg:p-10"><Outlet /></motion.main>
      </div>
    </div>
  )
}
