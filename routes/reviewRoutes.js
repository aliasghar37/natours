const express = require("express");
const authController = require(`${__dirname}/../controllers/authController.js`);
const reviewController = require(
    `${__dirname}/../controllers/reviewController.js`
);
const router = express.Router();

router
    .route("/")
    .get(reviewController.getAllReviews)
    .post(
        authController.protect,
        authController.restrictTo("user"),
        reviewController.createReview
    );

module.exports = router;
