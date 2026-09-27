import Map, { Marker, NavigationControl } from 'react-map-gl/mapbox'
import { Crosshair, Loader2, LocateFixed, MapPin, Search, X } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import 'mapbox-gl/dist/mapbox-gl.css'
import MapStyleToggle, { MapNotConfigured } from './MapStyleToggle'
import { GB_BBOX, GILGIT_CENTER, MAPBOX_TOKEN, MAP_STYLES } from './mapConfig'

/*
 * Place search uses Mapbox (suggestions while typing). Mapbox's free search
 * results may not be stored, so choosing one only moves the map there; the
 * owner then taps their house, and that tap is what gets saved.
 *
 * The Area / Street fields are filled from the pin with OpenStreetMap's
 * Nominatim, whose results may be stored (one lookup per pin, as its usage
 * policy asks).
 */
const MAPBOX_SEARCH = 'https://api.mapbox.com/search/geocode/v6/forward'
const NOMINATIM = 'https://nominatim.openstreetmap.org'
const SEARCH_DELAY_MS = 350

const round = (value) => Math.round(value * 1e6) / 1e6
// Stop refining once the device is this sure (metres), or after LOCATE_FOR_MS.
const GOOD_ACCURACY_M = 25
const LOCATE_FOR_MS = 20000
// Above this the pin is only a starting point and the owner should adjust it.
const ROUGH_ACCURACY_M = 100
const formatDistance = (metres) => (metres >= 1000 ? `${(metres / 1000).toFixed(1)} km` : `${metres} m`)
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
export default function LocationPicker(props) {
  if (!MAPBOX_TOKEN) return <MapNotConfigured className="h-[340px] sm:h-[420px]" />
  return <LocationPickerMap {...props} />
}

