import Map, { Marker, NavigationControl, Popup } from 'react-map-gl/maplibre'
import { MapPin } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import 'maplibre-gl/dist/maplibre-gl.css'
import { money } from '../workspace/WorkspaceUI'
import { isStayType } from '../../utils/propertyTypes'

const DEFAULT_STYLE = 'https://tiles.openfreemap.org/styles/liberty'
const DEFAULT_GILGIT = { latitude: 35.9208, longitude: 74.3144, zoom: 11 }

// Number(null) is 0, which passed isFinite and plotted unpinned listings at 0,0.
const hasCoordinate = (value) => value != null && value !== '' && Number.isFinite(Number(value))

export default function PropertyResultsMap({ properties = [] }) {
  const { t } = useTranslation()
  const [selected, setSelected] = useState(null)
  const mapped = useMemo(() => properties.filter((property) => hasCoordinate(property.address?.latitude) && hasCoordinate(property.address?.longitude)), [properties])
  const first = mapped[0]
  const initialViewState = first ? { latitude: Number(first.address.latitude), longitude: Number(first.address.longitude), zoom: 12 } : DEFAULT_GILGIT

  return (
    <div className="relative h-[680px] overflow-hidden rounded-[30px] border border-slate-200 bg-slate-100 shadow-sm">
      <Map initialViewState={initialViewState} mapStyle={import.meta.env.VITE_MAP_STYLE_URL || DEFAULT_STYLE} style={{ width: '100%', height: '100%' }}>
        <NavigationControl position="top-right" showCompass={false} />
        {mapped.map((property) => (
          <Marker key={property._id} latitude={Number(property.address.latitude)} longitude={Number(property.address.longitude)} anchor="bottom">
            <button onClick={() => setSelected(property)} className="group grid h-11 w-11 place-items-center rounded-full border-4 border-white bg-[#102f26] text-white shadow-xl transition hover:-translate-y-1 hover:scale-110" aria-label={t('resultsMap.openListing', { title: property.title })}>
              <MapPin className="h-4 w-4" />
            </button>
          </Marker>
        ))}
        {selected && (
          <Popup latitude={Number(selected.address.latitude)} longitude={Number(selected.address.longitude)} anchor="top" closeOnClick={false} onClose={() => setSelected(null)} maxWidth="280px">
            <div className="min-w-52 p-1 text-slate-900">
              <p className="text-sm font-black">{selected.title}</p>
              <p className="mt-1 text-xs text-slate-500">{selected.address?.area}</p>
              <p className="mt-2 text-sm font-black text-emerald-800">{isStayType(selected.propertyType) ? t('card.perNightFrom', { price: money(selected.nightlyPriceFrom) }) : `${money(selected.monthlyRent)} ${t('card.perMonth')}`}</p>
              <Link to={`/properties/${selected._id}`} className="mt-3 inline-flex rounded-full bg-[#102f26] px-3 py-2 text-xs font-black text-white">{t('resultsMap.viewProperty')}</Link>
            </div>
          </Popup>
        )}
      </Map>
      {mapped.length === 0 && <div className="pointer-events-none absolute inset-x-4 bottom-4 rounded-2xl bg-white/90 p-4 text-center text-xs font-bold text-slate-500 shadow-lg backdrop-blur">{t('resultsMap.noCoordinates')}</div>}
    </div>
  )
}
