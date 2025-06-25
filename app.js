const express = require("express");
const morgan = require("morgan");
const { error } = require("console");
const { create } = require("domain");
const app = express();
const tourRouter = require(`${__dirname}/routes/tourRoutes.js`);
const userRouter = require(`${__dirname}/routes/userRoutes.js`);

// MIDDLEWARES
if (process.env.NODE_ENV === "development") app.use(morgan("dev"));


app.use(express.json());

app.use(express.static(`${__dirname}/public/img/`));

app.use((req, res, next) => {
    console.log("Hello from the middleware 👋");
    next();
});

app.use((req, res, next) => {
    req.requestTime = new Date().toISOString();
    console.log(req.requestTime);
    next();
});

// ROUTE HANDLERS

app.use("/api/v1/tours", tourRouter);
app.use("/api/v1/users", userRouter);

module.exports = app;
