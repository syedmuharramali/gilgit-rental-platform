/*
 * What the add-property form asks for each property type.
 *
 *   about      questions on the "About the place" step, in order
 *   required   the ones that must be answered before submitting for review
 *   areaUnits  units offered for the size (the first is the default)
 *   utilities  which "Winter & utilities" questions apply
 *
 * The server clears whatever a type doesn't ask for, and checks `required`
 * when the listing is submitted. Keep in step with
 * server/src/data/listingFields.js.
 */

const ALL_UTILITIES = ['heating', 'hotWater', 'power', 'waterSources', 'waterReliability', 'roadAccess', 'winterAccess']

const home = (about, required) => ({ about, required, areaUnits: ['marla', 'kanal', 'sqft'], utilities: ALL_UTILITIES })
const stay = { about: [], required: [], areaUnits: [], utilities: ['heating', 'hotWater', 'power', 'waterReliability', 'roadAccess', 'winterAccess'] }

export const LISTING_FIELDS = {
  house: home(['bedrooms', 'bathrooms', 'size', 'furnishing', 'tenantTypes', 'maxOccupants'], ['bedrooms', 'bathrooms']),
  upper_portion: home(['bedrooms', 'bathrooms', 'size', 'furnishing', 'separateEntrance', 'separateMeters', 'tenantTypes', 'maxOccupants'], ['bedrooms', 'bathrooms']),
  lower_portion: home(['bedrooms', 'bathrooms', 'size', 'furnishing', 'separateEntrance', 'separateMeters', 'tenantTypes', 'maxOccupants'], ['bedrooms', 'bathrooms']),
  apartment: { ...home(['bedrooms', 'bathrooms', 'floor', 'size', 'furnishing', 'tenantTypes', 'maxOccupants'], ['bedrooms', 'bathrooms']), areaUnits: ['sqft', 'marla'] },
  studio: { ...home(['bathrooms', 'floor', 'size', 'furnishing', 'tenantTypes', 'maxOccupants'], []), areaUnits: ['sqft', 'marla'] },
  // Seater options, prices and mess have their own sections (HOSTEL_* below).
  hostel: { about: ['hostelFor', 'gateClosesAt'], required: ['hostelFor'], areaUnits: [], utilities: ALL_UTILITIES },
  shop: { about: ['size', 'floor', 'marketName', 'bathrooms'], required: ['size'], areaUnits: ['sqft', 'marla'], utilities: ['power', 'waterReliability', 'roadAccess', 'winterAccess'] },
  hotel: stay,
  guest_house: stay,
}

const NONE = { about: [], required: [], areaUnits: [], utilities: [] }
export const fieldsFor = (type) => LISTING_FIELDS[type] || NONE

// The type cards on the first step, grouped the way renters search.
export const TYPE_GROUPS = [
  { key: 'homes', types: ['house', 'upper_portion', 'lower_portion', 'apartment', 'studio'] },
  { key: 'hostels', types: ['hostel'] },
  { key: 'shops', types: ['shop'] },
  { key: 'stays', types: ['hotel', 'guest_house'] },
]

export const TENANT_TYPES = ['families', 'bachelors', 'students']
export const HOSTEL_FOR = ['boys', 'girls']
export const HEATING_TYPES = ['gas_heater', 'wood_stove', 'electric_heater', 'central', 'other']
export const POWER_BACKUPS = ['ups', 'solar', 'generator', 'other']
export const WATER_SOURCES = ['municipal', 'boring', 'tanker', 'spring']

// Hostels: seater options priced per person or per whole room, and a mess.
export const HOSTEL_PRICING = ['per_person', 'per_room']
export const MAX_SEATER = 8
export const MESS_PLANS = ['included', 'optional', 'none']
export const MEALS = ['breakfast', 'lunch', 'dinner']
export const WEEK_DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']

// Price of one person's place in a seater option.
export const pricePerPerson = (pricing, room) =>
  pricing === 'per_room' ? Math.round(Number(room.price) / Math.max(1, Number(room.seater) || 1)) : Number(room.price) || 0

/*
 * Amenities the form already asks about as a question (heating, furnishing,
 * separate entrance...) and ones that don't fit a type. They're hidden from
 * the optional amenity chips, unless the listing already has them.
 */
const ASKED_ELSEWHERE = ['heating', 'hot-water', 'electricity-backup', 'separate-entrance', 'furniture']
const HIDDEN_AMENITIES = {
  homes: ['mess-food', 'study-area'],
  hostels: ['mess-food', 'gas', 'balcony'],
  shops: ['kitchen', 'laundry', 'study-area', 'balcony', 'mess-food', 'gas', 'attached-bathroom'],
  stays: ['study-area', 'gas'],
}

// Also hidden from the search page's amenity list: new listings answer these
// as questions (the heating / hot water / backup / furnishing filters), so an
// amenity filter would only ever find old listings.
export const isAskedElsewhere = (slug) => ASKED_ELSEWHERE.includes(slug)

export const groupOf = (type) => TYPE_GROUPS.find((group) => group.types.includes(type))?.key || 'homes'

export const amenityFitsType = (amenity, type) =>
  !ASKED_ELSEWHERE.includes(amenity.slug) && !(HIDDEN_AMENITIES[groupOf(type)] || []).includes(amenity.slug)
