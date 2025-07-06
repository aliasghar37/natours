const { findByIdAndUpdate } = require("../models/userModel");

const AppError = require(`${__dirname}/../utils/AppError.js`);

const User = require(`${__dirname}/../models/userModel.js`);
const ApiFeatures = require(`${__dirname}/../utils/ApiFeatures.js`);
const catchAsync = require(`${__dirname}/../utils/catchAsync.js`);

const filterObj = (obj, ...allowedFields) => {
    const newObj = {};
    Object.keys(obj).forEach((el) => {
        if (allowedFields.includes(el)) newObj[el] = obj[el];
    });

    return newObj;
};

exports.getAllUsers = catchAsync(async (req, res) => {
    const features = new ApiFeatures(User.find(), req.query)
        .filter()
        .sort()
        .limitFields()
        .paginate();

    const users = await features.query;

    res.status(200).json({
        status: "success",
        data: {
            users,
        },
    });
});

exports.updateMe = async (req, res, next) => {
    // Check if password/passwordConfirm exists
    if (req.body.password || req.body.passwordConfirm) {
        const err = new AppError(
            "Incorrect URL to change password, try another URL",
            400
        );
        return next(err);
    }
    // If not, then filter the body before updating
    const filteredBody = filterObj(req.body, "name", "email");
    // Update the user document with filtered body
    const updatedUser = await User.findByIdAndUpdate(
        req.user.id,
        filteredBody,
        { new: true, runValidator: true }
    );

    res.status(200).json({
        status: "success",
        data: {
            user: updatedUser,
        },
    });
};

exports.deleteMe = catchAsync(async (req, res, next) => {
    console.log(req.user.id);
    await User.findByIdAndUpdate(req.user.id, { select: false });

    res.status(204).json({
        status: "success",
        data: null,
    });
});

exports.getUser = catchAsync(async (req, res) => {
    const user = await User.findById(req.params.id);

    res.status(200).json({
        status: "success",
        data: {
            user,
        },
    });
});
exports.createUser = async (req, res) => {
    res.status(500).json({
        status: "error",
        message: "Internal Server Error",
    });
};
exports.updateUser = async (req, res) => {
    const newUser = await User.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidator: true,
    });

    res.status(201).json({
        status: "success",
        data: {
            newUser,
        },
    });
};
exports.deleteUser = async (req, res) => {
    await User.findByIdAndDelete(req.params.id);

    res.status(200).json({
        status: "success",
        data: null,
    });
};
