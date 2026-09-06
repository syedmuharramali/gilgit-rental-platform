import { ArrowRight, BadgeCheck, Building2, Flame, MapPin, Search, ShieldCheck, Sparkles, Star, Waves, Zap } from 'lucide-react'
import { motion } from 'motion/react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import PropertyCard from '../components/properties/PropertyCard'
import SplineHero from '../components/three-d/SplineHero'
import { useGetPropertiesQuery } from '../features/properties/propertiesApi'

const areas = ['Jutial', 'Konodas', 'Danyor', 'Baseen', 'Kashrote']
const propertyTypes = [
  ['private_room', 'Private rooms', 'Flexible, simple and affordable'],
  ['apartment', 'Apartments', 'More privacy for longer stays'],
  ['hostel', 'Hostels', 'Popular with students and newcomers'],
  ['house', 'Houses', 'Space for families and groups'],
]

const benefits = [
  { icon: ShieldCheck, title: 'Verified owners', text: 'Owner identity is reviewed before publishing rental listings.' },
  { icon: Sparkles, title: 'Living Score', text: 'Compare heating, hot water, road access and winter readiness.' },
  { icon: BadgeCheck, title: 'One rental journey', text: 'Applications, viewings, agreements and tenancy records stay connected.' },
]

function HomePage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const { data, isLoading } = useGetPropertiesQuery({ limit: 6, sort: 'newest' })
  const properties = data?.properties || []

  const onSearch = (event) => {
    event.preventDefault()
    const value = search.trim()
    navigate(value ? `/properties?search=${encodeURIComponent(value)}` : '/properties')
  }

  return (
    <main>
      <section className="overflow-hidden bg-[#f6f8f7] px-5 pb-10 pt-8 sm:px-8 lg:px-10 lg:pb-16 lg:pt-12">
        <div className="mx-auto grid max-w-[1440px] items-center gap-10 lg:grid-cols-[.92fr_1.08fr] xl:gap-16">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.65 }} className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-800/10 bg-emerald-900/[0.06] px-3.5 py-2 text-xs font-extrabold text-emerald-900">
              <MapPin className="h-3.5 w-3.5" /> Built around renting in Gilgit
            </span>
            <h1 className="mt-6 text-[clamp(3rem,7vw,6.6rem)] font-black leading-[.88] tracking-[-0.07em] text-[#102f26]">
              Find a place that feels right.
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-slate-600 sm:text-lg">
              Discover verified rentals, understand local living conditions, and move from search to tenancy without losing track of what comes next.
            </p>

            <form onSubmit={onSearch} className="mt-8 flex max-w-2xl items-center gap-2 rounded-[24px] border border-slate-200 bg-white p-2 shadow-[0_24px_65px_rgba(15,23,42,.10)]">
              <div className="flex min-w-0 flex-1 items-center gap-3 px-3">
                <Search className="h-5 w-5 shrink-0 text-emerald-800" />
                <input value={search} onChange={(event) => setSearch(event.target.value)} className="h-12 min-w-0 flex-1 bg-transparent text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-400" placeholder="Search Jutial, Konodas, apartment, hostel..." />
              </div>
              <button type="submit" className="h-12 shrink-0 rounded-[18px] bg-[#102f26] px-5 text-sm font-extrabold text-white shadow-lg transition hover:-translate-y-0.5 sm:px-7">Search</button>
            </form>

            <div className="mt-5 flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Popular</span>
              {areas.map((area) => (
                <button key={area} onClick={() => navigate(`/properties?area=${encodeURIComponent(area)}`)} className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-950">{area}</button>
              ))}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.96, rotateY: -3 }} animate={{ opacity: 1, scale: 1, rotateY: 0 }} transition={{ duration: 0.8, delay: 0.08 }} className="h-[460px] min-h-[420px] lg:h-[650px]">
            <SplineHero />
          </motion.div>
        </div>
      </section>

      <section className="bg-white px-5 py-8 sm:px-8 lg:px-10">
        <div className="mx-auto grid max-w-[1440px] gap-3 sm:grid-cols-3">
          {benefits.map(({ icon: Icon, title, text }, index) => (
            <motion.article key={title} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.08 }} className="rounded-[24px] border border-slate-200/80 bg-[#fbfcfb] p-5">
              <div className="grid h-10 w-10 place-items-center rounded-2xl bg-[#e9f3ee] text-[#245545]"><Icon className="h-4.5 w-4.5" /></div>
              <h2 className="mt-4 font-black tracking-[-0.02em] text-slate-950">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">{text}</p>
            </motion.article>
          ))}
        </div>
      </section>

      <section className="bg-white px-5 py-14 sm:px-8 lg:px-10 lg:py-20">
        <div className="mx-auto max-w-[1440px]">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">Fresh listings</p>
              <h2 className="mt-2 text-3xl font-black tracking-[-0.05em] text-slate-950 sm:text-4xl">Homes worth opening first.</h2>
            </div>
            <Link to="/properties" className="inline-flex items-center gap-2 text-sm font-extrabold text-[#245545]">Explore all rentals <ArrowRight className="h-4 w-4" /></Link>
          </div>

          <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {isLoading
              ? Array.from({ length: 6 }).map((_, index) => <div key={index} className="aspect-[4/4.3] animate-pulse rounded-[28px] bg-slate-100" />)
              : properties.map((property) => <PropertyCard key={property._id} property={property} />)}
          </div>

          {!isLoading && properties.length === 0 && (
            <div className="mt-8 rounded-[30px] border border-dashed border-slate-300 bg-slate-50 px-6 py-14 text-center">
              <Building2 className="mx-auto h-8 w-8 text-slate-300" />
              <p className="mt-4 font-black text-slate-800">No published rentals yet</p>
              <p className="mt-2 text-sm text-slate-500">Once approved listings are published, they will appear here automatically.</p>
            </div>
          )}
        </div>
      </section>

      <section className="bg-[#f6f8f7] px-5 py-14 sm:px-8 lg:px-10 lg:py-20">
        <div className="mx-auto max-w-[1440px]">
          <div className="grid gap-8 lg:grid-cols-[.8fr_1.2fr] lg:items-end">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">Choose your format</p>
              <h2 className="mt-2 text-4xl font-black tracking-[-0.05em] text-slate-950">Not every rental needs the same shape.</h2>
            </div>
            <p className="max-w-2xl text-sm leading-7 text-slate-500 lg:justify-self-end">Quickly narrow the market to the kind of place you actually need, then refine by price, furnishing, amenities and local living conditions.</p>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {propertyTypes.map(([type, title, text], index) => (
              <motion.button key={type} whileHover={{ y: -6, rotateX: 2 }} onClick={() => navigate(`/properties?propertyType=${type}`)} className="group min-h-52 rounded-[28px] border border-slate-200 bg-white p-6 text-left shadow-[0_18px_45px_rgba(15,23,42,.05)]">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#102f26] text-white shadow-lg"><Building2 className="h-5 w-5" /></span>
                <p className="mt-8 text-xl font-black tracking-[-0.04em] text-slate-950">{title}</p>
                <p className="mt-2 text-sm leading-6 text-slate-500">{text}</p>
                <span className="mt-5 inline-flex items-center gap-1 text-xs font-extrabold text-emerald-700">Browse <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-1" /></span>
              </motion.button>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#102f26] px-5 py-16 text-white sm:px-8 lg:px-10 lg:py-24">
        <div className="mx-auto grid max-w-[1440px] gap-10 lg:grid-cols-[1.05fr_.95fr] lg:items-center">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-2 text-xs font-bold text-emerald-100"><Sparkles className="h-3.5 w-3.5" /> Gilgit Living Score</span>
            <h2 className="mt-5 text-4xl font-black tracking-[-0.055em] sm:text-5xl">A beautiful room is not enough in winter.</h2>
            <p className="mt-5 max-w-xl text-base leading-7 text-white/60">See the practical details that matter locally: heating, hot water, backup electricity, road access, water availability and winter accessibility.</p>
            <Link to="/living-score" className="mt-7 inline-flex items-center gap-2 rounded-full bg-emerald-300 px-5 py-3 text-sm font-black text-[#102f26]">Understand the score <ArrowRight className="h-4 w-4" /></Link>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {[
              [Flame, 'Heating', 'Winter comfort'],
              [Waves, 'Hot water', 'Daily reliability'],
              [Zap, 'Power backup', 'Outage readiness'],
              [MapPin, 'Road access', 'Year-round reach'],
            ].map(([Icon, title, text], index) => (
              <motion.div key={title} initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.07 }} className="rounded-[28px] border border-white/10 bg-white/[0.06] p-6 backdrop-blur-xl">
                <Icon className="h-5 w-5 text-emerald-300" />
                <p className="mt-8 font-black">{title}</p>
                <p className="mt-1 text-sm text-white/45">{text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#f6f8f7] px-5 py-16 sm:px-8 lg:px-10 lg:py-24">
        <div className="mx-auto max-w-[1440px] rounded-[36px] bg-[#e8f2ed] p-7 sm:p-10 lg:p-14">
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <div className="flex items-center gap-1 text-amber-500">{Array.from({ length: 5 }).map((_, index) => <Star key={index} className="h-4 w-4 fill-current" />)}</div>
              <h2 className="mt-4 max-w-3xl text-3xl font-black tracking-[-0.05em] text-[#102f26] sm:text-4xl">From “I found a room” to “I know what happens next.”</h2>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600">Save listings, apply, schedule viewings, manage tenancy records and keep important rental actions in one account.</p>
            </div>
            <Link to="/register" className="inline-flex items-center justify-center gap-2 rounded-full bg-[#102f26] px-6 py-4 text-sm font-black text-white shadow-xl">Start your rental journey <ArrowRight className="h-4 w-4" /></Link>
          </div>
        </div>
      </section>
    </main>
  )
}

export default HomePage
