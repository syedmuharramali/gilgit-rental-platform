const Application = require(
  "../models/application.model"
);

const Property = require(
  "../models/property.model"
);

const { isHostelType } = require(
  "../data/propertyTypes"
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
      // Hostels accept one student per seat; free places are checked
      // when applying and when accepting instead.
      const property = await Property.findById(
        req.params.propertyId
      ).select("propertyType");

      if (isHostelType(property?.propertyType)) {
        return next();
      }

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