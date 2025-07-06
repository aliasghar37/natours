const express = require("express");
const tourController = require(`${__dirname}/../controllers/tourController.js`);
const authController = require(`${__dirname}/../controllers/authController.js`);

const router = express.Router();

router
    .route("/top-5-cheap")
    .get(tourController.aliasTopTours, tourController.getAllTours);

router.route("/monthly-plan/:year").get(tourController.getMonthlyPlan);
router.route("/tour-stats").get(tourController.getTourStats);

router
    .route("/")
    .get(authController.protect, tourController.getAllTours)
    .post(tourController.createTour);

router
    .route("/:id")
    .get(authController.protect, tourController.getTour)
    .patch(authController.protect, tourController.updateTour)
    .delete(
        authController.protect,
        authController.restrictTo("lead-guide", "admin"),
        tourController.deleteTour
    );

module.exports = router;
