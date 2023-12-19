const mongoose = require("mongoose");
const Vehicle = require("../models/vehicle");

exports.getVehicles = async (req, res, next) => {
  const messages = await req.consumeFlash("info");
  const perPage = 4;
  const page = parseInt(req.query.page) || 1;
  try {
    const vehicles = await Vehicle.aggregate([
      { $sort: { updatedAt: -1 } },
      { $skip: perPage * page - perPage },
      { $limit: perPage },
    ]);

    const count = await Vehicle.countDocuments();
    const totalPages = Math.ceil(count / perPage);

    res.render("ser", {
      pageTitle: "View Vehicles",
      vehicles,
      current: page,
      pages: totalPages,
      messages,
    });
  } catch (error) {
    console.log(error);
  }
};

exports.viewDetails = async (req, res, next) => {
  try {
    const vehicle = await Vehicle.findOne({ _id: req.params.id });
    res.render("viewDetails", {
      pageTitle: "View Vehicle",
      vehicle,
    });
  } catch (err) {
    console.log(err);
  }
};
