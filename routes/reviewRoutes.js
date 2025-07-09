const express = require("express");
const authController = require(`${__dirname}/../controllers/authController.js`);
const reviewController = require(
    `${__dirname}/../controllers/reviewController.js`
);
const router = express.Router({ mergeParams: true });

// Protect all below routes
router.use(authController.protect);

router
    .route("/")
    .get(reviewController.getAllReviews)
    .post(
        authController.restrictTo("user"),
        reviewController.setUserTourIds,
        reviewController.createReview
    );

router
    .route("/:id")
    .get(reviewController.getReview)
    .patch(authController.restrictTo("user"), reviewController.updateReview)
    .delete(
        authController.restrictTo("user", "admin"),
        reviewController.deleteReview
    );

module.exports = router;
