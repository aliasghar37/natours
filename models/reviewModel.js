const mongoose = require("mongoose");
const Tour = require(`${__dirname}/tourModel.js`);
const AppError = require(`${__dirname}/../utils/AppError.js`);

const reviewSchema = new mongoose.Schema(
    {
        review: {
            type: String,
            trim: true,
            maxLength: [500, "A review must be lower than 500 characters"],
        },
        rating: {
            type: Number,
            min: 1,
            max: 5,
        },
        createdAt: {
            type: Date,
            default: Date.now(),
        },
        tour: {
            type: mongoose.Schema.ObjectId,
            ref: "Tour",
            required: [true, "Review must belong to a tour"],
        },
        user: {
            type: mongoose.Schema.ObjectId,
            ref: "User",
            required: [true, "Review must belong to a user"],
        },
    },
    {
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

reviewSchema.pre(/^find/, function (next) {
    this.populate({
        path: "user",
        select: "name",
    });
    // this.populate({
    //     path: "tour",
    //     select: "name photo",
    // });
    next();
});

reviewSchema.statics.calcAverageRating = async function (tourId) {
    console.log(tourId);
    const stats = await this.aggregate([
        {
            $match: { tour: tourId },
        },
        {
            $group: {
                _id: "$tour",
                nRating: { $sum: 1 },
                avgRating: { $avg: "$rating" },
            },
        },
    ]);

    if (stats.length > 0) {
        await Tour.findByIdAndUpdate(tourId, {
            ratingsAverage: stats[0].avgRating,
            ratingsQuantity: stats[0].nRating,
        });
    } else {
        await Tour.findByIdAndUpdate(tourId, {
            ratingsAverage: 4.5,
            ratingsQuantity: 0,
        });
    }
};

reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

reviewSchema.post("save", function () {
    // this refers to current doc -> review
    // this.constructor refers to the Review model (Object)
    this.constructor.calcAverageRating(this.tour);
});

reviewSchema.post(/^findOneAnd/, async function (doc, next) {
    // this doc is the updatedDoc that we got in result after executing
    // the findbyidandupdate query in the controller (updateOne)
    if (!doc) return next(new AppError("No document found with this id", 404));
    await doc.constructor.calcAverageRating(doc.tour);
});

const Review = mongoose.model("Review", reviewSchema);
module.exports = Review;
