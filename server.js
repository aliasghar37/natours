const dotenv = require("dotenv");
dotenv.config({ path: `${__dirname}/config.env` });

// HANDLING UNCAUGHT EXCEPTIONS
process.on("uncaughtException", (err) => {
    console.log("UNCAUGHT EXCEPTION! Shutting down...");
    console.log(err);
    server.close(() => {
        process.exit(1);
    });
});

const mongoose = require("mongoose");
const app = require(`${__dirname}/app.js`);

// CONFIGURING DB
const DB = process.env.DATABASE.replace(
    "<db_password>",
    process.env.DATABASE_PASSWORD
);
mongoose.connect(DB, { dbName: "natours" });

// START SERVER
const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
    console.log(`App is listenning at ${port}`);
});

// HANDLING UNHANDLED REJECTIONS
process.on("unhandledRejection", (err) => {
    console.log("UNHANDLED REJECTION! Shutting down...");
    console.log(err);
    server.close(() => {
        process.exit(1);
    });
});
