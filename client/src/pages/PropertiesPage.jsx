import { Filter, Map, Search, SlidersHorizontal, X } from 'lucide-react'
import { motion } from 'motion/react'
import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import PropertyCard from '../components/properties/PropertyCard'
import { useGetPropertiesQuery } from '../features/properties/propertiesApi'

const types = [
  ['hostel', 'Hostel'],
  ['hostel_bed', 'Hostel bed'],
  ['shared_room', 'Shared room'],
  ['private_room', 'Private room'],
  ['apartment', 'Apartment'],
  ['house', 'House'],
  ['upper_portion', 'Upper portion'],
  ['lower_portion', 'Lower portion'],
  ['studio', 'Studio'],
]

function PropertiesPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [filtersOpen, setFiltersOpen] = useState(false)

  const params = useMemo(() => {
    const result = {}
    for (const [key, value] of searchParams.entries()) {
      if (value) result[key] = value
    }
    return result
  }, [searchParams])

  const { data, isLoading, isFetching, error } = useGetPropertiesQuery(params)
  const properties = data?.properties || []

  const setParam = (key, value) => {
    const next = new URLSearchParams(searchParams)
    if (value) next.set(key, value)
    else next.delete(key)
    next.delete('page')
    setSearchParams(next)
  }

  const clearFilters = () => setSearchParams({})

  return (
    <main className="min-h-screen bg-[#f6f8f7]">
      <section className="border-b border-slate-200 bg-white px-5 py-8 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-[1440px]">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">Discover rentals</p>
          <div className="mt-2 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-4xl font-black tracking-[-0.055em] text-slate-950 sm:text-5xl">Find your place in Gilgit.</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">Search verified published listings and narrow them by the details that actually matter to your stay.</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setFiltersOpen((value) => !value)} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm lg:hidden"><SlidersHorizontal className="h-4 w-4" /> Filters</button>
              <div className="inline-flex rounded-full border border-slate-200 bg-slate-50 p-1">
                <button className="rounded-full bg-white px-4 py-2 text-xs font-bold text-slate-900 shadow-sm">Grid</button>
                <button className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold text-slate-400" disabled><Map className="h-3.5 w-3.5" /> Map later</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-5 py-6 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-[1440px]">
          <div className="flex items-center gap-2 rounded-[22px] border border-slate-200 bg-white p-2 shadow-[0_12px_30px_rgba(15,23,42,.05)]">
            <Search className="ml-3 h-5 w-5 text-slate-400" />
            <input value={searchParams.get('search') || ''} onChange={(event) => setParam('search', event.target.value)} placeholder="Search area, landmark or property name" className="h-11 min-w-0 flex-1 bg-transparent text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-400" />
            {searchParams.toString() && <button onClick={clearFilters} className="inline-flex h-10 items-center gap-1 rounded-2xl px-3 text-xs font-bold text-slate-500 hover:bg-slate-50"><X className="h-3.5 w-3.5" /> Clear</button>}
          </div>
        </div>
      </section>

      <section className="px-5 pb-16 sm:px-8 lg:px-10">
        <div className="mx-auto grid max-w-[1440px] gap-7 lg:grid-cols-[280px_1fr]">
          <aside className={`${filtersOpen ? 'block' : 'hidden'} lg:block`}>
            <div className="sticky top-24 rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,.05)]">
              <div className="flex items-center justify-between">
                <p className="flex items-center gap-2 font-black text-slate-950"><Filter className="h-4 w-4" /> Filters</p>
                <button onClick={clearFilters} className="text-xs font-bold text-emerald-700">Reset</button>
              </div>

              <div className="mt-6 space-y-6">
                <label className="block">
                  <span className="text-xs font-extrabold uppercase tracking-[0.12em] text-slate-400">Area</span>
                  <input value={searchParams.get('area') || ''} onChange={(event) => setParam('area', event.target.value)} placeholder="e.g. Jutial" className="mt-2 h-11 w-full rounded-2xl border border-slate-200 px-3 text-sm outline-none focus:border-emerald-700/40" />
                </label>

                <label className="block">
                  <span className="text-xs font-extrabold uppercase tracking-[0.12em] text-slate-400">Property type</span>
                  <select value={searchParams.get('propertyType') || ''} onChange={(event) => setParam('propertyType', event.target.value)} className="mt-2 h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-emerald-700/40">
                    <option value="">Any type</option>
                    {types.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                  </select>
                </label>

                <div className="grid grid-cols-2 gap-2">
                  <label>
                    <span className="text-xs font-extrabold uppercase tracking-[0.12em] text-slate-400">Min rent</span>
                    <input type="number" min="0" value={searchParams.get('minRent') || ''} onChange={(event) => setParam('minRent', event.target.value)} className="mt-2 h-11 w-full rounded-2xl border border-slate-200 px-3 text-sm outline-none" />
                  </label>
                  <label>
                    <span className="text-xs font-extrabold uppercase tracking-[0.12em] text-slate-400">Max rent</span>
                    <input type="number" min="0" value={searchParams.get('maxRent') || ''} onChange={(event) => setParam('maxRent', event.target.value)} className="mt-2 h-11 w-full rounded-2xl border border-slate-200 px-3 text-sm outline-none" />
                  </label>
                </div>

                <label className="block">
                  <span className="text-xs font-extrabold uppercase tracking-[0.12em] text-slate-400">Furnished</span>
                  <select value={searchParams.get('furnishedStatus') || ''} onChange={(event) => setParam('furnishedStatus', event.target.value)} className="mt-2 h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm outline-none">
                    <option value="">Any</option>
                    <option value="furnished">Furnished</option>
                    <option value="semi_furnished">Semi furnished</option>
                    <option value="unfurnished">Unfurnished</option>
                  </select>
                </label>

                <label className="block">
                  <span className="text-xs font-extrabold uppercase tracking-[0.12em] text-slate-400">Sort</span>
                  <select value={searchParams.get('sort') || 'newest'} onChange={(event) => setParam('sort', event.target.value)} className="mt-2 h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm outline-none">
                    <option value="newest">Newest</option>
                    <option value="rent_low">Rent: low to high</option>
                    <option value="rent_high">Rent: high to low</option>
                    <option value="oldest">Oldest</option>
                  </select>
                </label>
              </div>
            </div>
          </aside>

          <div>
            <div className="mb-5 flex items-center justify-between gap-4">
              <p className="text-sm text-slate-500"><strong className="text-slate-950">{data?.total ?? 0}</strong> rentals found</p>
              {isFetching && !isLoading && <span className="text-xs font-bold text-emerald-700">Updating…</span>}
            </div>

            {error && <div className="rounded-[24px] border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-semibold text-rose-700">Unable to load properties right now.</div>}

            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {isLoading
                ? Array.from({ length: 6 }).map((_, index) => <div key={index} className="aspect-[4/4.3] animate-pulse rounded-[28px] bg-slate-100" />)
                : properties.map((property) => <PropertyCard key={property._id} property={property} />)}
            </div>

            {!isLoading && !error && properties.length === 0 && (
              <div className="rounded-[30px] border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
                <Search className="mx-auto h-8 w-8 text-slate-300" />
                <p className="mt-4 font-black text-slate-900">No rentals match these filters</p>
                <p className="mt-2 text-sm text-slate-500">Try a wider rent range, another area, or reset your filters.</p>
                <button onClick={clearFilters} className="mt-5 rounded-full bg-[#102f26] px-5 py-2.5 text-sm font-bold text-white">Reset filters</button>
              </div>
            )}

            {data?.totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-2">
                {Array.from({ length: data.totalPages }, (_, index) => index + 1).slice(0, 8).map((page) => (
                  <motion.button key={page} whileTap={{ scale: 0.94 }} onClick={() => setParam('page', String(page))} className={`grid h-10 w-10 place-items-center rounded-full text-sm font-bold ${Number(searchParams.get('page') || 1) === page ? 'bg-[#102f26] text-white' : 'border border-slate-200 bg-white text-slate-600'}`}>
                    {page}
                  </motion.button>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  )
}

export default PropertiesPage
