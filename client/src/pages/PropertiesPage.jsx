import { Filter, Grid3X3, Map as MapIcon, Search, SlidersHorizontal, X } from 'lucide-react'
import { motion } from 'motion/react'
import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import PropertyCard from '../components/properties/PropertyCard'
import PropertyResultsMap from '../components/properties/PropertyResultsMap'
import { useGetPropertiesQuery } from '../features/properties/propertiesApi'
import { useGetAmenitiesQuery } from '../features/amenities/amenitiesApi'
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

  const { data, isLoading, isFetching, error } = useGetPropertiesQuery(params)
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
    <main className="min-h-screen bg-[#f6f8f7]">
      <section className="border-b border-slate-200 bg-white px-5 py-8 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-[1440px]">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">Discover rentals</p>
          <div className="mt-2 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-4xl font-black tracking-[-0.055em] text-slate-950 sm:text-5xl">Find your place in Gilgit.</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">Search published rentals by price, room details, practical winter readiness, amenities and exact map location when available.</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setFiltersOpen((value) => !value)} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm lg:hidden"><SlidersHorizontal className="h-4 w-4" /> Filters</button>
              <div className="inline-flex rounded-full border border-slate-200 bg-slate-50 p-1">
                <button onClick={() => setView('grid')} className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold ${view === 'grid' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}><Grid3X3 className="h-3.5 w-3.5" /> Grid</button>
                <button onClick={() => setView('map')} className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold ${view === 'map' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}><MapIcon className="h-3.5 w-3.5" /> Map</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-5 py-6 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-[1440px]">
          <div className="flex items-center gap-2 rounded-[22px] border border-slate-200 bg-white p-2 shadow-[0_12px_30px_rgba(15,23,42,.05)]">
            <Search className="ml-3 h-5 w-5 text-slate-400" />
            <input value={searchParams.get('search') || ''} onChange={(event) => setParam('search', event.target.value)} placeholder="Search area, landmark, description or property name" className="h-11 min-w-0 flex-1 bg-transparent text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-400" />
            {searchParams.toString() && <button onClick={clearFilters} className="inline-flex h-10 items-center gap-1 rounded-2xl px-3 text-xs font-bold text-slate-500 hover:bg-slate-50"><X className="h-3.5 w-3.5" /> Clear</button>}
          </div>
        </div>
      </section>

      <section className="px-5 pb-16 sm:px-8 lg:px-10">
        <div className="mx-auto grid max-w-[1440px] gap-7 lg:grid-cols-[300px_1fr]">
          <aside className={`${filtersOpen ? 'block' : 'hidden'} lg:block`}>
            <div className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,.05)]">
              <div className="flex items-center justify-between"><p className="flex items-center gap-2 font-black text-slate-950"><Filter className="h-4 w-4" /> Filters</p><button onClick={clearFilters} className="text-xs font-bold text-emerald-700">Reset</button></div>

              <div className="mt-6 space-y-6">
                <FilterField label="Area"><input value={searchParams.get('area') || ''} onChange={(event) => setParam('area', event.target.value)} placeholder="e.g. Jutial" className="filter-control" /></FilterField>
                <FilterField label="Property type"><select value={searchParams.get('propertyType') || ''} onChange={(event) => setParam('propertyType', event.target.value)} className="filter-control"><option value="">Any type</option>{types.map((value) => <option key={value} value={value}>{pretty(value)}</option>)}</select></FilterField>

                <div className="grid grid-cols-2 gap-2"><FilterField label="Min rent"><input type="number" min="0" value={searchParams.get('minRent') || ''} onChange={(event) => setParam('minRent', event.target.value)} className="filter-control" /></FilterField><FilterField label="Max rent"><input type="number" min="0" value={searchParams.get('maxRent') || ''} onChange={(event) => setParam('maxRent', event.target.value)} className="filter-control" /></FilterField></div>
                <div className="grid grid-cols-2 gap-2"><FilterField label="Bedrooms"><input type="number" min="0" value={searchParams.get('bedrooms') || ''} onChange={(event) => setParam('bedrooms', event.target.value)} className="filter-control" /></FilterField><FilterField label="Bathrooms"><input type="number" min="0" value={searchParams.get('bathrooms') || ''} onChange={(event) => setParam('bathrooms', event.target.value)} className="filter-control" /></FilterField></div>

                <FilterField label="Furnishing"><select value={searchParams.get('furnishedStatus') || ''} onChange={(event) => setParam('furnishedStatus', event.target.value)} className="filter-control"><option value="">Any</option><option value="furnished">Furnished</option><option value="semi_furnished">Semi furnished</option><option value="unfurnished">Unfurnished</option></select></FilterField>
                <FilterField label="Available by"><input type="date" value={searchParams.get('availableFrom') || ''} onChange={(event) => setParam('availableFrom', event.target.value)} className="filter-control" /></FilterField>

                <div><p className="filter-heading">Practical living</p><div className="mt-2 grid grid-cols-2 gap-2">{[['heating','Heating'],['hotWater','Hot water'],['electricityBackup','Power backup'],['winterAccessible','Winter access'],['negotiable','Negotiable']].map(([key,label]) => <button key={key} type="button" onClick={() => toggleBoolean(key)} className={`rounded-2xl border px-3 py-3 text-left text-xs font-black transition ${searchParams.get(key) === 'true' ? 'border-emerald-300 bg-emerald-50 text-emerald-800' : 'border-slate-200 text-slate-500'}`}>{label}</button>)}</div></div>

                <FilterField label="Water reliability"><select value={searchParams.get('waterAvailability') || ''} onChange={(event) => setParam('waterAvailability', event.target.value)} className="filter-control"><option value="">Any</option>{['excellent','good','limited','unreliable','unknown'].map((value) => <option key={value} value={value}>{pretty(value)}</option>)}</select></FilterField>
                <FilterField label="Road access"><select value={searchParams.get('roadAccess') || ''} onChange={(event) => setParam('roadAccess', event.target.value)} className="filter-control"><option value="">Any</option>{['excellent','good','limited','difficult','unknown'].map((value) => <option key={value} value={value}>{pretty(value)}</option>)}</select></FilterField>

                <div><p className="filter-heading">Amenities</p><div className="mt-2 max-h-56 space-y-2 overflow-y-auto pr-1">{(amenityData?.amenities || []).map((amenity) => <label key={amenity._id} className="flex cursor-pointer items-center gap-3 rounded-xl bg-slate-50 px-3 py-2.5 text-xs font-bold text-slate-600"><input type="checkbox" checked={selectedAmenities.includes(amenity.slug)} onChange={() => toggleAmenity(amenity.slug)} className="accent-emerald-700" /><span>{amenity.name}</span></label>)}</div></div>

                <FilterField label="Sort"><select value={searchParams.get('sort') || 'newest'} onChange={(event) => setParam('sort', event.target.value)} className="filter-control"><option value="newest">Newest</option><option value="rent_low">Rent: low to high</option><option value="rent_high">Rent: high to low</option><option value="oldest">Oldest</option></select></FilterField>
              </div>
            </div>
          </aside>

          <div>
            <div className="mb-5 flex items-center justify-between gap-4"><p className="text-sm text-slate-500"><strong className="text-slate-950">{data?.total ?? 0}</strong> rentals found</p>{isFetching && !isLoading && <span className="text-xs font-bold text-emerald-700">Updating…</span>}</div>
            {error && <div className="rounded-[24px] border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-semibold text-rose-700">{error?.data?.message || 'Unable to load properties right now.'}</div>}

            {view === 'map' && !isLoading && !error ? <PropertyResultsMap properties={properties} /> : (
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{isLoading ? Array.from({ length: 6 }).map((_, index) => <div key={index} className="aspect-[4/4.3] animate-pulse rounded-[28px] bg-slate-100" />) : properties.map((property) => <PropertyCard key={property._id} property={property} />)}</div>
            )}

            {!isLoading && !error && properties.length === 0 && <div className="rounded-[30px] border border-dashed border-slate-300 bg-white px-6 py-16 text-center"><Search className="mx-auto h-8 w-8 text-slate-300" /><p className="mt-4 font-black text-slate-900">No rentals match these filters</p><p className="mt-2 text-sm text-slate-500">Try a wider rent range, another area, or reset your filters.</p><button onClick={clearFilters} className="mt-5 rounded-full bg-[#102f26] px-5 py-2.5 text-sm font-bold text-white">Reset filters</button></div>}

            {data?.totalPages > 1 && <div className="mt-8 flex items-center justify-center gap-2">{Array.from({ length: data.totalPages }, (_, index) => index + 1).slice(0, 8).map((page) => <motion.button key={page} whileTap={{ scale: 0.94 }} onClick={() => setParam('page', String(page), true)} className={`grid h-10 w-10 place-items-center rounded-full text-sm font-bold ${Number(searchParams.get('page') || 1) === page ? 'bg-[#102f26] text-white' : 'border border-slate-200 bg-white text-slate-600'}`}>{page}</motion.button>)}</div>}
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
