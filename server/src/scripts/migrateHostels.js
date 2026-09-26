require("dotenv").config();

const mongoose = require("mongoose");

const connectDB = require("../config/db");
const Property = require("../models/property.model");
const Application = require("../models/application.model");
const Tenancy = require("../models/tenancy.model");
const { MAX_SEATER } = require("../data/listingFields");
const { unitsFor } = require("../services/hostelSeats.service");

/*
|--------------------------------------------------------------------------
| One-off migration: hostels rent by the seat
|--------------------------------------------------------------------------
|
| 1. "Hostel bed" listings become "Hostel" listings. Every hostel without
|    seater options gets one, built from what it had:
|      hostel bed  -> per-person price, a room of "beds per room" (or 1)
|      hostel room -> per-room price, a room for its old max occupants
|    with 1 free place (0 if it was rented). "Meals included" becomes the
|    mess plan (included / none).
| 2. A hostel that was "rented" or "reserved" as a whole is listed again:
|    hostels now stay open while seats are free.
| 3. Existing hostel applications and tenancies are linked to that option
|    (and accepted ones get their own slot), so they keep working.
| 4. The Application and Tenancy indexes are synced. This drops the old
|    "one accepted application / one active tenancy per property" index,
|    which would otherwise stop a hostel accepting a second student.
|
| Safe to run again: listings saved by the new code are skipped and the
| index sync is idempotent.
|
|   npm run migrate:hostels
|
*/

const clampSeater = (value) =>
  Math.min(MAX_SEATER, Math.max(1, Math.round(Number(value) || 1)));

const migrateHostels = async () => {
  try {
    await connectDB();

    const collection = Property.collection;

    // Only listings saved before hostels had seater options: anything the
    // new code saved has hostelPricing, so a second run leaves it alone.
    const hostels = await collection
      .find({
        propertyType: { $in: ["hostel", "hostel_bed"] },
        hostelPricing: null, // also matches "not set"
        $or: [{ hostelRooms: { $exists: false } }, { hostelRooms: { $size: 0 } }],
      })
      .toArray();

    let converted = 0;
    let relisted = 0;

    for (const hostel of hostels) {
      const wasBed = hostel.propertyType === "hostel_bed";
      const wasRented = hostel.listingStatus === "rented";
      const pricing = wasBed ? "per_person" : "per_room";

      const applications = await Application.collection
        .find({ property: hostel._id, status: { $in: ["pending", "accepted"] } })
        .toArray();

      // The old listing was one unit: taken if it was rented or someone
      // had been accepted. The room must also fit its largest group.
      const taken = wasRented || applications.some((item) => item.status === "accepted");
      const largestGroup = Math.max(1, ...applications.map((item) => Number(item.occupants) || 1));

      const option = {
        _id: new mongoose.Types.ObjectId(),
        seater: clampSeater(
          Math.max(largestGroup, Number(wasBed ? hostel.bedsPerRoom : hostel.maxOccupants) || 1)
        ),
        price: Number(hostel.monthlyRent) || 0,
        available: taken ? 0 : 1,
      };
      const perPerson =
        pricing === "per_room"
          ? Math.round(option.price / option.seater)
          : option.price;

      const set = {
        propertyType: "hostel",
        hostelPricing: pricing,
        hostelRooms: [option],
        monthlyRent: perPerson,
        maxOccupants: null,
        furnishedStatus: "furnished",
        bedrooms: 0,
        bathrooms: 0,
        "mess.plan":
          hostel.mealsIncluded === true
            ? "included"
            : hostel.mealsIncluded === false
              ? "none"
              : null,
        reservationStatus: "available",
        reservedAt: null,
      };

      if (wasRented) {
        set.listingStatus = "published";
        set.publishedAt = new Date();
        relisted += 1;
      }

      await collection.updateOne(
        { _id: hostel._id },
        { $set: set, $unset: { bedsPerRoom: "", mealsIncluded: "" } }
      );

      // Link its applications to the new option.
      for (const application of applications) {
        const occupants = Math.min(Number(application.occupants) || 1, option.seater);

        await Application.collection.updateOne(
          { _id: application._id },
          {
            $set: {
              hostelRoom: {
                id: option._id,
                seater: option.seater,
                price: option.price,
                pricing,
              },
              units: unitsFor(pricing, occupants),
              slotKey: application.status === "accepted" ? application._id : null,
            },
          }
        );

        if (application.status === "accepted") {
          await Tenancy.collection.updateMany(
            { application: application._id },
            { $set: { slotKey: application._id } }
          );
        }
      }

      converted += 1;
    }

    // Hostels that already had options but were still reserved as a whole.
    const unreserved = await collection.updateMany(
      { propertyType: "hostel", reservationStatus: "reserved" },
      { $set: { reservationStatus: "available", reservedAt: null } }
    );

    await Application.syncIndexes();
    await Tenancy.syncIndexes();

    console.log(`${converted} hostel listing(s) given seater options`);
    console.log(`${relisted} rented hostel(s) listed again — ask their owners to check free places`);
    console.log(`${unreserved.modifiedCount} reserved hostel(s) opened again`);
    console.log("Application and Tenancy indexes synced");

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error("Hostel migration failed:", error.message);
    await mongoose.connection.close().catch(() => {});
    process.exit(1);
  }
};

migrateHostels();
