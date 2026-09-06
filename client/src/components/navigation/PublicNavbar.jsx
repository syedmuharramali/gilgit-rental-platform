import { Menu, Search, Sparkles, X } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'
import { useSelector } from 'react-redux'
import { Link, NavLink } from 'react-router-dom'

const links = [
  { to: '/properties', label: 'Find a home' },
  { to: '/living-score', label: 'Living Score' },
  { to: '/about', label: 'How it works' },
]

function PublicNavbar() {
  const [open, setOpen] = useState(false)
  const token = useSelector((state) => state.auth.token)

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/88 backdrop-blur-2xl">
      <div className="mx-auto flex h-18 max-w-[1440px] items-center justify-between gap-4 px-5 sm:px-8 lg:px-10">
        <Link to="/" className="group flex items-center gap-3">
          <motion.div
            whileHover={{ rotate: -6, scale: 1.04 }}
            className="grid h-10 w-10 place-items-center rounded-2xl bg-[#102f26] text-white shadow-[0_10px_30px_rgba(16,47,38,0.18)]"
          >
            <Sparkles className="h-4.5 w-4.5" />
          </motion.div>
          <div className="leading-tight">
            <p className="text-[15px] font-black tracking-[-0.03em] text-slate-950">Gilgit Rental</p>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">Find your place</p>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `rounded-full px-4 py-2.5 text-sm font-semibold transition ${
                  isActive ? 'bg-slate-100 text-slate-950' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <Link
            to="/properties"
            className="grid h-10 w-10 place-items-center rounded-full border border-slate-200 bg-white text-slate-700 transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-lg"
            aria-label="Search rentals"
          >
            <Search className="h-4 w-4" />
          </Link>
          {token ? (
            <Link to="/dashboard" className="rounded-full bg-[#102f26] px-5 py-2.5 text-sm font-bold text-white shadow-[0_12px_28px_rgba(16,47,38,0.18)] transition hover:-translate-y-0.5">
              Dashboard
            </Link>
          ) : (
            <>
              <Link to="/login" className="rounded-full px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">Sign in</Link>
              <Link to="/register" className="rounded-full bg-[#102f26] px-5 py-2.5 text-sm font-bold text-white shadow-[0_12px_28px_rgba(16,47,38,0.18)] transition hover:-translate-y-0.5">
                Join free
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          className="grid h-10 w-10 place-items-center rounded-full border border-slate-200 bg-white text-slate-900 lg:hidden"
          onClick={() => setOpen((value) => !value)}
          aria-label="Toggle navigation"
        >
          {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden border-t border-slate-200 bg-white lg:hidden"
          >
            <div className="space-y-2 px-5 py-5 sm:px-8">
              {links.map((link) => (
                <Link key={link.to} to={link.to} onClick={() => setOpen(false)} className="block rounded-2xl px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                  {link.label}
                </Link>
              ))}
              <div className="grid grid-cols-2 gap-2 pt-2">
                <Link to={token ? '/dashboard' : '/login'} onClick={() => setOpen(false)} className="rounded-2xl border border-slate-200 px-4 py-3 text-center text-sm font-bold text-slate-800">
                  {token ? 'Dashboard' : 'Sign in'}
                </Link>
                {!token && (
                  <Link to="/register" onClick={() => setOpen(false)} className="rounded-2xl bg-[#102f26] px-4 py-3 text-center text-sm font-bold text-white">
                    Join free
                  </Link>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}

export default PublicNavbar
