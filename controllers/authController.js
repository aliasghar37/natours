const User = require(`${__dirname}/../models/userModel.js`);
const jwt = require("jsonwebtoken");
const catchAsync = require(`${__dirname}/../utils/catchAsync.js`);
const AppError = require(`${__dirname}/../utils/AppError.js`);
const { promisify } = require("util");
const Email = require(`${__dirname}/../utils/email.js`);
const crypto = require("crypto");

// SIGN/CREATE TOKEN
const signToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN,
    });
};

const createAndSendToken = (user, statusCode, req, res) => {
    const token = signToken(user._id);

    const cookieOptions = {
        expires: new Date(
            Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
        ),
        httpOnly: true,
        secure: req.secure || req.headers["x-forwarded-proto"] === "https",
        sameSite: "None",
    };
    res.cookie("jwt", token, cookieOptions);

    user.password = undefined;
    res.status(statusCode).json({
        status: "success",
        token,
        data: {
            user,
        },
    });
};

// SIGN UP - CREATE ACCOUNT
exports.signup = catchAsync(async (req, res, next) => {
    // CREATE A NEW USER
    const newUser = await User.create({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        passwordConfirm: req.body.passwordConfirm,
        // role: req.body.role,
    });
    // exclude password from sending in response
    const selectedUser = await User.findById(newUser._id);

    try {
        const url = `${req.protocol}://${req.get("host")}/me`;
        await new Email(selectedUser, url).sendWelcome();
    } catch (error) {
        console.log("ERROR 💥: Email sending failed! -> ", error.message);
    }

    // IMMEDIATELY LOG IN THE USER AS HE SIGNS UP
    createAndSendToken(selectedUser, 200, req, res);

    // res.status(201).json({
    //     status: "success",
    //     data: {
    //         selectedUser,
    //     },
    // });
});

// LOG IN
exports.login = async (req, res, next) => {
    // CHECK IF EMAIL AND PASSWORD EXIST
    const { email, password } = req.body;
    if (!email || !password) {
        const err = new AppError("Please provide email and password", 400);
        return next(err);
    }

    // CHECK IF USER EXISTS WITH THE PROVIDIED EMAIL
    const user = await User.findOne({ email }).select("email password");

    // CHECK IF THE PASSWORD IS CORRECT OR NOT
    if (!user || !(await user.comparePassword(password, user.password))) {
        const err = new AppError("Incorrect email or password", 401);
        return next(err);
    }

    createAndSendToken(user, 200, req, res);
};

exports.protect = catchAsync(async (req, res, next) => {
    // 1) Getting token and check if it's there
    let token;
    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith("Bearer")
    ) {
        token = req.headers.authorization.split(" ")[1];
    } else if (req.cookies.jwt) {
        token = req.cookies.jwt;
    }
    if (!token || token === "null") {
        const err = new AppError(
            "You are not logged in. Please log in to get access!",
            401
        );
        return next(err);
    }
    // 2) Verify token
    const verifyTokenAsync = promisify(jwt.verify);
    const decoded = await verifyTokenAsync(token, process.env.JWT_SECRET);

    // 3) Check if user still exists
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
        const err = new AppError(
            "The user belonging to this token doesn't exist any more",
            401
        );
        return next(err);
    }

    // 4) Check if user has changes password after the token was issued
    // true if it was changed
    if (currentUser.changedPasswordAfter(decoded.iat)) {
        const err = new AppError(
            "User recently changed the password, please log in again!",
            401
        );
        return next(err);
    }

    // Put entire user data on the req and res
    req.user = currentUser;
    res.locals.user = currentUser;
    // createAndSendToken(currentUser, 200, req, res);
    // GRANT ACCESS TO THE PROTECTED ROUTE
    next();
});

