const dotenv = require("dotenv");
dotenv.config({ path: `./config.env` });
const fs = require("fs");
const mongoose = require("mongoose");
const { dirname } = require("path");
const Tour = require(`${__dirname}/../../models/tourModel.js`);

const DB = process.env.DATABASE.replace(
    "<db_password>",
    process.env.DATABASE_PASSWORD
);
mongoose.connect(DB, { dbName: "natours" }).then(() => {});

// READ JSON FILE
const tours = JSON.parse(
    fs.readFileSync(`${__dirname}/tours-simple.json`, "utf-8")
);

// Import data into database
const importData = async () => {
    try {
        await Tour.create(tours);
        console.log("Data successfully loaded! ✔️");
    } catch (error) {
        console.log(error);
    }
    process.exit();
};

// Deleting all data from database collection
const deleteData = async () => {
    try {
        await Tour.deleteMany();
        console.log("Data successfully deleted 🗑️");
    } catch (error) {
        console.log(error);
    }
    process.exit();
};

if (process.argv[2] === "--import") importData();
else if (process.argv[2] === "--delete") deleteData();
