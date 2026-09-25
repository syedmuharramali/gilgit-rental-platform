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
import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'
import PropertyCard from '../components/properties/PropertyCard'
import PropertyResultsMap from '../components/properties/PropertyResultsMap'
import { useGetAmenitiesQuery } from '../features/amenities/amenitiesApi'
import { useGetPropertiesQuery } from '../features/properties/propertiesApi'
import { amenityLabel, pretty } from '../components/workspace/WorkspaceUI'
import { HOME_TYPES, SHOP_TYPES, isShopType } from '../utils/propertyTypes'


const quickFilters = [
  ['heating', Flame],
  ['hotWater', Waves],
  ['electricityBackup', Zap],
  ['winterAccessible', ShieldCheck],
]

function PropertiesPage() {
  const { t } = useTranslation()
  const [searchParams, setSearchParams] = useSearchParams()
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [searchText, setSearchText] = useState(() => searchParams.get('search') || '')
  const [view, setView] = useState('grid')
  const { data: amenityData } = useGetAmenitiesQuery()

  // Homes and shops are searched separately. A type in the URL decides the
  // category (a link to ?propertyType=shop opens Shops); otherwise ?category.
  const urlType = searchParams.get('propertyType')
  const category = urlType ? (isShopType(urlType) ? 'shops' : 'homes') : searchParams.get('category') === 'shops' ? 'shops' : 'homes'
  const types = category === 'shops' ? SHOP_TYPES : HOME_TYPES

  const params = useMemo(() => {
    const result = {}
    for (const [key, value] of searchParams.entries()) {
      if (value) result[key] = value
    }
    // While someone is still typing a maximum ("1" on the way to "10000") it
    // is briefly below the minimum; the API rejects that range, which used to
    // replace the results with "Unable to reach the property service".
    if (result.minRent && result.maxRent && Number(result.maxRent) < Number(result.minRent)) {
      delete result.maxRent
    }
    if (!result.propertyType) result.category = category
    return result
  }, [searchParams, category])

  const { data, isLoading, isFetching, error, refetch } = useGetPropertiesQuery(params)
  const properties = data?.properties || []
  const selectedAmenities = (searchParams.get('amenities') || '').split(',').filter(Boolean)

  // Always build on the latest URL. The debounced search runs from a timer
  // created on an older render; copying that render's searchParams wiped any
  // filter chip tapped in the meantime. Filter edits replace the history
  // entry so Back leaves the page instead of undoing one keystroke at a time.
  const setParam = (key, value, keepPage = false) => {
    setSearchParams((current) => {
      const next = new URLSearchParams(current)
      if (value !== '' && value !== null && value !== undefined) next.set(key, String(value))
      else next.delete(key)
      if (!keepPage) next.delete('page')
      return next
    }, { replace: key !== 'page' })
  }

  const toggleAmenity = (slug) => {
    const nextValues = selectedAmenities.includes(slug)
      ? selectedAmenities.filter((value) => value !== slug)
      : [...selectedAmenities, slug]
    setParam('amenities', nextValues.join(','))
  }

  // Switching category drops filters that only make sense for the other one.
  const switchCategory = (next) => {
    if (next === category) return
    setSearchParams((current) => {
      const params = new URLSearchParams(current)
      ;['propertyType', 'bedrooms', 'bathrooms', 'furnishedStatus', 'page'].forEach((key) => params.delete(key))
      if (next === 'shops') params.set('category', 'shops')
      else params.delete('category')
      return params
    }, { replace: true })
  }

  const clearFilters = () => {
    setSearchText('')
    // Reset filters, but stay on the category the person is browsing.
    setSearchParams(category === 'shops' ? { category: 'shops' } : {})
  }
  const toggleBoolean = (key) => setParam(key, searchParams.get(key) === 'true' ? '' : 'true')

  // Keep the box in sync when the URL changes from elsewhere (back button, Clear).
  const urlSearch = searchParams.get('search') || ''
  const lastTypedSearch = useRef(urlSearch)

  useEffect(() => {
    if (urlSearch !== lastTypedSearch.current) {
      lastTypedSearch.current = urlSearch
      setSearchText(urlSearch)
    }
  }, [urlSearch])

  // Only query the API once typing pauses, instead of on every keystroke.
  useEffect(() => {
    if (searchText === urlSearch) return

    const timer = setTimeout(() => {
      lastTypedSearch.current = searchText
      setParam('search', searchText)
    }, 400)

    return () => clearTimeout(timer)
    // setParam builds on the latest URL itself, so it is safe to omit here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchText, urlSearch])

  return (
    <main className="min-h-screen overflow-hidden bg-[#070b14] text-white">
      <section className="relative border-b border-white/8 px-5 pb-10 pt-12 sm:px-8 lg:px-10 lg:pb-14 lg:pt-16">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_16%_18%,rgba(56,189,248,.14),transparent_28%),radial-gradient(circle_at_88%_8%,rgba(139,92,246,.12),transparent_24%)]" />
        <div className="relative mx-auto max-w-[1440px]">
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }} className="flex flex-col gap-8 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/15 bg-cyan-300/8 px-3 py-2 text-[10px] font-black uppercase tracking-[.16em] text-cyan-200">
                <Sparkles className="h-3.5 w-3.5" /> {t('properties.eyebrow')}
              </div>
              <h1 className="mt-5 text-4xl font-black leading-[.98] tracking-[-.055em] text-white sm:text-5xl lg:text-6xl">
                {t('properties.heroTitle1')} <span className="bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-400 bg-clip-text text-transparent">{t('properties.heroTitle2')}</span>
              </h1>
              <p className="mt-5 max-w-2xl text-sm leading-7 text-white/48 sm:text-base">
                {t('properties.heroText')}
              </p>
            </div>

            <div className="grid w-full max-w-xl grid-cols-3 gap-3 sm:grid-cols-3 xl:w-auto">
              {[
                [t('properties.badgeVerified'), t('properties.badgeVerifiedText'), ShieldCheck],
                [t('properties.badgeLocal'), t('properties.badgeLocalText'), MapIcon],
                [t('properties.badgeSmart'), t('properties.badgeSmartText'), Sparkles],
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
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
                placeholder={t('properties.searchPlaceholder')}
                className="h-14 min-w-0 flex-1 bg-transparent text-sm font-semibold text-white outline-none placeholder:text-white/28"
              />
              {searchParams.toString() && (
                <button onClick={clearFilters} className="inline-flex h-10 items-center gap-1 rounded-xl px-3 text-xs font-bold text-white/45 transition hover:bg-white/6 hover:text-white">
                  <X className="h-3.5 w-3.5" /> {t('common.clear')}
                </button>
              )}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {quickFilters.map(([key, Icon]) => {
              const active = searchParams.get(key) === 'true'
              return (
                <button
                  key={key}
                  onClick={() => toggleBoolean(key)}
                  className={`inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-xs font-black transition ${active ? 'border-cyan-300/35 bg-cyan-300 text-[#07101e]' : 'border-white/10 bg-white/[0.04] text-white/55 hover:border-white/20 hover:text-white'}`}
                >
                  <Icon className="h-3.5 w-3.5" /> {t(`properties.quick.${key}`)}
                </button>
              )
            })}
          </div>
        </div>
      </section>

      <section className="px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
        <div className="mx-auto max-w-[1440px]">
          <div className="mb-5 inline-flex rounded-full border border-white/10 bg-white/[0.04] p-1" role="tablist" aria-label={t('properties.categoryLabel')}>
            {[['homes', t('properties.categoryHomes')], ['shops', t('properties.categoryShops')]].map(([value, label]) => (
              <button key={value} type="button" role="tab" aria-selected={category === value} onClick={() => switchCategory(value)} className={`rounded-full px-5 py-2 text-xs font-black transition ${category === value ? 'bg-white text-[#07101e]' : 'text-white/45 hover:text-white/75'}`}>{label}</button>
            ))}
          </div>

          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[.16em] text-white/28">{t('properties.marketplace')}</p>
              <p className="mt-1 text-sm text-white/48">
                {error ? t('properties.couldNotLoad') : isLoading ? t('properties.loadingRentals') : <><strong className="text-white">{data?.total ?? 0}</strong> {t('properties.available')}</>}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button onClick={() => setFiltersOpen((value) => !value)} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2.5 text-xs font-black text-white/65 lg:hidden">
                <SlidersHorizontal className="h-4 w-4" /> {t('properties.filtersButton')}
              </button>
              <div className="inline-flex rounded-full border border-white/10 bg-white/[0.04] p-1">
                <button onClick={() => setView('grid')} className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-black ${view === 'grid' ? 'bg-white text-[#07101e]' : 'text-white/38'}`}><Grid3X3 className="h-3.5 w-3.5" /> {t('properties.grid')}</button>
                <button onClick={() => setView('map')} className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-black ${view === 'map' ? 'bg-white text-[#07101e]' : 'text-white/38'}`}><MapIcon className="h-3.5 w-3.5" /> {t('properties.map')}</button>
              </div>
            </div>
          </div>

          <div className="grid gap-7 lg:grid-cols-[290px_1fr]">
            <AnimatePresence initial={false}>
              {(filtersOpen || true) && (
                <aside className={`${filtersOpen ? 'block' : 'hidden'} lg:block`}>
                  <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto rounded-[28px] border border-white/8 bg-[#0b111f]/92 p-5 shadow-[0_25px_70px_rgba(0,0,0,.22)] backdrop-blur-2xl">
                    <div className="flex items-center justify-between">
                      <p className="flex items-center gap-2 font-black"><Filter className="h-4 w-4 text-cyan-300" /> {t('properties.filters')}</p>
                      <button onClick={clearFilters} className="text-xs font-black text-cyan-300">{t('properties.reset')}</button>
                    </div>

                    <div className="mt-6 space-y-6">
                      <FilterField label={t('properties.field.area')}><input value={searchParams.get('area') || ''} onChange={(event) => setParam('area', event.target.value)} placeholder={t('properties.areaPlaceholder')} className="filter-control" /></FilterField>
                      <FilterField label={t('properties.field.propertyType')}><select value={searchParams.get('propertyType') || ''} onChange={(event) => setParam('propertyType', event.target.value)} className="filter-control"><option value="">{t('properties.anyType')}</option>{types.map((value) => <option key={value} value={value}>{pretty(value)}</option>)}</select></FilterField>

                      <div className="grid grid-cols-2 gap-2"><FilterField label={t('properties.field.minRent')}><input type="number" min="0" value={searchParams.get('minRent') || ''} onChange={(event) => setParam('minRent', event.target.value)} className="filter-control" /></FilterField><FilterField label={t('properties.field.maxRent')}><input type="number" min="0" value={searchParams.get('maxRent') || ''} onChange={(event) => setParam('maxRent', event.target.value)} className="filter-control" /></FilterField></div>
                      {category === 'homes' && <div className="grid grid-cols-2 gap-2"><FilterField label={t('properties.field.bedrooms')}><input type="number" min="0" value={searchParams.get('bedrooms') || ''} onChange={(event) => setParam('bedrooms', event.target.value)} className="filter-control" /></FilterField><FilterField label={t('properties.field.bathrooms')}><input type="number" min="0" value={searchParams.get('bathrooms') || ''} onChange={(event) => setParam('bathrooms', event.target.value)} className="filter-control" /></FilterField></div>}

                      {category === 'homes' && <FilterField label={t('properties.field.furnishing')}><select value={searchParams.get('furnishedStatus') || ''} onChange={(event) => setParam('furnishedStatus', event.target.value)} className="filter-control"><option value="">{t('properties.any')}</option>{['furnished','semi_furnished','unfurnished'].map((value) => <option key={value} value={value}>{pretty(value)}</option>)}</select></FilterField>}
                      <FilterField label={t('properties.availableBy')}><input type="date" value={searchParams.get('availableFrom') || ''} onChange={(event) => setParam('availableFrom', event.target.value)} className="filter-control" /></FilterField>

                      <div>
                        <p className="filter-heading">{t('properties.practicalLiving')}</p>
                        <div className="mt-2 grid grid-cols-2 gap-2">
                          {quickFilters.map(([key, Icon]) => {
                            const active = searchParams.get(key) === 'true'
                            return <button key={key} type="button" onClick={() => toggleBoolean(key)} className={`rounded-2xl border px-3 py-3 text-left text-[11px] font-black transition ${active ? 'border-cyan-300/30 bg-cyan-300/12 text-cyan-200' : 'border-white/8 bg-white/[0.025] text-white/38 hover:text-white/65'}`}><Icon className="mb-2 h-3.5 w-3.5" />{t(`properties.quick.${key}`)}</button>
                          })}
                          <button type="button" onClick={() => toggleBoolean('negotiable')} className={`rounded-2xl border px-3 py-3 text-left text-[11px] font-black transition ${searchParams.get('negotiable') === 'true' ? 'border-violet-300/30 bg-violet-300/12 text-violet-200' : 'border-white/8 bg-white/[0.025] text-white/38 hover:text-white/65'}`}><CheckCircle2 className="mb-2 h-3.5 w-3.5" />{t('properties.negotiable')}</button>
                        </div>
                      </div>

                      <FilterField label={t('properties.waterReliability')}><select value={searchParams.get('waterAvailability') || ''} onChange={(event) => setParam('waterAvailability', event.target.value)} className="filter-control"><option value="">{t('properties.any')}</option>{['excellent','good','limited','unreliable','unknown'].map((value) => <option key={value} value={value}>{pretty(value)}</option>)}</select></FilterField>
                      <FilterField label={t('properties.roadAccess')}><select value={searchParams.get('roadAccess') || ''} onChange={(event) => setParam('roadAccess', event.target.value)} className="filter-control"><option value="">{t('properties.any')}</option>{['excellent','good','limited','difficult','unknown'].map((value) => <option key={value} value={value}>{pretty(value)}</option>)}</select></FilterField>

                      <div>
                        <p className="filter-heading">{t('properties.amenitiesTitle')}</p>
                        <div className="mt-2 max-h-56 space-y-2 overflow-y-auto pr-1">{(amenityData?.amenities || []).map((amenity) => <label key={amenity._id} className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/6 bg-white/[0.025] px-3 py-2.5 text-xs font-bold text-white/48 transition hover:bg-white/[0.05]"><input type="checkbox" checked={selectedAmenities.includes(amenity.slug)} onChange={() => toggleAmenity(amenity.slug)} className="accent-cyan-300" /><span>{amenityLabel(amenity)}</span></label>)}</div>
                      </div>

                      <FilterField label={t('properties.field.sort')}><select value={searchParams.get('sort') || 'newest'} onChange={(event) => setParam('sort', event.target.value)} className="filter-control"><option value="newest">{t('properties.sortNewest')}</option><option value="rent_low">{t('properties.sort.priceLow')}</option><option value="rent_high">{t('properties.sort.priceHigh')}</option><option value="oldest">{t('properties.sortOldest')}</option></select></FilterField>
                    </div>
                  </motion.div>
                </aside>
              )}
            </AnimatePresence>

            <div>
              {isFetching && !isLoading && <div className="mb-4 text-xs font-black uppercase tracking-[.14em] text-cyan-300">{t('properties.refreshing')}</div>}

              {error && (
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-[30px] border border-rose-300/15 bg-rose-400/[0.06] p-7 shadow-[0_20px_60px_rgba(0,0,0,.18)]">
                  <div className="flex items-start gap-4">
                    <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-rose-300/10 text-rose-200"><X className="h-5 w-5" /></div>
                    <div>
                      {/* A 400 is a filter the server rejected, not an outage. */}
                      <p className="font-black text-white">{error.status === 400 ? t('properties.badFilter') : t('properties.unreachable')}</p>
                      <p className="mt-2 max-w-2xl text-sm leading-6 text-white/42">{error.status === 400 && error.data?.message ? error.data.message : t('properties.errorText')}</p>
                      <button onClick={refetch} className="mt-4 rounded-full bg-white px-4 py-2.5 text-xs font-black text-[#07101e] transition hover:scale-[1.02]">{t('common.tryAgain')}</button>
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
                  <p className="mt-4 font-black">{t('properties.emptyTitle')}</p>
                  <p className="mt-2 text-sm text-white/38">{t('properties.emptyText2')}</p>
                  <button onClick={clearFilters} className="mt-5 rounded-full bg-gradient-to-r from-cyan-300 to-blue-500 px-5 py-2.5 text-sm font-black text-[#07101e]">{t('properties.resetFilters')}</button>
                </div>
              )}

              {data?.totalPages > 1 && (
                <Pager
                  page={Number(searchParams.get('page') || 1)}
                  totalPages={data.totalPages}
                  onChange={(page) => setParam('page', String(page), true)}
                  labels={{ previous: t('properties.previousPage'), next: t('properties.nextPage'), nav: t('properties.pagination') }}
                />
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

// Shows the first and last page, the current one and its neighbours, with
// gaps between. The old pager showed pages 1–8 only, so page 9 onward
// (result 97+) could not be reached at all.
function Pager({ page, totalPages, onChange, labels }) {
  const wanted = new Set([1, totalPages, page - 1, page, page + 1])
  const pages = [...wanted].filter((value) => value >= 1 && value <= totalPages).sort((a, b) => a - b)
  const items = []
  pages.forEach((value, index) => {
    if (index > 0 && value - pages[index - 1] > 1) items.push(`gap-${value}`)
    items.push(value)
  })
  const base = 'grid h-10 min-w-10 place-items-center rounded-full px-3 text-sm font-bold'
  const idle = 'border border-white/10 bg-white/[0.035] text-white/48 disabled:opacity-30'

  return (
    <nav className="mt-8 flex flex-wrap items-center justify-center gap-2" aria-label={labels.nav}>
      <button disabled={page <= 1} onClick={() => onChange(page - 1)} className={`${base} ${idle}`}>{labels.previous}</button>
      {items.map((item) => typeof item === 'string'
        ? <span key={item} className="px-1 text-white/30">…</span>
        : <motion.button key={item} whileTap={{ scale: 0.94 }} onClick={() => onChange(item)} aria-current={item === page ? 'page' : undefined} className={`${base} ${item === page ? 'bg-white text-[#07101e]' : idle}`}>{item}</motion.button>)}
      <button disabled={page >= totalPages} onClick={() => onChange(page + 1)} className={`${base} ${idle}`}>{labels.next}</button>
    </nav>
  )
}

function FilterField({ label, children }) {
  return <label className="block"><span className="filter-heading">{label}</span><div className="mt-2">{children}</div></label>
}

export default PropertiesPage
