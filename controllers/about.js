module.exports.about = (req, res, next) => {
  // Check if the user is authenticated based on the session
  const isAuthenticated = req.session.isLoggedIn || false;

  res.render("about", {
    path: "/about",
    pageTitle: "About",
    isAuthenticated: isAuthenticated, // Pass the authentication status to the template
  });
};
