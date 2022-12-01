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
const { nextTick } = require("process");
const ExpressError = require("./utils/ExpressError");
const Review = require("./models/review");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user");
const flash = require("connect-flash");
const { isLoggedIn } = require("./middleware.js");
const cart = require("./models/cart");
const { captureStackTrace } = require("./utils/ExpressError");

mongoose.connect("mongodb://localhost:27017/plant-shop"); //gdzie znajduje się nasza db (wpisując use db to zamiast db wpisuje plant-shop)

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

const sessionConfig = {
  secret: "secre",
  resave: false,
  saveUninitialized: true,
  cookie: {
    httpOnly: true,
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

const validatePlant = (req, res, next) => {
  const { error } = plantSchema.validate(req.body);
  if (error) {
    const msg = error.details.map((el) => el.message).join(",");
    throw new ExpressError(msg, 400);
  } else {
    next();
  }
};

const validateReview = (req, res, next) => {
  const { error } = reviewSchema.validate(req.body);
  if (error) {
    const msg = error.details.map((err) => err.message).join(",");
    throw new ExpressError(msg, 400);
  } else {
    next();
  }
};

app.get("/register", (req, res) => {
  res.render("users/register");
});

app.post(
  "/register",
  catchAsync(async (req, res) => {
    try {
      const { email, username, location, password } = req.body;
      const user = new User({ email, location, username });
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

app.get("/", (req, res) => {
  res.render("home");
});

app.get(
  "/plants",
  catchAsync(async (req, res) => {
    const plants = await Plant.find({});
    res.render("plants/index", { plants });
  })
);

app.get("/plants/new", isLoggedIn, (req, res) => {
  res.render("plants/new");
});

app.post(
  "/plants",
  isLoggedIn,
  validatePlant,
  catchAsync(async (req, res, next) => {
    // if (!req.body.plant) throw new ExpressError("Invalid Plant Data", 400);

    const plant = new Plant(req.body.plant);
    plant.author = req.user._id;
    await plant.save();
    req.flash("success", "Successfully added plant");

    res.redirect(`/plants/${plant._id}`);
  })
);

app.get("/user", async (req, res) => {
  const users = await User.find({});

  console.log(users);
  res.render("users/index", { users });
});

app.get("/user/:id", async (req, res) => {
  const user = await User.findById(req.params.id).populate("reviews");
  const plants = await Plant.find({ author: user._id });
  console.log(user);

  res.render("users/show", { user, plants });
});

app.get("/user/:id/reviews", async (req, res) => {
  const user = await User.findById(req.params.id).populate({
    path: "reviews",
    populate: { path: "author" },
  });
  res.render("users/reviews", { user });
});

app.post(
  "/user/:id/reviews",
  isLoggedIn,
  validateReview,
  catchAsync(async (req, res) => {
    const user = await User.findById(req.params.id);
    const review = new Review(req.body.review);
    review.author = req.user._id;
    user.reviews.push(review);
    await review.save();
    await user.save();
    req.flash("success", "Successfully created review.");
    res.redirect(`/user/${user._id}`);
  })
);

app.delete(
  "/user/:id/reviews/:reviewId",
  catchAsync(async (req, res) => {
    const { id, reviewId } = req.params;
    await User.findByIdAndUpdate(id, { $pull: { reviews: reviewId } });
    await Review.findByIdAndDelete(reviewId);
    req.flash("success", "Successfully deleted review.");
    res.redirect(`/user/${id}`);
  })
);

// app.get(
//   "/user/:id/cart",
//   isLoggedIn,
//   catchAsync(async (req, res) => {
//     const user = await User.findById(req.params.id);
//     const cart = await Cart.find({ owner: req.user._id }).populate('plants.plantId')

//     // const plant = await Plant.findById(cart[0].plants[0].plantId);
//     console.log(cart)

//     // console.log('i')
//     // console.log(cart);

//     // let result = cart.map((a) => a.plants);

//     // result.populate('plants')
//     // console.log(result)

//     // let result = cart.plants.map(a => a.plantId)
//     // const plant = await Plant.find({plantId: cart[0].plants[0]});

//     // const plant = await Plant.findById(result);

//     res.render("users/cart", { user, carts: cart });
//   })
// );

app.get("/user/:id/cart", isLoggedIn, async (req, res) => {
  const user = await User.findById(req.params.id).populate("cart");
  console.log(user);
  req.session.amount = 0;
  const cart = [...user.cart];
  cart.map((item) => {
    req.session.amount += item.price;
  });
  console.log(cart);

  // cart.map((item) => {
  //     req.session.amount += item.price;
  // });
  res.render("users/cart", { cart, user });
});

app.post(
  "/user/:id/cart/:plantsId",
  isLoggedIn,
  catchAsync(async (req, res) => {
    const { id, plantsId } = req.params;
    const plant = await Plant.findById(req.params.plantsId);
    const user = await User.findById(req.params.id);

    user.cart.push(plant);
    await user.save();
    console.log(user);
    req.flash("success", "Successfully, added to cart");
    res.redirect(`/user/${id}/cart`);
  })
);

app.delete("/user/:id/cart/:cartId", async (req, res) => {
  const { id, cartId } = req.params;
  await User.findByIdAndUpdate(id, { $pull: { cart: cartId } });
  await Cart.findByIdAndDelete(cartId);
  req.flash("success", "Successfully deleted from Cart.");
  res.redirect(`/user/${req.user._id}/cart`);
});

// app.post(
//   "/user/:id/cart/:plantsId",
//   isLoggedIn,
//   catchAsync(async (req, res) => {
//     const { id, plantsId } = req.params;
//     const user = await User.findById(req.params.id);
//     // const plant = await Plant.findById(req.params.plantsId);
//     const cart = new Cart(req.body.cart)
//     console.log(cart);
//     cart.owner = req.user._id;
//     console.log(cart)
//     console.log(cart.owner)
//     cart.plants.push({ plantId: req.body.plantsId });
//     console.log(cart.plants)
//     console.log(cart)
//     console.log("end");
//     // cart.plants.push(cart);
//     await cart.save();
//     console.log(cart.plants);
//     res.redirect(`/user/${id}/cart`);
//   })
// );

// app.get(
//   "/cart",
//   isLoggedIn,
//   catchAsync(async (req, res) => {
//     const owner = req.user._id;
//     const cart = await Cart.findOne({ owner });
//     if (cart && cart.items.length > 0) {
//       res.render("users/cart");
//     }
//   })
// );

// app.post("/cart", isLoggedIn, async (req, res) => {
//   const user = await User.findById(req.params.id);
//   const owner = req.user._id;
//   const { plantId, quantity } = req.body;
//   try {
//     const cart = await Cart.findOne({ owner });
//     const plant = await Plant.findOne({ _id: plantId });
//     if (!plant) {
//       res.status(404).send({ message: "item not found" });
//       return;
//     }
//     const price = plant.price;
//     const name = plant.name;
//     //If cart already exists for user,
//     if (cart) {
//       const plantIndex = cart.plants.findIndex(
//         (plant) => plant.plantId == plantId
//       );
//       //check if product exists or not
//       if (plantIndex > -1) {
//         let product = cart.plants[plantIndex];
//         product.quantity += quantity;
//         cart.bill = cart.plants.reduce((acc, curr) => {
//           return acc + curr.quantity * curr.price;
//         }, 0);
//         cart.plants[plantIndex] = product;
//         await cart.save();
//         res.status(200).send(cart);
//       } else {
//         cart.plants.push({ plantId, name, quantity, price });
//         cart.bill = cart.plants.reduce((acc, curr) => {
//           return acc + curr.quantity * curr.price;
//         }, 0);
//         await cart.save();
//         res.status(200).send(cart);
//       }
//     } else {
//       //no cart exists, create one
//       const newCart = await Cart.create({
//         owner,
//         items: [{ plantId, name, quantity, price }],
//         bill: quantity * price,
//       });
//       return res.status(201).send(newCart);
//     }
//   } catch (error) {
//     console.log(error);
//     res.status(500).send("something went wrong");
//   }
// });

// app.get("/user/:id/cart/:plantId/:cartId", isLoggedIn, async (req, res) => {
//   const { id, plantId, cartId } = req.params;
//   console.log(id);
//   console.log(plantId);
//   console.log(cartId);
//   const plant = await Plant.findById(plantId);
//   const user = await User.findById(id);
//   console.log(plant);
//   console.log(user);

//   res.render("users/cart", { user, plant });
// });

// app.post("/user/:id/cart/:plantId", isLoggedIn, async (req, res) => {
//   // res.send("You made it");
//   console.log("HIT");
//   const { id, plantId } = req.params;
//   console.log("planid");
//   console.log(plantId);
//   const user = await User.findById(req.params.id);
//   console.log("user");
//   console.log(user);
//   const plant = await Plant.findById(plantId);
//   console.log("plant");
//   console.log(plant);
//   const cart = new Cart(plant);
//   console.log("cart new");
//   console.log(cart);
//   user.carts.push(cart);
//   console.log("user");
//   console.log(user.carts);
//   console.log("end");

//   console.log(user);
//   req.flash("success", "Successfully added to cart.");
//   res.redirect(`/user/${user._id}/cart/${plant._id}/${cart._id}`);
//   console.log("redirect");
// });
// app.post("/user/:id/cart", isLoggedIn, async (req, res) => {
//   const user = await User.findById(req.params.id);
//   const plant = await Plant(req.body);
//   user.cart.push(plant);
//   await cart.save();
//   await user.save();
//   req.flash("success", "Successfully added to cart.");

//   res.redeirect("/plants/:id", { plant });
// });

app.get("/plants/:id", async (req, res) => {
  const plant = await Plant.findById(req.params.id)
    .populate("reviews")
    .populate("author");
  if (!plant) {
    req.flash("error", "Cannot find that plant!");
    return res.redirect("/plants");
  }
  res.render("plants/show", { plant });
});

app.get(
  "/plants/:id/edit",
  isLoggedIn,
  catchAsync(async (req, res) => {
    const plant = await Plant.findById(req.params.id);
    res.render("plants/edit", { plant });
  })
);

app.put(
  "/plants/:id",
  validatePlant,
  catchAsync(async (req, res) => {
    const { id } = req.params;
    const plant = await Plant.findByIdAndUpdate(id, { ...req.body.plant });
    req.flash("success", "Successfully updated plant.");
    res.redirect(`/plants/${plant._id}`);
  })
);

app.delete(
  "/plants/:id",
  catchAsync(async (req, res) => {
    const { id } = req.params;
    await Plant.findByIdAndDelete(id);
    res.redirect("/plants");
  })
);

app.post(
  "/plants/:id/reviews",
  validateReview,
  catchAsync(async (req, res) => {
    const plant = await Plant.findById(req.params.id);
    const review = new Review(req.body.review);
    plant.reviews.push(review);
    await review.save();
    await plant.save();
    req.flash("success", "Successfully created review.");
    res.redirect(`/plants/${plant._id}`);
  })
);

app.delete(
  "/plants/:id/reviews/:reviewId",
  catchAsync(async (req, res) => {
    const { id, reviewId } = req.params;
    await Plant.findByIdAndUpdate(id, { $pull: { reviews: reviewId } });
    await Review.findByIdAndDelete(reviewId);
    req.flash("success", "Successfully deleted review.");
    res.redirect(`/plants/${id}`);
  })
);

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
