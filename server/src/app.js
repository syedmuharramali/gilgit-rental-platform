const express =
  require("express");

const cors =
  require("cors");

const helmet =
  require("helmet");

const morgan =
  require("morgan");

const cookieParser =
  require("cookie-parser");

const rateLimit =
  require(
    "express-rate-limit"
  );

const AppError =
  require(
    "./utils/AppError"
  );

const errorHandler =
  require(
    "./middleware/error.middleware"
  );

/*
|--------------------------------------------------------------------------
| Routes
|--------------------------------------------------------------------------
*/

const authRoutes =
  require(
    "./routes/auth.routes"
  );

const adminRoutes =
  require(
    "./routes/admin.routes"
  );

const ownerVerificationRoutes =
  require(
    "./routes/ownerVerification.routes"
  );

const adminVerificationRoutes =
  require(
    "./routes/adminVerification.routes"
  );

const propertyRoutes =
  require(
    "./routes/property.routes"
  );

const amenityRoutes =
  require(
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

const rentalTermsRoutes =
  require(
    "./routes/rentalTerms.routes"
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

const messagingRoutes =
  require(
    "./routes/messaging.routes"
  );

const reviewRoutes =
  require(
    "./routes/review.routes"
  );

const reportRoutes =
  require(
    "./routes/report.routes"
  );

const notificationRoutes =
  require(
    "./routes/notification.routes"
  );

const rentalAgreementRoutes =
  require(
    "./routes/rentalAgreement.routes"
  );

const conditionReportRoutes =
  require(
    "./routes/conditionReport.routes"
  );

const maintenanceRequestRoutes =
  require(
    "./routes/maintenanceRequest.routes"
  );

const scoringRoutes =
  require(
    "./routes/scoring.routes"
  );

const app =
  express();

/*
|--------------------------------------------------------------------------
| Reverse proxy
|--------------------------------------------------------------------------
*/

if (
  process.env.NODE_ENV ===
  "production"
) {
  app.set(
    "trust proxy",
    1
  );
}

app.use(
  helmet()
);

const allowedOrigins =
  [
    process.env.CLIENT_URL,

    ...(
      process.env
        .CLIENT_URLS || ""
    )
      .split(",")
      .map(
        (origin) =>
          origin.trim()
      ),
  ].filter(Boolean);

if (
  process.env.NODE_ENV ===
    "development" &&
  !allowedOrigins.includes(
    "http://localhost:5173"
  )
) {
  allowedOrigins.push(
    "http://localhost:5173"
  );
}

app.use(
  cors({
    origin(
      origin,
      callback
    ) {
      if (!origin) {
        return callback(
          null,
          true
        );
      }

      if (
        allowedOrigins.includes(
          origin
        )
      ) {
        return callback(
          null,
          true
        );
      }

      return callback(
        new AppError(
          "Origin not allowed by CORS",
          403
        )
      );
    },

    credentials: true,

    methods: [
      "GET",
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
      "OPTIONS",
    ],

    allowedHeaders: [
      "Content-Type",
      "Authorization",
    ],
  })
);

const apiLimiter =
  rateLimit({
    windowMs:
      15 * 60 * 1000,

    limit: 300,

    standardHeaders:
      "draft-8",

    legacyHeaders:
      false,

    message: {
      success: false,

      message:
        "Too many requests. Please try again later.",
    },
  });

app.use(
  "/api",
  apiLimiter
);

app.use(
  express.json({
    limit: "1mb",
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "1mb",
  })
);

app.use(
  cookieParser()
);

if (
  process.env.NODE_ENV ===
    "development"
) {
  app.use(
    morgan("dev")
  );
}

app.get(
  "/api/health",
  (req, res) => {
    res
      .status(200)
      .json({
        success: true,

        message:
          "Gilgit Rental Platform API is running",

        environment:
          process.env
            .NODE_ENV,

        timestamp:
          new Date()
            .toISOString(),
      });
  }
);

app.get(
  "/",
  (req, res) => {
    res
      .status(200)
      .json({
        success: true,

        message:
          "Welcome to Gilgit Rental Platform API",
      });
  }
);

app.use(
  "/api/auth",
  authRoutes
);

app.use(
  "/api/admin",
  adminRoutes
);

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
  "/api/rental-terms",
  rentalTermsRoutes
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

app.use(
  "/api/agreements",
  rentalAgreementRoutes
);

app.use(
  "/api/condition-reports",
  conditionReportRoutes
);

app.use(
  "/api/maintenance",
  maintenanceRequestRoutes
);

app.use(
  "/api/scoring",
  scoringRoutes
);

app.use(
  (req, res, next) => {
    next(
      new AppError(
        `Route not found: ${req.method} ${req.originalUrl}`,
        404
      )
    );
  }
);

app.use(
  errorHandler
);

module.exports =
  app;
