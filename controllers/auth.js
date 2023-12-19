const bcrypt = require("bcryptjs");

const cookie = require("cookie-parser");

const User = require("../models/user");

const { error } = require("../util/error");

exports.getSignUp = (req, res, next) => {
  res.render("signup", {
    path: "/signup",
    pageTitle: "Signup",
    errorMessage: "User already exists",
  });
};

exports.postSignUp = async (req, res) => {
  try {
    const { firstName, lastName, tel, email, password, details } = req.body;
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(409).render("signup", {
        path: "/signup",
        pageTitle: "Signup",
        errorMessage: "User with this email already exists",
      });
    }
    bcrypt
      .hash(password, 12)
      .then((hashedPassword) => {
        const user = new User({
          firstName: firstName,
          lastName: lastName,
          tel: tel,
          email: email,
          password: hashedPassword,
          details: details,
        });
        return user.save();
      })
      .then((result) => {
        res.redirect("/login");
      })
      .catch((err) => {
        console.log(err);
      });
  } catch (err) {
    console.log(err);
  }
};

exports.getLogIn = (req, res, next) => {
  res.render("login", {
    path: "/login",
    pageTitle: "Login",
  });
};

exports.postLogin = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;

  User.findOne({ email: email }).then((user) => {
    if (!user) {
      return res.status(422).render("login", {
        path: "/login",
        pageTitle: "Login",
        errorMessage: "Invalid email or password.",
      });
    }
    bcrypt
      .compare(password, user.password)
      .then((doMatch) => {
        if (doMatch) {
          req.session.isLoggedIn = true;
          req.session.user = user;
          req.session.isAdmin = user.isAdmin || false;
          return req.session.save((err) => {
            if (err) {
              console.log("Error saving session: ", err);
              return res.status(500).send("Internal Server Error");
            }
            if (user.isAdmin) {
              return res.render("main", {
                isAdmin: true,
              });
            }
            res.redirect("/");
          });
        } else {
          return res.status(422).render("login", {
            path: "/login",
            pageTitle: "Login",
            isAuthenticated: true,
          });
        }
      })
      .catch((err) => {
        console.log(err);
        res.redirect("/login");
      });
  });
};

exports.logout = (req, res, next) => {
  req.session.destroy((err) => {
    console.log(err);
    res.clearCookie("connect.sid");
    res.redirect("/");
  });
};

exports.home = (req, res, next) => {
  const isAuthenticated = req.session.isLoggedIn || false;
  res.render("main", {
    path: "/",
    pageTitle: "Car Rental Service",
    isAuthenticated: isAuthenticated,
  });
};
