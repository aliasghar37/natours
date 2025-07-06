const Tour = require(`${__dirname}/../models/tourModel.js`);
const ApiFeatures = require(`${__dirname}/../utils/ApiFeatures.js`);
const catchAsync = require(`${__dirname}/../utils/catchAsync.js`);

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
exports.getAllTours = catchAsync(async (req, res, next) => {
    const queryToUse = req.processedQuery || req.query;

    // EXECUTING QUERY
    const features = new ApiFeatures(Tour.find(), queryToUse)
        .filter()
        .sort()
        .limitFields()
        .paginate();
    const tours = await features.query;

    res.status(200).json({
        status: "success",
        result: tours.length,
        data: { tours },
    });
});

exports.getTour = catchAsync(async (req, res, next) => {
    const tour = await Tour.findById(req.params.id);
    res.status(200).json({
        status: "success",
        data: {
            tour,
        },
    });
});

exports.createTour = catchAsync(async (req, res, next) => {
    const newTour = await Tour.create(req.body);
    res.status(201).json({
        status: "success",
        data: {
            tour: newTour,
        },
    });
});

exports.updateTour = catchAsync(async (req, res, next) => {
    const updatedTour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
    });
    res.status(200).json({
        status: "success",
        data: {
            tour: updatedTour,
        },
    });
});

exports.deleteTour = catchAsync(async (req, res, next) => {
    await Tour.findByIdAndDelete(req.params.id);
    res.status(204).json({
        status: "success",
        data: null,
    });
});
