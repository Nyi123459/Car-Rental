const express = require("express");

const riderController = require("../controllers/ride");
const reviewsController = require("../controllers/reviews");
const aboutController = require("../controllers/about");

const router = express.Router();

router.get("/home", (req, res, next) => {
  res.render("main");
});

router.get("/ride", riderController.ride);

router.get("/about", aboutController.about);

router.get("/reviews", reviewsController.reviews);

module.exports = router;
