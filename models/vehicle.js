const { default: mongoose } = require("mongoose");
const monogoose = require("mongoose");

const Schema = monogoose.Schema;

const vehicleSchema = new Schema(
  {
    category: {
      type: String,
      enum: ["Car", "Truck", "SUV", "Van"],
      required: true,
    },
    type: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    transmission: {
      type: String,
      required: true,
    },
    passengers: {
      type: Number,
      required: true,
    },
    luggage: {
      type: Number,
    },
    price: {
      type: Number,
      required: true,
    },
    about: {
      type: String,
      required: true,
    },
    imageUrl: {
      type: String,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    updatedAt: {
      type: Date,
      default: Date.now(),
    },
    bookingId: {
      type: Schema.Types.ObjectId,
      ref: "Booking",
    },
    averageRating: {
      type: Number,
      default: 0, // Default value is 0
    },
    reviews: [
      {
        type: Schema.Types.ObjectId,
        ref: "Review",
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Vehicle", vehicleSchema);
