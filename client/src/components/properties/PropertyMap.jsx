import Map, { Marker, NavigationControl } from 'react-map-gl/mapbox'
import { MapPin } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import 'mapbox-gl/dist/mapbox-gl.css'
import MapStyleToggle, { MapNotConfigured } from './MapStyleToggle'
import { MAPBOX_TOKEN, MAP_STYLES } from './mapConfig'

export default function PropertyMap({ latitude, longitude, title, className = '' }) {
  const { t } = useTranslation()
  const [look, setLook] = useState('streets')
  // Number(null) is 0, so a listing with no pin used to be drawn at 0,0 in
  // the Atlantic instead of showing the "no location" card.
  const lat = latitude == null || latitude === '' ? NaN : Number(latitude)
  const lng = longitude == null || longitude === '' ? NaN : Number(longitude)

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return (
      <div className={`grid min-h-64 place-items-center rounded-[28px] border border-slate-200 bg-[radial-gradient(circle_at_30%_30%,#e5f2ec,transparent_30%),linear-gradient(145deg,#edf3f0,#dfe8e4)] text-center ${className}`}>
        <div className="px-6"><MapPin className="mx-auto h-6 w-6 text-emerald-700" /><p className="mt-3 text-sm font-black text-slate-800">{t('propertyMap.noLocation')}</p><p className="mt-1 text-xs text-slate-500">{t('propertyMap.noLocationText')}</p></div>
      </div>
    )
  }

  if (!MAPBOX_TOKEN) return <MapNotConfigured className={className} />

  return (
    <div className={`relative overflow-hidden rounded-[28px] border border-slate-200 bg-slate-100 ${className}`}>
      <MapStyleToggle value={look} onChange={setLook} />
      <Map
        mapboxAccessToken={MAPBOX_TOKEN}
        initialViewState={{ latitude: lat, longitude: lng, zoom: 15 }}
        mapStyle={MAP_STYLES[look]}
        style={{ width: '100%', height: '100%' }}
        cooperativeGestures
      >
        <NavigationControl position="top-right" showCompass={false} />
        <Marker latitude={lat} longitude={lng} anchor="bottom">
          <div className="grid h-11 w-11 place-items-center rounded-full border-4 border-white bg-[#102f26] text-white shadow-xl" title={title || t('propertyMap.pinTitle')}>
            <MapPin className="h-4 w-4" />
          </div>
        </Marker>
      </Map>
    </div>
  )
}
