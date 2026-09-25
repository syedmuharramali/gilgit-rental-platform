/*
|--------------------------------------------------------------------------
| Property types
|--------------------------------------------------------------------------
|
| PROPERTY_TYPES is what can be listed, searched for and chosen as a
| preference today.
|
| LEGACY_PROPERTY_TYPES were retired ("private room" and "shared room" do
| not fit how renting works in Gilgit). The schema still accepts them so
| listings that already carry them — including ones under an active rental
| — keep loading and saving, but nothing new can be created with them and a
| listing must switch to a current type before it can be submitted again.
|--------------------------------------------------------------------------
*/

const PROPERTY_TYPES = [
  "hostel",
  "hostel_bed",
  "apartment",
  "house",
  "upper_portion",
  "lower_portion",
  "studio",
];

const LEGACY_PROPERTY_TYPES = [
  "shared_room",
  "private_room",
];

const ALL_PROPERTY_TYPES = [
  ...PROPERTY_TYPES,
  ...LEGACY_PROPERTY_TYPES,
];

const isLegacyPropertyType = (type) =>
  LEGACY_PROPERTY_TYPES.includes(type);

module.exports = {
  PROPERTY_TYPES,
  LEGACY_PROPERTY_TYPES,
  ALL_PROPERTY_TYPES,
  isLegacyPropertyType,
};
