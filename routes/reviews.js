const express = require("express");
const router = express.Router({mergeParams: true});
const Review = require("../models/review");
const User = require("../models/user");
const { isLoggedIn } = require("../middleware.js");
const {  reviewSchema } = require("../schemas.js");
const catchAsync = require("../utils/catchAsync");


const validateReview = (req, res, next) => {
    const { error } = reviewSchema.validate(req.body);
    if (error) {
      const msg = error.details.map((err) => err.message).join(",");
      throw new ExpressError(msg, 400);
    } else {
      next();
    }
  };


router.get("/", async (req, res) => {
    const user = await User.findById(req.params.id).populate({
      path: "reviews",
      populate: { path: "author" },
    });
    res.render("users/reviews", { user });
  });
  
  router.post(
    "/",
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
  
  router.delete(
    "/:reviewId",
    catchAsync(async (req, res) => {
      const { id, reviewId } = req.params;
      await User.findByIdAndUpdate(id, { $pull: { reviews: reviewId } });
      await Review.findByIdAndDelete(reviewId);
      req.flash("success", "Successfully deleted review.");
      res.redirect(`/user/${id}`);
    })
  );

  module.exports = router;