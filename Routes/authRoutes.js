// Public routes
const express = require("express");
const router = express.Router();
const tokenMiddleware =require("../middleware/tokenMiddleware");
const { uploadUserProfileImage } = require("../controllers/authController");
const { uploadUserProfile } = require("../middleware/uploads");




const { signup, login, forgetPassword, verifyOtp, resetPassword,userProfile,updateProfile,removeUserProfileImage } = require("../controllers/authController");

router.post("/signup", signup);
router.post("/login", login);
router.post("/forget-password", forgetPassword);
router.post("/verify-otp", verifyOtp);
router.post("/reset-password",resetPassword);
router.get("/profile", tokenMiddleware,userProfile  );
router.put("/updateprofile", tokenMiddleware,updateProfile  );


// ✅ User profile image upload route
router.post( "/user/profile/upload",tokenMiddleware,
  uploadUserProfile.single("profileImage"),
  uploadUserProfileImage
);
// remove photo
router.post("/photo-remove",tokenMiddleware,removeUserProfileImage);







module.exports = router;