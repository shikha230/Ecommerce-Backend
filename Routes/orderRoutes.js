const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");


const tokenMiddleware = require("../middleware/tokenMiddleware");

// Get user's cart
// /Order Summary (Checkout Page)
router.get("/summary/:couponId", tokenMiddleware,orderController.getOrderSummary);


router.post("/create", tokenMiddleware,orderController.createOrder);
router.get("/my-orders", tokenMiddleware, orderController.getOrders);

// Admin routes
router.put("/:orderId/status", tokenMiddleware, orderController.updateOrderStatus);










module.exports = router;