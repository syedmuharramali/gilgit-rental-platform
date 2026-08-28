const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const connection = await mongoose.connect(process.env.MONGODB_URI, {
      dbName: process.env.DB_NAME,

      // Force IPv4
      family: 4,

      // Fail faster while debugging
      serverSelectionTimeoutMS: 10000,
    });

    // Verify that MongoDB can actually execute commands
    await connection.connection.db.admin().ping();

    console.log(`MongoDB connected: ${connection.connection.host}`);
    console.log(`Database connected: ${connection.connection.name}`);
    console.log("MongoDB ping successful");
  } catch (error) {
    console.error(`MongoDB connection failed: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;