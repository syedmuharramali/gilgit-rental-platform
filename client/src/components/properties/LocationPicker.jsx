import Map, { Marker, NavigationControl } from 'react-map-gl/maplibre'
import { Crosshair, Loader2, LocateFixed, MapPin, Search, X } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import 'maplibre-gl/dist/maplibre-gl.css'

const DEFAULT_STYLE = 'https://tiles.openfreemap.org/styles/liberty'
const GILGIT_CENTER = { latitude: 35.9208, longitude: 74.3089 }
// Gilgit-Baltistan bounding box, used to bias place search results.
const SEARCH_VIEWBOX = '72.5,37.1,77.8,34.5'
const NOMINATIM = 'https://nominatim.openstreetmap.org'

const round = (value) => Math.round(value * 1e6) / 1e6
const isCoord = (value) => value !== '' && value !== null && value !== undefined && Number.isFinite(Number(value))

const pickArea = (address = {}) =>
  address.neighbourhood || address.suburb || address.quarter || address.village || address.hamlet || address.town || null
const pickCity = (address = {}) => address.city || address.town || address.county || address.state_district || null

/**
 * Map-based location picker for the property editor.
 * - Opens on the owner's current location (falls back to Gilgit).
 * - Click/tap the map or drag the pin to place the property.
 * - Search a place name, or pin the device's current position.
 */
