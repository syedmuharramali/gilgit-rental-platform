/*
|--------------------------------------------------------------------------
| Listing fields per property type
|--------------------------------------------------------------------------
|
| What the add-property form asks for each type:
|
|   about      questions on the "About the place" step, in order
|   required   the ones that must be answered before submitting for review
|   areaUnits  units offered for the size (the first is the default)
|   utilities  which "Winter & utilities" questions apply
|
| Anything a type doesn't ask for is cleared when its type is set, so a
| draft switched from House to Shop doesn't keep its bedrooms.
|
| Keep in step with client/src/utils/listingFields.js.
|--------------------------------------------------------------------------
*/

const ALL_UTILITIES = [
  "heating",
  "hotWater",
  "power",
  "waterSources",
  "waterReliability",
  "roadAccess",
  "winterAccess",
];

const home = (about, required) => ({
  about,
  required,
  areaUnits: ["marla", "kanal", "sqft"],
  utilities: ALL_UTILITIES,
});

const stay = {
  about: [],
  required: [],
  areaUnits: [],
  utilities: ["heating", "hotWater", "power", "waterReliability", "roadAccess", "winterAccess"],
};

const LISTING_FIELDS = {
  house: home(
    ["bedrooms", "bathrooms", "size", "furnishing", "tenantTypes", "maxOccupants"],
    ["bedrooms", "bathrooms"]
  ),
  upper_portion: home(
    ["bedrooms", "bathrooms", "size", "furnishing", "separateEntrance", "separateMeters", "tenantTypes", "maxOccupants"],
    ["bedrooms", "bathrooms"]
  ),
  lower_portion: home(
    ["bedrooms", "bathrooms", "size", "furnishing", "separateEntrance", "separateMeters", "tenantTypes", "maxOccupants"],
    ["bedrooms", "bathrooms"]
  ),
  apartment: {
    ...home(
      ["bedrooms", "bathrooms", "floor", "size", "furnishing", "tenantTypes", "maxOccupants"],
      ["bedrooms", "bathrooms"]
    ),
    areaUnits: ["sqft", "marla"],
  },
  studio: {
    ...home(["bathrooms", "floor", "size", "furnishing", "tenantTypes", "maxOccupants"], []),
    areaUnits: ["sqft", "marla"],
  },
  // Seater options, mess and prices live on their own steps (see
  // HOSTEL_* below); "about" is who it's for and the gate time.
  hostel: {
    about: ["hostelFor", "gateClosesAt"],
    required: ["hostelFor"],
    areaUnits: [],
    utilities: ALL_UTILITIES,
  },
  shop: {
    about: ["size", "floor", "marketName", "bathrooms"],
    required: ["size"],
    areaUnits: ["sqft", "marla"],
    utilities: ["power", "waterReliability", "roadAccess", "winterAccess"],
  },
  hotel: stay,
  guest_house: stay,
};

// Value a field gets when its type doesn't ask for it.
const CLEARED = {
  bedrooms: 0,
  bathrooms: 0,
  floor: null,
  size: null,
  furnishing: "unfurnished",
  tenantTypes: [],
  maxOccupants: null,
  separateEntrance: null,
  separateMeters: null,
  hostelFor: null,
  gateClosesAt: null,
  marketName: null,
};

// Set regardless of the form: hostels come furnished and are rented by the
// seat, a shop is one unit with no bedrooms.
const FIXED = {
  hostel: { furnishedStatus: "furnished", bedrooms: 0, bathrooms: 0 },
  shop: { furnishedStatus: "unfurnished", bedrooms: 0, maxOccupants: 1 },
};

// Where each field lives on the Property document.
const FIELD_PATHS = {
  bedrooms: "bedrooms",
  bathrooms: "bathrooms",
  floor: "floor",
  size: "totalArea.value",
  furnishing: "furnishedStatus",
  tenantTypes: "tenantTypes",
  maxOccupants: "maxOccupants",
  separateEntrance: "separateEntrance",
  separateMeters: "separateMeters",
  hostelFor: "hostelFor",
  gateClosesAt: "gateClosesAt",
  marketName: "marketName",
};

const UTILITY_PATHS = {
  heating: "livingInfo.heatingTypes",
  power: "livingInfo.powerBackups",
  waterSources: "livingInfo.waterSources",
};

const TENANT_TYPES = ["families", "bachelors", "students"];
const HOSTEL_FOR = ["boys", "girls"];
const HEATING_TYPES = ["none", "gas_heater", "wood_stove", "electric_heater", "central", "other"];
const POWER_BACKUPS = ["none", "ups", "solar", "generator", "other"];
const WATER_SOURCES = ["municipal", "boring", "tanker", "spring"];

/*
| Hostels
|
| A hostel lists its seater options (1 seater, 2 seater...). The owner
| quotes each one either per person or per whole room, and says how many
| beds (per person) or rooms (per room) are free.
*/
const HOSTEL_PRICING = ["per_person", "per_room"];
const MAX_SEATER = 8;
const MESS_PLANS = ["included", "optional", "none"];
const MEALS = ["breakfast", "lunch", "dinner"];
const WEEK_DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

const fieldsFor = (type) => LISTING_FIELDS[type] || null;

// "Answered" as the submit check sees it.
const isAnswered = (field, property) => {
  const value = FIELD_PATHS[field]
    .split(".")
    .reduce((current, key) => (current == null ? current : current[key]), property);

  if (["bedrooms", "bathrooms", "size", "maxOccupants"].includes(field)) {
    return Number(value) > 0;
  }

  return value !== null && value !== undefined && value !== "";
};

// The first required field of this listing's type that is still empty.
const firstMissingField = (property) => {
  const fields = fieldsFor(property.propertyType);
  return fields?.required.find((field) => !isAnswered(field, property)) || null;
};

module.exports = {
  LISTING_FIELDS,
  CLEARED,
  FIXED,
  FIELD_PATHS,
  UTILITY_PATHS,
  TENANT_TYPES,
  HOSTEL_FOR,
  HEATING_TYPES,
  POWER_BACKUPS,
  WATER_SOURCES,
  HOSTEL_PRICING,
  MAX_SEATER,
  MESS_PLANS,
  MEALS,
  WEEK_DAYS,
  fieldsFor,
  firstMissingField,
};
