require("dotenv").config();

const mongoose = require("mongoose");

const connectDB = require("../config/db");
const Property = require("../models/property.model");
const RenterPreference = require("../models/renterPreference.model");
const { safeCreateNotifications } = require("../services/notification.service");
const { LEGACY_PROPERTY_TYPES } = require("../data/propertyTypes");

/*
|--------------------------------------------------------------------------
| One-off migration: retire "Private room" and "Shared room"
|--------------------------------------------------------------------------
|
| - Listings of those types that are live or waiting for review go back to
|   draft, so they leave search until the owner picks a new type.
| - Drafts and rejected listings keep their status.
| - Reserved or rented listings are left exactly as they are: a rental is in
|   progress and they cannot be edited anyway.
| - Every affected owner gets a notification explaining what to do.
| - The retired types are removed from saved renter preferences.
|
| Safe to run again (nothing breaks), but a second run sends the owner
| notifications again — run it once.
|
|   npm run retire:room-types
|
*/

const retireRoomTypes = async () => {
  try {
    await connectDB();

    const affected = await Property.find({
      propertyType: { $in: LEGACY_PROPERTY_TYPES },
      isDeleted: { $ne: true },
      listingStatus: { $ne: "rented" },
      reservationStatus: { $ne: "reserved" },
    }).select("_id owner title listingStatus");

    const toUnpublish = affected
      .filter((property) =>
        ["published", "pending_review"].includes(property.listingStatus)
      )
      .map((property) => property._id);

    let unpublished = 0;

    if (toUnpublish.length > 0) {
      const result = await Property.updateMany(
        { _id: { $in: toUnpublish } },
        {
          $set: {
            listingStatus: "draft",
            publishedAt: null,
            submittedAt: null,
            reviewedAt: null,
            reviewedBy: null,
          },
        }
      );

      unpublished = result.modifiedCount;
    }

    await safeCreateNotifications(
      affected.map((property) => ({
        user: property.owner,
        type: "system",
        title: "Choose a new property type",
        message: `"Private room" and "Shared room" are no longer offered. Open ${property.title}, pick the type that fits best and submit it for review again.`,
        resourceType: "property",
        resourceId: property._id,
      }))
    );

    const preferences = await RenterPreference.updateMany(
      { propertyTypes: { $in: LEGACY_PROPERTY_TYPES } },
      { $pull: { propertyTypes: { $in: LEGACY_PROPERTY_TYPES } } }
    );

    console.log(`${affected.length} listing(s) use a retired type`);
    console.log(`${unpublished} moved from published / in review back to draft`);
    console.log(`${preferences.modifiedCount} renter preference(s) cleaned`);

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error("Retiring room types failed:", error.message);
    await mongoose.connection.close().catch(() => {});
    process.exit(1);
  }
};

retireRoomTypes();
