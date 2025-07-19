const User = require(`${__dirname}/../models/userModel.js`);
const jwt = require("jsonwebtoken");
const catchAsync = require(`${__dirname}/../utils/catchAsync.js`);
const AppError = require(`${__dirname}/../utils/AppError.js`);
const { promisify } = require("util");
const sendEmail = require(`${__dirname}/../utils/email.js`);
const crypto = require("crypto");

// SIGN/CREATE TOKEN
const signToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN,
    });
};

const createAndSendToken = (user, statusCode, res) => {
    const token = signToken(user._id);

    const cookieOptions = {
        expires: new Date(
            Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
        ),
        httpOnly: true,
    };
    if (process.env.NODE_ENV === "production") cookieOptions.secure = true;
    res.cookie("jwt", token, cookieOptions);

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

    res.status(201).json({
        status: "success",
        data: {
            selectedUser,
        },
    });

    // IMMEDIATELY LOG IN THE USER AS HE SIGNS UP
    // createAndSendToken(selectedUser, 200, res);
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

    createAndSendToken(user, 200, res);
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

    // Put entire user data on the req
    req.user = currentUser;

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
    res.cookie("jwt", "loggedout", {
        expires: new Date(Date.now() + 5 * 1000),
        httpOnly: true,
    });
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
    // A) for API
    // const resetURL = `${req.protocol}://${req.get("host")}/api/v1/users/resetPasswod/${resetToken}`;
    // const message = `Forgot your password? Submit a PATCH request with new password and passwordConfirm to: ${resetURL}\nIf you didn't forget, please ignore this.`;

    // B) for Rendered Website
    const resetURL = `${req.protocol}://${req.get("host")}/resetPassword/${resetToken}`;
    const message = `Hi ${user.name.split(" ")[0]}\n\nForgot your password?\nWe received a request to reset the password for your account.\n\nTo reset your password, click on the below link:\n${resetURL}\n\nIf you didn't sent this request, please ignore this.`;
    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>NATOURS - Reset Password</title>
        <style>
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                margin: 0;
                background: #f5f5f5;
            }
            
            .email-container {
                max-width: 500px;
                margin: 50px auto;
                background: white;
                border-radius: 8px;
                overflow: hidden;
                box-shadow: 0 4px 20px rgba(0,0,0,0.1);
            }
            
            .header {
                background: #55c57a;
                color: white;
                padding: 30px;
                text-align: center;
            }
            
            .header h1 {
                margin: 0;
                font-size: 28px;
                letter-spacing: 3px;
            }
            
            .title {
                background: #47a869;
                color: white;
                padding: 20px;
                text-align: center;
                font-size: 18px;
            }
            
            .content {
                padding: 30px;
                color: #666;
                line-height: 1.6;
            }
            
            .btn {
                background: #55c57a;
                color: white;
                padding: 8px 20px;
                border: none;
                border-radius: 5px;
                font-size: 16px;
                cursor: pointer;
                margin: 40px 0;
                text-decoration: none;
            }
            
            .footer {
                background: #55c57a;
                color: white;
                padding: 20px;
                text-align: center;
                font-size: 14px;
            }
        </style>
    </head>
    <body>
        <div class="email-container">
            <div class="header">
                <h1>NATOURS</h1>
            </div>
            
            <div class="title">
                Please reset your password
            </div>
            
            <div class="content">
                <p>Hi ${user.name.split(" ")[0]},</p>
                <p>We received a request to reset the password for your account.</p>
                <p>To reset your password, please follow the link below:</p>
                
                <a class="btn" href="${resetURL}">Reset Password</a>
                
                <p><em>Please ignore this email if you did not request a password change.</em></p>
            </div>
            
            <div class="footer">
                Contact: admin@natours.io | Company © All Rights Reserved
            </div>
        </div>
    </body>
    </html>`;
    try {
        await sendEmail({
            email: user.email,
            subject: "Please reset your password",
            message,
            html,
        });

        // createAndSendToken(user, 200, res);
        res.status(200).json({
            status: "success",
        });
    } catch (err) {
        user.passwordResetToken = undefined;
        user.passwordResetTokenExpires = undefined;
        await user.save({ validateBeforeSave: false });
        console.log(err);
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
    console.log(user);
    await user.save({ validateBeforeSave: true });

    // 3) update changedpasswordat property for user using mongoose middleware
    // 4) log the user in and send jwt
    createAndSendToken(user, 200, res);
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
    createAndSendToken(user, 200, res);
});
