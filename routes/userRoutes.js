const express = require("express");
const userController = require(`${__dirname}/../controllers/userController.js`);
const router = express.Router();
const authController = require(`${__dirname}/../controllers/authController.js`);

router.post("/signup", authController.signup);
router.post("/login", authController.login);
router.get("/logout", authController.logout);

router.post("/forgotPassword", authController.forgotPassword);
router.patch("/resetPassword/:token", authController.resetPassword);

// Protect all routes below this
router.use(authController.protect);

router.patch("/updateMyPassword", authController.updatePassword);

router.patch(
    "/updateMe",
    userController.uploadUserPhoto,
    userController.resizeUserPhoto,
    userController.updateMe
);
router.delete("/deleteMe", userController.deleteMe);
router.get("/me", userController.getMe, userController.getUser);

// Restrict all routes below this to admin only
router.use(authController.restrictTo("admin"));

router.route("/").get(userController.getAllUsers);
router
    .route("/:id")
    .get(userController.getUser)
    .patch(userController.updateUser)
    .delete(userController.deleteUser);

module.exports = router;
