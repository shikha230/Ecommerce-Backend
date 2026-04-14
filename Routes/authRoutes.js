// Public routes
const express = require("express");
const router = express.Router();
const tokenMiddleware =require("../middleware/tokenMiddleware");




const { signup, login, forgetPassword, verifyOtp, resetPassword,userProfile,updateProfile } = require("../controllers/authController");

router.post("/signup", signup);
router.post("/login", login);
router.post("/forget-password",tokenMiddleware, forgetPassword);
router.post("/verify-otp",tokenMiddleware, verifyOtp);
router.post("/reset-password",tokenMiddleware,resetPassword);
router.get("/profile", tokenMiddleware,userProfile  );
router.put("/updateprofile", tokenMiddleware,updateProfile  );









module.exports = router;