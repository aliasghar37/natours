const Tour = require(`${__dirname}/../models/tourModel.js`);
const ApiFeatures = require(`${__dirname}/../utils/ApiFeatures.js`);

// Middleware -> pre-filling the query for 5 cheap tours only
exports.aliasTopTours = (req, res, next) => {
    // As we cannot modify the req.query that is why using this:
    const processedQuery = { ...req.query };
    processedQuery.limit = "5";
    processedQuery.sort = "-ratingsAverage,price";
    processedQuery.fields = "name,price,ratingsAverage,summary,difficulty";

    req.processedQuery = processedQuery;
    next();
};

exports.getAllTours = async (req, res) => {
    try {
        const queryToUse = req.processedQuery || req.query;

        // EXECUTING QUERY
        const features = new ApiFeatures(Tour.find(), queryToUse)
            .filter()
            .sort()
            .limitFields()
            .paginate();
        const tours = await features.query;

        // SENDING RESPONSE
        res.status(200).json({
            status: "success",
            result: tours.length,
            data: { tours },
        });
    } catch (error) {
        res.status(404).json({
            status: "fail",
            message: error.message,
        });
    }
};
exports.getTour = async (req, res) => {
    try {
        const tour = await Tour.findById(req.params.id);

        res.status(200).json({
            status: "success",
            data: {
                tour,
            },
        });
    } catch (err) {
        res.status(404).json({
            status: "fail",
            message: "⛔ No results found",
        });
    }
};

exports.createTour = async (req, res) => {
    try {
        const newTour = await Tour.create(req.body);
        res.status(201).json({
            status: "success",
            data: {
                tour: newTour,
            },
        });
    } catch (error) {
        res.status(400).json({
            status: "failed",
            message: "⚠️ Invalid data sent!",
        });
    }
};
exports.updateTour = async (req, res) => {
    try {
        const updatedTour = await Tour.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        res.status(200).json({
            status: "success",
            data: {
                tour: updatedTour,
            },
        });
    } catch (error) {
        res.status(400).json({
            status: "message",
            message: "📛 Bad request",
        });
    }
};
exports.deleteTour = async (req, res) => {
    try {
        await Tour.findByIdAndDelete(req.params.id);
        res.status(204).json({
            status: "success",
            data: null,
        });
    } catch (error) {
        res.status(400).json({
            status: "fail",
            message: "📛 Bad request",
        });
    }
};
