const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/paymentController");
const tokenMiddleware = require("../middleware/tokenMiddleware");

// Create Razorpay Order (protected route)
router.post("/create-order", paymentController.createPaymentOrder);

// Verify Razorpay Payment (protected route)
router.post("/verify-payment",paymentController.verifyPayment);

module.exports = router;