if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const express = require("express");
const path = require("path"); //path is Node.js native utility module, require is Node.js global function that allows you to extract contents from module.exports object inside some file
const mongoose = require("mongoose");
const ejsMate = require("ejs-mate");
const session = require("express-session");
const Joi = require("joi");
const { plantSchema, reviewSchema } = require("./schemas.js");
const catchAsync = require("./utils/catchAsync");
const methodOverride = require("method-override");
const Plant = require("./models/plant");
const Cart = require("./models/cart");
// const { nextTick } = require("process");
const ExpressError = require("./utils/ExpressError");
const Review = require("./models/review");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user");
const flash = require("connect-flash");
const { isLoggedIn } = require("./middleware.js");

const plants = require("./routes/plants");
const user = require("./routes/user");
const reviews = require("./routes/reviews");
const cart = require("./routes/cart");

var MongoDBStore = require('connect-mongodb-session')(session);
const dbUrl = process.env.DB_URL || "mongodb://localhost:27017/yelp-camp";
"mongodb://localhost:27017/plant-shop"
mongoose.connect(dbUrl); //gdzie znajduje się nasza db (wpisując use db to zamiast db wpisuje plant-shop)

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
  console.log("Database connected"); //when you use 'once' it signifies that the event will be called only once i.e the first time the event occurred like here in this case the first time when the connection is opened ,it will not occur once per request but rather once when the mongoose connection is made with the db while the 'on' signifies the event will be called every time that it occurred
});

const app = express();

app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views")); //absolute path of the directory, when you run the express app from another directory

app.use(express.urlencoded({ extended: true })); //tell express to parse the  body to be able to send post request and have req.body not empty
app.use(methodOverride("_method"));
app.use(express.static("public"));


const store = new MongoDBStore({
  url: dbUrl,
  secret: 'secret',
  touchAfter: 24 * 60 * 60,
});

store.on("error", function (e) {
  console.log("SESSION STORE ERROR", e);
});

const sessionConfig = {
  store,
  secret: "secre",
  resave: false,
  saveUninitialized: true,
  cookie: {
    httpOnly: true,
    // secure: true,
    expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
    maxAge: 1000 * 60 * 06 * 24 * 7,
  },
};
app.use(session(sessionConfig));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser()); //store user in session
passport.deserializeUser(User.deserializeUser()); //unstore user in session

app.use((req, res, next) => {
  res.locals.currentUser = req.user;
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  next();
}); //so now in all my templates I should have access to current user, success and error

app.use("/plants", plants);
app.use("/user", user);
app.use("/user/:id/reviews", reviews);
app.use("/user/:id/cart", cart);

app.get("/", (req, res) => {
  res.render("home");
});

app.get("/register", (req, res) => {
  res.render("users/register");
});

app.post(
  "/register",
  catchAsync(async (req, res) => {
    try {
      const { email, username, location, password, image } = req.body;
      const user = new User({ email, location, username, image });
      const registeredUser = await User.register(user, password);
      req.login(registeredUser, (err) => {
        if (err) return next(err);
        req.flash("success", "Successfully registered");
        res.redirect("/plants");
      });
    } catch (e) {
      req.flash("error", e.message);
      res.redirect("/register");
    }
  })
);

app.get("/login", (req, res) => {
  res.render("users/login");
});

app.post(
  "/login",
  passport.authenticate("local", {
    failureFlash: true,
    failureRedirect: "/login",
  }),
  (req, res) => {
    req.flash("success", "welcome back!");
    const redirectUrl = req.session.returnTo || "/plants";
    delete req.session.returnTo;
    res.redirect(redirectUrl);
  }
);

app.get("/logout", (req, res, next) => {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
  });
  req.flash("success", "Goodbye!");
  res.redirect("/plants");
});

app.all("*", (req, res, next) => {
  next(new ExpressError("Page Not Found", 404));
});

app.use((err, req, res, next) => {
  const { statusCode = 500 } = err;
  if (!err.message) err.message = "Oh No, Something Went Wrong!";
  res.status(statusCode).render("error", { err });
});

app.listen(3000, () => {
  console.log("Serving on port 3000");
});
