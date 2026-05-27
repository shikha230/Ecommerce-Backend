const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");


const tokenMiddleware = require("../middleware/tokenMiddleware");

// Get user's cart
// /Order Summary (Checkout Page)
router.get("/summary", tokenMiddleware,orderController.getOrderSummary);


router.post("/create", tokenMiddleware,orderController.createOrder);

router.post("/buynow", tokenMiddleware,orderController.buyNow);
// Shipping address update route
router.put("/address/:orderId",tokenMiddleware, orderController.updateOrderAddress);

router.get("/my-orders",tokenMiddleware, orderController.getOrders);
//  Track Order (User side)
router.get("/:orderId/track",tokenMiddleware, orderController.trackOrder);



// Admin routes
router.put("/:orderId/status", tokenMiddleware, orderController.updateOrderStatus);
router.get("/all",tokenMiddleware, orderController.getAllOrders); // Admin route
// Admin: delete order
router.delete("/delete/:orderId",tokenMiddleware,orderController.deleteOrder);









module.exports = router;