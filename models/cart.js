const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const cartSchema = new Schema(
  {
    plants: {
      type: Schema.Types.ObjectId,
      ref: "Plant",
      // required: true,
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },

   
    amount: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
    },
  },
  {
    timestamps: true,
  }
);
module.exports = mongoose.model("Cart", cartSchema);
