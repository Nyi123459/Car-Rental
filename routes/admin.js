const path = require("path");

const express = require("express");
const adminController = require("../controllers/admin");
const isAdmin = require("../middleware/is-admin");

const router = express.Router();
// User//
router.get("/admin", isAdmin, adminController.homepage);
router.get("/admin/add", isAdmin, adminController.addCustomer);
router.post("/admin/add", isAdmin, adminController.postCustomer);
router.get("/admin/view/:id", isAdmin, adminController.view);
router.get("/admin/edit/:id", isAdmin, adminController.edit);
router.put("/admin/edit/:id", isAdmin, adminController.editPost);
router.delete("/admin/edit/:id", isAdmin, adminController.deleteCustomer);
router.post("/admin/search", isAdmin, adminController.searchCustomer);

//Vehicle//
router.get("/admin/viewVehicles", isAdmin, adminController.viewVehicles);
router.get("/admin/viewVehicle/:id", isAdmin, adminController.viewVehicle);
router.get("/admin/addVehicle", isAdmin, adminController.getAddVehicle);
router.post("/admin/addVehicle", isAdmin, adminController.postAddVehicle);
router.get("/admin/editVehicle/:id", isAdmin, adminController.getEditVehicle);
router.put("/admin/editVehicle/:id", isAdmin, adminController.postEditVehicle);
router.delete("/admin/editVehicle/:id", isAdmin, adminController.deleteVehicle);
router.post("/admin/searchVehicle", isAdmin, adminController.searchVehicle);

//Bookings//
router.get("/admin/viewBookings", isAdmin, adminController.viewBookings);
router.get("/admin/viewBooking/:id", isAdmin, adminController.viewBooking);
router.delete("/admin/deleteBooking/:id", isAdmin, adminController.deleteBooking);
module.exports = router;
