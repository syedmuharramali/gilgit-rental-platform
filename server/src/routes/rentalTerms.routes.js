const express = require("express");

const {
  getMyRentalTerms,
  proposeRentalTerms,
  acceptRentalTerms,
  requestRentalTermChanges,
} = require("../controllers/rentalTerms.controller");

const { protect } = require("../middleware/auth.middleware");

const router = express.Router();

router.use(protect);

router.get("/", getMyRentalTerms);
router.put("/application/:applicationId", proposeRentalTerms);
router.patch("/:id/accept", acceptRentalTerms);
router.patch("/:id/request-changes", requestRentalTermChanges);

module.exports = router;
