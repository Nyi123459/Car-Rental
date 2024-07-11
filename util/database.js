const Review = require("../models/review");
const Vehicle = require("../models/vehicle");

const updateAverageRating = async (vehicleId) => {
  try {
    const reviews = await Review.find({ vehicle: vehicleId });
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = reviews.length > 0 ? totalRating / reviews.length : 0;

    await Vehicle.findByIdAndUpdate(vehicleId, { averageRating });
  } catch (error) {
    console.error("Error updating average rating:", error);
  }
};

module.exports = {
  updateAverageRating,
};
