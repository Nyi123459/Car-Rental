module.exports.reviews = (req, res, next) => {
  // Check if the user is authenticated based on the session
  const isAuthenticated = req.session.isLoggedIn || false;

  res.render("reviews", {
    path: "/reviews",
    pageTitle: "Reviews",
    isAuthenticated: isAuthenticated, // Pass the authentication status to the template
  });
};
