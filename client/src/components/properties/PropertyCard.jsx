import { Bath, BedDouble, Heart, MapPin, ShieldCheck } from 'lucide-react'
import { motion } from 'motion/react'
import { Link } from 'react-router-dom'

const formatRent = (value) => new Intl.NumberFormat('en-PK').format(value || 0)

function PropertyCard({ property }) {
  const cover = property?.images?.find((image) => image.isCover) || property?.images?.[0]

  return (
    <motion.article
      whileHover={{ y: -8, rotateX: 1.5, rotateY: -1.5 }}
      transition={{ type: 'spring', stiffness: 260, damping: 24 }}
      className="group [perspective:1200px]"
    >
      <Link to={`/properties/${property._id}`} className="block overflow-hidden rounded-[28px] border border-slate-200/80 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.07)] transition-shadow duration-300 group-hover:shadow-[0_28px_70px_rgba(15,23,42,0.12)]">
        <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
          {cover?.url ? (
            <img src={cover.url} alt={cover.alt || property.title} className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.04]" />
          ) : (
            <div className="grid h-full place-items-center bg-[radial-gradient(circle_at_30%_20%,#d9efe5,transparent_34%),linear-gradient(145deg,#cbded5,#9ab8aa)] text-slate-700">
              <div className="rounded-3xl bg-white/50 px-4 py-3 text-sm font-bold backdrop-blur-xl">Property photo coming soon</div>
            </div>
          )}

          <div className="absolute inset-x-0 top-0 flex items-center justify-between p-4">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/30 bg-white/82 px-3 py-1.5 text-[11px] font-bold text-slate-800 shadow-sm backdrop-blur-xl">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-700" /> Verified listing
            </span>
            <span className="grid h-9 w-9 place-items-center rounded-full border border-white/35 bg-white/84 text-slate-700 shadow-sm backdrop-blur-xl">
              <Heart className="h-4 w-4" />
            </span>
          </div>

          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent p-4 pt-14 text-white">
            <p className="text-lg font-black tracking-[-0.03em]">PKR {formatRent(property.monthlyRent)}<span className="text-xs font-semibold text-white/70"> / month</span></p>
          </div>
        </div>

        <div className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h3 className="truncate text-[17px] font-black tracking-[-0.03em] text-slate-950">{property.title}</h3>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500"><MapPin className="h-3.5 w-3.5" /> {property.address?.area}, {property.address?.city}</p>
            </div>
            <span className="shrink-0 rounded-full bg-[#edf5f1] px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.1em] text-[#245545]">
              {property.propertyType?.replaceAll('_', ' ')}
            </span>
          </div>

          <div className="mt-4 flex items-center gap-4 border-t border-slate-100 pt-4 text-xs font-semibold text-slate-500">
            <span className="flex items-center gap-1.5"><BedDouble className="h-4 w-4 text-slate-400" /> {property.bedrooms || 0} beds</span>
            <span className="flex items-center gap-1.5"><Bath className="h-4 w-4 text-slate-400" /> {property.bathrooms || 0} baths</span>
            <span className="ml-auto text-emerald-700">View home →</span>
          </div>
        </div>
      </Link>
    </motion.article>
  )
}

export default PropertyCard
