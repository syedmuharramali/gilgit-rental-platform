import { Building2, LayoutDashboard, ShieldCheck, TriangleAlert } from 'lucide-react'
import { NavLink, Outlet } from 'react-router-dom'

const links = [
  ['/admin', 'Overview', LayoutDashboard],
  ['/admin/verifications', 'Owner verifications', ShieldCheck],
  ['/admin/properties', 'Property reviews', Building2],
  ['/admin/reports', 'Safety reports', TriangleAlert],
]

export default function AdminLayout() {
  return <div className="min-h-screen bg-[#f4f6f5]"><aside className="fixed inset-y-0 left-0 hidden w-72 border-r border-slate-200 bg-[#0e261f] p-5 text-white lg:block"><p className="px-3 py-5 text-xs font-black uppercase tracking-[.2em] text-emerald-300">Gilgit Rental Admin</p><nav className="mt-4 space-y-1">{links.map(([to,label,Icon]) => <NavLink key={to} to={to} end={to === '/admin'} className={({isActive}) => `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold ${isActive ? 'bg-white text-[#102f26]' : 'text-white/60 hover:bg-white/10 hover:text-white'}`}><Icon className="h-4 w-4" />{label}</NavLink>)}</nav><a href="/dashboard" className="absolute bottom-6 left-5 right-5 rounded-2xl border border-white/15 px-4 py-3 text-center text-sm font-bold text-white/70">Back to account</a></aside><div className="lg:pl-72"><header className="border-b border-slate-200 bg-white px-5 py-5 sm:px-8"><p className="text-sm font-black text-slate-900">Administration Console</p></header><main className="p-5 sm:p-8 lg:p-10"><Outlet /></main></div></div>
}
