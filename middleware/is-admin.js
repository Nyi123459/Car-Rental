module.exports = (req, res, next) => {
  if (req.session.user && req.session.isAdmin) {
    return next();
  } else {
    res.redirect("/login");
  }
};
