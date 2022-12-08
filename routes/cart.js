
const express = require("express");
const router = express.Router({mergeParams: true});
const Cart = require("../models/cart");
const User = require("../models/user");
const Plant = require("../models/plant");
const { isLoggedIn } = require("../middleware.js");
const catchAsync = require("../utils/catchAsync");



router.get("/", isLoggedIn, async (req, res) => {
    const user = await User.findById(req.params.id).populate("cart");
    const cart = [...user.cart];
  
    // cart.map((item) => {
    //     req.session.amount += item.price;
    // });
    res.render("users/cart", { cart, user });
  });
  
  router.post(
    "/:plantsId",
    isLoggedIn,
    catchAsync(async (req, res) => {
      const { id, plantsId } = req.params;
      const plant = await Plant.findById(req.params.plantsId);
      const user = await User.findById(req.params.id);
      if (user.cart.indexOf(plantsId) === -1) {
        user.cart.push(plant);
        await user.save();
        req.flash("success", "Successfully, added to cart");
        res.redirect(`/plants/${plantsId}`);
      } else {
        req.flash("error", "You already have it in your cart.");
        res.redirect(`/plants/${plantsId}`);
      }
    })
  );
  
  router.delete("/:cartId", async (req, res) => {
    const { id, cartId } = req.params;
    await User.findByIdAndUpdate(id, { $pull: { cart: cartId } });
    await Cart.findByIdAndDelete(cartId);
    req.flash("success", "Successfully deleted from Cart.");
    res.redirect(`/user/${id}/cart`);
  });

  module.exports = router;