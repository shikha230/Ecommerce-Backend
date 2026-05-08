const User = require("../models/User");

const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const logger = require("../helper/logger");
const path = require("path");
const emailService = require("../helper/emailServices");

// Register
exports.signup = async (req, res) => {
  try {
    const { fullname, email, password } = req.body;

    // Validations
    if (!fullname || !email || !password) {
      logger.info("-----signup------ All fields are required ")

      return res.status(400).json({ error: "All fields are required" });
    }

    if (password.length < 8) {
      logger.error("-----signup------Password must be at least 8 characters  ")

      return res.status(400).json({ error: "Password must be at least 8 characters" });
    }
    if (password.length > 16) {
       logger.error("-----signup------ Password cannot exceed 16 characters");
       return res.status(400).json({ error: "Password cannot exceed 16 characters" });
    }
    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      logger.info("-----signup------Email already registered  ")

      return res.status(400).json({ error: "Email already registered" });
    }

    // Password hash करना
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user with hashed password
    const user = new User({ fullname, email, password: hashedPassword });
    await user.save();
    logger.info("----signup----User registered successfully")

    //  Mailer Integration: Welcome Email
    try{
      await emailService.sendMail(
      email,
      "Welcome to Our Store",
      `<h2>Hello ${fullname},</h2>
       <p>Thanks for registering on our ecommerce platform. 
       We’re excited to have you onboard!</p>`
    );
  }catch(mailErr){
    logger.warn("---singup---welcome email failed:"+mailErr.message);
  }
    res.status(201).json({
      message: "User registered successfully",
     // ya false agar mail fail ho
      user: {
        _id: user.id,
        fullname: user.fullname,
        email: user.email,
        status: user.status
        // orders और totalSpent यहाँ नहीं भेजे
      }
    });

  } catch (err) {
    logger.error("----signup----error:"+err.message);
    res.status(500).json({ error: err.message });
  }
};

// Login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validations
    if (!email || !password) {
      logger.error("-----login------ Email and password are required ")
      return res.status(400).json({ error: "Email and password are required" });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      logger.error("-----login------Invalid email or password  ")
      return res.status(400).json({ error: "Invalid email or password" });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      logger.error("-----login------Invalid email or password  ")
      return res.status(400).json({ error: "Invalid email or password" });
    }

    // Generate JWT
    const token = jwt.sign({ id: user._id },process.env.JWT_SECRET ,{
      expiresIn: "24h"
    });
    logger.info("-----login------Login successfully  ")
    res.status(200).json({ message: "Login successful", token });
  } catch (err) {
    logger.error("-----login------error")
    res.status(500).json({ error: err.message });
  }
};


// Forget Password (just message)
exports.forgetPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      logger.info("-----forgetPassword-----User not found")
      return res.status(400).json({ message: "User not found" });
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Save OTP in DB
    user.otp = otp;
    user.otpExpire = Date.now() + 10 * 60 * 1000; // 10 minutes expiry
    await user.save();
    
    //  Mailer Integration: Send OTP to user's email
    await emailService.sendMail(
      email,
      "Password Reset OTP",
      `<p>Hello ${user.fullname},</p>
       <p>Your OTP for password reset is <b>${otp}</b>. 
       It will expire in 10 minutes.</p>`,
       `Hello ${user.fullname}, Your OTP is ${otp}. It will expire in 10 minutes.`
    );
    logger.info("-----forgetPassword-----OTP sent to Email")
    res.json({ message: `OTP sent to ${email}`, otp }); // अभी demo में response में दिखा रहे हैं
  } catch (error) {
    logger.error("-----forgetPassword-----Server error in forgetPassword");
    res.status(500).json({ message: "Server error in forgetPassword" });
  }
};

// Verify OTP (just message)
exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    // user find
    const user = await User.findOne({ email });
    if (!user) {
     logger.info("-----verifyOtp-----User not found") 
      return res.status(400).json({ message: "User not found" });
    }

    // OTP check
    if (user.otp !== otp) {
      logger.info("-----verifyOtp-----Invalid OTP")
      return res.status(400).json({ message: "Invalid OTP" });
    }

    // Expiry check
    if (user.otpExpire < Date.now()) {
      logger.info("-----verifyOtp-----OTP expired")
      return res.status(400).json({ message: "OTP expired" });
    }

    //  OTP verified successfully → clear OTP from DB
    user.otp = null;
    user.otpExpire = null;
    await user.save();

    //  Mailer Integration: Confirmation Email
    await emailService.sendMail(
      email,
      "OTP Verified Successfully",
      `<p>Hello ${user.fullname},</p>
       <p>Your OTP has been verified successfully. 
       You can now reset your password.</p>`
    );
    logger.info("-----verifyOtp-----OTP verified successfully")
    res.json({ message: "OTP verified successfully" });
  } catch (error) {
    
    log.error("-----verifyOtp-----Server error in verifyOtp")
    res.status(500).json({ message: "Server error in verifyOtp" });
  }
};



