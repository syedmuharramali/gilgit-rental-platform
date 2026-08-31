const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");

const app = express();

// Security middleware
app.use(helmet());

// CORS
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);

// Request parsers
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Cookies
app.use(cookieParser());

// HTTP request logger
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

  const authRoutes = require("./routes/auth.routes");
const errorHandler = require("./middleware/error.middleware");
const adminRoutes = require("./routes/admin.routes");
const ownerVerificationRoutes = require(
  "./routes/ownerVerification.routes"
);
const adminVerificationRoutes = require(
  "./routes/adminVerification.routes"
);
const propertyRoutes =
  require(
    "./routes/property.routes"
  );

const amenityRoutes = require(
  "./routes/amenity.routes"
);
const adminPropertyRoutes =
  require(
    "./routes/adminProperty.routes"
  );
  const applicationRoutes =
  require(
    "./routes/application.routes"
  );
  const viewingRoutes =
  require(
    "./routes/viewing.routes"
  );
  const tenancyRoutes =
  require(
    "./routes/tenancy.routes"
  );
  const rentRecordRoutes =
  require(
    "./routes/rentRecord.routes"
  );
  const favoriteRoutes =
  require(
    "./routes/favorite.routes"
  );
  const messagingRoutes = require(
  "./routes/messaging.routes"
);
const reviewRoutes = require(
  "./routes/review.routes"
);

const reportRoutes = require(
  "./routes/report.routes"
);
const notificationRoutes = require(
  "./routes/notification.routes"
);
// Health check
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Gilgit Rental Platform API is running",
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// Root route
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Welcome to Gilgit Rental Platform API",
  });
});

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use(
  "/api/owner-verification",
  ownerVerificationRoutes
);
app.use(
  "/api/admin/verifications",
  adminVerificationRoutes
);
app.use(
  "/api/properties",
  propertyRoutes
);
app.use(
  "/api/amenities",
  amenityRoutes
);
app.use(
  "/api/admin/properties",
  adminPropertyRoutes
);
app.use(
  "/api/applications",
  applicationRoutes
);
app.use(
  "/api/viewings",
  viewingRoutes
);
app.use(
  "/api/tenancies",
  tenancyRoutes
);
app.use(
  "/api/rent-ledger",
  rentRecordRoutes
);
app.use(
  "/api/favorites",
  favoriteRoutes
);
app.use(
  "/api/messages",
  messagingRoutes
);
app.use(
  "/api/reviews",
  reviewRoutes
);

app.use(
  "/api/reports",
  reportRoutes
);
app.use(
  "/api/notifications",
  notificationRoutes
);
// 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// Global error handler
app.use(errorHandler);

module.exports = app;