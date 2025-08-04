const express = require("express");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const mongoSanitize = require("mongo-sanitize");
const { xss } = require("express-xss-sanitizer");
const hpp = require("hpp");
const path = require("path");
const AppError = require("./utils/AppError");
const globalErrorHandler = require(
    `${__dirname}/controllers/errorController.js`
);
const cookieParser = require("cookie-parser");
const compression = require("compression");

const tourRouter = require(`${__dirname}/routes/tourRoutes.js`);
const userRouter = require(`${__dirname}/routes/userRoutes.js`);
const reviewRouter = require(`${__dirname}/routes/reviewRoutes.js`);
const viewRouter = require(`${__dirname}/routes/viewRoutes.js`);
const bookingRouter = require(`${__dirname}/routes/bookingRoutes.js`);
const bookingController = require(
    `${__dirname}/controllers/bookingController.js`
);

const app = express();
app.enable("trust proxy");

app.set("view engine", "pug");
app.set("views", path.join(__dirname, "views"));

// Serving static files
app.use(express.static(path.join(__dirname, "public")));

// GLOBAL MIDDLEWARES

// using helmet to enhance security over all the middlewares
app.use(helmet());

// Logging response in development
if (process.env.NODE_ENV === "development") app.use(morgan("dev"));

// RATE LIMITER
const limiter = rateLimit({
    max: 200,
    windowsMs: 60 * 60 * 60 * 1000,
    message: "Too many request from this IP, please try again in an hour",
});
app.use("/api", limiter);

app.use(
    "/webhook-checkout",
    express.raw({ type: "application/json" }),
    bookingController.webhookCheckout
);

// Body parser, reading data from body into req.body
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
app.use(cookieParser());

// DATA SANITIZATION AGAINST NOSSQL QUERY INJECTION
app.use((req, res, next) => {
    req.body = mongoSanitize(req.body);
    req.query = mongoSanitize(req.query);
    req.params = mongoSanitize(req.params);
    next();
});

// // DATA SANITIZATION AGAIN XSS
app.use(xss());

// Parameter population prevention
app.use(
    hpp({
        whitelist: [
            "duration",
            "difficulty",
            "maxGroupSize",
            "ratingsAverage",
            "ratingsQuantity",
            "price",
        ],
    })
);

// Setting the query parser to allow nested objects for api query parsing
app.set("query parser", "extended");

app.use((req, res, next) => {
    res.setHeader(
        "Content-Security-Policy",
        "img-src 'self' data: https://api.maptiler.com"
    );
    next();
});

app.use(compression());

// app.use((req, res, next) => {
//     console.log(req.cookies);
//     next();
// });

// ROUTES
app.use("/api/v1/tours", tourRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/reviews", reviewRouter);
app.use("/api/v1/bookings", bookingRouter);
app.use("/", viewRouter);

// HANDLE ALL UNHANDLED ROUTES
app.all(/.*/, (req, res, next) => {
    const err = new AppError(
        `Can't find ${req.originalUrl} on this server!`,
        404
    );

    next(err);
});

// ERROR HANDLING MIDDLEWARE
app.use(globalErrorHandler);

module.exports = app;
