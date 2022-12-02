const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const cartSchema = new Schema(
  {
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
      
        plants: {
          type: Schema.Types.ObjectId,
          ref: "Plant",
          // required: true,
        },
   
        
      


  },
  {
    timestamps: true,
  }
);
module.exports = mongoose.model("Cart", cartSchema);
