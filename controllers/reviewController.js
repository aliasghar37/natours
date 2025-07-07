const catchAsync = require(`${__dirname}/../utils/catchAsync.js`);
const Review = require(`${__dirname}/../models/reviewModel.js`);

exports.getAllReviews = catchAsync(async (req, res) => {
    const reviews = await Review.find();

    res.status(200).json({
        status: "success",
        reviewsLength: reviews.length,
        data: { reviews },
    });
});

exports.createReview = catchAsync(async (req, res) => {
    const newReview = await Review.create({
        review: req.body.review,
        rating: req.body.rating,
        tour: req.body.tour,
        user: req.body.user,
    });

    res.status(200).json({
        status: "success",
        data: { review: newReview },
    });
});
