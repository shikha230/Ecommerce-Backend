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
      const paymentDetails = await razorpay.payments.fetch(razorpayPaymentId);
      console.log("Payment Details =>", paymentDetails);

      // ✅ Payment success
      order.paymentStatus = "Successful";
      order.orderStatus = "Placed";
      order.paymentMethod = paymentDetails.method; // upi, card, netbanking, wallet
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
      return res.status(400).json({
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
// exports.razorpayWebhook = async (req, res) => {
// try {
//     console.log("=================================");
//     console.log("🚀 WEBHOOK HIT RECEIVED");

//     const signature = req.headers["x-razorpay-signature"];
//     const secret = process.env.RAZORPAY_WEBHOOK_SECRET; // Dashboard वाला Secret यहाँ डालें

//     if (!signature) {
//       console.error(" No signature found in headers");
//       return res.status(400).send("No signature");
//     }

//     // 1. Signature Verification (Raw Body का इस्तेमाल करें)
//     const expectedSignature = crypto
//       .createHmac("sha256", secret)
//       .update(req.rawBody)
//       .digest("hex");

//     console.log("Received Signature:", signature);
//     console.log("Expected Signature:", expectedSignature);

//     if (signature !== expectedSignature) {
//       console.error("❌ Invalid Signature! Possible tampering.");
//       return res.status(400).json({ success: false, message: "Invalid signature" });
//     }

//     console.log("✅ Signature Verified Successfully");

//     // 2. Data Parse करें
//     const eventData = req.body; // express.json इसे पहले ही parse कर चुका है
//     const eventName = eventData.event;

//     console.log("🔹 Event Name:", eventName);

//     // 3. Events को Handle करें
//     switch (eventName) {
//       case "payout.processed":
//         console.log("💰 Payout successful for ID:", eventData.payload.payout.entity.id);
//         // यहाँ अपना Database update करें
//         break;

//       case "payout.reversed":
//         console.log("⚠️ Payout reversed/failed for ID:", eventData.payload.payout.entity.id);
//         break;

//       case "payout.initiated":
//         console.log("⏳ Payout initiated...");
//         break;

//       case "transaction.created":
//         console.log("📝 Transaction created");
//         break;

//       default:
//         console.log("ℹ️ Unhandled Event:", eventName);
//     }

//     // 4. Razorpay को हमेशा 200 OK भेजें (वरना वो बार-बार retry करेगा)
//     return res.status(200).json({ status: "ok" });

//   } catch (error) {
//     console.error("❌ Webhook Error:", error.message);
//     return res.status(500).json({ success: false, message: error.message });
//   }
// };


// exports.razorpayWebhook = async (req, res) => {
//   try {
//     logger.info("Razorpay webhook received");

//     const signature = req.headers["x-razorpay-signature"];

//     const expectedSignature = crypto
//       .createHmac(
//         "sha256",
//         process.env.RAZORPAY_WEBHOOK_SECRET
//       )
//       .update(req.body)
//       .digest("hex");

//     if (signature !== expectedSignature) {
//       logger.warn("Invalid Razorpay webhook signature");

//       return res.status(400).json({
//         success: false,
//         message: "Invalid signature",
//       });
//     }

//     const event = JSON.parse(req.body.toString());

//     logger.info(`Webhook Event Received: ${event.event}`);

//     switch (event.event) {

//       //  Payment Success
//       case "payment.captured": {
//         const razorpayOrderId =
//           event.payload.payment.entity.order_id;

//         const paymentId =
//           event.payload.payment.entity.id;

//         logger.info(
//           `Payment Captured | Razorpay OrderId: ${razorpayOrderId} | PaymentId: ${paymentId}`
//         );

//         const order = await Order.findOne({
//           razorpayOrderId,
//         });

//         if (order) {
//           order.paymentStatus = "Successful";
//           order.orderStatus = "Placed";
//           order.razorpayPaymentId = paymentId;

//           await order.save();

//           logger.info(
//             `Order updated successfully after payment capture | OrderId: ${order._id}`
//           );
//         } else {
//           logger.warn(
//             `Order not found for Razorpay OrderId: ${razorpayOrderId}`
//           );
//         }

//         break;
//       }

//       //  Payment Failed
//       case "payment.failed": {
//         const razorpayOrderId =
//           event.payload.payment.entity.order_id;

//         logger.warn(
//           `Payment Failed | Razorpay OrderId: ${razorpayOrderId}`
//         );

//         const order = await Order.findOne({
//           razorpayOrderId,
//         });

//         if (order) {
//           order.paymentStatus = "Failed";
//           order.orderStatus = "Cancelled";

//           await order.save();

//           logger.warn(
//             `Order marked as failed | OrderId: ${order._id}`
//           );
//         }

//         break;
//       }

//       // 💰 Refund Created
//       case "refund.created": {
//         logger.info(
//           `Refund Created | RefundId: ${event.payload.refund.entity.id}`
//         );
//         break;
//       }

//       // 💰 Refund Processed
//       case "refund.processed": {
//         logger.info(
//           `Refund Processed | RefundId: ${event.payload.refund.entity.id}`
//         );
//         break;
//       }

//       // 📦 Order Paid
//       case "order.paid": {
//         logger.info(
//           `Order Paid Event | Razorpay OrderId: ${event.payload.order.entity.id}`
//         );
//         break;
//       }

//       default:
//         logger.info(`Unhandled Webhook Event: ${event.event}`);
//     }

//     return res.status(200).json({
//       success: true,
//       message: "Webhook processed successfully",
//     });

//   } catch (error) {
//     logger.error(`Webhook Error: ${error.message}`);

//     return res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };

exports.razorpayWebhook = async (req, res) => {
  try {
    logger.info("Razorpay Webhook Received");
    console.log("=================================");
    console.log(" WEBHOOK HIT");
    // console.log("Event Name:", event.event);

    console.log("Body:", req.body);
    console.log("Headers:", req.headers);
    // console.log("Payload:", JSON.stringify(event, null, 2));

    
    const signature = req.headers["x-razorpay-signature"];

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET)
      .update(req.body)
      .digest("hex");
    console.log("Received Signature:", signature);
    console.log("Expected Signature:", expectedSignature);
    if (signature !== expectedSignature) {
      logger.warn("Invalid Razorpay Webhook Signature");

      return res.status(400).json({
        success: false,
        message: "Missing signature header",
      });
    }
    //   return res.status(200).json({
    //   success: true,
    //   message: "Webhook received"
    // });
    const event = JSON.parse(req.body.toString());

    logger.info(`Webhook Event: ${event.event}`);
     console.log('check-events',event.event);
     switch (event.event) {
      
      case "transaction.created":
        console.log("Webhook Event: transaction.created");
        console.log("Transaction created:", event);
        break;

      case "payout.initiated":
        console.log("Webhook Event: payout.initiated");
        console.log("Payout initiated:", event);
        break;

      case "payout.queued":
        console.log(" Webhook Event: payout.queued");
        console.log("Payout queued:", event);
        break;

      case "payout.pending":
        console.log(" Webhook Event: payout.pending");
        console.log("Payout pending:", event);
        break;

      case "payout.processed":
        console.log("Webhook Event: payout.processed");
        console.log("Payout processed:", event);
        break;

      case "payout.updated":
        console.log(" Webhook Event: payout.updated");
        console.log("Payout updated:", event);
        break;

      case "payout.rejected":
        console.log(" Webhook Event: payout.rejected");
        console.log("Payout rejected:", event);
        break;

      case "payout.reversed":
        console.log(" Webhook Event: payout.reversed");
        console.log("Payout reversed:", event);
        break;

      default:
        console.log("🔹 Unhandled Event:", event.event);
        console.log("Full Payload:", event);
    }
    return res.status(200).json({
      success: true,
      message: "Webhook processed successfully",
    });
  } catch (error) {
    logger.error(`Webhook Error: ${error.message}`);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
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
