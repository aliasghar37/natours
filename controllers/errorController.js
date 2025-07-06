const AppError = require(`${__dirname}/../utils/AppError.js`);

// HANDLING PRODUCTION ERRORS
const handleCastErrorDb = (err) => {
    const message = `Invalid ${err.path}: ${err.value}`;
    return new AppError(message, 400);
};

const handleDuplicateFieldDb = (err) => {
    const message = `A resource already exists with the same (${err.keyValue.name}) name!`;
    return new AppError(message, 400);
};

const handleValidationErrorDb = (err) => {
    const errMessages = Object.values(err.errors).map((el) => el.message);
    return new AppError(`Invalid data input! ${errMessages.join(". ")}`, 400);
};

// HANDLE JWT ERRORS ON PRODUCTION
const handleJWTError = () =>
    new AppError("Invalid token, please log in again", 401);

const handleJWTExpiredError = () =>
    new AppError("Your token has been expired, please log in again!", 401);

const sendErrorDev = (err, res) => {
    return res.status(err.statusCode).json({
        error: err,
        status: err.status,
        message: err.message,
        stack: err.stack,
    });
};

const sendErrorProd = (err, res) => {
    // Operational, trusted error > send msg to the client
    if (err.isOperational) {
        res.status(err.statusCode).json({
            status: err.status,
            message: err.message,
        });
    } else {
        // Programming or other unknown error > Don't leak error details
        // 1) Log to the console
        console.error(err);

        // 2) Send a generic message
        res.status(500).json({
            status: "error",
            message: "Something went wrong",
        });
    }
};

// GLOBAL ERROR HANDLER

module.exports = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || "error";

    if (process.env.NODE_ENV === "development") {
        sendErrorDev(err, res);
    } else if (process.env.NODE_ENV === "production") {
        // Handle Invalid Database ID
        if (err.name === "CastError") err = handleCastErrorDb(err);
        if (err.name === "ValidationError") err = handleValidationErrorDb(err);
        if (err.code === 11000) err = handleDuplicateFieldDb(err);
        if (err.name === "JsonWebTokenError") err = handleJWTError();
        if (err.name === "TokenExpiredError") err = handleJWTExpiredError();

        sendErrorProd(err, res);
    }
};
