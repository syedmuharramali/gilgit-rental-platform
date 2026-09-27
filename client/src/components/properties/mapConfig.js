/*
 * Mapbox setup shared by every map on the site.
 *
 * The token lives in client/.env as VITE_MAPBOX_TOKEN (a public "pk." token).
 * In the Mapbox account, restrict it to this site's URLs so it can't be
 * reused elsewhere.
 *
 * Two looks: the street map, and satellite photos with road and place names
 * on top. Villages such as Nomal have few mapped streets, so satellite is
 * what lets an owner find their own roof.
 */

export const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || ''

export const MAP_STYLES = {
  streets: 'mapbox://styles/mapbox/streets-v12',
  satellite: 'mapbox://styles/mapbox/satellite-streets-v12',
}

export const GILGIT_CENTER = { latitude: 35.9208, longitude: 74.3089 }

// Gilgit-Baltistan, to keep place search local: [minLng, minLat, maxLng, maxLat]
export const GB_BBOX = [72.5, 34.5, 77.8, 37.1]
