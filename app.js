const path = require("path");

const express = require("express");

const mongoose = require("mongoose");

const bodyParser = require("body-parser");

const methodOverride = require("method-override");

const { flash } = require("express-flash-message");

const multer = require("multer");

const cookieParser = require("cookie-parser");

const session = require("express-session");

const MongoDBStore = require("connect-mongodb-session")(session);

const dotenv = require("dotenv");

const adminRoute = require("./routes/admin");

const authRoute = require("./routes/auth");

const userRoute = require("./routes/user");

const vehicleRoute = require("./routes/vehicle");

const User = require("./models/user");
const { error } = require("./util/error");

const app = express();
dotenv.config();

const store = new MongoDBStore({
  uri: process.env.MONGO,
  collection: "sessions",
});

const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "images");
  },
  filename: (req, file, cb) => {
    cb(
      null,
      file.fieldname + "-" + Date.now() + path.extname(file.originalname)
    );
  },
});

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpg" ||
    file.mimetype === "image/jpeg"
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(bodyParser.urlencoded({ extended: false }));
app.use(
  multer({ storage: fileStorage, fileFilter: fileFilter }).single("image")
);
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
app.use("/images", express.static(path.join(__dirname, "images")));

app.use(cookieParser());
app.use(methodOverride("_method"));

app.use(
  session({
    secret: process.env.SESSION,
    resave: false,
    saveUninitialized: false,
    store: store,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 7,
    },
  })
);

app.use(flash({ sessionKeyName: "flashMessage" }));

app.use((req, res, next) => {
  res.locals.isAuthenticated = req.session.isLoggedIn;
  next();
});

app.use((req, res, next) => {
  if (!req.session.user) {
    return next();
  }
  User.findById(req.session.user._id)
    .then((user) => {
      if (!user) {
        return next();
      }
      req.user = user;
      next();
    })
    .catch((err) => {
      throw new Error(err);
    });
});

// app.use(expressLayouts);
// app.set("layout", "./admin/layouts/admin-main");

app.use(authRoute);
app.use(userRoute);
app.use(adminRoute);
app.use(vehicleRoute);

app.use((err, req, res, next) => {
  const errorStatus = err.status || 500;
  const errorMessage = err.message || "Something went wrong";
  return res.status(errorStatus).json({
    success: false,
    status: errorStatus,
    message: errorMessage,
    stack: err.stack,
  });
});

const connect = async () => {
  try {
    await mongoose.connect(process.env.MONGO);
    console.log("Connected to mongoDB");
  } catch (err) {
    console.log(err);
  }
};

app.listen(4000, () => {
  connect();
  console.log("Connected to backend");
});
