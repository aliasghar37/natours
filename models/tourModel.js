const mongoose = require("mongoose");
const slugify = require("slugify");
const User = require(`${__dirname}/userModel.js`);

// MONGOOSE SCHEMA
const tourSchema = mongoose.Schema(
    {
        name: {
            type: String,
            unique: true,
            required: [true, "A tour must have a name"],
            trim: true,
            maxLength: [
                40,
                "A tour name must be lower than or equal to 40 characters",
            ],
            minLength: [
                10,
                "A tour name must be greater than or equal to 10 characters",
            ],
        },
        slug: {
            type: String,
        },
        duration: {
            type: Number,
            required: [true, "A tour must have a duration"],
        },
        maxGroupSize: {
            type: Number,
            required: [true, "A tour must have a group size"],
        },
        difficulty: {
            type: String,
            required: [true, "A tour must have a difficulty"],
            enum: {
                values: ["easy", "medium", "difficult"],
                message:
                    "Difficulty should be either: easy, medium or difficult",
            },
        },
        ratingsAverage: {
            type: Number,
            default: 4.5,
            min: [1.0, "Rating must be above 1.0"],
            max: [5.0, "Rating must be below 5.0"],
        },
        ratingsQuantity: {
            type: Number,
            default: 0,
        },
        price: {
            type: Number,
            required: [true, "A tour must have a price"],
        },
        priceDiscount: {
            type: Number,
            validate: {
                validator: function (val) {
                    return val < this.price;
                },
                message: "The discount price must be lower than actual price",
            },
        },
        summary: {
            type: String,
            trim: true,
            required: [true, "A tour must have a summary"],
        },
        description: {
            type: String,
            trim: true,
        },
        imageCover: {
            type: String,
            required: [true, "A tour must have a cover image"],
        },
        images: [String],
        createdAt: {
            type: Date,
            default: Date.now(),
            select: false,
        },
        startDates: [Date],
        secretTour: {
            type: Boolean,
            default: false,
        },
        startLocation: {
            // GeoJSON
            type: {
                type: String,
                enum: ["Point"],
                default: "Point",
            },
            coordinates: [Number],
            address: String,
            description: String,
        },
        // Embedding location docs in tour doc
        locations: [
            {
                type: {
                    type: String,
                    enum: ["Point"],
                    default: "Point",
                },
                coordinates: [Number],
                address: String,
                description: String,
                day: Number,
            },
        ],
        guides: [{ type: mongoose.Schema.ObjectId, ref: "User" }],
    },

    {
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// VIRTUAL PROPERTY
tourSchema.virtual("durationWeeks").get(function () {
    return this.duration / 7;
});

// Virtual populate
tourSchema.virtual("review", {
    ref: "Review",
    foreignField: "tour",
    localField: "_id",
});

// DOCUMENT MIDDLEWARE
tourSchema.pre("save", function (next) {
    this.slug = slugify(this.name, { lower: true });
    next();
});

// Embedding Middlware
// tourSchema.pre("save", async function (next) {
//     const guidesPromises = this.guides.map(
//         // returns an array of promises
//         async (id) => await User.findById(id)
//     );
//     this.guides = await Promise.all(guidesPromises);
//     next();
// });

// QUERY MIDDLEWARE
tourSchema.pre(/^find/, function (next) {
    this.find({ secretTour: { $ne: true } });
    next();
});
tourSchema.pre(/^find/, function (next) {
    this.populate({
        path: "guides",
        select: "-passwordChangedAt -__v",
    });
    next();
});

// AGGREGATION MIDDLEWARE
tourSchema.pre("aggregate", function (next) {
    this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
    next();
});

const Tour = mongoose.model("Tour", tourSchema);
module.exports = Tour;
