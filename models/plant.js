const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const PlantSchema = new Schema({
  title: String,
  image: String,
  price: Number,
  description: String,
  location: String,
  author: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
});

module.exports = mongoose.model("Plant", PlantSchema);
