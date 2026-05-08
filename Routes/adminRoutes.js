const express = require("express");
const router = express.Router();
const tokenMiddleware =require("../middleware/tokenMiddleware");
const { signup, login, forgetPassword, verifyOtp, resetPassword,adminProfile,updateProfile,updateNotifications,getSessions,uploadProfileImage,removeProfileImage,logoutSession } = require("../controllers/adminController");
const { uploadProfile } = require("../middleware/uploads");



router.post("/signup",signup);
router.post("/login",login);
router.post("/forget-password", forgetPassword);
router.post("/verify-otp", verifyOtp);
router.post("/reset-password",resetPassword);
router.get("/profile", tokenMiddleware,adminProfile );
router.put("/updateprofile", tokenMiddleware,updateProfile );
// router.put("/notifications", tokenMiddleware,updateNotifications); comment
router.put("/session", tokenMiddleware,getSessions );
router.put("/logout", tokenMiddleware,logoutSession );

// Profile image upload
router.post("/profile/photo",tokenMiddleware,uploadProfile.single("profileImage"),uploadProfileImage);
router.post("/photo-remove",tokenMiddleware,removeProfileImage);






module.exports = router;