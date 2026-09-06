import { CheckCircle2, MapPin, Snowflake } from 'lucide-react'
import { motion } from 'motion/react'
import { Link } from 'react-router-dom'
import ScoreRing from './ScoreRing'

const breakdownLabels = {
  rent: 'Budget fit',
  propertyType: 'Property type',
  area: 'Preferred area',
  furnishing: 'Furnishing',
  bedrooms: 'Bedrooms',
  amenities: 'Amenities',
  winterReadiness: 'Winter readiness',
}

function MatchCard({ match, index = 0 }) {
  const property = match?.property
  const cover = property?.images?.find((image) => image.isCover) || property?.images?.[0]
  const reasons = Object.entries(match?.matchBreakdown || {}).filter(([, value]) => Number(value) > 0)

  return (
    <motion.article
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ y: -6 }}
      className="overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,.06)]"
    >
      <div className="grid lg:grid-cols-[260px_1fr]">
        <div className="relative min-h-[240px] bg-slate-100">
          {cover?.url ? <img src={cover.url} alt={property.title} className="absolute inset-0 h-full w-full object-cover" /> : <div className="grid h-full min-h-[240px] place-items-center bg-[#dce9e2] text-sm font-black text-slate-500">No photo yet</div>}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
          <div className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1.5 text-[11px] font-black text-slate-800 backdrop-blur-xl">#{index + 1} match</div>
        </div>

        <div className="grid gap-6 p-5 sm:p-6 xl:grid-cols-[1fr_auto] xl:items-center">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-[#eaf5f0] px-3 py-1 text-[10px] font-black uppercase tracking-[0.1em] text-[#245545]">{match.matchLabel}</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.1em] text-sky-700"><Snowflake className="h-3 w-3" /> Living {match.gilgitLivingScore}</span>
            </div>

            <h3 className="mt-4 text-2xl font-black tracking-[-0.04em] text-slate-950">{property.title}</h3>
            <p className="mt-2 flex items-center gap-2 text-sm text-slate-500"><MapPin className="h-4 w-4" /> {property.address?.area}, {property.address?.city}</p>
            <p className="mt-3 text-xl font-black text-slate-900">PKR {new Intl.NumberFormat('en-PK').format(property.monthlyRent || 0)} <span className="text-xs font-semibold text-slate-400">/ month</span></p>

            <div className="mt-5 flex flex-wrap gap-2">
              {reasons.slice(0, 5).map(([key]) => (
                <span key={key} className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-600"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-700" /> {breakdownLabels[key] || key}</span>
              ))}
            </div>

            <Link to={`/properties/${property._id}`} className="mt-6 inline-flex rounded-full bg-[#102f26] px-5 py-2.5 text-sm font-black text-white transition hover:-translate-y-0.5">View matched home</Link>
          </div>

          <div className="flex justify-center xl:block">
            <ScoreRing score={match.matchScore} label={match.matchLabel} size={148} compact />
          </div>
        </div>
      </div>
    </motion.article>
  )
}

export default MatchCard
