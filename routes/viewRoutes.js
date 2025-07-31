const express = require("express");
const router = express.Router();
const viewController = require(`${__dirname}/../controllers/viewController.js`);
const authController = require(`${__dirname}/../controllers/authController.js`);
const bookingController = require(
    `${__dirname}/../controllers/bookingController.js`
);

router.get(
    "/",
    bookingController.createBookingCheckout,
    authController.isLoggedIn,
    viewController.getOverview
);

router.get("/tours/:slug", authController.isLoggedIn, viewController.getTour);
router.get("/login", authController.isLoggedIn, viewController.getLoginForm);
router.get("/signup", authController.isLoggedIn, viewController.getSignupForm);
router.get(
    "/forgotPassword",
    authController.isLoggedIn,
    viewController.getForgotPasswordForm
);
router.get(
    "/resetPassword/:token",
    authController.isLoggedIn,
    viewController.getResetPasswordForm
);
router.get("/me", authController.protect, viewController.getAccount);
router.get(
    "/my-bookings",
    authController.protect,
    viewController.getMyBookings
);

module.exports = router;
