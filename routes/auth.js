const express = require("express");

const path = require("path");

const authController = require("../controllers/auth");
const isAuth = require("../middleware/is-admin");

const router = express.Router();

router.get("/", authController.home);

router.get("/login", authController.getLogIn);

router.post("/login", authController.postLogin);

router.get("/signup", authController.getSignUp);

router.post("/signup", authController.postSignUp);

router.post("/logout", authController.logout);

module.exports = router;
