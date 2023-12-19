

module.exports.ride = (req, res, next) => {
  // Check if the user is authenticated based on the session
  const isAuthenticated = req.session.isLoggedIn || false;

  res.render("ride", {
    path: "/ride",
    pageTitle: "Ride",
    isAuthenticated: isAuthenticated, // Pass the authentication status to the template
  });
};
