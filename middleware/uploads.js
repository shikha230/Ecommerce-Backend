const multer = require("multer");
const path = require("path");

// Profile image storage
const profileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/profileImage"); // folder path
  },
  filename: (req, file, cb) => {
    // Custom filename: userId + timestamp + extension
    const ext = path.extname(file.originalname);
    cb(null, req.user.id + "-profile-" + Date.now() + ext);
  }
});

// // Product image storage
// const productStorage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, "uploads/productImages"); // folder path
//   },
//   filename: (req, file, cb) => {
//     // Custom filename: productName + timestamp + extension
//     const ext = path.extname(file.originalname);
//     cb(null, req.body.name.replace(/\s+/g, "_") + "-product-" + Date.now() + ext);
//   }
// });

//  File filter (optional)
 const fileFilter = (req, file, cb) => {
   const allowedTypes = /jpeg|jpg|png|webp/;
  const ext = path.extname(file.originalname).toLowerCase();
   if (allowedTypes.test(ext)) {
    cb(null, true);
   } else {
    cb(new Error("Only images are allowed"), false);
   }
 };

 // Uploaders
const uploadProfile = multer({ storage: profileStorage, fileFilter });
// const uploadProduct = multer({ storage: productStorage, fileFilter });

module.exports = { uploadProfile };