const express =
  require("express");

const {
  addFavorite,
  getMyFavorites,
  checkFavorite,
  removeFavorite,
} = require(
  "../controllers/favorite.controller"
);

const {
  protect,
} = require(
  "../middleware/auth.middleware"
);

const router =
  express.Router();

router.use(protect);

/*
|--------------------------------------------------------------------------
| Favorites
|--------------------------------------------------------------------------
*/

router.get(
  "/",
  getMyFavorites
);

router.get(
  "/:propertyId/check",
  checkFavorite
);

router.post(
  "/:propertyId",
  addFavorite
);

router.delete(
  "/:propertyId",
  removeFavorite
);

module.exports = router;