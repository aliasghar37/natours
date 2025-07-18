const express = require("express");
const router = express.Router();
const viewController = require(`${__dirname}/../controllers/viewController.js`);
const authController = require(`${__dirname}/../controllers/authController.js`);

router.use(authController.isLoggedIn);

router.get("/", viewController.getOverview);
router.get("/tours/:slug", viewController.getTour);
router.get("/login", viewController.getLoginForm);

module.exports = router;
