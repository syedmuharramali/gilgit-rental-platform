import { Bath, BedDouble, MapPin, ShieldCheck } from 'lucide-react'
import { motion } from 'motion/react'
import { Link } from 'react-router-dom'
import FavoriteButton from './FavoriteButton'

const formatRent = (value) => new Intl.NumberFormat('en-PK').format(value || 0)

function PropertyCard({ property }) {
  const cover = property?.images?.find((image) => image.isCover) || property?.images?.[0]

  return (
    <motion.article
      whileHover={{ y: -10, rotateX: 1.5, rotateY: -1.5 }}
      transition={{ type: 'spring', stiffness: 260, damping: 24 }}
      className="group relative [perspective:1200px]"
    >
      <FavoriteButton
        propertyId={property._id}
        className="absolute right-4 top-4 z-20 h-9 w-9 border border-white/15 bg-[#080c18]/70 text-white shadow-sm backdrop-blur-2xl hover:bg-white hover:text-[#07101e]"
      />

      <Link
        to={`/properties/${property._id}`}
        className="block overflow-hidden rounded-[30px] border border-white/9 bg-[#0c1220] shadow-[0_22px_70px_rgba(0,0,0,.22)] transition group-hover:border-cyan-300/20 group-hover:shadow-[0_30px_90px_rgba(0,0,0,.32)]"
        aria-label={`View ${property.title}`}
      >
        <div className="relative aspect-[4/3] overflow-hidden bg-[#111827]">
          {cover?.url ? (
            <img
              src={cover.url}
              alt={cover.alt || property.title}
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.045]"
            />
          ) : (
            <div className="grid h-full place-items-center bg-[radial-gradient(circle_at_30%_20%,rgba(56,189,248,.18),transparent_34%),linear-gradient(145deg,#111827,#0b1220)] text-white/70">
              <div className="rounded-3xl border border-white/10 bg-white/8 px-4 py-3 text-sm font-bold backdrop-blur-xl">
                Property photo coming soon
              </div>
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-[#050815]/82 via-transparent to-[#050815]/15" />
          <div className="absolute left-0 top-0 p-4">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-[#080c18]/68 px-3 py-1.5 text-[10px] font-black uppercase tracking-[.12em] text-white shadow-sm backdrop-blur-2xl">
              <ShieldCheck className="h-3.5 w-3.5 text-cyan-300" /> Verified
            </span>
          </div>

          <div className="absolute inset-x-0 bottom-0 p-5 text-white">
            <p className="text-xl font-black tracking-[-0.035em]">
              PKR {formatRent(property.monthlyRent)}
              <span className="text-xs font-semibold text-white/55"> / month</span>
            </p>
          </div>
        </div>

        <div className="p-5 text-white">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h3 className="truncate text-[17px] font-black tracking-[-0.03em]">{property.title}</h3>
              <p className="mt-1.5 flex items-center gap-1.5 text-sm text-white/42">
                <MapPin className="h-3.5 w-3.5 shrink-0 text-cyan-300" />
                <span className="truncate">{[property.address?.area, property.address?.city].filter(Boolean).join(', ')}</span>
              </p>
            </div>
            <span className="shrink-0 rounded-full border border-white/8 bg-white/[0.05] px-2.5 py-1 text-[9px] font-black uppercase tracking-[.12em] text-cyan-100/70">
              {property.propertyType?.replaceAll('_', ' ')}
            </span>
          </div>

          <div className="mt-4 flex items-center gap-4 border-t border-white/8 pt-4 text-xs font-semibold text-white/42">
            <span className="flex items-center gap-1.5">
              <BedDouble className="h-4 w-4 text-white/28" /> {property.bedrooms || 0} beds
            </span>
            <span className="flex items-center gap-1.5">
              <Bath className="h-4 w-4 text-white/28" /> {property.bathrooms || 0} baths
            </span>
            <span className="ml-auto text-cyan-200">View home →</span>
          </div>
        </div>
      </Link>
    </motion.article>
  )
}

export default PropertyCard
