const bcrypt = require("bcryptjs");

const Customer = require("../models/user");
const Vehicle = require("../models/vehicle");
const Booking = require("../models/booking");
const fileHelper = require("../util/file");

// User //
exports.homepage = async (req, res) => {
  const perPage = 12;
  const page = parseInt(req.query.page) || 1;

  try {
    const customers = await Customer.aggregate([
      { $sort: { updatedAt: -1 } },
      { $skip: perPage * page - perPage },
      { $limit: perPage },
    ]);

    const count = await Customer.countDocuments();
    const totalPages = Math.ceil(count / perPage);

    res.render("admin/index", {
      pageTitle: "Dashboard",
      customers,
      current: page,
      pages: totalPages,
    });
  } catch (error) {
    console.log(error);
  }
};

exports.addCustomer = async (req, res) => {
  res.render("admin/customer/add", { pageTitle: "Add New Custome" });
};

exports.postCustomer = async (req, res) => {
  const { firstName, lastName,  tel, email, password } = req.body;
  try {
    const existingUser = await Customer.findOne({ email });
    if (existingUser) {
      if (existingUser.email === email) {
        return console.log("Email already exist", email);
      }
    }
    const hashedPassword = await bcrypt.hash(password, 10);

    const newCustomer = new Customer({
      firstName: firstName,
      lastName: lastName,
      tel: tel,
      email: email,
      password: hashedPassword,
    });

    await Customer.create(newCustomer);
    res.redirect("/admin");
  } catch (error) {
    console.log(error);
  }
};

exports.view = async (req, res) => {
  try {
    const customer = await Customer.findOne({ _id: req.params.id });
    res.render("admin/customer/view", {
      pageTitle: "View Customer Data",
      customer,
    });
  } catch (error) {
    console.log(error);
  }
};

exports.edit = async (req, res) => {
  try {
    const customer = await Customer.findOne({ _id: req.params.id });
    res.render("admin/customer/edit", {
      pageTitle: "Edit Customer Data",
      customer,
    });
  } catch (error) {
    console.log(error);
  }
};

exports.editPost = async (req, res) => {
  try {
    await Customer.findByIdAndUpdate(req.params.id, {
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      tel: req.body.tel,
      details: req.body.details,
      updatedAt: Date.now(),
    });
    await res.redirect(`/admin`);
  } catch (error) {
    console.log(error);
  }
};

exports.deleteCustomer = async (req, res) => {
  try {
    await Customer.deleteOne({ _id: req.params.id });
    res.redirect("/");
  } catch (error) {
    console.log(error);
  }
};

exports.searchCustomer = async (req, res) => {
  try {
    let searchTerm = req.body.searchTerm;
    const searchNoSpecialChar = searchTerm.replace(/[^a-zA-Z0-9 ]/g, "");
    const customers = await Customer.find({
      $or: [
        { firstName: { $regex: new RegExp(searchNoSpecialChar, "i") } },
        { lastName: { $regex: new RegExp(searchNoSpecialChar, "i") } },
      ],
    });
    res.render("admin/search", {
      customers,
      pageTitle: "Edit Customer Data",
    });
  } catch (error) {
    console.log(error);
  }
}; // User //

//  Vehicle  //

exports.viewVehicles = async (req, res) => {
  const perPage = 6;
  const page = parseInt(req.query.page) || 1;
  try {
    const vehicles = await Vehicle.aggregate([
      { $sort: { updatedAt: -1 } },
      { $skip: perPage * page - perPage },
      { $limit: perPage },
    ]);

    const count = await Vehicle.countDocuments();
    const totalPages = Math.ceil(count / perPage);

    res.render("admin/vehicle/index", {
      pageTitle: "View Vehicles Data",
      vehicles,
      current: page,
      pages: totalPages,
    });
  } catch (error) {
    console.log(error);
  }
};

exports.viewVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findOne({ _id: req.params.id });
    res.render("admin/vehicle/viewVehicle", {
      pageTitle: "View Vehicle Data",
      vehicle,
    });
  } catch (error) {
    console.log(error);
  }
};

