const Admin = require("../models/admin");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const logger = require("../helper/logger");
const path = require("path"); 


// ✅ Admin Signup
exports.signup = async (req, res) => {
  try {
    const { firstname, email, password, role } = req.body;

    // Manual validations
    if (!firstname || firstname.length < 3) {
      logger.info("-----Signup------ Name must be at least 3 characters ")
        
      return res.status(400).json({ error: "Name must be at least 3 characters" });
    }
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      logger.info("-----Signup------ valid email is required ")
        
      return res.status(400).json({ error: "Valid email is required" });
    }
    if (!password || password.length < 6) {
       logger.info("-----Signup------ Password must be at least 6 characters ")
        
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }

    // Check if email already exists
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      logger.info("-----signup------ Email already registered ")
        
      return res.status(400).json({ error: "Email already registered" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new admin
    const admin = new Admin({
      firstname,
      email,
      password: hashedPassword,
      role: role || "admin"
    });

    await admin.save();
    logger.info("-----signup------ Admin registered successfully ")
    
    res.status(201).json({ success: true, message: "Admin registered successfully" });
  } catch (err) {
    logger.error("-----Signup------ error message ")
    
    res.status(500).json({ error: err.message });
  }
};

// ✅ Admin Login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Manual validations
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      logger.error("-----login------ valid email is required ")
        
      return res.status(400).json({ error: "Valid email is required" });
    }
    if (!password) {
      logger.error("-----login------ Password are required ")

      return res.status(400).json({ error: "Password is required" });
    }

    // Find admin by email
    const admin = await Admin.findOne({ email });
    if (!admin) {
       logger.error("-----Login------ Invalid email or password ")
        
      return res.status(400).json({ error: "Invalid email or password" });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      logger.error("------Login----- Invalid email or password ")
        
      return res.status(400).json({ error: "Invalid email or password" });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: admin._id, role: admin.role },
      process.env.JWT_SECRET ,
      { expiresIn: "24h" }
    );
    logger.info("-----login------Admin login successfully ")
    
    res.json({ success: true, token });
  } catch (err) {
    logger.error("-----login------ error  ")
    
    res.status(500).json({ error: err.message });
  }
};
 
// Forget Password (just message)
exports.forgetPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const admin = await Admin.findOne({ email });

    if (!admin) {
      logger.info("-----forgetPassword-----Admin not found")
      return res.status(400).json({ message: "Admin not found" });
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Save OTP in DB
    admin.otp = otp;
    admin.otpExpire = Date.now() + 10 * 60 * 1000; // 10 minutes expiry
    await admin.save();
    logger.info("-----forgetPassword-----OTP sent to Email")
    res.json({ message: `OTP sent to ${email}`, otp }); // now only shown in demo response
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
    const admin = await Admin.findOne({ email });
    if (!admin) {
     logger.info("-----verifyOtp-----Admin not found") 
      return res.status(400).json({ message: "Admin not found" });
    }

    // OTP check
    if (admin.otp !== otp) {
      logger.info("-----verifyOtp-----Invalid OTP")
      return res.status(400).json({ message: "Invalid OTP" });
    }

    // Expiry check
    if (admin.otpExpire < Date.now()) {
      logger.info("-----verifyOtp-----OTP expired")
      return res.status(400).json({ message: "OTP expired" });
    }
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
    const admin = await Admin.findOne({ email });
    if (!admin) {
      logger.info("-----resetPasswordOtp-----Admin not found") 
      return res.status(400).json({ message: "Admin not found" });
    }

    // hash new password
    const salt = await bcrypt.genSalt(10);
    admin.password = await bcrypt.hash(newPassword, salt);

    // clear OTP fields
    admin.otp = null;
    admin.otpExpire = null;

    await admin.save();
    logger.info("-----resetPasswordOtp-----Password reset successful")
    res.json({ message: "Password reset successful" });
  } catch (error) {
    logger.error("----resetPassword----Server error in resetPassword")

    res.status(500).json({ message: "Server error in resetPassword" });
  }
};
exports.adminProfile = async (req, res) => {
  try {
    const admin = await Admin.findById(req.user.id)
      .select("firstname lastname email role bio department profileImage"); // sirf required fields

    if (!admin) {
      logger.info("-----Profile-----Admin not found");
      return res.status(404).json({ message: "Admin not found" });
    }

    logger.info("-----Profile-----Profile fetched successfully");
    res.json({
      message: "Welcome to your profile",
      profile: {
        firstname: admin.firstname,
        lastname: admin.lastname,
        email: admin.email,
        role: admin.role,
        bio: admin.bio,
        department: admin.department,
        profileImage: admin.profileImage
      }
    });
  } catch (error) {
    logger.error("-----Profile-----error");
    res.status(500).json({ message: "Server error in profile" });
  }
};

// Profile update Personal Information
exports.updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, phone, bio,email,profileImage, department } = req.body;
    const updated = await Admin.findByIdAndUpdate(
      req.user.id,
      { firstName, lastName, phone,email,profileImage, bio, department, },
      { new: true }
    ).select("-password");
    logger.info("------update------profile updated")
    res.json(updated);
  } catch (err) {
    logger.error("----updatederror-----")
    res.status(500).json({ message: err.message });
  }
};
// Notifiacations
// exports.updateNotifications = async (req, res) => {
//   try {
//     const { notificationsEnabled } = req.body;
//     const admin = await Admin.findByIdAndUpdate(
//       req.admin.id,
//       { notificationsEnabled },
//       { new: true }
//     );
//     res.json(admin);
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };
// Active Seesions
exports.getSessions = async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin.id);
    logger.info("-----admin session----")
    res.json(admin.sessions);
  } catch (err) {
    logger.error("----sessionerror-----")
    res.status(500).json({ message: err.message });
  }
};
// upload photo
exports.uploadProfileImage = async (req, res) => {
  try {
    const admin = await Admin.findByIdAndUpdate(
      req.user.id,
      { profileImage: req.file.filename }, // filename or path
      { new: true }
    ).select("-password");
    logger.info("--Profile----Profile image uploaded successfully")
    res.json({ message: "Profile image uploaded successfully", admin });
  } catch (err) {
    logger.error("---error----profile error")
    res.status(500).json({ error: err.message });
  }
};
// remove photo
exports.removeProfileImage = async (req, res) => {
  try {
    const admin = await Admin.findByIdAndUpdate(
      req.user.id,   // 👈 JWT से आने वाला id
      { profileImage: null }, // 👈 image field को null कर दिया
      { new: true }
    ).select("-password");
    logger.info("---Profle----Image removed Successfully")
    res.json({ message: "Profile image removed successfully", admin });
  } catch (err) {
    logger.error("---error-----remove")
    res.status(500).json({ error: err.message });
  }
};

// LOgout seesion
exports.logoutSession = async (req, res) => {
  try {
    const { token } = req.body;

    // 🔹 Check role from JWT decoded user
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Only admin can logout from this endpoint" });
    }

    await Admin.findByIdAndUpdate(req.user.id, {
      $pull: { sessions: { token } }
    });

    logger.info(`-----logoutSession----- Admin: ${req.user.email} logged out`);
    res.json({ success: true, message: "Session removed" });
  } catch (err) {
    logger.error("-----logoutSession----- Error", err);
    res.status(500).json({ message: err.message });
  }
};

   