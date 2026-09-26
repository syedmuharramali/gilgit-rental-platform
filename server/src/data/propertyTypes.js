/*
|--------------------------------------------------------------------------
| Property types
|--------------------------------------------------------------------------
|
| PROPERTY_TYPES is what can be listed, searched for and chosen as a
| preference today.
|
| LEGACY_PROPERTY_TYPES were retired ("private room" and "shared room" do
| not fit how renting works in Gilgit; "hostel bed" became a seater option
| of a Hostel — `npm run migrate:hostels` converts old listings). The schema still accepts them so
| listings that already carry them — including ones under an active rental
| — keep loading and saving, but nothing new can be created with them and a
| listing must switch to a current type before it can be submitted again.
|--------------------------------------------------------------------------
*/

const PROPERTY_TYPES = [
  "hostel",
  "apartment",
  "house",
  "upper_portion",
  "lower_portion",
  "studio",
  "shop",
  "hotel",
  "guest_house",
];

/*
| Homes are lived in; shops are commercial space rented by the month. They
| share the same rental flow, but shops have no bedrooms, occupants or
| roommates and are never offered as a home match.
*/
const SHOP_TYPES = ["shop"];

/*
| Stays are booked by the night (hotels and guest houses). They have room
| types with nightly prices instead of a monthly rent, and use bookings
| instead of applications, viewings and agreements.
*/
const STAY_TYPES = ["hotel", "guest_house"];

/*
| Hostels rent by the seat: one listing has many seater options and many
| tenants at once, so they never become "rented" as a whole.
*/
const HOSTEL_TYPES = ["hostel"];
const isHostelType = (type) => HOSTEL_TYPES.includes(type);

const HOME_TYPES = PROPERTY_TYPES.filter(
  (type) =>
    !SHOP_TYPES.includes(type) &&
    !STAY_TYPES.includes(type)
);

const isShopType = (type) => SHOP_TYPES.includes(type);
const isStayType = (type) => STAY_TYPES.includes(type);

const LEGACY_PROPERTY_TYPES = [
  "shared_room",
  "private_room",
  "hostel_bed",
];

const ALL_PROPERTY_TYPES = [
  ...PROPERTY_TYPES,
  ...LEGACY_PROPERTY_TYPES,
];

const isLegacyPropertyType = (type) =>
  LEGACY_PROPERTY_TYPES.includes(type);

module.exports = {
  PROPERTY_TYPES,
  HOME_TYPES,
  SHOP_TYPES,
  STAY_TYPES,
  isShopType,
  isStayType,
  HOSTEL_TYPES,
  isHostelType,
  LEGACY_PROPERTY_TYPES,
  ALL_PROPERTY_TYPES,
  isLegacyPropertyType,
};
