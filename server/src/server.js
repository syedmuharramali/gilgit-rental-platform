require("dotenv").config();

const app = require("./app");
const connectDB = require("./config/db");

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Connect to MongoDB before accepting requests
    await connectDB();

    const server = app.listen(PORT, () => {
      console.log(`
========================================
 Gilgit Rental Platform API
========================================
 Environment : ${process.env.NODE_ENV}
 Port        : ${PORT}
 URL         : http://localhost:${PORT}
========================================
`);
    });

    process.on("unhandledRejection", (error) => {
      console.error("Unhandled Rejection:", error);

      server.close(() => {
        process.exit(1);
      });
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  process.exit(1);
});

startServer();