const multer = require("multer");
const path = require("path");

// Profile image storage
const profileStorage = multer.diskStorage({
 destination: (req, file, cb) => {
  cb(null, path.join(__dirname, "../uploads/profileImage"));
},

  filename: (req, file, cb) => {
    // Custom filename: userId + timestamp + extension
    const ext = path.extname(file.originalname);
    cb(null, req.user.id + "-profile-" + Date.now() + ext);
  }
});

// // productImges
 const productStorage = multer.diskStorage({
   destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../uploads/productImages")); 
     // "../" because uploads.js is inside middleware folder
   },
   filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
     cb(null, "product-" + Date.now() + ext); 
     // simple unique filename, product ke liye
   }
 });

 // Userproflie
 const userProfileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../uploads/userProfileImages")); 
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, req.user.id + "-user-" + Date.now() + ext);
  }
});

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
const uploadProduct = multer({ storage: productStorage, fileFilter,limits: { fileSize: 20 * 1024 * 1024 } // 20 MB
 });

const uploadUserProfile = multer({ storage: userProfileStorage, fileFilter });
module.exports = { uploadProfile,uploadProduct,uploadUserProfile };