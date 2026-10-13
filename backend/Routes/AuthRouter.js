const { signup, login, forgotPassword, resetPassword } = require("../Controllers/AuthController");
const {
    signupValidation,
    loginValidation,
    forgotPasswordValidation,
    resetPasswordValidation
} = require("../Middlewares/AuthValidation");

const router = require("express").Router();


router.post("/login", loginValidation, login);

router.post("/signup", signupValidation, signup);

router.post("/forgot-password", forgotPasswordValidation, forgotPassword);

router.post("/reset-password", resetPasswordValidation, resetPassword);

module.exports = router;
