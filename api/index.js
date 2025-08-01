const mongoose = require("mongoose");
const app = require("../app");

// CONFIGURING DB
const DB = process.env.DATABASE.replace(
    "<db_password>",
    process.env.DATABASE_PASSWORD
);

let cachedDB = null;
async function connectToDB() {
    if (cachedDB) return cachedDB;

    try {
        const client = await mongoose.connect(DB, { dbName: "natours" });
        cachedDB = client;
        console.log("DB connection successful!");
        return cachedDB;
    } catch (error) {
        console.error("DB connection error:", error);
        throw error; // Re-throw the error to prevent the app from starting
    }
}
module.exports = async (req, res) => {
    await connectToDB();
    app(req, res);
};
