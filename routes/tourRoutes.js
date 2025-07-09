const express = require("express");
const tourController = require(`${__dirname}/../controllers/tourController.js`);
const authController = require(`${__dirname}/../controllers/authController.js`);
const reviewRouter = require(`${__dirname}/../routes/reviewRoutes.js`);

const router = express.Router();

router
    .route("/top-5-cheap")
    .get(tourController.aliasTopTours, tourController.getAllTours);

router.route("/tour-stats").get(tourController.getTourStats);
router
    .route("/monthly-plan/:year")
    .get(
        authController.protect,
        authController.restrictTo("admin", "lead-guide", "guide"),
        tourController.getMonthlyPlan
    );

router
    .route("/tours-within/:distance/center/:latlng/unit/:unit")
    .get(tourController.getToursWithin);

router.route("/distances/:latlng/unit/:unit").get(tourController.getDistances);

router
    .route("/")
    .get(tourController.getAllTours)
    .post(
        authController.protect,
        authController.restrictTo("lead-guide", "admin"),
        tourController.createTour
    );

router
    .route("/:id")
    .get(authController.protect, tourController.getTour)
    .patch(
        authController.protect,
        authController.restrictTo("lead-guide", "admin"),
        tourController.updateTour
    )
    .delete(
        authController.protect,
        authController.restrictTo("lead-guide", "admin"),
        tourController.deleteTour
    );

router.use("/:tourId/reviews", reviewRouter);

module.exports = router;
