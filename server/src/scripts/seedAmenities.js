require("dotenv").config();

const mongoose = require("mongoose");

const connectDB = require(
  "../config/db"
);

const {
  ensureDefaultAmenities,
} = require(
  "../services/amenitySeed.service"
);

const seedAmenities = async () => {
  try {
    await connectDB();

    const { total, inserted } =
      await ensureDefaultAmenities({
        mode: "overwrite",
      });

    console.log(
      `${total} amenities seeded successfully (${inserted} new)`
    );

    await mongoose.connection.close();

    process.exit(0);
  } catch (error) {
    console.error(
      "Amenity seed failed:",
      error
    );

    await mongoose.connection.close();

    process.exit(1);
  }
};

seedAmenities();