function LocationPickerMap({ latitude, longitude, onChange, onAddressSuggestion }) {
  const { t } = useTranslation()
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
  // Satellite first: in villages it's the only way to see your own roof.
  const [look, setLook] = useState('satellite')
  const [pickHint, setPickHint] = useState('')
  const skipNextSearch = useRef(false)

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

  // lookup: fill the address from the pin. Skipped while GPS is still
  // refining, so a rough first fix can't fill in the wrong neighbourhood.
  const placePin = useCallback((lat, lng, { lookup = true } = {}) => {
    const next = { latitude: round(lat), longitude: round(lng) }
    onChange(next)
    setAddressLabel('')
    if (lookup) reverseLookup(next.latitude, next.longitude)
  }, [onChange, reverseLookup])

  /*
   * "I'm at the property" used to take the first answer the browser gave,
   * and allowed a cached one up to a minute old. That first answer is often
   * a rough Wi-Fi / network guess (hundreds of metres to kilometres off),
   * and the cache could even be from somewhere else. Now it asks for a fresh
   * GPS fix, keeps listening for a few seconds, moves the pin each time a
   * more accurate fix arrives, and says how accurate the result is.
   */
  const watchId = useRef(null)
  const watchTimer = useRef(null)
  const [accuracy, setAccuracy] = useState(null)

  const stopWatching = useCallback(() => {
    if (watchId.current !== null) navigator.geolocation?.clearWatch(watchId.current)
    clearTimeout(watchTimer.current)
    watchId.current = null
    setLocating(false)
  }, [])

  const locate = useCallback(({ pin = false } = {}) => {
    if (!('geolocation' in navigator)) {
      setGeoMessage(t('map.noGeolocation'))
      return
    }
    // Browsers only share location on https (or localhost). Opening the
    // dev server on a phone via http://192.168.x.x fails silently otherwise.
    if (!window.isSecureContext) {
      setGeoMessage(t('map.needsHttps'))
      return
    }

    // Opening the page: just centre the map roughly, no pin.
    if (!pin) {
      navigator.geolocation.getCurrentPosition(
        ({ coords }) => {
          setUserPosition({ latitude: coords.latitude, longitude: coords.longitude })
          flyTo(coords.latitude, coords.longitude, 15)
        },
        () => {},
        { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 },
      )
      return
    }

    stopWatching()
    setLocating(true)
    setGeoMessage('')
    setAccuracy(null)
    let best = null

    const finish = () => {
      stopWatching()
      if (best) reverseLookup(round(best.latitude), round(best.longitude))
      else setGeoMessage(t('map.locationTimeout'))
    }

    watchId.current = navigator.geolocation.watchPosition(
      ({ coords }) => {
        if (best && coords.accuracy >= best.accuracy) return
        best = { latitude: coords.latitude, longitude: coords.longitude, accuracy: coords.accuracy }
        setUserPosition({ latitude: best.latitude, longitude: best.longitude })
        setAccuracy(Math.round(best.accuracy))
        flyTo(best.latitude, best.longitude, best.accuracy > 500 ? 14 : 17)
        placePin(best.latitude, best.longitude, { lookup: false })
        if (best.accuracy <= GOOD_ACCURACY_M) finish()
      },
      (error) => {
        // Keep a fix we already have; only report if there is none.
        if (best) return
        stopWatching()
        setGeoMessage(
          error.code === error.PERMISSION_DENIED
            ? t('map.permissionDenied')
            : error.code === error.TIMEOUT
              ? t('map.locationTimeout')
              : t('map.locationFailed'),
        )
      },
      { enableHighAccuracy: true, timeout: LOCATE_FOR_MS, maximumAge: 0 },
    )

    watchTimer.current = setTimeout(finish, LOCATE_FOR_MS)
  }, [flyTo, placePin, reverseLookup, stopWatching, t])

  // A pin the owner places by hand wins over any GPS fix still arriving.
  const placeManually = useCallback((lat, lng) => {
    stopWatching()
    setAccuracy(null)
    setPickHint('')
    placePin(lat, lng)
  }, [placePin, stopWatching])

  // Open on the owner's current location when no pin exists yet.
  useEffect(() => {
    if (!hasPin) locate()
    return () => {
      searchAbort.current?.abort()
      reverseAbort.current?.abort()
      if (watchId.current !== null) navigator.geolocation?.clearWatch(watchId.current)
      clearTimeout(watchTimer.current)
    }
    // Only on first mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const runSearch = useCallback(async (text, { quiet = false } = {}) => {
    searchAbort.current?.abort()
    const controller = new AbortController()
    searchAbort.current = controller
    setSearching(true)
    setSearchMessage('')
    try {
      const params = new URLSearchParams({
        q: text,
        access_token: MAPBOX_TOKEN,
        country: 'pk',
        bbox: GB_BBOX.join(','),
        proximity: `${GILGIT_CENTER.longitude},${GILGIT_CENTER.latitude}`,
        language: 'en',
        limit: '6',
        autocomplete: 'true',
      })
      const response = await fetch(`${MAPBOX_SEARCH}?${params}`, { signal: controller.signal })
      if (!response.ok) throw new Error('search failed')
      const data = await response.json()
      const places = (data?.features || []).filter((feature) => feature?.properties?.coordinates)
      setResults(places)
      if (!places.length && !quiet) setSearchMessage(t('map.noPlaces'))
    } catch (error) {
      if (error.name !== 'AbortError') setSearchMessage(t('map.searchUnavailable'))
    } finally {
      if (searchAbort.current === controller) setSearching(false)
    }
  }, [t])

  // Suggestions while typing (debounced).
  useEffect(() => {
    if (skipNextSearch.current) {
      skipNextSearch.current = false
      return undefined
    }
    const text = query.trim()
    if (text.length < 3) {
      setResults([])
      return undefined
    }
    const timer = setTimeout(() => runSearch(text, { quiet: true }), SEARCH_DELAY_MS)
    return () => clearTimeout(timer)
  }, [query, runSearch])

  const search = (event) => {
    event?.preventDefault()
    const text = query.trim()
    if (text.length >= 2) runSearch(text)
  }

  const placeName = (result) => result.properties.name_preferred || result.properties.name
  const placeDetails = (result) => result.properties.full_address || result.properties.place_formatted || ''

  const chooseResult = (result) => {
    const { latitude: lat, longitude: lng } = result.properties.coordinates
    skipNextSearch.current = true
    setResults([])
    setQuery(placeName(result))
    setLook('satellite')
    flyTo(Number(lat), Number(lng), result.properties.feature_type === 'poi' || result.properties.feature_type === 'address' ? 18 : 16)
    setPickHint(t('map.tapYourHouse'))
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
              placeholder={t('map.searchPlaceholder')}
              aria-label={t('map.searchAria')}
              className="h-full w-full bg-transparent text-sm text-slate-100 outline-none placeholder:text-slate-600"
            />
            {query && <button type="button" aria-label={t('map.clearSearch')} onClick={() => { setQuery(''); setResults([]); setSearchMessage('') }} className="text-slate-500 hover:text-slate-300"><X className="h-4 w-4" /></button>}
            <button type="button" onClick={search} disabled={searching} className="rounded-xl bg-cyan-300/10 px-3 py-1.5 text-xs font-black text-cyan-200 hover:bg-cyan-300/20 disabled:opacity-50">
              {searching ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : t('map.search')}
            </button>
          </form>

          {results.length > 0 && (
            <ul className="absolute inset-x-0 top-14 z-20 max-h-72 overflow-y-auto rounded-2xl border border-white/10 bg-[#0b1322] p-1.5 shadow-2xl">
              {results.map((result) => (
                <li key={result.properties.mapbox_id || result.id}>
                  <button type="button" onClick={() => chooseResult(result)} className="flex w-full items-start gap-2.5 rounded-xl px-3 py-2.5 text-left hover:bg-white/[0.06]">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300" />
                    <span className="text-xs leading-5 text-slate-300"><span className="block font-black text-white">{placeName(result)}</span>{placeDetails(result)}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <button type="button" onClick={() => locate({ pin: true })} disabled={locating} className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-cyan-300/20 bg-cyan-300/[0.07] px-4 text-xs font-black text-cyan-100 transition hover:bg-cyan-300/[0.12] disabled:opacity-60">
          {locating ? <Loader2 className="h-4 w-4 animate-spin" /> : <LocateFixed className="h-4 w-4" />}
          {t('map.imAtProperty')}
        </button>
      </div>

      {searchMessage && <p className="text-xs text-amber-200/80">{searchMessage}</p>}
      {pickHint && !searchMessage && <p className="text-xs font-bold text-cyan-200">{pickHint}</p>}

      <div className="relative h-[340px] overflow-hidden rounded-[24px] border border-white/10 bg-[#0b1322] sm:h-[420px]">
        {mapError ? (
          <div className="grid h-full place-items-center p-6 text-center">
            <div><MapPin className="mx-auto h-6 w-6 text-slate-500" /><p className="mt-3 text-sm font-black text-white">{t('map.loadFailed')}</p><p className="mt-1 text-xs text-slate-500">{t('map.loadFailedText')}</p></div>
          </div>
        ) : (
          <Map
            ref={mapRef}
            mapboxAccessToken={MAPBOX_TOKEN}
            {...viewState}
            onMove={(event) => setViewState(event.viewState)}
            onClick={(event) => placeManually(event.lngLat.lat, event.lngLat.lng)}
            onLoad={(event) => { mapLoaded.current = true; event.target.resize() }}
            // A failed tile after load is harmless; only a style that never loads is fatal.
            onError={() => { if (!mapLoaded.current) setMapError(true) }}
            mapStyle={MAP_STYLES[look]}
            cooperativeGestures
            cursor="crosshair"
            style={{ width: '100%', height: '100%' }}
          >
            <NavigationControl position="top-right" showCompass={false} />

            {userPosition && (
              <Marker latitude={userPosition.latitude} longitude={userPosition.longitude} anchor="center">
                <span className="relative block h-4 w-4" title={t('map.yourLocation')}>
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
                onDragEnd={(event) => placeManually(event.lngLat.lat, event.lngLat.lng)}
              >
                <div className="flex cursor-grab flex-col items-center active:cursor-grabbing" title={t('map.dragToAdjust')}>
                  <div className="grid h-11 w-11 place-items-center rounded-full border-4 border-white bg-gradient-to-br from-cyan-400 to-violet-500 text-white shadow-xl">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div className="-mt-1 h-3 w-3 rotate-45 border-b-4 border-r-4 border-white bg-violet-500" />
                </div>
              </Marker>
            )}
          </Map>
        )}

        {!mapError && <MapStyleToggle value={look} onChange={setLook} />}

        {!mapError && !hasPin && (
          <div className="pointer-events-none absolute inset-x-3 bottom-3 flex items-center gap-2 rounded-2xl bg-[#07101e]/85 px-4 py-3 text-xs font-bold text-slate-200 backdrop-blur">
            <Crosshair className="h-4 w-4 shrink-0 text-cyan-300" />
            {t('map.tapToPin')}
          </div>
        )}
      </div>

      {geoMessage && <p className="text-xs text-amber-200/80">{geoMessage}</p>}

      {accuracy !== null && (
        <p className={`rounded-2xl border px-4 py-3 text-xs leading-5 ${accuracy > ROUGH_ACCURACY_M ? 'border-amber-300/20 bg-amber-300/[0.06] text-amber-100' : 'border-emerald-300/15 bg-emerald-300/[0.05] text-emerald-100'}`}>
          {locating
            ? t('map.refining', { distance: formatDistance(accuracy) })
            : accuracy > ROUGH_ACCURACY_M
              ? t('map.roughLocation', { distance: formatDistance(accuracy) })
              : t('map.goodLocation', { distance: formatDistance(accuracy) })}
        </p>
      )}

      {hasPin ? (
        <div className="flex flex-col gap-3 rounded-2xl border border-cyan-300/15 bg-cyan-300/[0.05] p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-3">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300" />
            <div>
              <p className="text-sm font-black text-cyan-100">{t('map.pinPlaced')}</p>
              <p className="mt-0.5 text-xs leading-5 text-slate-400">{addressLabel || t('map.pinHint')}</p>
              <p className="mt-1 font-mono text-[10px] text-slate-600">{Number(latitude).toFixed(6)}, {Number(longitude).toFixed(6)}</p>
            </div>
          </div>
          <button type="button" onClick={() => { stopWatching(); setAccuracy(null); onChange({ latitude: '', longitude: '' }); setAddressLabel('') }} className="self-start rounded-xl border border-white/10 px-3 py-2 text-xs font-black text-slate-300 hover:border-rose-300/30 hover:text-rose-200 sm:self-center">
            {t('map.removePin')}
          </button>
        </div>
      ) : null}
    </div>
  )
}
