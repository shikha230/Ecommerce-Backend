const express = require("express");
const router = express.Router();
const tokenMiddleware =require("../middleware/tokenMiddleware");
const { signup, login, forgetPassword, verifyOtp, resetPassword,Profile,updateProfile,updateNotifications,getSessions,uploadProfileImage,logoutSession } = require("../controllers/adminController");
const { uploadProfile } = require("../middleware/uploads");



router.post("/signup",signup);
router.post("/login",login);
router.post("/forget-password",tokenMiddleware, forgetPassword);
router.post("/verify-otp",tokenMiddleware, verifyOtp);
router.post("/reset-password",tokenMiddleware,resetPassword);
router.get("/profile", tokenMiddleware,Profile );
router.put("/updateprofile", tokenMiddleware,updateProfile );
router.put("/notifications", tokenMiddleware,updateNotifications);
router.put("/session", tokenMiddleware,getSessions );
router.put("/logout", tokenMiddleware,logoutSession );

// Profile image upload
router.post("/profile/photo",tokenMiddleware,uploadProfile.single("profileImage"),uploadProfileImage);





module.exports = router;