const mongoose = require("mongoose");
const stripe = require("stripe")(process.env.SECRET_KEY);
const Vehicle = require("../models/vehicle");
const Booking = require("../models/booking");
const Review = require("../models/review");
const user = require("../models/user");
const { updateAverageRating } = require("../util/database");

exports.getVehicles = async (req, res, next) => {
  let messages = req.flash("error");
  const perPage = 9;
  const page = parseInt(req.query.page) || 1;
  try {
    // Fetch vehicles with averageRating
    const vehicles = await Vehicle.aggregate([
      { $sort: { updatedAt: -1 } },
      { $skip: perPage * page - perPage },
      { $limit: perPage },
      {
        $lookup: {
          from: "reviews",
          localField: "_id",
          foreignField: "vehicle",
          as: "reviews",
        },
      },
      {
        $addFields: {
          averageRating: { $avg: "$reviews.rating" },
        },
      },
    ]);

    const count = await Vehicle.countDocuments();
    const totalPages = Math.ceil(count / perPage);

    res.render("ser", {
      pageTitle: "View Vehicles and Reviews",
      vehicles,
      current: page,
      pages: totalPages,
      messages,
    });
  } catch (err) {
    console.error("Error fetching vehicles:", err);
    // Handle the error appropriately
    res.status(500).send("Internal Server Error");
  }
};

exports.viewDetails = async (req, res, next) => {
  try {
    const vehicle = await Vehicle.findOne({ _id: req.params.id });
    const queryParams = req.query;
    // Fetch bookings for the specific vehicle and user
    const userBookings = await Booking.find({
      "vehicle.vehicleId": vehicle._id,
    });
    res.render("viewDetails", {
      pageTitle: vehicle.title,
      vehicle,
      queryParams,
      userBookings,
    });
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};

exports.booking = async (req, res, next) => {
  if (!req.user) {
    res.redirect("/login");
  }
  try {
    let validationError;
    const {
      location,
      startDate,
      endDate,
      startHourlyTime,
      endHourlyTime,
      vehicleId,
      differentLocation,
    } = req.body;
    console.log("DifferentLocation:", differentLocation);
    const userId = req.user._id;
    const firstName = req.user.firstName;
    const lastName = req.user.lastName;
    const userEmail = req.user.email;

    const startDateTime = new Date(`${startDate} ${startHourlyTime}`);
    let endDateTime = new Date(`${endDate} ${endHourlyTime}`);

    if (endDateTime < startDateTime) {
      endDateTime = startDateTime;
      validationError =
        "End date cannot be earlier than start date. End date has been adjusted.";
    }

    const existingBookings = await Booking.find({
      "vehicle.vehicleId": vehicleId,
    });

    let overlappingBookings = [];

    for (let i = 0; i < existingBookings.length; i++) {
      const existingStart = new Date(existingBookings[i].startDate + "UTC");
      const existingEnd = new Date(existingBookings[i].endDate + "UTC");
      // Check if the new input overlaps with existing bookings
      if (
        (startDateTime >= existingStart && startDateTime < existingEnd) ||
        (endDateTime > existingStart && endDateTime <= existingEnd) ||
        (startDateTime <= existingStart && endDateTime >= existingEnd)
      ) {
        console.log(
          "Validation Error:",
          "The selected time range overlaps with an existing booking."
        );
        validationError =
          "The selected dates are already booked. Please choose different dates.";
        overlappingBookings.push({
          startDate: existingStart,
          endDate: existingEnd,
        });
      }
    }
    console.log("OverlappingBookings", overlappingBookings);

    const upcomingBookings = existingBookings.filter((booking) => {
      const bookingEnd = new Date(booking.endDate);
      return bookingEnd > endDateTime;
    });

    const durationInMilliseconds = endDateTime - startDateTime;
    const durationInHours = durationInMilliseconds / (60 * 60 * 1000);

    const vehicleData = await Vehicle.findOne({ _id: vehicleId });
    const cost = vehicleData.price * durationInHours;

    res.render("confirm-booking", {
      location,
      startDate,
      endDate,
      startHourlyTime,
      endHourlyTime,
      vehicleData,
      cost,
      userId,
      userEmail,
      validationError,
      existingBookings,
      overlappingBookings,
      upcomingBookings,
      firstName,
      lastName,
      differentLocation,
    });
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};

exports.confirmBooking = async (req, res, next) => {
  try {
    const {
      location,
      startDate,
      endDate,
      startHourlyTime,
      endHourlyTime,
      vehicleId,
      differentLocation,
    } = req.body;
    const userId = req.user._id;
    const userEmail = req.user.email;
    const key = process.env.PUB_KEY;
    const startDateTime = new Date(`${startDate} ${startHourlyTime}`);
    const endDateTime = new Date(`${endDate} ${endHourlyTime}`);

    const durationInMilliseconds = endDateTime - startDateTime;
    const durationInHours = durationInMilliseconds / (60 * 60 * 1000);

    const bookingCreationTime = new Date();

    const vehicleData = await Vehicle.findOne({ _id: vehicleId });
    const totalAmount = vehicleData.price * durationInHours;

    // Check if the user has an existing booking for the same vehicle and date range
    const existingBooking = await Booking.findOne({
      "user.userId": userId,
      "vehicle.vehicleId": vehicleId,
      startDate: { $lte: endDateTime },
      endDate: { $gte: startDateTime },
    });

    if (existingBooking && existingBooking.payment_done) {
      // If a valid existing booking with payment done is found, render payment page
      const paymentIntent = await stripe.paymentIntents.retrieve(
        existingBooking.paymentIntentId
      );
      res.render("payment", {
        clientSecret: paymentIntent.client_secret,
        totalAmount: existingBooking.totalAmount,
        key,
        paymentIntentId: paymentIntent.id,
      });
    } else {
      // If there's no existing booking or payment not done, create a new booking
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(totalAmount * 100), // Amount in cents
        currency: "usd",
        metadata: {
          userId: userId,
          userEmail: userEmail,
        },
      });

      if (existingBooking) {
        // Update the existing booking details
        existingBooking.startDate = startDateTime;
        existingBooking.endDate = endDateTime;
        existingBooking.totalAmount = totalAmount;
        existingBooking.payment_done = false;
        existingBooking.paymentIntentId = paymentIntent.id;
        await existingBooking.save();
      } else {
        // Create a new booking
        const booking = new Booking({
          user: {
            email: req.user.email,
            userId: req.user._id,
          },
          vehicle: {
            vehicleId: vehicleData._id,
            category: vehicleData.category,
            title: vehicleData.title,
          },
          location,
          differentLocation,
          startDate: startDateTime,
          endDate: endDateTime,
          startHourlyTime,
          endHourlyTime,
          payment_done: false,
          totalAmount: totalAmount,
          paymentIntentId: paymentIntent.id,
        });

        await booking.save();
      }

      res.render("payment", {
        clientSecret: paymentIntent.client_secret,
        totalAmount,
        key,
        paymentIntentId: paymentIntent.id,
        bookingCreationTime,
      });
    }
  } catch (err) {
    console.log(err);
  }
};

