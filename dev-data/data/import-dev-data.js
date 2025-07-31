const dotenv = require("dotenv");
dotenv.config({ path: `./config.env` });
const fs = require("fs");
const mongoose = require("mongoose");
const Tour = require(`${__dirname}/../../models/tourModel.js`);
const User = require(`${__dirname}/../../models/userModel.js`);
const Review = require(`${__dirname}/../../models/reviewModel.js`);

const DB = process.env.DATABASE.replace(
    "<db_password>",
    process.env.DATABASE_PASSWORD
);
mongoose.connect(DB, { dbName: "natours" }).then(() => {});

// READ JSON FILE
const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`, "utf-8"));
const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, "utf-8"));
const reviews = JSON.parse(
    fs.readFileSync(`${__dirname}/reviews.json`, "utf-8")
);

// Import data into database
const importData = async () => {
    try {
        await Tour.create(tours);
        await User.create(users, { validateBeforeSave: false });
        await Review.create(reviews);
        console.log("Data successfully loaded! ✔️");
    } catch (error) {
        console.log("ERROR 💥", error);
    }
    process.exit();
};

// Deleting all data from database collection
const deleteData = async () => {
    try {
        await Tour.deleteMany();
        await User.deleteMany();
        await Review.deleteMany();
        console.log("Data successfully deleted 🗑️");
    } catch (error) {
        console.log("ERROR 💥", error);
    }
    process.exit();
};

if (process.argv[2] === "--import") importData();
else if (process.argv[2] === "--delete") deleteData();
