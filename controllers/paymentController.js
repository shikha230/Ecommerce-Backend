// PaymentController.js
const Razorpay = require("razorpay");
const crypto = require("crypto");
const Order = require("../models/order");
const Product = require("../models/product");
const logger = require("../helper/logger");
const Cart = require("../models/cart");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_SECRET,
});
console.log("RAZORPAY_KEY_ID:", process.env.RAZORPAY_KEY_ID);
console.log("RAZORPAY_SECRET:", process.env.RAZORPAY_SECRET);

// Create Razorpay Order
exports.createPaymentOrder = async (req, res) => {
  try {
    const { orderId } = req.body; // frontend से existing orderId आएगा
    logger.info(`Creating Razorpay order for orderId: ${orderId}`);

    const order = await Order.findById(orderId);
    if (!order) {
      logger.warn(`Order not found: ${orderId}`);
      console.warn("⚠️ Order not found in DB for id:", orderId);
      return res.status(404).json({ message: "Order not found" });
    }
    console.log(order);
    const options = {
      amount: order.total * 100, // paise
      currency: "INR",
      receipt: `receipt_${order._id}`,
    };
    console.log("options------------", options);
    const razorpayOrder = await razorpay.orders.create(options);
    console.log("razorpayOrder--------", razorpayOrder);
    order.razorpayOrderId = razorpayOrder.id;
    order.orderStatus = "Payment Initiated";
    order.paymentStatus = "Pending"; // जब तक payment verify नहीं होती
    await order.save();

    // logger.info(`Razorpay order created successfully: ${razorpayOrder.id}`);
    logger.info(
      `Payment order created for ${order.source} flow, DB orderId: ${order._id}, Razorpay orderId: ${razorpayOrder.id}`,
    );
    res.json({
      message: "Payment order created",
      razorpayOrderId: razorpayOrder.id,
      key: process.env.RAZORPAY_KEY_ID,
      amount: options.amount,
    });
  } catch (error) {
    console.log("Full ERROR:", error);
    console.log("Error message:", error?.message);
    console.log("Razorpay error:", error?.error?.description);
    logger.error(`Error creating Razorpay order: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};
exports.verifyPayment = async (req, res) => {
  try {
    logger.info("VerifyPayment API called");
    logger.debug("VerifyPayment req.body:", req.body);

    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;
    logger.info(`Verifying payment for Razorpay orderId: ${razorpayOrderId}`);

    // Signature generate
    const hmac = crypto.createHmac("sha256", process.env.RAZORPAY_SECRET);
    hmac.update(razorpayOrderId + "|" + razorpayPaymentId);
    const generatedSignature = hmac.digest("hex");
    logger.debug(`Generated signature: ${generatedSignature}`);
    logger.debug(`Received signature: ${razorpaySignature}`);

    // Order fetch
    const order = await Order.findOne({ razorpayOrderId });
    if (!order) {
      logger.error(`Order not found for Razorpay orderId: ${razorpayOrderId}`);
      return res.status(404).json({ message: "Order not found" });
    }

    if (generatedSignature === razorpaySignature) {
      // ✅ Payment success
      order.paymentStatus = "Successful";
      order.orderStatus = "Placed";
      order.razorpayPaymentId = razorpayPaymentId;
      order.razorpaySignature = razorpaySignature;
      await order.save();

      logger.info(`Payment verified successfully for orderId: ${order._id}`);

      for (const item of order.products) {
        const product = await Product.findById(item.product);

        if (!product) continue;

        const newQuantity = product.quantity - item.quantity;

        product.sold += item.quantity;
        product.quantity = Math.max(0, newQuantity);
        product.inStock = newQuantity > 0;

        await product.save();
      }

      // Cart delete सिर्फ cart flow में
      if (order.source === "cart") {
        await Cart.deleteOne({ user: order.userId });
        logger.info(
          `Cart deleted after successful payment for user: ${order.userId}`,
        );
      } else {
        logger.info(`BuyNow flow detected, no cart deletion needed`);
      }

      return res.json({
        success: true,
        message: "Payment verified successfully",
        order,
      });
    } else {
      //  Payment failed
      order.paymentStatus = "Failed";
      order.orderStatus = "Cancelled";
      await order.save();

      logger.warn(
        `Invalid payment signature for Razorpay orderId: ${razorpayOrderId}`,
      );
      return res
        .status(400)
        .json({
          success: false,
          message: "Payment failed. Invalid signature",
          order,
        });
    }
  } catch (error) {
    logger.error(`Error verifying payment: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};

// Verify Payment
// exports.verifyPayment = async (req, res) => {
//   try {
//     console.log("VerifyPayment req.body:", req.body);
//     const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;
//     logger.info(`Verifying payment for Razorpay orderId: ${razorpayOrderId}`);

//     const hmac = crypto.createHmac("sha256", process.env.RAZORPAY_SECRET);
//     hmac.update(razorpayOrderId + "|" + razorpayPaymentId);
//     const generatedSignature = hmac.digest("hex");

//     if (generatedSignature === razorpaySignature) {
//       const order = await Order.findOne({ razorpayOrderId });
//       // order.orderStatus = "Successful";
//        order.paymentStatus = "Successful";   // ✅ यहाँ orderStatus update होगा
//       order.razorpayPaymentId = razorpayPaymentId;
//       order.razorpaySignature = razorpaySignature;
//       await order.save();

//       // Cart delete karo ab
//       await Cart.deleteOne({ user: order.userId });
//       logger.info(`Cart deleted after successful payment for user: ${order.userId}`);

//       logger.info(`Payment verified successfully for orderId: ${order._id}`);
//       return res.json({ success: true, message: "Payment verified successfully", order });

//     } else {
//       // Payment failed (signature mismatch)
//       order.paymentStatus = "Failed";
//       order.orderStatus = "Cancelled";  // optional: mark order cancelled
//       await order.save();

//       logger.warn(`Invalid payment signature for Razorpay orderId: ${razorpayOrderId}`);
//       return res.status(400).json({ success: false, message: "Payment failed. Invalid signature", order });
//     }
//   } catch (error) {
//     logger.error(`Error verifying payment: ${error.message}`);
//     res.status(500).json({ error: error.message });
//   }
// };