exports.isLoggedIn = async (req, res, next) => {
    if (req.cookies.jwt) {
        try {
            // 1) Get token from cookies
            const token = req.cookies.jwt;
            if (!token) return next();

            // 2) Verify token
            const verifyTokenAsync = promisify(jwt.verify);
            const decoded = await verifyTokenAsync(
                token,
                process.env.JWT_SECRET
            );

            // 3) Check if user still exists
            const currentUser = await User.findById(decoded.id);
            if (!currentUser) return next();

            // 4) Check if user has changed password after the token was issued
            // true if it was changed
            if (currentUser.changedPasswordAfter(decoded.iat)) return next();

            // There is a logged in user so;
            res.locals.user = currentUser;
            return next();
        } catch (err) {
            return next();
        }
    }
    next();
};

exports.logout = (req, res) => {
    const cookieOptions = {
        maxAge: 5000,
        httpOnly: true,
        secure: req.secure || req.headers["x-forwarded-proto"] === "https",
        sameSite: "None",
    };

    res.cookie("jwt", "loggedout", cookieOptions);
    // Set headers to prevent caching
    res.set(
        "Cache-Control",
        "no-store, no-cache, must-revalidate, proxy-revalidate"
    );
    res.set("Pragma", "no-cache");
    res.set("Expires", "0");
    res.status(200).json({ status: "success" });
};

// RESTRICT FROM PERFORMING ACTIONS TO CERTAIN RESOURCES
// based on the role of user
exports.restrictTo = (...roles) => {
    return function (req, res, next) {
        // roles = ['lead-guide', 'admin'], role = user
        if (!roles.includes(req.user.role)) {
            const err = new AppError(
                "You are not allowed to perform this action",
                403
            );
            return next(err);
        }
        next();
    };
};

// FORGOT PASSWORD
exports.forgotPassword = catchAsync(async (req, res, next) => {
    // Get user based on the received email
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
        const err = new AppError(
            "Couldn't find the user with this email. Please try again",
            404
        );
        next(err);
    }
    // Generate the random reset token
    const resetToken = await user.createPasswordResetToken();
    // need to save the document after midification (token expires at)
    // without running the validator, because there's no need for all required fields
    await user.save({ validateBeforeSave: false });

    // Send it to user's email
    try {
        const resetURL = `${req.protocol}://${req.get("host")}/resetPassword/${resetToken}`;
        await new Email(user, resetURL).sendPasswordReset();

        res.status(200).json({
            status: "success",
        });
    } catch (err) {
        user.passwordResetToken = undefined;
        user.passwordResetTokenExpires = undefined;
        await user.save({ validateBeforeSave: false });
        return next(
            new AppError(
                "There was an error while sending the email, please try again.",
                500
            )
        );
    }
});

exports.resetPassword = async (req, res, next) => {
    // 1) Get user based on the reset token
    const hashedToken = crypto
        .createHash("sha256")
        .update(req.params.token)
        .digest("hex");
    const user = await User.findOne({
        passwordResetToken: hashedToken,
        passwordResetTokenExpires: { $gt: Date.now() },
    });
    if (!user) {
        const err = new AppError("Token is invalid or expired!");
        return next(err);
    }
    // 2) If token in not expired and there is user then set new password
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    user.passwordResetToken = undefined;
    user.passwordResetTokenExpires = undefined;

    await user.save({ validateBeforeSave: true });

    // 3) update changedpasswordat property for user using mongoose middleware
    // 4) log the user in and send jwt
    createAndSendToken(user, 200, req, res);
};

exports.updatePassword = catchAsync(async (req, res, next) => {
    // Get user from collection
    const user = await User.findById(req.user.id).select("+password");
    if (!user) {
        const err = new AppError("There is no user with this email");
        return next(err);
    }
    // check if received password is correct
    if (
        !(await user.comparePassword(req.body.passwordCurrent, user.password))
    ) {
        const err = new AppError(
            "Incorrect password, please provide correct password",
            403
        );
        return next(err);
    }

    // update password
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    await user.save({ validateBeforeSave: true });
    // log in user and send jwt
    createAndSendToken(user, 200, req, res);
});
