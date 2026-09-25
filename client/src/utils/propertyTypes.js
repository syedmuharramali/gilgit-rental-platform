// Types that can be listed, searched for and chosen as a preference.
// Keep in step with server/src/data/propertyTypes.js.
export const PROPERTY_TYPES = [
  'hostel',
  'hostel_bed',
  'apartment',
  'house',
  'upper_portion',
  'lower_portion',
  'studio',
]

// "Private room" and "Shared room" were retired. Old listings may still carry
// them (their labels stay translated), but they can't be chosen any more.
export const LEGACY_PROPERTY_TYPES = ['shared_room', 'private_room']

export const isLegacyPropertyType = (type) => LEGACY_PROPERTY_TYPES.includes(type)