exports.getAddVehicle = (req, res, next) => {
  res.render("admin/vehicle/addVehicle", {
    pageTitle: "Vehicle Data",
  });
};

exports.postAddVehicle = (req, res, next) => {
  const {
    category,
    type,
    title,
    transmission,
    about,
    price,
    passengers,
    luggage,
  } = req.body;
  const image = req.file;
  if (!image) {
    return res.redirect("/admin/addVehicle");
  }
  const imageUrl = image.path;
  const newVehicle = new Vehicle({
    category: category,
    type: type,
    title: title,
    transmission: transmission,
    about: about,
    price: price,
    imageUrl: imageUrl,
    passengers: passengers,
    luggage: luggage,
  });
  newVehicle
    .save()
    .then((result) => {
      res.redirect("/admin/viewVehicles");
    })
    .catch((error) => {
      console.log(error);
    });
};

exports.getEditVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findOne({ _id: req.params.id });
    res.render("admin/vehicle/editVehicle", {
      pageTitle: "Edit Vehicle Data",
      vehicle,
    });
  } catch (error) {
    console.log(error);
  }
};

exports.postEditVehicle = async (req, res) => {
  const id = req.params.id;
  const {
    category,
    type,
    title,
    transmission,
    about,
    price,
    passengers,
    luggage,
  } = req.body;

  const image = req.file;
  try {
    const vehicle = await Vehicle.findById(id);
    if (!vehicle) {
      return res.redirect("/vehicles");
    }
    vehicle.category = category;
    vehicle.type = type;
    vehicle.title = title;
    vehicle.transmission = transmission;
    vehicle.about = about;
    vehicle.price = price;
    vehicle.passengers = passengers;
    vehicle.luggage = luggage;
    if (image) {
      if (vehicle.imageUrl) {
        fileHelper.deleteFile(vehicle.imageUrl);
      }
      vehicle.imageUrl = image.path;
    }
    await vehicle.save();
    await res.redirect(`/admin/viewVehicles`);
  } catch (error) {
    console.log(error);
  }
};

exports.deleteVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) {
      return res.redirect("/admin/viewVehicles");
    }
    const imageUrl = vehicle.imageUrl;
    await Vehicle.deleteOne({ _id: req.params.id });
    if (imageUrl) {
      fileHelper.deleteFile(vehicle.imageUrl);
    }
    res.redirect("/admin/viewVehicles");
  } catch (error) {
    console.log(error);
  }
};

exports.searchVehicle = async (req, res) => {
  try {
    let searchTerm = req.body.searchTerm;
    const searchNoSpecialChar = searchTerm.replace(/[^a-zA-Z0-9 ]/g, "");
    const vehicles = await Vehicle.find({
      $or: [
        { type: { $regex: new RegExp(searchNoSpecialChar, "i") } },
        { title: { $regex: new RegExp(searchNoSpecialChar, "i") } },
      ],
    });
    res.render("admin/vehicle/searchVehicle", {
      vehicles,
      pageTitle: "Edit Vehicle Data",
    });
  } catch (error) {
    console.log(error);
  }
}; // Vehicle //

exports.viewBookings = async (req, res, next) => {
  const perPage = 6;
  const page = parseInt(req.query.page) || 1;
  try {
    const bookings = await Booking.aggregate([
      { $sort: { updatedAt: -1 } },
      { $skip: perPage * page - perPage },
      { $limit: perPage },
    ]);

    const count = await Booking.countDocuments();
    const totalPages = Math.ceil(count / perPage);

    res.render("admin/bookings/index", {
      pageTitle: "View Bookings Data",
      bookings,
      current: page,
      pages: totalPages,
    });
  } catch (error) {
    console.log(error);
  }
};

exports.viewBooking = async (req, res) => {
  try {
    const booking = await Booking.findOne({ _id: req.params.id });
    res.render("admin/bookings/viewBooking", {
      pageTitle: "View Booking Data",
      booking,
    });
  } catch (error) {
    console.log(error);
  }
};

exports.deleteBooking = async (req, res) => {
  try {
    await Booking.deleteOne({ _id: req.params.id });
    res.redirect("/admin/viewBookings");
  } catch (error) {
    console.log(error);
  }
};
