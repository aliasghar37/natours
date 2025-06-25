const dotenv = require("dotenv");
dotenv.config({ path: `${__dirname}/config.env` });

const mongoose = require("mongoose");
const app = require(`${__dirname}/app.js`);

const DB = process.env.DATABASE.replace(
    "<db_password>",
    process.env.DATABASE_PASSWORD
);
mongoose.connect(DB, { dbName: "natours" }).then(() => {});

// START SERVER
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`App is listenning at ${port}`);
});
