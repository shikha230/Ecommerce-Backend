const express = require("express");
const router = express.Router();
const tokenMiddleware =require("../middleware/tokenMiddleware");
const { signup, login, forgetPassword, verifyOtp, resetPassword,Profile } = require("../controllers/adminController");

const dashboredController=require("../controllers/dashboredController")

router.post("/signup",signup);
router.post("/login",login);
router.post("/forget-password",tokenMiddleware, forgetPassword);
router.post("/verify-otp",tokenMiddleware, verifyOtp);
router.post("/reset-password",tokenMiddleware,resetPassword);
router.get("/profile", tokenMiddleware,Profile );
// customer Status

router.get("/status", tokenMiddleware,dashboredController.getCustomerStats );



module.exports = router;