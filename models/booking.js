const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const bookingSchema = new Schema({
  user: {
    email: {
      type: String,
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
  },
  vehicle: {
    vehicleId: {
      type: Schema.Types.ObjectId,
      ref: "Vehicle",
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
  },
  paymentIntentId: {
    type: String,
    required: true,
    unique: true,
  },
  payment_done: {
    type: Boolean,
    default: false,
  },
  location: {
    type: String,
    required: true,
  },
  differentLocation: {
    type: String,
  },
  startDate: {
    type: String,
    required: true,
  },
  endDate: {
    type: String,
    required: true,
  },
  startHourlyTime: {
    type: String,
    required: true,
  },
  endHourlyTime: {
    type: String,
    required: true,
  },
  totalAmount: {
    type: Number,
    required: true,
  },
});

module.exports = mongoose.model("Booking", bookingSchema);
