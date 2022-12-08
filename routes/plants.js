const express = require("express");
const router = express.Router();
const catchAsync = require("../utils/catchAsync");
const ExpressError = require("../utils/ExpressError");
const Plant = require("../models/plant");
const { plantSchema } = require("../schemas.js");
const { isLoggedIn } = require("../middleware.js");

const validatePlant = (req, res, next) => {
  const { error } = plantSchema.validate(req.body);
  if (error) {
    const msg = error.details.map((el) => el.message).join(",");
    throw new ExpressError(msg, 400);
  } else {
    next();
  }
};

router.get(
  "/",
  catchAsync(async (req, res) => {
    const { searchTerm } = req.query;
    const plants = await Plant.find({});
    res.render("plants/index", { plants, searchTerm });
  })
);
router.get("/new", isLoggedIn, (req, res) => {
  res.render("plants/new");
});

router.post(
  "/",
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

router.get("/:id", async (req, res) => {
  const plant = await Plant.findById(req.params.id).populate("author");
  if (!plant) {
    req.flash("error", "Cannot find that plant!");
    return res.redirect("/plants");
  }
  res.render("plants/show", { plant });
});

router.get(
  "/:id/edit",
  isLoggedIn,
  catchAsync(async (req, res) => {
    const plant = await Plant.findById(req.params.id);
    res.render("plants/edit", { plant });
  })
);

router.put(
  "/:id",
  validatePlant,
  catchAsync(async (req, res) => {
    const { id } = req.params;
    const plant = await Plant.findByIdAndUpdate(id, { ...req.body.plant });
    req.flash("success", "Successfully updated plant.");
    res.redirect(`/plants/${plant._id}`);
  })
);

router.delete(
  "/:id",
  catchAsync(async (req, res) => {
    const { id } = req.params;
    await Plant.findByIdAndDelete(id);
    req.flash("success", "Successfully deleted plant.");
    res.redirect("/plants");
  })
);

module.exports = router;
