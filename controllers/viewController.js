const Tour = require(`${__dirname}/../models/tourModel.js`);
const catchAsync = require(`${__dirname}/../utils/catchAsync.js`);
const AppError = require(`${__dirname}/../utils/AppError.js`);

exports.getOverview = catchAsync(async (req, res, next) => {
    const tours = await Tour.find();

    res.status(200).render("overview", {
        title: "All tours",
        tours,
    });
});

exports.getTour = catchAsync(async (req, res, next) => {
    const tour = await Tour.findOne({ slug: req.params.slug }).populate({
        path: "reviews",
        select: "review rating user",
    });
    if (!tour) {
        const err = new AppError("There is no tour with this name", 404);
        return next(err);
    }

    res.status(200).render("tour", {
        title: `${tour.name} Tour`,
        leafletKey: process.env.LEAFLET_KEY,
        tour,
    });
});

exports.getLoginForm = (req, res) => {
    res.status(200).render("login", {
        title: "Log in to your account",
    });
};

exports.getSignupForm = (req, res) => {
    res.status(200).render("signup", {
        title: "Create a new account",
    });
};

exports.getForgotPasswordForm = (req, res) => {
    res.status(200).render("forgotPassword", {
        title: "Forgot password",
    });
};

exports.getResetPasswordForm = (req, res) => {
    res.status(200).render("resetPassword", {
        title: "Reset password",
        token: req.params.token,
    })
}