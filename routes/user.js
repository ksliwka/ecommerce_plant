const express = require("express");
const router = express.Router();
const catchAsync = require("../utils/catchAsync");
const ExpressError = require("../utils/ExpressError");
const User = require("../models/user");
const Plant = require("../models/plant");

router.get("/", async (req, res) => {
  const users = await User.find({});

  console.log(users);
  res.render("users/index", { users });
});

router.get("/:id", async (req, res) => {
  const user = await User.findById(req.params.id).populate("reviews");
  const plants = await Plant.find({ author: user._id });

  res.render("users/show", { user, plants });
});


module.exports = router;