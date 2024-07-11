const path = require("path");
const stripe = require("stripe")(process.env.SECRET_KEY);

const express = require("express");

const vehicleController = require("../controllers/vehicle");
const isAdmin = require("../middleware/is-admin");
const { isAuth } = require("../middleware/is-auth");

const router = express.Router();

router.get("/vehicles", vehicleController.getVehicles);

router.get("/viewDetails/:id", vehicleController.viewDetails);

router.post("/booking", vehicleController.booking);

router.post("/confirmBooking", vehicleController.confirmBooking);

router.delete("/webhook/deleteBooking", vehicleController.deleteBooking);

router.post("/webhook/payment/", vehicleController.payment);

router.get("/webhook/payment", vehicleController.payment);

//routes for review
router.get("/reviews", vehicleController.getReviews);

router.post("/vehicles/:id/reviews", isAuth, vehicleController.submitReview);

router.delete(
  "/vehicles/:id/reviews/:reviewId",
  isAdmin,
  vehicleController.deleteReview
);

module.exports = router;
