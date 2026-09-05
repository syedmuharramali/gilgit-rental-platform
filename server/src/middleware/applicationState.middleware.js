const Application = require(
  "../models/application.model"
);

const AppError = require(
  "../utils/AppError"
);

const asyncHandler = require(
  "../utils/asyncHandler"
);

exports.blockIfPropertyHasAcceptedApplication =
  asyncHandler(
    async (req, res, next) => {
      const acceptedApplicationExists =
        await Application.exists({
          property:
            req.params.propertyId,

          status:
            "accepted",
        });

      if (
        acceptedApplicationExists
      ) {
        return next(
          new AppError(
            "This property already has an accepted rental application",
            409
          )
        );
      }

      next();
    }
  );