import { Bath, BedDouble, CalendarDays, CheckCircle2, ChevronLeft, Heart, MapPin, ShieldCheck, UsersRound } from 'lucide-react'
import { motion } from 'motion/react'
import { Link, useParams } from 'react-router-dom'
import { useGetPropertyQuery } from '../features/properties/propertiesApi'

const money = (value) => new Intl.NumberFormat('en-PK').format(value || 0)

function PropertyDetailsPage() {
  const { id } = useParams()
  const { data: property, isLoading, error } = useGetPropertyQuery(id)

  if (isLoading) {
    return <main className="min-h-[70vh] bg-[#f6f8f7] px-5 py-10"><div className="mx-auto max-w-[1440px] animate-pulse"><div className="h-[55vh] rounded-[34px] bg-slate-200" /><div className="mt-8 h-10 w-1/2 rounded bg-slate-200" /></div></main>
  }

  if (error || !property) {
    return (
      <main className="grid min-h-[70vh] place-items-center bg-[#f6f8f7] px-5 py-16 text-center">
        <div><p className="text-2xl font-black text-slate-950">Property not found</p><p className="mt-2 text-sm text-slate-500">This listing may be unavailable or no longer public.</p><Link to="/properties" className="mt-5 inline-flex rounded-full bg-[#102f26] px-5 py-3 text-sm font-bold text-white">Back to rentals</Link></div>
      </main>
    )
  }

  const images = property.images || []
  const cover = images.find((image) => image.isCover) || images[0]
  const secondary = images.filter((image) => image.id !== cover?.id).slice(0, 4)

  return (
    <main className="bg-[#f6f8f7] pb-20">
      <section className="px-5 py-5 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-[1440px]">
          <Link to="/properties" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-950"><ChevronLeft className="h-4 w-4" /> Back to rentals</Link>
        </div>
      </section>

      <section className="px-5 sm:px-8 lg:px-10">
        <div className="mx-auto grid max-w-[1440px] gap-3 overflow-hidden rounded-[34px] lg:grid-cols-[1.3fr_.7fr] lg:grid-rows-2">
          <div className="min-h-[360px] overflow-hidden bg-slate-200 lg:row-span-2 lg:min-h-[620px]">
            {cover?.url ? <img src={cover.url} alt={cover.alt || property.title} className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center bg-[#d7e6de] font-bold text-slate-600">No property image</div>}
          </div>
          {secondary.slice(0, 2).map((image) => <div key={image.id} className="hidden overflow-hidden bg-slate-200 lg:block"><img src={image.url} alt={image.alt || property.title} className="h-full w-full object-cover" /></div>)}
        </div>
      </section>

      <section className="px-5 pt-9 sm:px-8 lg:px-10">
        <div className="mx-auto grid max-w-[1440px] gap-8 lg:grid-cols-[1fr_380px]">
          <div>
            <div className="flex flex-col gap-4 border-b border-slate-200 pb-7 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-[#e6f2ec] px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.1em] text-[#245545]">{property.propertyType?.replaceAll('_', ' ')}</span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1.5 text-[11px] font-bold text-slate-600 ring-1 ring-slate-200"><ShieldCheck className="h-3.5 w-3.5 text-emerald-700" /> Published</span>
                </div>
                <h1 className="mt-4 text-4xl font-black tracking-[-0.055em] text-slate-950 sm:text-5xl">{property.title}</h1>
                <p className="mt-3 flex items-center gap-2 text-sm text-slate-500"><MapPin className="h-4 w-4" /> {property.address?.area}, {property.address?.city}</p>
              </div>
              <button className="grid h-12 w-12 shrink-0 place-items-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm"><Heart className="h-5 w-5" /></button>
            </div>

            <div className="grid grid-cols-2 gap-3 border-b border-slate-200 py-7 sm:grid-cols-4">
              <div className="rounded-[20px] bg-white p-4 ring-1 ring-slate-200"><BedDouble className="h-4 w-4 text-emerald-700" /><p className="mt-3 text-sm font-black">{property.bedrooms || 0} bedrooms</p></div>
              <div className="rounded-[20px] bg-white p-4 ring-1 ring-slate-200"><Bath className="h-4 w-4 text-emerald-700" /><p className="mt-3 text-sm font-black">{property.bathrooms || 0} bathrooms</p></div>
              <div className="rounded-[20px] bg-white p-4 ring-1 ring-slate-200"><UsersRound className="h-4 w-4 text-emerald-700" /><p className="mt-3 text-sm font-black">Up to {property.maxOccupants || 1}</p></div>
              <div className="rounded-[20px] bg-white p-4 ring-1 ring-slate-200"><CalendarDays className="h-4 w-4 text-emerald-700" /><p className="mt-3 text-sm font-black">{property.minimumStayMonths || 1}+ month stay</p></div>
            </div>

            <div className="py-8">
              <h2 className="text-2xl font-black tracking-[-0.04em] text-slate-950">About this place</h2>
              <p className="mt-4 max-w-3xl whitespace-pre-line text-[15px] leading-8 text-slate-600">{property.description}</p>
            </div>

            <div className="border-t border-slate-200 py-8">
              <h2 className="text-2xl font-black tracking-[-0.04em] text-slate-950">Amenities</h2>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {(property.amenities || []).map((amenity) => <div key={amenity._id} className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-700 ring-1 ring-slate-200"><CheckCircle2 className="h-4 w-4 text-emerald-700" /> {amenity.name}</div>)}
              </div>
            </div>
          </div>

          <aside>
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="sticky top-24 rounded-[30px] border border-slate-200 bg-white p-6 shadow-[0_24px_70px_rgba(15,23,42,.10)]">
              <p className="text-sm text-slate-500">Monthly rent</p>
              <p className="mt-1 text-3xl font-black tracking-[-0.045em] text-slate-950">PKR {money(property.monthlyRent)}</p>
              {property.negotiable && <span className="mt-2 inline-block rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.08em] text-amber-700">Negotiable</span>}

              <div className="mt-6 space-y-3 rounded-[22px] bg-[#f6f8f7] p-4 text-sm">
                <div className="flex justify-between gap-4"><span className="text-slate-500">Security deposit</span><strong>PKR {money(property.securityDeposit)}</strong></div>
                <div className="flex justify-between gap-4"><span className="text-slate-500">Furnishing</span><strong className="capitalize">{property.furnishedStatus?.replace('_', ' ')}</strong></div>
                <div className="flex justify-between gap-4"><span className="text-slate-500">Available</span><strong>{property.availableFrom ? new Date(property.availableFrom).toLocaleDateString() : 'Ask owner'}</strong></div>
              </div>

              <Link to="/login" state={{ from: `/properties/${property._id}` }} className="mt-5 flex h-13 items-center justify-center rounded-[18px] bg-[#102f26] text-sm font-black text-white shadow-lg transition hover:-translate-y-0.5">Sign in to apply</Link>
              <button className="mt-2 flex h-13 w-full items-center justify-center rounded-[18px] border border-slate-200 text-sm font-black text-slate-700">Schedule a viewing</button>

              <div className="mt-6 flex items-center gap-3 border-t border-slate-100 pt-5">
                {property.owner?.avatar?.url ? <img src={property.owner.avatar.url} alt="" className="h-11 w-11 rounded-2xl object-cover" /> : <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#e8f2ed] font-black text-[#245545]">{property.owner?.name?.[0] || 'O'}</div>}
                <div><p className="text-sm font-black text-slate-900">{property.owner?.name || 'Property owner'}</p><p className="text-xs text-slate-400">Verified rental owner</p></div>
              </div>
            </motion.div>
          </aside>
        </div>
      </section>
    </main>
  )
}

export default PropertyDetailsPage
