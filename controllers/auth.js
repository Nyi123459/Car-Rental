const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const dotenv = require("dotenv");

const { DateTime } = require("luxon");
const { validationResult } = require("express-validator");
const User = require("../models/user");

dotenv.config();
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.AUTH_EMAIL,
    pass: process.env.AUTH_SECRET_KEY,
  },
});

exports.getSignUp = (req, res, next) => {
  let message = req.flash("error");
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }
  res.render("signup", {
    path: "/signup",
    pageTitle: "Signup",
    errorMessage: message,
    validationErrors: [],
  });
};

exports.postSignUp = async (req, res) => {
  try {
    const { firstName, lastName, tel, email, password, details } = req.body;
    const errors = validationResult(req);
    console.log("errors", errors);
    if (!errors.isEmpty()) {
      return res.status(422).render("signup", {
        path: "/signup",
        pageTitle: "Signup",
        errorMessage: errors.array()[0].msg,
        validationErrors: errors.array(),
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).render("signup", {
        path: "/signup",
        pageTitle: "Signup",
        errorMessage: errors.array()[0].msg,
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
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  }
};

exports.getLogIn = (req, res, next) => {
  let message = req.flash("error");
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }
  res.render("login", {
    path: "/login",
    pageTitle: "Login",
    errorMessage: message,
    validationErrors: [],
  });
};

exports.postLogin = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).render("login", {
      path: "/login",
      pageTitle: "Login",
      errorMessage: errors.array()[0].msg,
      validationErrors: errors.array(),
    });
  }

  User.findOne({ email: email }).then((user) => {
    if (!user) {
      return res.status(422).render("login", {
        path: "/login",
        pageTitle: "Login",
        errorMessage: "Invalid email or password.",
        validationErrors: [],
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
                pageTitle: "Car Rental",
              });
            }
            res.redirect("/");
          });
        } else {
          return res.status(422).render("login", {
            path: "/login",
            pageTitle: "Login",
            isAuthenticated: true,
            errorMessage: "Invalid email or password",
            validationErrors: [],
          });
        }
      })
      .catch((err) => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
      });
  });
};

exports.logout = (req, res, next) => {
  req.session.destroy((err) => {
    res.clearCookie("connect.sid");
    res.redirect("/");
  });
};

exports.home = (req, res, next) => {
  const isAuthenticated = req.session.isLoggedIn || false;
  const currentDate = DateTime.local().toISODate();
  res.render("main", {
    currentDate,
    path: "/",
    pageTitle: "Car Rental Service",
    isAuthenticated: isAuthenticated,
  });
};

exports.getReset = (req, res, next) => {
  let message = req.flash("error");
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }
  res.render("reset", {
    path: "/reset",
    pageTitle: "Reset Password",
    errorMessage: message,
  });
};

exports.postReset = (req, res, next) => {
  crypto.randomBytes(32, (err, buffer) => {
    if (err) {
      console.log(err);
      return res.redirect("/reset");
    }
    const token = buffer.toString("hex");
    const email = req.body.email;
    console.log("email:", email);
    User.findOne({ email: req.body.email })
      .then((user) => {
        if (!user) {
          req.flash("error", "No account with that email found");
          return res.redirect("/reset");
        }
        user.resetToken = token;
        user.resetTokenExpiration = Date.now() + 3600000;
        return user.save();
      })
      .then((result) => {
        res.redirect("/");
        transporter.sendMail({
          to: email,
          from: process.env.AUTH_EMAIL,
          subject: "Password Reset",
          html: `
          <p> You requested a password reset <p>
          <p> Click this <a href="http://localhost:4000/reset/${token}">link</a> to set a new password.</p>
          `,
        });
      })
      .catch((err) => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
      });
  });
};

exports.getNewPassword = (req, res, next) => {
  const token = req.params.token;
  User.findOne({
    resetToken: token,
    resetTokenExpiration: { $gt: Date.now() },
  })
    .then((user) => {
      let message = req.flash("error");
      if (message.length > 0) {
        message = message[0];
      } else {
        message = null;
      }
      res.render("new-password", {
        path: "/new-password",
        pageTitle: "New Password",
        errorMessage: message,
        userId: user._id.toString(),
        passwordToken: token,
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postNewPassword = (req, res, next) => {
  const newPassword = req.body.password;
  const userId = req.body.userId;
  const passwordToken = req.body.passwordToken;
  let resetUser;
  User.findOne({
    resetToken: passwordToken,
    resetTokenExpiration: { $gt: Date.now() },
    _id: userId,
  })
    .then((user) => {
      resetUser = user;
      return bcrypt.hash(newPassword, 12);
    })
    .then((hashedPassword) => {
      resetUser.password = hashedPassword;
      resetUser.resetToken = undefined;
      resetUser.resetTokenExpiration = undefined;
      return resetUser.save();
    })
    .then((result) => {
      res.redirect("/login");
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};
