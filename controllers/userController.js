const AppError = require(`${__dirname}/../utils/AppError.js`);
const User = require(`${__dirname}/../models/userModel.js`);
const catchAsync = require(`${__dirname}/../utils/catchAsync.js`);
const handlerFactory = require(`${__dirname}/../controllers/handlerFactory.js`);

const filterObj = (obj, ...allowedFields) => {
    const newObj = {};
    Object.keys(obj).forEach((el) => {
        if (allowedFields.includes(el)) newObj[el] = obj[el];
    });

    return newObj;
};

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
    await User.findByIdAndUpdate(req.user.id, { select: false });

    res.status(204).json({
        status: "success",
        data: null,
    });
});

exports.getMe = (req, res, next) => {
    req.params.id = req.user.id;
    next();
};

exports.getAllUsers = handlerFactory.getAll(User);
exports.getUser = handlerFactory.getOne(User);
exports.updateUser = handlerFactory.updateOne(User);
exports.deleteUser = handlerFactory.deleteOne(User);
