// PaymentController.js
const Razorpay = require("razorpay");
const crypto = require("crypto");
const Order = require("../models/order");
const logger = require("../helper/logger");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_SECRET
});
// console.log("RAZORPAY_KEY_ID:", process.env.RAZORPAY_KEY_ID);
// console.log("RAZORPAY_SECRET:", process.env.RAZORPAY_SECRET);

// Create Razorpay Order
exports.createPaymentOrder = async (req, res) => {
  try {
    const { orderId } = req.body;   // frontend से existing orderId आएगा
    logger.info(`Creating Razorpay order for orderId: ${orderId}`);

    const order = await Order.findById(orderId);
    if (!order) {
      logger.warn(`Order not found: ${orderId}`);
      console.warn("⚠️ Order not found in DB for id:", orderId);
      return res.status(404).json({ message: "Order not found" });
    }
    // console.log(order)
    const options = {
      amount: order.total * 100, // paise
      currency: "INR",
      receipt: `receipt_${order._id}`
    };
    // console.log("options------------",options)
    const razorpayOrder = await razorpay.orders.create(options);
    console.log("razorpayOrder--------",razorpayOrder)
    order.razorpayOrderId = razorpayOrder.id;
    await order.save();

    logger.info(`Razorpay order created successfully: ${razorpayOrder.id}`);
     
    res.json({
      message: "Payment order created",
      razorpayOrderId: razorpayOrder.id,
      key: process.env.RAZORPAY_KEY_ID,
      amount: options.amount
      

    });
  } catch (error) {
    console.log("Full ERROR:",error);
    console.log("Error message:",error?.message);
    console.log("Razorpay error:",error?.error?.description);
    logger.error(`Error creating Razorpay order: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};

// Verify Payment
exports.verifyPayment = async (req, res) => {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;
    logger.info(`Verifying payment for Razorpay orderId: ${razorpayOrderId}`);

    const hmac = crypto.createHmac("sha256", process.env.RAZORPAY_SECRET);
    hmac.update(razorpayOrderId + "|" + razorpayPaymentId);
    const generatedSignature = hmac.digest("hex");

    if (generatedSignature === razorpaySignature) {
      const order = await Order.findOne({ razorpayOrderId });
      order.orderStatus = "Successful";   // ✅ यहाँ orderStatus update होगा
      order.razorpayPaymentId = razorpayPaymentId;
      order.razorpaySignature = razorpaySignature;
      await order.save();

      logger.info(`Payment verified successfully for orderId: ${order._id}`);

      res.json({ success: true, message: "Payment verified successfully", order });
    } else {
      logger.warn(`Invalid payment signature for Razorpay orderId: ${razorpayOrderId}`);
      res.status(400).json({ success: false, message: "Invalid signature" });
    }
  } catch (error) {
    logger.error(`Error verifying payment: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};