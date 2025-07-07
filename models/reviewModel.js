const mongoose = require("mongoose");

const reviewSchema = mongoose.Schema(
    {
        review: {
            type: String,
            trim: true,
            maxLength: [50, "A review must be lower than 50 characters"],
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
    this.populate({
        path: "tour",
        select: "name photo",
    });
    next();
});

const Review = mongoose.model("Review", reviewSchema);
module.exports = Review;
