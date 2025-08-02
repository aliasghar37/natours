const Tour = require(`${__dirname}/../models/tourModel.js`);
const Booking = require(`${__dirname}/../models/bookingModel.js`);
const catchAsync = require(`${__dirname}/../utils/catchAsync.js`);
const AppError = require(`${__dirname}/../utils/AppError.js`);

exports.alerts = (req, res, next) => {
    const { alert } = req.query;
    if (alert === "booking")
        res.locals.alert =
            "Tour has been booked successfully, please check your email.";

    next();
};

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
    });
};
exports.getAccount = (req, res) => {
    res.status(200).render("account", {
        title: "Your account",
    });
};

exports.getMyBookings = async (req, res, next) => {
    // 1) Find all bookings
    const bookings = await Booking.find({ user: req.user.id });
    // 2) Find tours with returned booking ids
    const tourIds = bookings.map((el) => el.tour);
    const tours = await Tour.find({ _id: { $in: tourIds } });

    res.status(200).render("overview", { title: "My bookings", tours });
};
