const mongoose = require("mongoose");
const cities = require("./cities");
const { plants } = require("./seedHelpers");
const Plant = require("../models/plant");

mongoose.connect("mongodb://localhost:27017/plant-shop"); //gdzie znajduje się nasza db (wpisując use db to zamiast db wpisuje plant-shop)

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
  console.log("Database connected"); //when you use 'once' it signifies that the event will be called only once i.e the first time the event occurred like here in this case the first time when the connection is opened ,it will not occur once per request but rather once when the mongoose connection is made with the db while the 'on' signifies the event will be called every time that it occurred
});

const sample = (array) => array[Math.floor(Math.random() * array.length)];

// removing everything from in the db
const seedDB = async () => {
  await Plant.deleteMany({});
  for (let i = 0; i < 50; i++) {
    const random1000 = Math.floor(Math.random() * 1000);
    const price = Math.floor(Math.random() * 10) + 10;
    const flora = new Plant({
      author: "6391f585238a84222f85f084",
      location: `${cities[random1000].city}, ${cities[random1000].state}`,
      title: `${sample(plants)}`,
      image: "https://images.unsplash.com/photo-1614594975525-e45190c55d0b?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1364&q=80",
      description:
        "Lorem, ipsum dolor sit amet consectetur adipisicing elit. Quia suscipit molestias assumenda ex molestiae minus totam! Et cupiditate officiis optio laboriosam saepe unde ipsum nemo neque minima, sapiente, veritatis delectus? Ut facilis nisi exercitationem modi ratione earum ad fugiat ipsum veritatis deleniti ullam, nostrum necessitatibus architecto pariatur asperiores magni? Illo consectetur cum nobis nostrum quibusdam, doloribus at modi vero neque!",
      price,
    });
    await flora.save();
  }
};

seedDB().then(() => {
  mongoose.connection.close();
}); //The success or the error handler in the then function will be called only once, after the asynchronous task finishes.
