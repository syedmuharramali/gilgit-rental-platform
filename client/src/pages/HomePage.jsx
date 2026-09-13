import {
  ArrowRight,
  BadgeCheck,
  Building2,
  CalendarDays,
  Flame,
  Heart,
  MapPin,
  MessageCircle,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Waves,
  Zap,
} from 'lucide-react'
import { motion } from 'motion/react'
import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import PropertyCard from '../components/properties/PropertyCard'
import SplineHero from '../components/three-d/SplineHero'
import { useGetPropertiesQuery } from '../features/properties/propertiesApi'

const AREAS = ['Jutial', 'Konodas', 'Danyor', 'Baseen', 'Kashrote']
const CATEGORY_IMAGE = {
  apartment: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=84',
  private_room: 'https://images.unsplash.com/photo-1615529182904-14819c35db37?auto=format&fit=crop&w=1200&q=84',
  hostel: 'https://images.unsplash.com/photo-1595576508898-0ad5c879a061?auto=format&fit=crop&w=1200&q=84',
  house: 'https://images.unsplash.com/photo-1600585152915-d208bec867a1?auto=format&fit=crop&w=1200&q=84',
}

const categories = [
  ['apartment', 'Apartments', 'Private, polished spaces for longer stays'],
  ['private_room', 'Private rooms', 'Flexible rentals with your own space'],
  ['hostel', 'Hostels', 'Practical stays for students and newcomers'],
  ['house', 'Houses', 'Extra space for families and groups'],
]

const journey = [
  { icon: Search, step: '01', title: 'Discover', text: 'Search by area, budget, amenities and practical living conditions.' },
  { icon: CalendarDays, step: '02', title: 'Visit', text: 'Request a viewing and keep every appointment in one place.' },
  { icon: BadgeCheck, step: '03', title: 'Apply', text: 'Send your rental application and follow its status clearly.' },
  { icon: MessageCircle, step: '04', title: 'Agree', text: 'Confirm the final rental agreement clearly with the owner.' },
]

