import { CheckCircle2, MapPin, Snowflake } from 'lucide-react'
import { motion } from 'motion/react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { money } from '../../utils/formatters'
import ScoreRing from './ScoreRing'

function MatchCard({ match, index = 0 }) {
  const { t } = useTranslation()
  const property = match?.property
  const cover = property?.images?.find((image) => image.isCover) || property?.images?.[0]
  const reasons = Object.entries(match?.matchBreakdown || {}).filter(([, value]) => Number(value) > 0)

  return (
    <motion.article
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ y: -6 }}
      className="overflow-hidden rounded-[30px] border border-white/9 bg-[#0c1220] shadow-[0_24px_70px_rgba(0,0,0,.24)]"
    >
      <div className="grid lg:grid-cols-[260px_1fr]">
        <div className="relative min-h-[240px] bg-[#111827]">
          {cover?.url ? (
            <img src={cover.url} alt={cover.alt || property.title} loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover" />
          ) : (
            <div className="grid h-full min-h-[240px] place-items-center bg-[radial-gradient(circle_at_30%_20%,rgba(56,189,248,.14),transparent_36%),#111827] text-sm font-black text-white/40">{t('match.noPhoto')}</div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#050815]/70 via-transparent to-[#050815]/10" />
          <div className="absolute left-4 top-4 rounded-full border border-white/15 bg-[#070b14]/72 px-3 py-1.5 text-[11px] font-black text-white backdrop-blur-xl">{t('match.rank', { rank: index + 1 })}</div>
        </div>

        <div className="grid gap-6 p-5 sm:p-6 xl:grid-cols-[1fr_auto] xl:items-center">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-cyan-300/15 bg-cyan-300/8 px-3 py-1 text-[10px] font-black uppercase tracking-[0.1em] text-cyan-200">{t(`score.${match.matchLabel}`, { defaultValue: match.matchLabel })}</span>
              <span className="inline-flex items-center gap-1 rounded-full border border-violet-300/15 bg-violet-300/8 px-3 py-1 text-[10px] font-black uppercase tracking-[0.1em] text-violet-200"><Snowflake className="h-3 w-3" /> {t('match.living', { score: match.gilgitLivingScore })}</span>
            </div>

            <h3 className="mt-4 text-2xl font-black tracking-[-0.04em] text-white">{property.title}</h3>
            <p className="mt-2 flex items-center gap-2 text-sm text-white/42"><MapPin className="h-4 w-4 shrink-0 text-cyan-300" /> <span className="truncate">{[property.address?.area, property.address?.city].filter(Boolean).join(', ')}</span></p>
            <p className="mt-3 text-xl font-black text-white">{money(property.monthlyRent)} <span className="text-xs font-semibold text-white/35">{t('card.perMonth')}</span></p>

            <div className="mt-5 flex flex-wrap gap-2">
              {reasons.slice(0, 5).map(([key]) => (
                <span key={key} className="inline-flex items-center gap-1.5 rounded-full border border-white/8 bg-white/[0.035] px-3 py-1.5 text-xs font-bold text-white/48"><CheckCircle2 className="h-3.5 w-3.5 text-cyan-300" /> {t(`match.reason.${key}`, { defaultValue: key })}</span>
              ))}
            </div>

            <Link to={`/properties/${property._id}`} className="mt-6 inline-flex rounded-full bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-500 px-5 py-2.5 text-sm font-black text-[#07101e] transition hover:-translate-y-0.5">{t('match.viewHome')}</Link>
          </div>

          <div className="flex justify-center xl:block">
            <ScoreRing score={match.matchScore} label={match.matchLabel} size={148} compact light />
          </div>
        </div>
      </div>
    </motion.article>
  )
}

export default MatchCard