exports.deleteBooking = async (req, res, next) => {
  try {
    const paymentIntentId = req.query.paymentIntentId;
    cosole.log("paymentIntentIdToDelete:", paymentIntentId);
    const deleteBooking = await Booking.findOneAndDelete({ paymentIntentId });
    console.log("Booking deleted on timeout:", deleteBooking);
    res.json({ success: true });
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};

exports.payment = async (req, res, next) => {
  const paymentIntentId = req.query.paymentIntentId;
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    const updatedBooking = await Booking.findOneAndUpdate(
      { paymentIntentId: paymentIntentId },
      { $set: { payment_done: true } },
      { new: true } // Return the updated document
    );

    if (updatedBooking) {
      res.render("success", { paymentIntent });
    } else {
      console.log(
        "No matching document found for paymentIntentId:",
        paymentIntentId
      );
      res.render("fail");
    }
  } catch (err) {
    console.error("Error retrieving/payment intent:", err);
    res.render("fail");
  }
};

exports.getReviews = async (req, res, next) => {
  const perPage = 9;
  const page = parseInt(req.query.page) || 1;
  try {
    const reviews = await Review.aggregate([
      { $sort: { updatedAt: -1 } },
      { $skip: perPage * page - perPage },
      { $limit: perPage },
    ]);
    const count = await Review.countDocuments();
    const totalPages = Math.ceil(count / perPage);

    res.render("reviews", {
      pageTitle: "Reviews",
      reviews,
      current: page,
      pages: totalPages,
    });
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};

exports.submitReview = async (req, res, next) => {
  try {
    const vehicleId = req.params.id;
    const { rating, comment } = req.body;

    if (rating) {
      await updateAverageRating(vehicleId);
    }

    //Check if the user has already submitted a review for the vehicle
    const existingReview = await Review.findOne({
      user: req.user._id,
      vehicle: vehicleId,
    });

    if (existingReview) {
      //User has already submitted a review,you can choose to update it here if needed
      //For example, you might want to allow users to edit their reviews
      existingReview.rating = rating;
      existingReview.comment = comment;
      await existingReview.save();
    } else {
      //User has not submitted a review, create a new one
      const newReview = new Review({
        user: {
          firstName: req.user.firstName,
          lastName: req.user.lastName,
          userId: req.user._id,
        },
        vehicle: vehicleId,
        rating,
        comment,
        createdAt,
        updatedAt,
      });
      await newReview.save();
    }
    res.redirect(`/viewDetails/${vehicleId}`);
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};

exports.deleteReview = async (req, res, next) => {
  try {
    const reviewId = req.params.reviewId;
    //Check if the user is Admin
    if (req.user.isAdmin) {
      await Review.findByIdAndDelete(reviewId);
      res.redirect("/admin/reviews");
    } else {
      res.status(403).send("Unauthorized");
    }
  } catch (err) {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};
