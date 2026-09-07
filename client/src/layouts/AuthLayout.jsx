import { ArrowLeft, BadgeCheck, Home, MapPin, ShieldCheck, Sparkles } from 'lucide-react'
import { motion } from 'motion/react'
import { Link } from 'react-router-dom'
import SplineHero from '../components/three-d/SplineHero'

const trust = [
  { icon: ShieldCheck, label: 'Verified owners' },
  { icon: MapPin, label: 'Gilgit focused' },
  { icon: Sparkles, label: 'Living Score' },
]

function AuthLayout({ children, eyebrow, title, subtitle }) {
  return (
    <main className="min-h-screen bg-[#060914] text-white">
      <div className="grid min-h-screen lg:grid-cols-[1.05fr_.95fr]">
        <section className="relative hidden overflow-hidden p-5 lg:block xl:p-7">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_15%,rgba(56,189,248,.14),transparent_28%),radial-gradient(circle_at_88%_72%,rgba(139,92,246,.16),transparent_30%)]" />

          <div className="relative h-full min-h-[calc(100vh-2.5rem)] overflow-hidden rounded-[38px] border border-white/10 bg-[#090d18] p-6 shadow-[0_40px_110px_rgba(0,0,0,.35)] xl:p-8">
            <div className="relative z-20 flex items-center justify-between">
              <Link to="/" className="flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-cyan-300 via-blue-400 to-violet-500 text-[#07101e] shadow-xl"><Home className="h-5 w-5" /></div>
                <div><p className="text-sm font-black tracking-[-0.02em]">Gilgit Rental</p><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/30">Stay smarter</p></div>
              </Link>
              <Link to="/" className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-xs font-bold text-white/60 backdrop-blur-xl transition hover:bg-white/10 hover:text-white"><ArrowLeft className="h-3.5 w-3.5" /> Back home</Link>
            </div>

            <div className="relative z-10 mx-auto mt-7 h-[50vh] min-h-[390px] max-w-[760px] xl:h-[55vh]">
              <SplineHero />
            </div>

            <div className="relative z-20 mt-7 grid gap-5 xl:grid-cols-[1fr_auto] xl:items-end">
              <div className="max-w-xl">
                <span className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-cyan-200"><BadgeCheck className="h-3.5 w-3.5" /> Local rental journey</span>
                <h2 className="mt-4 text-4xl font-black leading-[.98] tracking-[-0.055em] xl:text-5xl">A smarter way to rent in Gilgit.</h2>
                <p className="mt-4 max-w-lg text-sm leading-6 text-white/42">Discover verified homes, understand practical living conditions, apply, schedule viewings and manage everything from one account.</p>
              </div>

              <div className="flex flex-wrap gap-2 xl:max-w-[260px] xl:justify-end">
                {trust.map(({ icon: Icon, label }) => <span key={label} className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.05] px-3 py-2 text-[11px] font-bold text-white/55 backdrop-blur-xl"><Icon className="h-3.5 w-3.5 text-cyan-300" /> {label}</span>)}
              </div>
            </div>
          </div>
        </section>

        <section className="relative flex min-h-screen items-center justify-center overflow-hidden px-5 py-8 sm:px-8 lg:px-10 xl:px-16">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_10%,rgba(59,130,246,.12),transparent_26%),radial-gradient(circle_at_20%_80%,rgba(139,92,246,.1),transparent_30%)]" />
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }} className="relative z-10 w-full max-w-[500px]">
            <div className="mb-8 flex items-center justify-between lg:hidden">
              <Link to="/" className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-cyan-300 to-blue-500 text-[#07101e]"><Home className="h-4 w-4" /></div><div><p className="text-sm font-black">Gilgit Rental</p><p className="text-[10px] uppercase tracking-[.14em] text-white/30">Stay smarter</p></div></Link><Link to="/" className="text-xs font-bold text-white/45">Home</Link>
            </div>

            <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-300">{eyebrow}</p>
            <h1 className="mt-3 text-4xl font-black leading-[.98] tracking-[-0.055em] text-white sm:text-5xl">{title}</h1>
            <p className="mt-4 max-w-md text-sm leading-6 text-white/40 sm:text-[15px]">{subtitle}</p>

            <div className="mt-8 rounded-[30px] border border-white/10 bg-white/[0.055] p-5 shadow-[0_30px_90px_rgba(0,0,0,.28)] backdrop-blur-2xl sm:p-7">
              {children}
            </div>

            <p className="mt-5 text-center text-xs leading-5 text-white/25">By continuing, you agree to use the platform responsibly and provide accurate rental information.</p>
          </motion.div>
        </section>
      </div>
    </main>
  )
}

export default AuthLayout
