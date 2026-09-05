import { motion } from 'framer-motion'
import { Bell, Building2, Compass, Heart, Home, LogOut, MessageCircle, ShieldCheck, Sparkles } from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import { logout } from '../features/auth/authSlice'

const actions = [
  { icon: Compass, title: 'Explore rentals', text: 'Browse verified listings across Gilgit.' },
  { icon: Heart, title: 'Saved homes', text: 'Keep your favourite options close.' },
  { icon: MessageCircle, title: 'Messages', text: 'Continue conversations with owners and renters.' },
  { icon: Bell, title: 'Notifications', text: 'Track every important rental update.' },
]

function DashboardPage() {
  const dispatch = useDispatch()
  const user = useSelector((state) => state.auth.user)

  return (
    <main className="min-h-screen bg-[#07130f] text-white">
      <div className="dashboard-noise" />
      <header className="relative z-10 border-b border-white/8 bg-[#07130f]/80 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
          <div className="flex items-center gap-3">
            <div className="brand-cube"><Home className="h-5 w-5" /></div>
            <div>
              <p className="text-sm font-semibold tracking-[0.15em] text-emerald-200/80">GILGIT RENTAL</p>
              <p className="text-xs text-white/35">Your rental command centre</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => dispatch(logout())}
            className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/65 transition hover:border-white/20 hover:bg-white/10 hover:text-white"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </header>

      <section className="relative z-10 mx-auto max-w-7xl px-5 py-10 sm:px-8 lg:py-16">
        <div className="grid gap-8 lg:grid-cols-[1.35fr_.65fr]">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            className="dashboard-hero"
          >
            <div className="relative z-10 max-w-2xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300/15 bg-emerald-300/10 px-3 py-1 text-xs font-medium text-emerald-200">
                <ShieldCheck className="h-3.5 w-3.5" />
                Secure session active
              </span>
              <h1 className="mt-6 text-4xl font-semibold tracking-tight sm:text-5xl">
                Welcome, {user?.name?.split(' ')[0] || 'there'}.
              </h1>
              <p className="mt-4 max-w-xl text-base leading-7 text-white/50">
                Your authentication foundation is live. The next frontend milestone will connect this dashboard to real property discovery, applications, owner tools and tenancy workflows.
              </p>
            </div>

            <div className="dashboard-3d-object" aria-hidden="true">
              <div className="dashboard-orbit" />
              <Building2 className="h-20 w-20" />
            </div>
          </motion.div>

          <motion.aside
            initial={{ opacity: 0, x: 18 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="dashboard-profile-card"
          >
            <div className="flex items-center gap-4">
              {user?.avatar?.url ? (
                <img src={user.avatar.url} alt="" className="h-14 w-14 rounded-2xl object-cover ring-1 ring-white/10" />
              ) : (
                <div className="grid h-14 w-14 place-items-center rounded-2xl bg-emerald-300/10 text-xl font-semibold text-emerald-200 ring-1 ring-emerald-200/15">
                  {user?.name?.[0]?.toUpperCase() || 'U'}
                </div>
              )}
              <div className="min-w-0">
                <p className="truncate font-semibold">{user?.name}</p>
                <p className="truncate text-sm text-white/40">{user?.email}</p>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="mini-stat"><span>Role</span><strong>{user?.role || 'user'}</strong></div>
              <div className="mini-stat"><span>Email</span><strong>{user?.emailVerified ? 'Verified' : 'Pending'}</strong></div>
            </div>
          </motion.aside>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {actions.map(({ icon: Icon, title, text }, index) => (
            <motion.article
              key={title}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12 + index * 0.06 }}
              whileHover={{ y: -6, rotateX: 2, rotateY: -2 }}
              className="dashboard-action-card"
            >
              <div className="floating-icon"><Icon className="h-5 w-5" /></div>
              <h2 className="mt-5 font-semibold">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-white/42">{text}</p>
            </motion.article>
          ))}
        </div>

        <div className="mt-8 flex items-center gap-3 rounded-2xl border border-violet-300/10 bg-violet-300/5 px-5 py-4 text-sm text-violet-100/70">
          <Sparkles className="h-4 w-4 shrink-0" />
          3D visual language is intentionally lightweight: perspective, depth, glass layers and motion instead of a heavy WebGL scene.
        </div>
      </section>
    </main>
  )
}

export default DashboardPage
