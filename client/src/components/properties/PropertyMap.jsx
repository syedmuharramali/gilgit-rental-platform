import Map, { Marker, NavigationControl } from 'react-map-gl/maplibre'
import { MapPin } from 'lucide-react'
import 'maplibre-gl/dist/maplibre-gl.css'

const DEFAULT_STYLE = 'https://tiles.openfreemap.org/styles/liberty'

export default function PropertyMap({ latitude, longitude, title, className = '' }) {
  const lat = Number(latitude)
  const lng = Number(longitude)

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return (
      <div className={`grid min-h-64 place-items-center rounded-[28px] border border-slate-200 bg-[radial-gradient(circle_at_30%_30%,#e5f2ec,transparent_30%),linear-gradient(145deg,#edf3f0,#dfe8e4)] text-center ${className}`}>
        <div className="px-6"><MapPin className="mx-auto h-6 w-6 text-emerald-700" /><p className="mt-3 text-sm font-black text-slate-800">Exact map location not provided</p><p className="mt-1 text-xs text-slate-500">Use the area and landmark details shown on this listing.</p></div>
      </div>
    )
  }

  return (
    <div className={`overflow-hidden rounded-[28px] border border-slate-200 bg-slate-100 ${className}`}>
      <Map
        initialViewState={{ latitude: lat, longitude: lng, zoom: 14 }}
        mapStyle={import.meta.env.VITE_MAP_STYLE_URL || DEFAULT_STYLE}
        style={{ width: '100%', height: '100%' }}
        attributionControl
      >
        <NavigationControl position="top-right" showCompass={false} />
        <Marker latitude={lat} longitude={lng} anchor="bottom">
          <div className="grid h-11 w-11 place-items-center rounded-full border-4 border-white bg-[#102f26] text-white shadow-xl" title={title || 'Property location'}>
            <MapPin className="h-4 w-4" />
          </div>
        </Marker>
      </Map>
    </div>
  )
}
