import { ArrowRight, Droplets, Flame, PlugZap, Route, Snowflake, Sparkles } from 'lucide-react'
import { motion } from 'motion/react'
import { Link } from 'react-router-dom'

const factors = [
  [Flame, 'Heating', '20 pts', 'Whether the property provides heating for Gilgit winters.'],
  [Droplets, 'Hot water', '20 pts', 'Reliable access to hot water during colder months.'],
  [PlugZap, 'Power backup', '15 pts', 'Backup electricity support when the grid is unavailable.'],
  [Droplets, 'Water reliability', '15 pts', 'How dependable daily water availability is.'],
  [Route, 'Road access', '15 pts', 'Ease of reaching the property and nearby routes.'],
  [Snowflake, 'Winter access', '15 pts', 'Whether the property remains reasonably accessible in winter.'],
]

function LivingScorePage() {
  return (
    <main className="bg-[#f6f8f7]">
      <section className="px-5 py-10 sm:px-8 lg:px-10 lg:py-16">
        <div className="mx-auto max-w-[1440px] overflow-hidden rounded-[38px] bg-[#102f26] p-8 text-white shadow-[0_30px_90px_rgba(16,47,38,.18)] sm:p-12 lg:p-16">
          <div className="grid gap-10 lg:grid-cols-[1fr_.7fr] lg:items-center">
            <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-2 text-xs font-black text-emerald-100"><Sparkles className="h-4 w-4" /> Gilgit Living Score</span>
              <h1 className="mt-6 max-w-4xl text-5xl font-black tracking-[-0.06em] sm:text-7xl">A rental score built for how Gilgit actually feels to live in.</h1>
              <p className="mt-6 max-w-2xl text-base leading-8 text-white/60">Instead of judging a home only by rent and photos, the score surfaces winter readiness, utilities and access conditions that matter locally.</p>
              <Link to="/properties" className="mt-8 inline-flex items-center gap-2 rounded-full bg-emerald-300 px-5 py-3 text-sm font-black text-[#102f26]">Browse scored rentals <ArrowRight className="h-4 w-4" /></Link>
            </motion.div>

            <div className="relative mx-auto aspect-square w-full max-w-[420px] [perspective:1000px]">
              <motion.div animate={{ rotateY: [0, 5, 0, -5, 0], rotateX: [0, -3, 0, 3, 0] }} transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }} className="absolute inset-8 rounded-full border border-white/10 bg-[radial-gradient(circle_at_35%_30%,rgba(167,243,208,.28),rgba(255,255,255,.04)_40%,rgba(0,0,0,.08))] shadow-[0_40px_90px_rgba(0,0,0,.28)] backdrop-blur-xl">
                <div className="absolute inset-8 rounded-full border border-white/10" />
                <div className="absolute inset-0 grid place-items-center text-center"><div><p className="text-7xl font-black tracking-[-0.07em]">100</p><p className="mt-2 text-xs font-black uppercase tracking-[0.2em] text-emerald-200/70">Local living context</p></div></div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-5 pb-20 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-[1200px]">
          <div className="max-w-2xl"><p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-700">Transparent scoring</p><h2 className="mt-3 text-4xl font-black tracking-[-0.05em] text-slate-950">See exactly where the score comes from.</h2><p className="mt-4 leading-7 text-slate-500">The score is rule-based, not a black-box AI model. Every point maps to a specific property condition.</p></div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {factors.map(([Icon, title, points, text], index) => (
              <motion.article key={title} initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * .04 }} className="rounded-[26px] border border-slate-200 bg-white p-6 shadow-[0_14px_40px_rgba(15,23,42,.05)]">
                <div className="flex items-center justify-between"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-50 text-emerald-700"><Icon className="h-5 w-5" /></span><span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-black text-slate-500">{points}</span></div>
                <h3 className="mt-5 text-xl font-black tracking-[-0.03em] text-slate-950">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">{text}</p>
              </motion.article>
            ))}
          </div>

          <div className="mt-10 rounded-[30px] border border-slate-200 bg-white p-7 sm:p-9">
            <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
              <div><p className="text-xs font-black uppercase tracking-[0.15em] text-violet-700">Personalized ranking</p><h3 className="mt-2 text-3xl font-black tracking-[-0.045em] text-slate-950">Living Score + your preferences = Smart Matches.</h3><p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500">Signed-in renters can combine this local living context with budget, area, property type, furnishing, bedrooms and amenities.</p></div>
              <Link to="/matches" className="inline-flex items-center justify-center rounded-full bg-[#102f26] px-6 py-3 text-sm font-black text-white">Open Smart Matches</Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

export default LivingScorePage
