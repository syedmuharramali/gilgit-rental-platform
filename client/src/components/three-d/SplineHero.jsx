import { Suspense, lazy } from 'react'
import { motion } from 'motion/react'
import { BadgeCheck, Flame, MapPin, ShieldCheck, Sparkles, Star, Waves } from 'lucide-react'

const Spline = lazy(() => import('@splinetool/react-spline'))

const HERO_HOME = 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1800&q=88'

function GlassBadge({ className = '', children, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18, scale: 0.94 }}
      animate={{ opacity: 1, y: [0, -7, 0], scale: 1 }}
      transition={{ opacity: { duration: 0.55, delay }, scale: { duration: 0.55, delay }, y: { duration: 5.5, delay, repeat: Infinity, ease: 'easeInOut' } }}
      className={`absolute z-20 rounded-2xl border border-white/20 bg-[#0a1020]/72 px-4 py-3 text-white shadow-[0_20px_55px_rgba(2,6,23,.35)] backdrop-blur-2xl ${className}`}
    >
      {children}
    </motion.div>
  )
}

function FallbackScene() {
  return (
    <div className="relative h-full w-full overflow-hidden rounded-[34px] bg-[#090d18] [perspective:1400px]">
      <motion.div
        initial={{ scale: 1.06 }}
        animate={{ scale: [1.06, 1.1, 1.06], x: [0, -4, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute inset-0"
      >
        <img src={HERO_HOME} alt="Premium rental home" className="h-full w-full object-cover" />
      </motion.div>

      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,10,20,.04)_0%,rgba(7,10,20,.16)_45%,rgba(7,10,20,.82)_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_12%,rgba(96,165,250,.32),transparent_28%),radial-gradient(circle_at_18%_80%,rgba(139,92,246,.24),transparent_30%)]" />

      <GlassBadge className="left-5 top-5 sm:left-7 sm:top-7" delay={0.15}>
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-blue-500/20 text-blue-200"><ShieldCheck className="h-4 w-4" /></span>
          <div><p className="text-[10px] font-bold uppercase tracking-[.16em] text-white/45">Listing trust</p><p className="mt-0.5 text-xs font-black">Verified owner</p></div>
        </div>
      </GlassBadge>

      <GlassBadge className="right-5 top-[30%] sm:right-7" delay={0.32}>
        <div className="flex items-center gap-3">
          <div className="relative grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br from-cyan-300 to-blue-500 text-sm font-black text-[#08101f] shadow-lg">86</div>
          <div><p className="text-[10px] font-bold uppercase tracking-[.16em] text-cyan-200/60">Living Score</p><p className="mt-0.5 text-xs font-black">Winter ready</p></div>
        </div>
      </GlassBadge>

      <GlassBadge className="bottom-[23%] left-5 sm:left-8" delay={0.48}>
        <div className="flex items-center gap-2 text-xs font-black"><MapPin className="h-4 w-4 text-cyan-300" /> Gilgit · Jutial</div>
      </GlassBadge>

      <motion.div
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.65, delay: 0.3 }}
        className="absolute inset-x-4 bottom-4 z-20 rounded-[26px] border border-white/15 bg-[#070b16]/78 p-4 text-white shadow-2xl backdrop-blur-2xl sm:inset-x-6 sm:bottom-6 sm:p-5"
      >
        <div className="flex items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-1 text-amber-300"><Star className="h-3.5 w-3.5 fill-current" /><span className="text-[10px] font-black uppercase tracking-[.14em] text-white/55">Premium discovery</span></div>
            <p className="mt-2 text-lg font-black tracking-[-.03em] sm:text-xl">Homes that make sense beyond the photos.</p>
            <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-bold text-white/65"><span className="inline-flex items-center gap-1 rounded-full bg-white/8 px-2.5 py-1.5"><Flame className="h-3 w-3 text-orange-300" /> Heating</span><span className="inline-flex items-center gap-1 rounded-full bg-white/8 px-2.5 py-1.5"><Waves className="h-3 w-3 text-cyan-300" /> Water</span><span className="inline-flex items-center gap-1 rounded-full bg-white/8 px-2.5 py-1.5"><BadgeCheck className="h-3 w-3 text-blue-300" /> Verified</span></div>
          </div>
          <span className="hidden h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-cyan-300 to-blue-500 text-[#08101f] shadow-lg sm:grid"><Sparkles className="h-5 w-5" /></span>
        </div>
      </motion.div>
    </div>
  )
}

function SplineHero() {
  const scene = import.meta.env.VITE_SPLINE_SCENE_URL

  if (!scene) return <FallbackScene />

  return (
    <div className="relative h-full w-full overflow-hidden rounded-[34px] bg-[#090d18] shadow-[0_40px_100px_rgba(2,6,23,.28)]">
      <Suspense fallback={<FallbackScene />}>
        <Spline scene={scene} />
      </Suspense>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#070b16]/70 via-transparent to-transparent" />
      <div className="pointer-events-none absolute bottom-5 left-5 flex items-center gap-2 rounded-full border border-white/15 bg-[#070b16]/70 px-4 py-2 text-xs font-bold text-white shadow-lg backdrop-blur-2xl">
        <Sparkles className="h-3.5 w-3.5 text-cyan-300" /> Interactive 3D rental experience
      </div>
    </div>
  )
}

export default SplineHero