exports.resetPassword = async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    // user find
    const user = await User.findOne({ email });
    if (!user) {
      logger.info("-----resetPasswordOtp-----User not found") 
      return res.status(400).json({ message: "User not found" });
    }
    //  Password validations
    if (newPassword.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters" });
    }
    if (newPassword.length > 16) {
      return res.status(400).json({ message: "Password cannot exceed 16 characters" });
    }

    // hash new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);

    // clear OTP fields
    user.otp = null;
    user.otpExpire = null;

    await user.save();

    //  Mailer Integration: Confirmation Email
    await emailService.sendMail(
      email,
      "Password Reset Successful",
      `<p>Hello ${user.fullname},</p>
       <p>Your password has been reset successfully. 
       If you did not request this change, please contact support immediately.</p>`
    );
    logger.info("-----resetPasswordOtp-----Password reset successful")
    res.json({ message: "Password reset successful" });
  } catch (error) {
    logger.error("----resetPassword----error:",error.message);

    res.status(500).json({ message: error.message  });
  }
};

exports.userProfile =async (req, res) => {
  try {
    // req.user.id JWT से आया है
    const user = await User.findById(req.user.id).select("-password"); // password hide कर दिया
    if (!user) {
      logger.info("-----Profile-----User not found")
      
      return res.status(404).json({ message: "User not found" });
    }
    logger.info("-----Profile-----Welcome to your profile")
    res.status(201).json({
      message: "Welcome to your profile",
      user: {
        _id: user.id,
        fullname: user.fullname,
        email: user.email,
        phone:user.phone,
        address:user.address,
        status: user.status,
        profileImage: user.profileImage
        // orders और totalSpent यहाँ नहीं भेजे
      }
    });

  } catch (error) {
    logger.error("-----Profile-----error")
    res.status(500).json({ message: "error" });
  }
}
exports.updateProfile = async (req, res) => {
  try {
    logger.info("-----UpdateProfile-----Request Body:", req.body);

    const { fullname, email, phone, address,profileImage } = req.body;

    logger.info("-----UpdateProfile-----User ID from JWT:", req.user.id);

    const user = await User.findById(req.user.id);
    if (!user) {
      logger.warn("-----UpdateProfile-----User not found in DB");
      return res.status(404).json({ message: "User not found" });
    }

    logger.info("-----UpdateProfile-----Current User Data:", user);

    // Update fields
    user.fullname = fullname || user.fullname;
    user.email = email || user.email;
    user.phone = phone || user.phone;
    user.address = address || user.address;
    //  Profile image update (multer OR body)
    if (req.file) {
      user.profileImage = req.file.filename;
    } else {
      user.profileImage = profileImage || user.profileImage;
    }
    await user.save();

    logger.info("-----UpdateProfile-----Updated User Data:", user);

    res.status(200).json({
      message: "Profile updated successfully",
      user: {
        _id: user.id,
        fullname: user.fullname,
        email: user.email,
        phone: user.phone,
        address: user.address,
        profileImage: user.profileImage
      },
    });
  } catch (error) {
    logger.error("-----UpdateProfile-----Error:", error);
    res.status(500).json({ message: "Error updating profile" });
  }
};
// Upload User Profile Image
exports.uploadUserProfileImage = async (req, res) => {
  try {
    if (!req.user) {
      logger.warn("Unauthorized access attempt to upload profile image");
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!req.file) {
      logger.warn(`No file uploaded by userId: ${req.user.id}`);
      return res.status(400).json({ message: "No file uploaded" });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { profileImage: req.file.filename },
      { new: true }
    ).select("-password");

    if (!user) {
      logger.warn(`User not found: ${req.user.id}`);
      return res.status(404).json({ message: "User not found" });
    }

    logger.info(`Profile image uploaded successfully for userId: ${req.user.id}`);
    res.status(200).json({
      message: "Profile image uploaded successfully",
      user
    });
  } catch (err) {
    logger.error(`Error uploading profile image: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
};
// remove image
exports.removeUserProfileImage = async (req, res) => {
  try {
    if (!req.user) {
      logger.warn("Unauthorized access attempt to remove profile image");
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { profileImage: null }, // ✅ remove image
      { new: true }
    ).select("-password");

    if (!user) {
      logger.warn(`User not found: ${req.user.id}`);
      return res.status(404).json({ message: "User not found" });
    }

    logger.info(`Profile image removed successfully for userId: ${req.user.id}`);
    res.status(200).json({
      message: "Profile image removed successfully",
      user
    });
  } catch (err) {
    logger.error(`Error removing profile image: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
};
// User Logout Session
exports.logoutSession = async (req, res) => {
  try {
    const { token } = req.body;

    // 🔹 User की पहचान JWT से होगी
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized, no user found" });
    }

    // 🔹 User की sessions array से token हटाएँ
    await User.findByIdAndUpdate(req.user.id, {
      $pull: { sessions: { token } }
    });

    logger.info(`-----logoutSession----- User: ${req.user.email} logged out`);
    res.json({ success: true, message: "Session removed" });
  } catch (err) {
    logger.error("-----logoutSession----- Error", err);
    res.status(500).json({ message: err.message });
  }
};