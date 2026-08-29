require("dotenv").config();

const mongoose = require("mongoose");
const slugify = require("slugify");
const connectDB = require(
  "../config/db"
);

const Amenity = require(
  "../models/amenity.model"
);

const amenities = [
  {
    name: "WiFi",
    category: "utilities",
    icon: "wifi",
  },

  {
    name: "Heating",
    category: "comfort",
    icon: "heater",
  },

  {
    name: "Hot Water",
    category: "utilities",
    icon: "hot-water",
  },

  {
    name: "Electricity Backup",
    category: "utilities",
    icon: "battery",
  },

  {
    name: "Gas",
    category: "utilities",
    icon: "flame",
  },

  {
    name: "Parking",
    category: "parking",
    icon: "car",
  },

  {
    name: "CCTV",
    category: "security",
    icon: "camera",
  },

  {
    name: "Security Guard",
    category: "security",
    icon: "shield",
  },

  {
    name: "Kitchen",
    category: "kitchen",
    icon: "utensils",
  },

  {
    name: "Attached Bathroom",
    category: "bathroom",
    icon: "bath",
  },

  {
    name: "Laundry",
    category: "laundry",
    icon: "washing-machine",
  },

  {
    name: "Mess / Food",
    category: "food",
    icon: "food",
  },

  {
    name: "Study Area",
    category: "study",
    icon: "book",
  },

  {
    name: "Furniture",
    category: "comfort",
    icon: "bed",
  },

  {
    name: "Balcony",
    category: "comfort",
    icon: "balcony",
  },

  {
    name: "Separate Entrance",
    category: "other",
    icon: "door",
  },
];

const seedAmenities = async () => {
  try {
    await connectDB();

     for (const amenity of amenities) {
  const slug = slugify(amenity.name, {
    lower: true,
    strict: true,
    trim: true,
  });

  await Amenity.updateOne(
    {
      name: amenity.name,
    },
    {
      $set: {
        name: amenity.name,
        slug,
        category: amenity.category,
        icon: amenity.icon,
        isActive: true,
      },
    },
    {
      upsert: true,
      runValidators: true,
    }
  );
}

    console.log(
      `${amenities.length} amenities seeded successfully`
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