function HomePage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const { data, isLoading, error, refetch } = useGetPropertiesQuery({ limit: 6, sort: 'newest' })
  const properties = data?.properties || []
  const propertyCount = error ? '—' : data?.total ?? properties.length

  const stats = useMemo(() => [
    [propertyCount, 'live rentals'],
    ['100%', 'verified-owner listings'],
    ['6', 'Living Score signals'],
  ], [propertyCount])

  const onSearch = (event) => {
    event.preventDefault()
    const value = search.trim()
    navigate(value ? `/properties?search=${encodeURIComponent(value)}` : '/properties')
  }

  return (
    <main className="overflow-hidden bg-[#060914] text-white">
      <section className="relative isolate min-h-[calc(100vh-74px)] overflow-hidden px-5 pb-14 pt-10 sm:px-8 lg:px-10 lg:pb-20 lg:pt-16">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_14%_18%,rgba(56,189,248,.13),transparent_26%),radial-gradient(circle_at_86%_12%,rgba(139,92,246,.16),transparent_30%),radial-gradient(circle_at_55%_92%,rgba(34,211,238,.08),transparent_30%)]" />
        <div className="pointer-events-none absolute inset-0 -z-10 opacity-30 [background-image:linear-gradient(rgba(255,255,255,.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.035)_1px,transparent_1px)] [background-size:46px_46px] [mask-image:linear-gradient(to_bottom,black,transparent_82%)]" />

        <div className="mx-auto grid max-w-[1500px] items-center gap-10 lg:grid-cols-[.9fr_1.1fr] xl:gap-16">
          <motion.div initial={{ opacity: 0, y: 26 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="relative z-10 max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3.5 py-2 text-[11px] font-black uppercase tracking-[.18em] text-cyan-200 backdrop-blur-xl"><Sparkles className="h-3.5 w-3.5" /> Rental discovery, redesigned for Gilgit</div>
            <h1 className="mt-7 text-[clamp(3.6rem,7.5vw,7.6rem)] font-black leading-[.84] tracking-[-0.075em] text-white">Find a home.<br /><span className="bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-400 bg-clip-text text-transparent">Know what matters.</span></h1>
            <p className="mt-7 max-w-2xl text-base leading-7 text-white/58 sm:text-lg sm:leading-8">Search verified rentals, compare winter readiness and local living conditions, then move from viewing to a clear rental agreement without jumping between disconnected tools.</p>

            <form onSubmit={onSearch} className="mt-8 max-w-3xl rounded-[28px] border border-white/10 bg-white/[0.075] p-2 shadow-[0_30px_90px_rgba(0,0,0,.28)] backdrop-blur-2xl sm:flex sm:items-center">
              <div className="flex min-w-0 flex-1 items-center gap-3 px-4"><Search className="h-5 w-5 shrink-0 text-cyan-300" /><input value={search} onChange={(event) => setSearch(event.target.value)} aria-label="Search rentals" className="h-14 min-w-0 flex-1 bg-transparent text-sm font-semibold text-white outline-none placeholder:text-white/30" placeholder="Search Jutial, Konodas, apartment, hostel..." /></div>
              <button type="submit" className="mt-2 flex h-13 w-full items-center justify-center gap-2 rounded-[20px] bg-white px-6 text-sm font-black text-[#07101e] shadow-xl transition hover:-translate-y-0.5 sm:mt-0 sm:w-auto">Explore rentals <ArrowRight className="h-4 w-4" /></button>
            </form>

            <div className="mt-5 flex flex-wrap items-center gap-2"><span className="mr-1 text-[10px] font-black uppercase tracking-[.16em] text-white/28">Popular areas</span>{AREAS.map((area) => <button type="button" key={area} onClick={() => navigate(`/properties?area=${encodeURIComponent(area)}`)} className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-white/60 transition hover:border-cyan-300/30 hover:bg-cyan-300/10 hover:text-cyan-100">{area}</button>)}</div>
            <div className="mt-9 grid max-w-2xl grid-cols-3 gap-3">{stats.map(([value, label]) => <div key={label} className="rounded-[22px] border border-white/8 bg-white/[0.04] px-4 py-4 backdrop-blur-xl"><p className="text-xl font-black tracking-[-.04em] text-white sm:text-2xl">{value}</p><p className="mt-1 text-[10px] font-bold uppercase tracking-[.12em] text-white/32">{label}</p></div>)}</div>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.95, rotateY: -4 }} animate={{ opacity: 1, scale: 1, rotateY: 0 }} transition={{ duration: 0.9, delay: 0.08 }} className="relative h-[500px] min-h-[460px] lg:h-[680px]"><div className="absolute -inset-10 -z-10 rounded-full bg-blue-500/10 blur-3xl" /><SplineHero /></motion.div>
        </div>
      </section>

      <section className="border-y border-white/8 bg-white/[0.025] px-5 py-6 sm:px-8 lg:px-10"><div className="mx-auto grid max-w-[1500px] gap-3 md:grid-cols-3">{[[ShieldCheck, 'Verified-owner ecosystem', 'Only approved owners can publish listings.'],[Sparkles, 'Living Score', 'Understand heating, water, roads and winter access.'],[Heart, 'One connected journey', 'Save, apply, view, message and manage tenancy.']].map(([Icon, title, text]) => <motion.div key={title} whileHover={{ y: -3 }} className="flex items-center gap-4 rounded-[22px] border border-white/8 bg-white/[0.035] p-4"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-cyan-300/20 to-violet-400/20 text-cyan-200"><Icon className="h-5 w-5" /></span><div><p className="text-sm font-black">{title}</p><p className="mt-1 text-xs leading-5 text-white/38">{text}</p></div></motion.div>)}</div></section>

      <section className="bg-[#090d18] px-5 py-16 sm:px-8 lg:px-10 lg:py-24">
        <div className="mx-auto max-w-[1500px]">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-[11px] font-black uppercase tracking-[.2em] text-cyan-300">Fresh listings</p><h2 className="mt-3 text-4xl font-black tracking-[-.055em] sm:text-5xl">Homes worth opening first.</h2></div><Link to="/properties" className="inline-flex items-center gap-2 text-sm font-black text-cyan-200">Explore all rentals <ArrowRight className="h-4 w-4" /></Link></div>

          {isLoading ? <div className="mt-9 grid gap-5 md:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 6 }).map((_, index) => <div key={index} className="aspect-[4/4.3] animate-pulse rounded-[30px] bg-white/[0.05]" />)}</div> : null}
          {!isLoading && !error && properties.length > 0 ? <div className="mt-9 grid gap-5 md:grid-cols-2 xl:grid-cols-3">{properties.map((property) => <PropertyCard key={property._id} property={property} />)}</div> : null}
          {!isLoading && error ? <div className="mt-8 rounded-[32px] border border-amber-300/15 bg-amber-300/[0.05] px-6 py-12 text-center"><RefreshCw className="mx-auto h-7 w-7 text-amber-200" /><p className="mt-4 font-black">Fresh listings could not be loaded</p><p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-white/38">The marketplace request failed, so this is not being shown as an empty listing state.</p><button type="button" onClick={refetch} className="mt-5 rounded-full bg-white px-5 py-2.5 text-xs font-black text-[#07101e]">Try again</button></div> : null}
          {!isLoading && !error && properties.length === 0 ? <div className="mt-8 rounded-[32px] border border-dashed border-white/12 bg-white/[0.03] px-6 py-14 text-center"><Building2 className="mx-auto h-8 w-8 text-white/20" /><p className="mt-4 font-black">No published rentals right now</p><p className="mt-2 text-sm text-white/38">Approved, available listings will appear here automatically.</p></div> : null}
        </div>
      </section>

      <section className="bg-[#070b14] px-5 py-16 sm:px-8 lg:px-10 lg:py-24"><div className="mx-auto max-w-[1500px]"><div className="grid gap-7 lg:grid-cols-[.8fr_1.2fr] lg:items-end"><div><p className="text-[11px] font-black uppercase tracking-[.2em] text-violet-300">Choose your format</p><h2 className="mt-3 text-4xl font-black tracking-[-.055em] sm:text-5xl">The right rental starts with the right shape.</h2></div><p className="max-w-2xl text-sm leading-7 text-white/40 lg:justify-self-end">Browse by property type first, then refine by rent, furnishing, amenities and Gilgit-specific living conditions.</p></div><div className="mt-9 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{categories.map(([type, title, text], index) => <motion.button type="button" key={type} whileHover={{ y: -8 }} onClick={() => navigate(`/properties?propertyType=${type}`)} className="group relative min-h-[330px] overflow-hidden rounded-[30px] border border-white/10 text-left shadow-[0_28px_70px_rgba(0,0,0,.2)]"><img src={CATEGORY_IMAGE[type]} alt="" loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105" /><div className="absolute inset-0 bg-gradient-to-t from-[#060914] via-[#060914]/45 to-transparent" /><div className="absolute inset-x-0 bottom-0 p-6"><span className="mb-6 grid h-11 w-11 place-items-center rounded-2xl border border-white/15 bg-white/10 text-white backdrop-blur-xl"><Building2 className="h-5 w-5" /></span><p className="text-xl font-black">{title}</p><p className="mt-2 text-sm leading-6 text-white/50">{text}</p><span className="mt-5 inline-flex items-center gap-2 text-xs font-black text-cyan-200">Browse homes <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-1" /></span></div><span className="absolute right-5 top-5 rounded-full border border-white/12 bg-black/25 px-3 py-1.5 text-[10px] font-black text-white/60 backdrop-blur-xl">0{index + 1}</span></motion.button>)}</div></div></section>

      <section className="relative overflow-hidden bg-[#0b1020] px-5 py-16 sm:px-8 lg:px-10 lg:py-24"><div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_30%,rgba(56,189,248,.12),transparent_28%),radial-gradient(circle_at_82%_65%,rgba(139,92,246,.16),transparent_28%)]" /><div className="relative mx-auto grid max-w-[1500px] gap-9 lg:grid-cols-[1fr_1fr] lg:items-center"><div><span className="inline-flex items-center gap-2 rounded-full border border-cyan-300/15 bg-cyan-300/8 px-3 py-2 text-[10px] font-black uppercase tracking-[.16em] text-cyan-200"><Sparkles className="h-3.5 w-3.5" /> Gilgit Living Score</span><h2 className="mt-5 max-w-3xl text-4xl font-black tracking-[-.055em] sm:text-5xl">A beautiful room is only half the story.</h2><p className="mt-5 max-w-xl text-sm leading-7 text-white/45">Compare the local details that affect everyday comfort before you commit to a property.</p><Link to="/living-score" className="mt-7 inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-black text-[#07101e] shadow-xl">Understand the score <ArrowRight className="h-4 w-4" /></Link></div><div className="grid gap-3 sm:grid-cols-2">{[[Flame,'Heating','Winter comfort'],[Waves,'Water','Daily reliability'],[Zap,'Power backup','Outage readiness'],[MapPin,'Road access','Year-round reach']].map(([Icon,title,text],index) => <motion.div key={title} initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * .08 }} className="rounded-[28px] border border-white/9 bg-white/[0.045] p-6 backdrop-blur-xl"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-cyan-300/18 to-violet-400/18 text-cyan-200"><Icon className="h-5 w-5" /></span><p className="mt-8 font-black">{title}</p><p className="mt-1 text-sm text-white/36">{text}</p></motion.div>)}</div></div></section>

      <section className="bg-[#060914] px-5 py-16 sm:px-8 lg:px-10 lg:py-24"><div className="mx-auto max-w-[1500px]"><div className="text-center"><p className="text-[11px] font-black uppercase tracking-[.2em] text-blue-300">One connected journey</p><h2 className="mx-auto mt-3 max-w-3xl text-4xl font-black tracking-[-.055em] sm:text-5xl">From discovery to move-in without losing context.</h2></div><div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">{journey.map(({ icon: Icon, step: stepLabel, title, text }, index) => <motion.article key={title} initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * .07 }} className="rounded-[28px] border border-white/8 bg-white/[0.035] p-6"><div className="flex items-center justify-between"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-white/8 text-cyan-200"><Icon className="h-5 w-5" /></span><span className="text-xs font-black text-white/18">{stepLabel}</span></div><h3 className="mt-8 text-xl font-black">{title}</h3><p className="mt-2 text-sm leading-6 text-white/38">{text}</p></motion.article>)}</div></div></section>

      <section className="bg-[#090d18] px-5 pb-20 sm:px-8 lg:px-10 lg:pb-28"><div className="mx-auto max-w-[1500px] overflow-hidden rounded-[38px] border border-white/10 bg-[linear-gradient(135deg,rgba(34,211,238,.16),rgba(59,130,246,.12)_45%,rgba(139,92,246,.16))] p-7 shadow-[0_35px_100px_rgba(0,0,0,.25)] sm:p-10 lg:p-14"><div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center"><div><div className="flex items-center gap-1 text-amber-300">{Array.from({ length: 5 }).map((_, index) => <Star key={index} className="h-4 w-4 fill-current" />)}</div><h2 className="mt-4 max-w-3xl text-3xl font-black tracking-[-.05em] sm:text-5xl">Ready to find a rental that fits real life?</h2><p className="mt-4 max-w-2xl text-sm leading-7 text-white/48">Create an account to save homes, build your preferences, request viewings and keep every rental step together.</p></div><div className="flex flex-col gap-3 sm:flex-row lg:flex-col"><Link to="/register" className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-4 text-sm font-black text-[#07101e] shadow-xl">Create free account <ArrowRight className="h-4 w-4" /></Link><Link to="/properties" className="inline-flex items-center justify-center rounded-full border border-white/12 bg-white/[0.05] px-6 py-4 text-sm font-black text-white">Browse rentals</Link></div></div></div></section>
    </main>
  )
}

export default HomePage
