
// routes/adminCouponRoutes.js
const express = require("express");
const router = express.Router();
const couponController = require("../controllers/couponController");
const  tokenMiddleware  = require("../middleware/tokenMiddleware");


// Admin protected routes
router.post("/create",tokenMiddleware,couponController.createCoupon);
router.put("/:id",tokenMiddleware,couponController.updateCoupon);
router.put("/deactivate/:id",tokenMiddleware,couponController.deactivateCoupon);
router.delete("/:id",tokenMiddleware,couponController. deleteCoupon);




// User protected route
router.post("/apply", tokenMiddleware,couponController.applyCouponcode);



module.exports = router;