const catchAsync = require(`${__dirname}/../utils/catchAsync.js`);
const Review = require(`${__dirname}/../models/reviewModel.js`);
const Tour = require(`${__dirname}/../models/tourModel.js`);
const Booking = require(`${__dirname}/../models/bookingModel.js`);
const handlerFactory = require(`${__dirname}/../controllers/handlerFactory.js`);
const AppError = require(`${__dirname}/../utils/AppError.js`);

exports.getAllReviews = handlerFactory.getAll(Review);
exports.getReview = handlerFactory.getOne(Review);
exports.updateReview = handlerFactory.updateOne(Review);
exports.deleteReview = handlerFactory.deleteOne(Review);

exports.setUserTourIds = (req, res, next) => {
    if (!req.body.tour) req.body.tour = req.params.tourId;
    if (!req.body.user) req.body.user = req.user.id;
    next();
};

exports.createReview = catchAsync(async (req, res, next) => {
    // Check if user has booked the same tour for which he wants to add review
    const userInBooking = await Booking.find({ user: { $eq: req.body.user } });
    const tourInBooking = await Booking.find({ tour: { $eq: req.body.tour } });
    if (userInBooking.length <= 0 || tourInBooking.length <= 0) {
        const err = new AppError(
            "Only users who booked this tour can create a review",
            400
        );
        return next(err);
    }

    const review = await Review.create(req.body);
    res.status(201).json({
        status: "success",
        data: {
            data: review,
        },
    });
});
