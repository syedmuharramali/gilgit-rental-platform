require("dotenv").config();

const {
  validateEnv,
} = require("./config/env");

validateEnv();

const mongoose =
  require("mongoose");

const app =
  require("./app");

const connectDB =
  require("./config/db");

const PORT =
  Number(
    process.env.PORT
  ) || 5000;

let server;

let shuttingDown =
  false;

/*
|--------------------------------------------------------------------------
| Graceful shutdown
|--------------------------------------------------------------------------
*/

const shutdown =
  async (
    signal,
    exitCode = 0
  ) => {
    if (shuttingDown) {
      return;
    }

    shuttingDown = true;

    console.log(
      `${signal} received. Shutting down gracefully...`
    );

    const forceExit =
      setTimeout(() => {
        console.error(
          "Forced shutdown after timeout"
        );

        process.exit(1);
      }, 10000);

    forceExit.unref();

    try {
      if (server) {
        await new Promise(
          (resolve) => {
            server.close(
              resolve
            );
          }
        );
      }

      if (
        mongoose
          .connection
          .readyState !== 0
      ) {
        await mongoose.disconnect();
      }

      console.log(
        "Server shutdown complete"
      );

      process.exit(
        exitCode
      );
    } catch (error) {
      console.error(
        "Shutdown error:",
        error
      );

      process.exit(1);
    }
  };

/*
|--------------------------------------------------------------------------
| Start
|--------------------------------------------------------------------------
*/

const startServer =
  async () => {
    try {
      await connectDB();

      server =
        app.listen(
          PORT,
          () => {
            console.log(
              [
                "",
                "========================================",
                " Gilgit Rental Platform API",
                "========================================",
                ` Environment : ${process.env.NODE_ENV}`,
                ` Port        : ${PORT}`,
                ` URL         : http://localhost:${PORT}`,
                "========================================",
                "",
              ].join("\n")
            );
          }
        );
    } catch (error) {
      console.error(
        "Failed to start server:",
        error.message
      );

      process.exit(1);
    }
  };

/*
|--------------------------------------------------------------------------
| Process errors
|--------------------------------------------------------------------------
*/

process.on(
  "unhandledRejection",
  (error) => {
    console.error(
      "Unhandled Rejection:",
      error
    );

    shutdown(
      "unhandledRejection",
      1
    );
  }
);

process.on(
  "uncaughtException",
  (error) => {
    console.error(
      "Uncaught Exception:",
      error
    );

    shutdown(
      "uncaughtException",
      1
    );
  }
);

/*
|--------------------------------------------------------------------------
| Deployment shutdown signals
|--------------------------------------------------------------------------
*/

process.on(
  "SIGTERM",
  () =>
    shutdown(
      "SIGTERM",
      0
    )
);

process.on(
  "SIGINT",
  () =>
    shutdown(
      "SIGINT",
      0
    )
);

startServer();