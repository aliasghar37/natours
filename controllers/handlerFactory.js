const catchAsync = require(`${__dirname}/../utils/catchAsync.js`);
const AppError = require(`${__dirname}/../utils/AppError.js`);
const ApiFeatures = require(`${__dirname}/../utils/ApiFeatures.js`);

exports.getAll = (Model) =>
    catchAsync(async (req, res, next) => {
        // Filtering only reviews based on tour id
        // if no tourid, then empty filter means nothing
        let filter = {};
        if (req.params.tourId) {
            filter = {
                tour: req.params.tourId,
            };
        }

        const queryToUse = req.processedQuery || req.query;
        const features = new ApiFeatures(Model.find(filter), queryToUse)
            .filter()
            .sort()
            .limitFields()
            .paginate();
        const docs = await features.query;

        res.status(200).json({
            status: "success",
            result: docs.length,
            data: { data: docs },
        });
    });

exports.getOne = (Model, populateOptions) =>
    (exports.getTour = catchAsync(async (req, res, next) => {
        let query = Model.findById(req.params.id);
        if (populateOptions) query = query.populate(populateOptions);
        const doc = await query;

        if (!doc) {
            const err = new AppError("No document found witht this id", 404);
            return next(err);
        }

        res.status(200).json({
            status: "success",
            data: {
                data: doc,
            },
        });
    }));

exports.createOne = (Model) =>
    catchAsync(async (req, res, next) => {
        const newDoc = await Model.create(req.body);
        res.status(201).json({
            status: "success",
            data: {
                data: newDoc,
            },
        });
    });

exports.updateOne = (Model) =>
    catchAsync(async (req, res, next) => {
        const updatedDoc = await Model.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true,
            }
        );
        if (!updatedDoc) {
            const err = new AppError("No document found with this id", 404);
            return next(err);
        }
        res.status(200).json({
            status: "success",
            data: {
                data: updatedDoc,
            },
        });
    });

exports.deleteOne = (Model) =>
    catchAsync(async (req, res, next) => {
        const doc = await Model.findByIdAndDelete(req.params.id);

        if (!doc) {
            const err = new AppError("No document found with this id", 404);
            return next(err);
        }

        res.status(204).json({
            status: "success",
            data: null,
        });
    });
