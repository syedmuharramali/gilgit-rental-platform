/*
|--------------------------------------------------------------------------
| Default amenity catalogue
|--------------------------------------------------------------------------
|
| Single source of truth for the amenities an owner can pick when
| creating a property. Used by the startup self-seed and by
| `npm run seed:amenities`.
|
*/

module.exports = [
  { name: "WiFi", category: "utilities", icon: "wifi" },
  { name: "Heating", category: "comfort", icon: "heater" },
  { name: "Hot Water", category: "utilities", icon: "hot-water" },
  { name: "Electricity Backup", category: "utilities", icon: "battery" },
  { name: "Gas", category: "utilities", icon: "flame" },
  { name: "Parking", category: "parking", icon: "car" },
  { name: "CCTV", category: "security", icon: "camera" },
  { name: "Security Guard", category: "security", icon: "shield" },
  { name: "Kitchen", category: "kitchen", icon: "utensils" },
  { name: "Attached Bathroom", category: "bathroom", icon: "bath" },
  { name: "Laundry", category: "laundry", icon: "washing-machine" },
  { name: "Mess / Food", category: "food", icon: "food" },
  { name: "Study Area", category: "study", icon: "book" },
  { name: "Furniture", category: "comfort", icon: "bed" },
  { name: "Balcony", category: "comfort", icon: "balcony" },
  { name: "Separate Entrance", category: "other", icon: "door" },
];
