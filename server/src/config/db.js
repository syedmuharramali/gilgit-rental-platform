const dns = require("node:dns");

const mongoose = require(
  "mongoose"
);

/*
|--------------------------------------------------------------------------
| Local DNS workaround
|--------------------------------------------------------------------------
|
| Our Windows/local network previously had trouble resolving MongoDB Atlas
| SRV records.
|
| Never override the production server's DNS configuration.
|--------------------------------------------------------------------------
*/

if (
  process.env.NODE_ENV ===
  "development"
) {
  dns.setServers([
    "8.8.8.8",
    "8.8.4.4",
  ]);
}

/*
|--------------------------------------------------------------------------
| Connect MongoDB
|--------------------------------------------------------------------------
*/

const connectDB = async () => {
  const connection =
    await mongoose.connect(
      process.env.MONGODB_URI,
      {
        dbName:
          process.env.DB_NAME,

        family: 4,

        serverSelectionTimeoutMS:
          10000,
      }
    );

  /*
  |--------------------------------------------------------------------------
  | Verify actual database connectivity
  |--------------------------------------------------------------------------
  */

  await connection.connection.db
    .admin()
    .ping();

  console.log(
    `MongoDB connected: ${connection.connection.host}`
  );

  console.log(
    `Database: ${connection.connection.name}`
  );

  return connection;
};

module.exports =
  connectDB;