import {
  Bath,
  BedDouble,
  CheckCircle2,
  Filter,
  Flame,
  Grid3X3,
  Map as MapIcon,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Waves,
  X,
  Zap,
} from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import PropertyCard from '../components/properties/PropertyCard'
import PropertyResultsMap from '../components/properties/PropertyResultsMap'
import { useGetAmenitiesQuery } from '../features/amenities/amenitiesApi'
import { useGetPropertiesQuery } from '../features/properties/propertiesApi'
import { pretty } from '../components/workspace/WorkspaceUI'

const types = [
  'hostel',
  'hostel_bed',
  'shared_room',
  'private_room',
  'apartment',
  'house',
  'upper_portion',
  'lower_portion',
  'studio',
]

const quickFilters = [
  ['heating', 'Heating', Flame],
  ['hotWater', 'Hot water', Waves],
  ['electricityBackup', 'Backup power', Zap],
  ['winterAccessible', 'Winter ready', ShieldCheck],
]

function PropertiesPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [view, setView] = useState('grid')
  const { data: amenityData } = useGetAmenitiesQuery()

  const params = useMemo(() => {
    const result = {}
    for (const [key, value] of searchParams.entries()) {
      if (value) result[key] = value
    }
    return result
  }, [searchParams])

  const { data, isLoading, isFetching, error, refetch } = useGetPropertiesQuery(params)
  const properties = data?.properties || []
  const selectedAmenities = (searchParams.get('amenities') || '').split(',').filter(Boolean)

  const setParam = (key, value, keepPage = false) => {
    const next = new URLSearchParams(searchParams)
    if (value !== '' && value !== null && value !== undefined) next.set(key, String(value))
    else next.delete(key)
    if (!keepPage) next.delete('page')
    setSearchParams(next)
  }

  const toggleAmenity = (slug) => {
    const nextValues = selectedAmenities.includes(slug)
      ? selectedAmenities.filter((value) => value !== slug)
      : [...selectedAmenities, slug]
    setParam('amenities', nextValues.join(','))
  }

  const clearFilters = () => setSearchParams({})
  const toggleBoolean = (key) => setParam(key, searchParams.get(key) === 'true' ? '' : 'true')

  return (
    <main className="min-h-screen overflow-hidden bg-[#070b14] text-white">
      <section className="relative border-b border-white/8 px-5 pb-10 pt-12 sm:px-8 lg:px-10 lg:pb-14 lg:pt-16">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_16%_18%,rgba(56,189,248,.14),transparent_28%),radial-gradient(circle_at_88%_8%,rgba(139,92,246,.12),transparent_24%)]" />
        <div className="relative mx-auto max-w-[1440px]">
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }} className="flex flex-col gap-8 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/15 bg-cyan-300/8 px-3 py-2 text-[10px] font-black uppercase tracking-[.16em] text-cyan-200">
                <Sparkles className="h-3.5 w-3.5" /> Curated for Gilgit living
              </div>
              <h1 className="mt-5 text-4xl font-black leading-[.98] tracking-[-.055em] text-white sm:text-5xl lg:text-6xl">
                Find a place that works <span className="bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-400 bg-clip-text text-transparent">beyond the photos.</span>
              </h1>
              <p className="mt-5 max-w-2xl text-sm leading-7 text-white/48 sm:text-base">
                Explore verified rentals with practical filters for heating, water, backup power, winter access, amenities and location.
              </p>
            </div>

            <div className="grid w-full max-w-xl grid-cols-3 gap-3 sm:grid-cols-3 xl:w-auto">
              {[
                ['Verified', 'Owner reviewed', ShieldCheck],
                ['Local', 'Gilgit focused', MapIcon],
                ['Smarter', 'Living insights', Sparkles],
              ].map(([label, text, Icon]) => (
                <div key={label} className="rounded-[22px] border border-white/8 bg-white/[0.04] p-4 backdrop-blur-xl">
                  <Icon className="h-4 w-4 text-cyan-300" />
                  <p className="mt-4 text-sm font-black">{label}</p>
                  <p className="mt-1 text-[10px] leading-4 text-white/36">{text}</p>
                </div>
              ))}
            </div>
          </motion.div>

          <div className="mt-10 rounded-[28px] border border-white/10 bg-white/[0.05] p-2 shadow-[0_25px_80px_rgba(0,0,0,.28)] backdrop-blur-2xl">
            <div className="flex items-center gap-3 rounded-[22px] bg-[#0b111f]/88 px-4">
              <Search className="h-5 w-5 shrink-0 text-cyan-300" />
              <input
                value={searchParams.get('search') || ''}
                onChange={(event) => setParam('search', event.target.value)}
                placeholder="Search Jutial, Danyor, apartment, hostel..."
                className="h-14 min-w-0 flex-1 bg-transparent text-sm font-semibold text-white outline-none placeholder:text-white/28"
              />
              {searchParams.toString() && (
                <button onClick={clearFilters} className="inline-flex h-10 items-center gap-1 rounded-xl px-3 text-xs font-bold text-white/45 transition hover:bg-white/6 hover:text-white">
                  <X className="h-3.5 w-3.5" /> Clear
                </button>
              )}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {quickFilters.map(([key, label, Icon]) => {
              const active = searchParams.get(key) === 'true'
              return (
                <button
                  key={key}
                  onClick={() => toggleBoolean(key)}
                  className={`inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-xs font-black transition ${active ? 'border-cyan-300/35 bg-cyan-300 text-[#07101e]' : 'border-white/10 bg-white/[0.04] text-white/55 hover:border-white/20 hover:text-white'}`}
                >
                  <Icon className="h-3.5 w-3.5" /> {label}
                </button>
              )
            })}
          </div>
        </div>
      </section>

      <section className="px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
        <div className="mx-auto max-w-[1440px]">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[.16em] text-white/28">Rental marketplace</p>
              <p className="mt-1 text-sm text-white/48">
                {error ? 'We could not load rentals' : isLoading ? 'Loading available rentals…' : <><strong className="text-white">{data?.total ?? 0}</strong> rentals available</>}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button onClick={() => setFiltersOpen((value) => !value)} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2.5 text-xs font-black text-white/65 lg:hidden">
                <SlidersHorizontal className="h-4 w-4" /> Filters
              </button>
              <div className="inline-flex rounded-full border border-white/10 bg-white/[0.04] p-1">
                <button onClick={() => setView('grid')} className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-black ${view === 'grid' ? 'bg-white text-[#07101e]' : 'text-white/38'}`}><Grid3X3 className="h-3.5 w-3.5" /> Grid</button>
                <button onClick={() => setView('map')} className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-black ${view === 'map' ? 'bg-white text-[#07101e]' : 'text-white/38'}`}><MapIcon className="h-3.5 w-3.5" /> Map</button>
              </div>
            </div>
          </div>

          <div className="grid gap-7 lg:grid-cols-[290px_1fr]">
            <AnimatePresence initial={false}>
              {(filtersOpen || true) && (
                <aside className={`${filtersOpen ? 'block' : 'hidden'} lg:block`}>
                  <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto rounded-[28px] border border-white/8 bg-[#0b111f]/92 p-5 shadow-[0_25px_70px_rgba(0,0,0,.22)] backdrop-blur-2xl">
                    <div className="flex items-center justify-between">
                      <p className="flex items-center gap-2 font-black"><Filter className="h-4 w-4 text-cyan-300" /> Refine search</p>
                      <button onClick={clearFilters} className="text-xs font-black text-cyan-300">Reset</button>
                    </div>

                    <div className="mt-6 space-y-6">
                      <FilterField label="Area"><input value={searchParams.get('area') || ''} onChange={(event) => setParam('area', event.target.value)} placeholder="e.g. Jutial" className="filter-control" /></FilterField>
                      <FilterField label="Property type"><select value={searchParams.get('propertyType') || ''} onChange={(event) => setParam('propertyType', event.target.value)} className="filter-control"><option value="">Any type</option>{types.map((value) => <option key={value} value={value}>{pretty(value)}</option>)}</select></FilterField>

                      <div className="grid grid-cols-2 gap-2"><FilterField label="Min rent"><input type="number" min="0" value={searchParams.get('minRent') || ''} onChange={(event) => setParam('minRent', event.target.value)} className="filter-control" /></FilterField><FilterField label="Max rent"><input type="number" min="0" value={searchParams.get('maxRent') || ''} onChange={(event) => setParam('maxRent', event.target.value)} className="filter-control" /></FilterField></div>
                      <div className="grid grid-cols-2 gap-2"><FilterField label="Bedrooms"><input type="number" min="0" value={searchParams.get('bedrooms') || ''} onChange={(event) => setParam('bedrooms', event.target.value)} className="filter-control" /></FilterField><FilterField label="Bathrooms"><input type="number" min="0" value={searchParams.get('bathrooms') || ''} onChange={(event) => setParam('bathrooms', event.target.value)} className="filter-control" /></FilterField></div>

                      <FilterField label="Furnishing"><select value={searchParams.get('furnishedStatus') || ''} onChange={(event) => setParam('furnishedStatus', event.target.value)} className="filter-control"><option value="">Any</option><option value="furnished">Furnished</option><option value="semi_furnished">Semi furnished</option><option value="unfurnished">Unfurnished</option></select></FilterField>
                      <FilterField label="Available by"><input type="date" value={searchParams.get('availableFrom') || ''} onChange={(event) => setParam('availableFrom', event.target.value)} className="filter-control" /></FilterField>

                      <div>
                        <p className="filter-heading">Practical living</p>
                        <div className="mt-2 grid grid-cols-2 gap-2">
                          {quickFilters.map(([key, label, Icon]) => {
                            const active = searchParams.get(key) === 'true'
                            return <button key={key} type="button" onClick={() => toggleBoolean(key)} className={`rounded-2xl border px-3 py-3 text-left text-[11px] font-black transition ${active ? 'border-cyan-300/30 bg-cyan-300/12 text-cyan-200' : 'border-white/8 bg-white/[0.025] text-white/38 hover:text-white/65'}`}><Icon className="mb-2 h-3.5 w-3.5" />{label}</button>
                          })}
                          <button type="button" onClick={() => toggleBoolean('negotiable')} className={`rounded-2xl border px-3 py-3 text-left text-[11px] font-black transition ${searchParams.get('negotiable') === 'true' ? 'border-violet-300/30 bg-violet-300/12 text-violet-200' : 'border-white/8 bg-white/[0.025] text-white/38 hover:text-white/65'}`}><CheckCircle2 className="mb-2 h-3.5 w-3.5" />Negotiable</button>
                        </div>
                      </div>

                      <FilterField label="Water reliability"><select value={searchParams.get('waterAvailability') || ''} onChange={(event) => setParam('waterAvailability', event.target.value)} className="filter-control"><option value="">Any</option>{['excellent','good','limited','unreliable','unknown'].map((value) => <option key={value} value={value}>{pretty(value)}</option>)}</select></FilterField>
                      <FilterField label="Road access"><select value={searchParams.get('roadAccess') || ''} onChange={(event) => setParam('roadAccess', event.target.value)} className="filter-control"><option value="">Any</option>{['excellent','good','limited','difficult','unknown'].map((value) => <option key={value} value={value}>{pretty(value)}</option>)}</select></FilterField>

                      <div>
                        <p className="filter-heading">Amenities</p>
                        <div className="mt-2 max-h-56 space-y-2 overflow-y-auto pr-1">{(amenityData?.amenities || []).map((amenity) => <label key={amenity._id} className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/6 bg-white/[0.025] px-3 py-2.5 text-xs font-bold text-white/48 transition hover:bg-white/[0.05]"><input type="checkbox" checked={selectedAmenities.includes(amenity.slug)} onChange={() => toggleAmenity(amenity.slug)} className="accent-cyan-300" /><span>{amenity.name}</span></label>)}</div>
                      </div>

                      <FilterField label="Sort"><select value={searchParams.get('sort') || 'newest'} onChange={(event) => setParam('sort', event.target.value)} className="filter-control"><option value="newest">Newest</option><option value="rent_low">Rent: low to high</option><option value="rent_high">Rent: high to low</option><option value="oldest">Oldest</option></select></FilterField>
                    </div>
                  </motion.div>
                </aside>
              )}
            </AnimatePresence>

            <div>
              {isFetching && !isLoading && <div className="mb-4 text-xs font-black uppercase tracking-[.14em] text-cyan-300">Refreshing listings…</div>}

              {error && (
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-[30px] border border-rose-300/15 bg-rose-400/[0.06] p-7 shadow-[0_20px_60px_rgba(0,0,0,.18)]">
                  <div className="flex items-start gap-4">
                    <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-rose-300/10 text-rose-200"><X className="h-5 w-5" /></div>
                    <div>
                      <p className="font-black text-white">Unable to reach the property service.</p>
                      <p className="mt-2 max-w-2xl text-sm leading-6 text-white/42">The page is connected to the real properties API, but the request failed. This is different from having zero published listings.</p>
                      <button onClick={refetch} className="mt-4 rounded-full bg-white px-4 py-2.5 text-xs font-black text-[#07101e] transition hover:scale-[1.02]">Try again</button>
                    </div>
                  </div>
                </motion.div>
              )}

              {!error && view === 'map' && !isLoading ? <PropertyResultsMap properties={properties} /> : null}

              {!error && view === 'grid' && (
                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                  {isLoading
                    ? Array.from({ length: 6 }).map((_, index) => <div key={index} className="aspect-[4/4.3] animate-pulse rounded-[30px] border border-white/8 bg-white/[0.035]" />)
                    : properties.map((property, index) => <motion.div key={property._id} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: index * 0.045 }}><PropertyCard property={property} /></motion.div>)}
                </div>
              )}

              {!isLoading && !error && properties.length === 0 && (
                <div className="rounded-[32px] border border-dashed border-white/12 bg-white/[0.025] px-6 py-16 text-center">
                  <Search className="mx-auto h-8 w-8 text-white/18" />
                  <p className="mt-4 font-black">No rentals match these filters</p>
                  <p className="mt-2 text-sm text-white/38">Try a wider rent range, another area, or reset the active filters.</p>
                  <button onClick={clearFilters} className="mt-5 rounded-full bg-gradient-to-r from-cyan-300 to-blue-500 px-5 py-2.5 text-sm font-black text-[#07101e]">Reset filters</button>
                </div>
              )}

              {data?.totalPages > 1 && (
                <div className="mt-8 flex items-center justify-center gap-2">
                  {Array.from({ length: data.totalPages }, (_, index) => index + 1).slice(0, 8).map((page) => <motion.button key={page} whileTap={{ scale: 0.94 }} onClick={() => setParam('page', String(page), true)} className={`grid h-10 w-10 place-items-center rounded-full text-sm font-bold ${Number(searchParams.get('page') || 1) === page ? 'bg-white text-[#07101e]' : 'border border-white/10 bg-white/[0.035] text-white/48'}`}>{page}</motion.button>)}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

function FilterField({ label, children }) {
  return <label className="block"><span className="filter-heading">{label}</span><div className="mt-2">{children}</div></label>
}

export default PropertiesPage
