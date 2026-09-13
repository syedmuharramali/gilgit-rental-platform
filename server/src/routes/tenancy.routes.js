const express = require("express");
const {
  getMyTenancies,
  getOwnedTenancies,
} = require("../controllers/tenancyLifecycle.controller");
const { protect } = require("../middleware/auth.middleware");

const router = express.Router();

router.use(protect);

// Kept only for property reviews attached to historic, completed rentals.
router.get("/mine", getMyTenancies);
router.get("/owned", getOwnedTenancies);

module.exports = router;
