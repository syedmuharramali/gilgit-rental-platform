const express = require("express");

const {
  savePreferences,
  getMyPreferences,
  getSmartMatches,
  getPropertyLivingScore,
} = require(
  "../controllers/scoring.controller"
);

const {
  protect,
} = require(
  "../middleware/auth.middleware"
);

const router =
  express.Router();

/*
|--------------------------------------------------------------------------
| Public Gilgit score
|--------------------------------------------------------------------------
*/

router.get(
  "/properties/:propertyId/living-score",
  getPropertyLivingScore
);

/*
|--------------------------------------------------------------------------
| Authenticated matching
|--------------------------------------------------------------------------
*/

router.use(protect);

router.get(
  "/preferences",
  getMyPreferences
);

router.put(
  "/preferences",
  savePreferences
);

router.get(
  "/matches",
  getSmartMatches
);

module.exports = router;