const AppError = require(`${__dirname}/../utils/AppError.js`);
const User = require(`${__dirname}/../models/userModel.js`);
const catchAsync = require(`${__dirname}/../utils/catchAsync.js`);
const handlerFactory = require(`${__dirname}/../controllers/handlerFactory.js`);
const sharp = require("sharp");
const multer = require("multer");

// UPLOAD IMAGE IN THE STORAGE

// const multerStorage = multer.diskStorage({
//     destination: (req, file, cb) => {
//         cb(null, "public/img/users");
//     },
//     filename: (req, file, cb) => {
//         const extension = file.mimetype.split("/")[1];
//         cb(null, `user-${req.user.id}-${Date.now()}.${extension}`);
//     },
// });

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

exports.uploadUserPhoto = upload.single("photo");

exports.resizeUserPhoto = async (req, res, next) => {
    if (!req.file) return next();
    req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;

    await sharp(req.file.buffer)
        .resize(500, 500)
        .toFormat("jpeg")
        .jpeg({ quality: 90 })
        .toFile(`public/img/users/${req.file.filename}`);

    next();
};

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
    if (req.file) filteredBody.photo = req.file.filename;

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
