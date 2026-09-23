import { ArrowRight, Droplets, Flame, PlugZap, Route, Snowflake, Sparkles } from 'lucide-react'
import { motion } from 'motion/react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

const factors = [
  [Flame, 'heating', 20],
  [Droplets, 'hotWater', 20],
  [PlugZap, 'electricityBackup', 15],
  [Droplets, 'waterAvailability', 15],
  [Route, 'roadAccess', 15],
  [Snowflake, 'winterAccessible', 15],
]

function LivingScorePage() {
  const { t } = useTranslation()

  return (
    <main className="relative overflow-hidden bg-[#070b14] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_10%,rgba(56,189,248,.13),transparent_27%),radial-gradient(circle_at_88%_22%,rgba(139,92,246,.11),transparent_30%)]" />
      <section className="relative px-5 py-10 sm:px-8 lg:px-10 lg:py-16">
        <div className="mx-auto max-w-[1440px] overflow-hidden rounded-[38px] border border-white/10 bg-[#0b111f]/92 p-8 shadow-[0_34px_110px_rgba(0,0,0,.35)] backdrop-blur-2xl sm:p-12 lg:p-16">
          <div className="grid gap-10 lg:grid-cols-[1fr_.7fr] lg:items-center">
            <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}>
              <span className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-2 text-xs font-black text-cyan-200"><Sparkles className="h-4 w-4" /> {t('details.livingScore')}</span>
              <h1 className="mt-6 max-w-4xl text-5xl font-black leading-[.96] tracking-[-0.06em] sm:text-7xl">{t('living.title')}</h1>
              <p className="mt-6 max-w-2xl text-base leading-8 text-white/48">{t('living.text')}</p>
              <Link to="/properties" className="mt-8 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-500 px-5 py-3 text-sm font-black text-[#07101e]">{t('living.cta')} <ArrowRight className="h-4 w-4" /></Link>
            </motion.div>

            <div className="relative mx-auto aspect-square w-full max-w-[420px] [perspective:1000px]">
              <motion.div animate={{ rotateY: [0, 5, 0, -5, 0], rotateX: [0, -3, 0, 3, 0] }} transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }} className="absolute inset-8 rounded-full border border-cyan-300/15 bg-[radial-gradient(circle_at_35%_30%,rgba(56,189,248,.28),rgba(59,130,246,.08)_42%,rgba(139,92,246,.08))] shadow-[0_40px_100px_rgba(0,0,0,.36)] backdrop-blur-xl">
                <div className="absolute inset-8 rounded-full border border-white/10" />
                <div className="absolute inset-0 grid place-items-center text-center"><div><p className="text-7xl font-black tracking-[-0.07em]">100</p><p className="mt-2 text-xs font-black uppercase tracking-[0.2em] text-cyan-200/70">{t('living.context')}</p></div></div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative px-5 pb-20 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-[1200px]">
          <div className="max-w-2xl"><p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-300">{t('living.transparent')}</p><h2 className="mt-3 text-4xl font-black tracking-[-0.05em]">{t('living.transparentTitle')}</h2><p className="mt-4 leading-7 text-white/42">{t('living.transparentText')}</p></div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {factors.map(([Icon, factorKey, points], index) => (
              <motion.article key={factorKey} initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * .04 }} whileHover={{ y: -5 }} className="rounded-[26px] border border-white/9 bg-white/[0.035] p-6 shadow-[0_18px_60px_rgba(0,0,0,.2)]">
                <div className="flex items-center justify-between"><span className="grid h-11 w-11 place-items-center rounded-2xl border border-cyan-300/15 bg-cyan-300/8 text-cyan-200"><Icon className="h-5 w-5" /></span><span className="rounded-full border border-white/8 bg-white/[0.045] px-3 py-1 text-[11px] font-black text-white/42">{t('living.points', { count: points })}</span></div>
                <h3 className="mt-5 text-xl font-black tracking-[-0.03em]">{t(`score.${factorKey}`)}</h3>
                <p className="mt-2 text-sm leading-6 text-white/38">{t(`living.factor.${factorKey}`)}</p>
              </motion.article>
            ))}
          </div>

          <div className="mt-10 rounded-[30px] border border-white/9 bg-gradient-to-br from-white/[0.045] to-violet-300/[0.035] p-7 sm:p-9">
            <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
              <div><p className="text-xs font-black uppercase tracking-[0.15em] text-violet-300">{t('living.personalized')}</p><h3 className="mt-2 text-3xl font-black tracking-[-0.045em]">{t('living.personalizedTitle')}</h3><p className="mt-3 max-w-2xl text-sm leading-7 text-white/40">{t('living.personalizedText')}</p></div>
              <Link to="/matches" className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white px-6 py-3 text-sm font-black text-[#07101e]">{t('living.openMatches')}</Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

export default LivingScorePage
