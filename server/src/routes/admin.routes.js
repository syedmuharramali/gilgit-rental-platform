const express = require("express");

const {
  protect,
  authorize,
} = require("../middleware/auth.middleware");

const {
  getAdminDashboard,
} = require("../controllers/admin.controller");

const router = express.Router();

router.get(
  "/dashboard",
  protect,
  authorize("admin"),
  getAdminDashboard
);

module.exports = router;