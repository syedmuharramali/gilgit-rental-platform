const express = require(
  "express"
);

const {
  body,
} = require(
  "express-validator"
);

const {
  createProperty,
  getMyProperties,
  getPublishedProperties,
  getPropertyById,
  updateProperty,
  deletePropertyImage,
  deleteProperty,
  uploadPropertyImages,
  setPropertyCoverImage,
  reorderPropertyImages,
  submitPropertyForReview
} = require(
  "../controllers/property.controller"
);
const {
  uploadPropertyImages:
    uploadPropertyImagesMiddleware,
} = require(
  "../middleware/upload.middleware"
);
const {
  protect,
  optionalAuth,
} = require(
  "../middleware/auth.middleware"
);

const {
  requireVerifiedOwner,
} = require(
  "../middleware/owner.middleware"
);

const {
  requireMutableOwnedProperty,
} = require(
  "../middleware/propertyState.middleware"
);

const validateRequest = require(
  "../middleware/validate.middleware"
);

const router =
  express.Router();

/*
|--------------------------------------------------------------------------
| Property validation
|--------------------------------------------------------------------------
*/

const propertyValidation = [
  body("title")
    .trim()
    .notEmpty()
    .withMessage(
      "Property title is required"
    )
    .isLength({
      min: 5,
      max: 120,
    }),

  body("description")
    .trim()
    .notEmpty()
    .withMessage(
      "Property description is required"
    )
    .isLength({
      min: 20,
      max: 3000,
    }),

  body("propertyType")
    .isIn([
      "hostel",
      "hostel_bed",
      "shared_room",
      "private_room",
      "apartment",
      "house",
      "upper_portion",
      "lower_portion",
      "studio",
    ])
    .withMessage(
      "Invalid property type"
    ),

  body("monthlyRent")
    .isFloat({
      min: 0,
    })
    .withMessage(
      "Monthly rent must be a positive number"
    ),

  body("securityDeposit")
    .optional()
    .isFloat({
      min: 0,
    })
    .withMessage(
      "Security deposit cannot be negative"
    ),

  body("availableFrom")
    .isISO8601()
    .withMessage(
      "availableFrom must be a valid date"
    ),

  body("address.area")
    .trim()
    .notEmpty()
    .withMessage(
      "Property area is required"
    ),

  body("address.city")
    .optional()
    .trim()
    .notEmpty()
    .withMessage(
      "City cannot be empty"
    ),
];

/*
|--------------------------------------------------------------------------
| Public routes
|--------------------------------------------------------------------------
*/

router.get(
  "/",
  getPublishedProperties
);

/*
|--------------------------------------------------------------------------
| Owner routes
|--------------------------------------------------------------------------
*/

router.get(
  "/mine",
  protect,
  getMyProperties
);

router.post(
  "/",
  protect,
  requireVerifiedOwner,
  propertyValidation,
  validateRequest,
  createProperty
);
router.patch(
  "/:id/submit",

  protect,

  requireVerifiedOwner,

  submitPropertyForReview
);

/*
|--------------------------------------------------------------------------
| Single property
|--------------------------------------------------------------------------
*/
router.post(
  "/:id/images",

  protect,

  requireVerifiedOwner,

  requireMutableOwnedProperty,

  uploadPropertyImagesMiddleware,

  uploadPropertyImages
);
router.patch(
  "/:id/images/reorder",

  protect,

  requireVerifiedOwner,

  requireMutableOwnedProperty,

  reorderPropertyImages
);

router.patch(
  "/:id/images/:imageId/cover",

  protect,

  requireVerifiedOwner,

  requireMutableOwnedProperty,

  setPropertyCoverImage
);

router.delete(
  "/:id/images/:imageId",

  protect,

  requireVerifiedOwner,

  requireMutableOwnedProperty,

  deletePropertyImage
);

router.get(
  "/:id",
  optionalAuth,
  getPropertyById
);

router.patch(
  "/:id",
  protect,
  requireVerifiedOwner,
  requireMutableOwnedProperty,
  updateProperty
);

router.delete(
  "/:id",
  protect,
  requireVerifiedOwner,
  requireMutableOwnedProperty,
  deleteProperty
);

module.exports = router;