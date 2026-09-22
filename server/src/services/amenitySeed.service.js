const slugify = require("slugify");

const Amenity = require(
  "../models/amenity.model"
);

const defaultAmenities = require(
  "../data/defaultAmenities"
);

const toSlug = (name) =>
  slugify(name, {
    lower: true,
    strict: true,
    trim: true,
  });

/*
|--------------------------------------------------------------------------
| Ensure default amenities exist
|--------------------------------------------------------------------------
|
| The property editor requires at least one amenity, so an empty
| Amenity collection makes it impossible to list a property.
|
| mode "missing"   -> insert only amenities that do not exist yet
|                     (never overwrites admin edits; safe on every boot)
| mode "overwrite" -> also reset name/category/icon/isActive
|                     (used by `npm run seed:amenities`)
|
*/

const ensureDefaultAmenities =
  async ({ mode = "missing" } = {}) => {
    const operations =
      defaultAmenities.map(
        (amenity) => {
          const doc = {
            name: amenity.name,
            slug: toSlug(amenity.name),
            category: amenity.category,
            icon: amenity.icon,
            isActive: true,
          };

          return {
            updateOne: {
              filter: {
                slug: doc.slug,
              },

              update:
                mode === "overwrite"
                  ? { $set: doc }
                  : { $setOnInsert: doc },

              upsert: true,
            },
          };
        }
      );

    const result =
      await Amenity.bulkWrite(
        operations,
        { ordered: false }
      );

    return {
      total: defaultAmenities.length,
      inserted:
        result.upsertedCount || 0,
    };
  };

module.exports = {
  ensureDefaultAmenities,
};
