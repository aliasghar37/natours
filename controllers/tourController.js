const Tour = require(`${__dirname}/../models/tourModel.js`);
const catchAsync = require(`${__dirname}/../utils/catchAsync.js`);
const handlerFactory = require(`${__dirname}/../controllers/handlerFactory.js`);
const AppError = require(`${__dirname}/../utils/AppError.js`);
const multer = require("multer");
const sharp = require("sharp");

const multerFilter = (req, file, cb) => {
    if (file.mimetype.startsWith("image")) cb(null, true);
    else
        cb(new AppError("Not an image! please upload only images", 400), false);
};

// UPLOAD IMAGE IN MEMORY AS BUFFER - which is then available at << req.file.buffer >>
const multerStorage = multer.memoryStorage();

const upload = multer({
    storage: multerStorage,
    fileFilter: multerFilter,
});

exports.uploadTourImages = upload.fields([
    { name: "imageCover", maxCount: 1 },
    { name: "images", maxCount: 3 },
]);

exports.resizeTourImages = async (req, res, next) => {
    if (!req.files.imageCover || !req.files.images) return next();

    // a) coverImage
    req.body.filename = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;
    await sharp(req.files.imageCover[0].buffer)
        .resize(2000, 1333)
        .toFormat("jpeg")
        .jpeg({ quality: 90 })
        .toFile(`public/img/tours/${req.body.filename}`);

    req.body.images = [];
    console.log(req.files.imageCover);
    await Promise.all(
        req.files.images.map(async (img, i) => {
            const filename = `tour-${req.params.id}-${Date.now()}-${i + 1}-cover.jpeg`;
            await sharp(img.buffer)
                .resize(2000, 1333)
                .toFormat("jpeg")
                .jpeg({ quality: 90 })
                .toFile(`public/img/tours/${filename}`);
            req.body.images.push(filename);
        })
    );

    next();
};

// MIDDLEWARE -> pre-filling the query for 5 cheap tours only
exports.aliasTopTours = (req, res, next) => {
    // As we cannot modify the req.query that is why using this:
    const processedQuery = { ...req.query };
    processedQuery.limit = "5";
    processedQuery.sort = "price,ratingsAverage";
    processedQuery.fields = "name,price,ratingsAverage,summary,difficulty";

    req.processedQuery = processedQuery;
    next();
};

// TOUR STATS AGGREGATION PIPELINE
exports.getTourStats = catchAsync(async (req, res, next) => {
    const stats = await Tour.aggregate([
        {
            $match: { ratingsAverage: { $gte: 4.5 } },
        },
        {
            $group: {
                // Group by difficulty (or ratings)
                _id: { $toUpper: "$difficulty" },
                numTours: { $sum: 1 },
                numRatings: { $sum: "$ratingsQuantity" },
                avgRating: { $avg: "$ratingsAverage" },
                avgPrice: { $avg: "$price" },
                minPrice: { $min: "$price" },
                maxPrice: { $max: "$price" },
            },
        },
        {
            $sort: { avgPrice: 1 },
        },
    ]);
    res.status(200).json({
        status: "success",
        data: {
            stats,
        },
    });
});

// MONTHLY PLAN AGGREGATION PIPELINE
exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
    const year = +req.params.year;

    const plan = await Tour.aggregate([
        {
            $unwind: "$startDates",
        },
        {
            $match: {
                startDates: {
                    $gte: new Date(`${year}-01-01`),
                    $lte: new Date(`${year}-12-31`),
                },
            },
        },
        {
            $group: {
                _id: { $month: "$startDates" },
                numTourStarts: { $sum: 1 },
                tours: { $push: "$name" },
            },
        },
        {
            $addFields: { month: "$_id" },
        },
        {
            $project: { _id: 0 },
        },
        {
            $sort: { numTourStarts: -1 },
        },
    ]);

    res.status(200).json({
        status: "success",
        data: {
            plan,
        },
    });
});

// ROUTE CALLBACKS
exports.getAllTours = handlerFactory.getAll(Tour);
exports.getTour = handlerFactory.getOne(Tour, { path: "reviews" });
exports.createTour = handlerFactory.createOne(Tour);
exports.updateTour = handlerFactory.updateOne(Tour);
exports.deleteTour = handlerFactory.deleteOne(Tour);

exports.getToursWithin = catchAsync(async (req, res, next) => {
    // /tours-within/:distance/center/:latlng/unit/:unit
    const { distance, latlng, unit } = req.params;
    const [lat, lng] = latlng.split(",");

    if (!lat || !lng) {
        const err = new AppError("Lattitue and longitude are not defined", 400);
        return next(err);
    }

    // Convert the value into radians
    const radius = unit === "mi" ? distance / 3963.2 : distance / 6378.1;

    // Query for MongoDB Compass
    // {startLocation: { $geoWithin: { $centerSphere: [[-118.113491, 34.111745], 0.1] } }}

    const tour = await Tour.find({
        startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } },
    });

    if (!tour) {
        const err = new AppError("No tours found", 404);
        return next(err);
    }

    res.status(200).json({
        status: "message",
        results: tour.length,
        data: {
            data: tour,
        },
    });
});

exports.getDistances = async (req, res, next) => {
    const { latlng, unit } = req.params;
    const [lat, lng] = latlng.split(",");

    if (!lat || !lng) {
        const err = new AppError("Lattitue and longitude are not defined", 400);
        return next(err);
    }

    const multiplier = unit === "mi" ? 0.000621371 : 0.001;
    const distances = await Tour.aggregate([
        {
            $geoNear: {
                near: {
                    type: "Point",
                    coordinates: [+lng, +lat],
                },
                distanceField: "distance",
                distanceMultiplier: multiplier,
            },
        },
        {
            $project: {
                name: 1,
                distance: 1,
            },
        },
    ]);

    res.status(200).json({
        status: "success",
        data: { data: distances },
    });
};