export default function LocationPicker({ latitude, longitude, onChange, onAddressSuggestion }) {
  const mapRef = useRef(null)
  const searchAbort = useRef(null)
  const reverseAbort = useRef(null)
  const hasPin = isCoord(latitude) && isCoord(longitude)

  const [viewState, setViewState] = useState(() =>
    hasPin
      ? { latitude: Number(latitude), longitude: Number(longitude), zoom: 16 }
      : { ...GILGIT_CENTER, zoom: 12 },
  )
  const [userPosition, setUserPosition] = useState(null)
  const [locating, setLocating] = useState(false)
  const [geoMessage, setGeoMessage] = useState('')
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [searchMessage, setSearchMessage] = useState('')
  const [addressLabel, setAddressLabel] = useState('')
  const [mapError, setMapError] = useState(false)
  const mapLoaded = useRef(false)

  const flyTo = useCallback((lat, lng, zoom = 16) => {
    const map = mapRef.current
    if (map) map.flyTo({ center: [lng, lat], zoom, duration: 900 })
    else setViewState((current) => ({ ...current, latitude: lat, longitude: lng, zoom }))
  }, [])

  const reverseLookup = useCallback(async (lat, lng) => {
    reverseAbort.current?.abort()
    const controller = new AbortController()
    reverseAbort.current = controller
    try {
      const response = await fetch(`${NOMINATIM}/reverse?format=jsonv2&addressdetails=1&zoom=18&lat=${lat}&lon=${lng}`, {
        signal: controller.signal,
        headers: { 'Accept-Language': 'en' },
      })
      if (!response.ok) return
      const data = await response.json()
      setAddressLabel(data?.display_name || '')
      onAddressSuggestion?.({
        area: pickArea(data?.address),
        street: data?.address?.road || null,
        city: pickCity(data?.address),
      })
    } catch {
      // Address lookup is only a convenience — the pin itself is what gets saved.
    }
  }, [onAddressSuggestion])

  const placePin = useCallback((lat, lng) => {
    const next = { latitude: round(lat), longitude: round(lng) }
    onChange(next)
    setAddressLabel('')
    reverseLookup(next.latitude, next.longitude)
  }, [onChange, reverseLookup])

  const locate = useCallback(({ pin = false } = {}) => {
    if (!('geolocation' in navigator)) {
      setGeoMessage('Your browser does not support location access. Search or tap the map instead.')
      return
    }
    setLocating(true)
    setGeoMessage('')
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setLocating(false)
        const position = { latitude: coords.latitude, longitude: coords.longitude }
        setUserPosition(position)
        flyTo(position.latitude, position.longitude, 16)
        if (pin) placePin(position.latitude, position.longitude)
      },
      (error) => {
        setLocating(false)
        setGeoMessage(
          error.code === error.PERMISSION_DENIED
            ? 'Location permission was blocked. Search for the area or tap the map to place the pin.'
            : 'Could not detect your location. Search for the area or tap the map to place the pin.',
        )
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 },
    )
  }, [flyTo, placePin])

  // Open on the owner's current location when no pin exists yet.
  useEffect(() => {
    if (!hasPin) locate()
    return () => {
      searchAbort.current?.abort()
      reverseAbort.current?.abort()
    }
    // Only on first mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const search = async (event) => {
    event?.preventDefault()
    const text = query.trim()
    if (text.length < 2) return
    searchAbort.current?.abort()
    const controller = new AbortController()
    searchAbort.current = controller
    setSearching(true)
    setSearchMessage('')
    try {
      const params = new URLSearchParams({ format: 'jsonv2', q: text, countrycodes: 'pk', viewbox: SEARCH_VIEWBOX, limit: '6', addressdetails: '1' })
      const response = await fetch(`${NOMINATIM}/search?${params}`, { signal: controller.signal, headers: { 'Accept-Language': 'en' } })
      if (!response.ok) throw new Error('search failed')
      const data = await response.json()
      setResults(data)
      if (!data.length) setSearchMessage('No places found. Try a nearby landmark or tap the map directly.')
    } catch (error) {
      if (error.name !== 'AbortError') setSearchMessage('Search is unavailable right now. Tap the map to place the pin.')
    } finally {
      setSearching(false)
    }
  }

  const chooseResult = (result) => {
    const lat = Number(result.lat)
    const lng = Number(result.lon)
    setResults([])
    setQuery(result.name || result.display_name.split(',')[0])
    flyTo(lat, lng, 17)
    placePin(lat, lng)
  }

  return (
    <div className="grid gap-3">
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <form onSubmit={search} className="flex h-12 items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-3 focus-within:border-cyan-300/40">
            <Search className="h-4 w-4 shrink-0 text-slate-500" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search a place, e.g. Jutial, Konodas, Zulfiqarabad"
              aria-label="Search a place on the map"
              className="h-full w-full bg-transparent text-sm text-slate-100 outline-none placeholder:text-slate-600"
            />
            {query && <button type="button" aria-label="Clear search" onClick={() => { setQuery(''); setResults([]); setSearchMessage('') }} className="text-slate-500 hover:text-slate-300"><X className="h-4 w-4" /></button>}
            <button type="button" onClick={search} disabled={searching} className="rounded-xl bg-cyan-300/10 px-3 py-1.5 text-xs font-black text-cyan-200 hover:bg-cyan-300/20 disabled:opacity-50">
              {searching ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Search'}
            </button>
          </form>

          {results.length > 0 && (
            <ul className="absolute inset-x-0 top-14 z-20 max-h-72 overflow-y-auto rounded-2xl border border-white/10 bg-[#0b1322] p-1.5 shadow-2xl">
              {results.map((result) => (
                <li key={result.place_id}>
                  <button type="button" onClick={() => chooseResult(result)} className="flex w-full items-start gap-2.5 rounded-xl px-3 py-2.5 text-left hover:bg-white/[0.06]">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300" />
                    <span className="text-xs leading-5 text-slate-300"><span className="block font-black text-white">{result.name || result.display_name.split(',')[0]}</span>{result.display_name}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <button type="button" onClick={() => locate({ pin: true })} disabled={locating} className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-cyan-300/20 bg-cyan-300/[0.07] px-4 text-xs font-black text-cyan-100 transition hover:bg-cyan-300/[0.12] disabled:opacity-60">
          {locating ? <Loader2 className="h-4 w-4 animate-spin" /> : <LocateFixed className="h-4 w-4" />}
          I'm at the property
        </button>
      </div>

      {searchMessage && <p className="text-xs text-amber-200/80">{searchMessage}</p>}

      <div className="relative h-[340px] overflow-hidden rounded-[24px] border border-white/10 bg-[#0b1322] sm:h-[420px]">
        {mapError ? (
          <div className="grid h-full place-items-center p-6 text-center">
            <div><MapPin className="mx-auto h-6 w-6 text-slate-500" /><p className="mt-3 text-sm font-black text-white">The map could not load</p><p className="mt-1 text-xs text-slate-500">Check your internet connection and reload the page. The area and city fields are still enough to save a draft.</p></div>
          </div>
        ) : (
          <Map
            ref={mapRef}
            {...viewState}
            onMove={(event) => setViewState(event.viewState)}
            onClick={(event) => placePin(event.lngLat.lat, event.lngLat.lng)}
            onLoad={(event) => { mapLoaded.current = true; event.target.resize() }}
            // A failed tile after load is harmless; only a style that never loads is fatal.
            onError={() => { if (!mapLoaded.current) setMapError(true) }}
            mapStyle={import.meta.env.VITE_MAP_STYLE_URL || DEFAULT_STYLE}
            cooperativeGestures
            cursor="crosshair"
            style={{ width: '100%', height: '100%' }}
          >
            <NavigationControl position="top-right" showCompass={false} />

            {userPosition && (
              <Marker latitude={userPosition.latitude} longitude={userPosition.longitude} anchor="center">
                <span className="relative block h-4 w-4" title="Your current location">
                  <span className="absolute inset-0 animate-ping rounded-full bg-blue-400/60" />
                  <span className="absolute inset-0 rounded-full border-2 border-white bg-blue-500 shadow" />
                </span>
              </Marker>
            )}

            {hasPin && (
              <Marker
                latitude={Number(latitude)}
                longitude={Number(longitude)}
                anchor="bottom"
                draggable
                onDragEnd={(event) => placePin(event.lngLat.lat, event.lngLat.lng)}
              >
                <div className="flex cursor-grab flex-col items-center active:cursor-grabbing" title="Drag to adjust">
                  <div className="grid h-11 w-11 place-items-center rounded-full border-4 border-white bg-gradient-to-br from-cyan-400 to-violet-500 text-white shadow-xl">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div className="-mt-1 h-3 w-3 rotate-45 border-b-4 border-r-4 border-white bg-violet-500" />
                </div>
              </Marker>
            )}
          </Map>
        )}

        {!mapError && !hasPin && (
          <div className="pointer-events-none absolute inset-x-3 bottom-3 flex items-center gap-2 rounded-2xl bg-[#07101e]/85 px-4 py-3 text-xs font-bold text-slate-200 backdrop-blur">
            <Crosshair className="h-4 w-4 shrink-0 text-cyan-300" />
            Tap or click on the map exactly where the property is to drop the pin.
          </div>
        )}
      </div>

      {geoMessage && <p className="text-xs text-amber-200/80">{geoMessage}</p>}

      {hasPin ? (
        <div className="flex flex-col gap-3 rounded-2xl border border-cyan-300/15 bg-cyan-300/[0.05] p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-3">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300" />
            <div>
              <p className="text-sm font-black text-cyan-100">Pin placed</p>
              <p className="mt-0.5 text-xs leading-5 text-slate-400">{addressLabel || 'Drag the pin or tap elsewhere on the map to adjust it.'}</p>
              <p className="mt-1 font-mono text-[10px] text-slate-600">{Number(latitude).toFixed(6)}, {Number(longitude).toFixed(6)}</p>
            </div>
          </div>
          <button type="button" onClick={() => { onChange({ latitude: '', longitude: '' }); setAddressLabel('') }} className="self-start rounded-xl border border-white/10 px-3 py-2 text-xs font-black text-slate-300 hover:border-rose-300/30 hover:text-rose-200 sm:self-center">
            Remove pin
          </button>
        </div>
      ) : null}
    </div>
  )
}
