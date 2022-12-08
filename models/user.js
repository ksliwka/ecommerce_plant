const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const passportLocalMongoose = require("passport-local-mongoose");

const UserSchema = new Schema(
  {
    email: {
      type: String,
      lowercase:true,
      required: true,
      unique: true,
    },
    location: String,
    image: String,

    reviews: [
      {
        type: Schema.Types.ObjectId,
        ref: "Review",
      },
    ],
    cart: [
      {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Plant'
      },
    ],
  },
  { timestamps: true }
);

UserSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", UserSchema);
