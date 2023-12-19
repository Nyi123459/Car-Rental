const path = require("path");

const express = require("express");

const vehicleController = require("../controllers/vehicle");

const router = express.Router();

router.get("/vehicles", vehicleController.getVehicles);

router.get("/viewDetails/:id", vehicleController.viewDetails);

module.exports = router;
