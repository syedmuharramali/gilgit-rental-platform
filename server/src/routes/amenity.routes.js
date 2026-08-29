const express = require("express");

const {
  getAmenities,
} = require(
  "../controllers/amenity.controller"
);

const router = express.Router();

router.get("/", getAmenities);

module.exports = router;