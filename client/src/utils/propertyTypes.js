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
  'shop',
  'hotel',
  'guest_house',
]

// Shops are commercial space rented by the month: same flow as homes, but no
// bedrooms, occupants or roommates, and never offered as a home match.
export const SHOP_TYPES = ['shop']

// Stays (hotels, guest houses) are booked by the night per room type, with
// bookings instead of applications, viewings and agreements.
export const STAY_TYPES = ['hotel', 'guest_house']

export const HOME_TYPES = PROPERTY_TYPES.filter((type) => !SHOP_TYPES.includes(type) && !STAY_TYPES.includes(type))
export const isShopType = (type) => SHOP_TYPES.includes(type)
export const isStayType = (type) => STAY_TYPES.includes(type)

// "Private room" and "Shared room" were retired. Old listings may still carry
// them (their labels stay translated), but they can't be chosen any more.
export const LEGACY_PROPERTY_TYPES = ['shared_room', 'private_room']

export const isLegacyPropertyType = (type) => LEGACY_PROPERTY_TYPES.includes(type)
