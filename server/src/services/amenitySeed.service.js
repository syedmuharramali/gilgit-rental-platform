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

    let result;

    try {
      result =
        await Amenity.bulkWrite(
          operations,
          { ordered: false }
        );
    } catch (error) {
      /*
      | Two first requests seeding at the same moment can both try to insert
      | the same slug. The other one won, so the amenity exists — that is
      | success, not a 409 for the owner's editor.
      */
      const onlyDuplicates =
        error?.code === 11000 ||
        (Array.isArray(error?.writeErrors) &&
          error.writeErrors.length > 0 &&
          error.writeErrors.every(
            (writeError) => writeError.code === 11000
          ));

      if (!onlyDuplicates) {
        throw error;
      }

      result = error.result || {};
    }

    return {
      total: defaultAmenities.length,
      inserted:
        result.upsertedCount || 0,
    };
  };

module.exports = {
  ensureDefaultAmenities,
};
