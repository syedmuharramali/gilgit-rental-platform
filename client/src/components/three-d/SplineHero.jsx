import { Suspense, lazy } from 'react'
import { motion } from 'motion/react'
import { Building2, MapPin, Mountain, ShieldCheck, Sparkles } from 'lucide-react'

const Spline = lazy(() => import('@splinetool/react-spline'))

function FallbackScene() {
  return (
    <div className="relative h-full w-full overflow-hidden rounded-[34px] bg-[radial-gradient(circle_at_65%_20%,rgba(255,255,255,.34),transparent_22%),linear-gradient(150deg,#bfe3d3_0%,#73a78f_38%,#244c40_100%)] [perspective:1300px]">
      <motion.div animate={{ y: [0, -10, 0], rotateZ: [0, 1.2, 0] }} transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }} className="absolute left-[13%] top-[16%] grid h-24 w-24 place-items-center rounded-[28px] border border-white/30 bg-white/20 text-white shadow-2xl backdrop-blur-xl">
        <Mountain className="h-10 w-10" />
      </motion.div>

      <motion.div animate={{ y: [0, 9, 0], rotateY: [0, -8, 0] }} transition={{ duration: 6.2, repeat: Infinity, ease: 'easeInOut' }} className="absolute right-[12%] top-[17%] rounded-full border border-white/35 bg-white/78 px-4 py-2 text-xs font-black text-[#153d31] shadow-xl backdrop-blur-xl">
        <span className="flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> Verified owner</span>
      </motion.div>

      <motion.div animate={{ y: [0, -7, 0], rotateX: [4, -2, 4], rotateY: [-8, 4, -8] }} transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }} className="absolute bottom-[12%] left-1/2 h-[46%] w-[68%] -translate-x-1/2 rounded-[40px] border border-white/25 bg-[#f4eee2] shadow-[0_45px_90px_rgba(9,32,24,.32)] [transform-style:preserve-3d]">
        <div className="absolute -top-20 left-1/2 h-36 w-[76%] -translate-x-1/2 [clip-path:polygon(50%_0,100%_100%,0_100%)] bg-[#163f33]" />
        <div className="absolute bottom-0 left-1/2 h-24 w-14 -translate-x-1/2 rounded-t-2xl bg-[#284e40]" />
        <div className="absolute left-[18%] top-[28%] h-12 w-12 rounded-2xl bg-[#9bd8ce] shadow-[inset_0_0_0_6px_rgba(255,255,255,.35)]" />
        <div className="absolute right-[18%] top-[28%] h-12 w-12 rounded-2xl bg-[#9bd8ce] shadow-[inset_0_0_0_6px_rgba(255,255,255,.35)]" />
      </motion.div>

      <div className="absolute bottom-5 left-5 right-5 flex items-center justify-between gap-3 rounded-[22px] border border-white/25 bg-[#102f26]/78 px-4 py-3 text-white shadow-xl backdrop-blur-xl">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-100/65">Gilgit living</p>
          <p className="mt-1 text-sm font-black">Warm home. Clear road access.</p>
        </div>
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-emerald-300 text-[#102f26]"><Sparkles className="h-5 w-5" /></div>
      </div>
    </div>
  )
}

function SplineHero() {
  const scene = import.meta.env.VITE_SPLINE_SCENE_URL

  if (!scene) return <FallbackScene />

  return (
    <div className="relative h-full w-full overflow-hidden rounded-[34px] bg-[#d8eee4]">
      <Suspense fallback={<FallbackScene />}>
        <Spline scene={scene} />
      </Suspense>
      <div className="pointer-events-none absolute bottom-5 left-5 flex items-center gap-2 rounded-full border border-white/30 bg-white/80 px-4 py-2 text-xs font-bold text-slate-800 shadow-lg backdrop-blur-xl">
        <MapPin className="h-3.5 w-3.5 text-emerald-700" /> Interactive Gilgit rental scene
      </div>
    </div>
  )
}

export default SplineHero
