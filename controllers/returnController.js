const Return = require("../models/return");
const logger = require("../helper/logger");
const Order = require("../models/order");   // path अपने project structure के हिसाब से बदलें
const Product = require("../models/product");
const emailService = require("../helper/emailServices"); // जहां आपने sendMail export किया है

// Get Return Order Controller
exports.getReturnOrder = async (req, res) => {
  try {
    const { orderId } = req.params; // सिर्फ orderId लो

    // Step 1: Validate Order
    const order = await Order.findById(orderId)
      .populate("products.product", "name price images discount")
      .populate("userId", "name email"); // user details भी लाओ

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    // Step 2: Return पूरा Order + Products details
    res.status(200).json({
      success: true,
      message: "Order details fetched successfully",
      data: {
        orderId: order._id,
        userId: order.userId._id,
        userName: order.userId.fullname,
        userEmail: order.userId.email,
        products: order.products.map(p => ({
          productId: p.product._id,
          productName: p.product.name,
          productImages: p.product.images,
          productPrice: p.product.price,
          quantity: p.quantity
        })),
        orderStatus: order.orderStatus,
        paymentStatus: order.paymentStatus,
        shippingAddress: order.shippingAddress,
        subtotal: order.subtotal,
        discount: order.discount,
        shipping: order.shipping,
        tax: order.tax,
        installationCharges: order.installationCharges,
        total: order.total,
        createdAt: order.createdAt
      }
    });
  } catch (error) {
    console.error("Error fetching return order:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

exports.createReturnRequest = async (req, res) => {
  try {
    const { orderId,productId, reason } = req.body;
    console.log("Body received:", req.body);

    logger.info(`Return request initiated by user: ${req.user.id}, orderId: ${orderId}, productId: ${productId}`);

    // Proof files (images/videos)
    const proofFiles = req.files ? req.files.map(file => file.filename) : [];
    if (proofFiles.length > 0) {
      logger.debug(`Proof files uploaded: ${proofFiles}`);
    } else {
      logger.debug("No proof files uploaded for return request");
    }

    // ✅ Step 1: Validate Order
    const order = await Order.findById(orderId).populate("products.product", "name price");
    if (!order) {
      logger.warn(`Order not found: ${orderId}`);
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    if (!order.products || order.products.length === 0) {
      logger.warn(`Order ${orderId} has no items`);
      return res.status(400).json({ success: false, message: "This order has no items" });
    }

    // ✅ Step 2: Validate Product exists in Order
   const productExists = order.products.some(
  (p) => p.product && p.product._id.toString() === productId
);

    if (!productExists) {
      logger.warn(`Product ${productId} not found in order ${orderId}`);
      return res.status(404).json({ success: false, message: "Product not found in this order" });
    }

    // ✅ Step 3: Create Return Request
    const newReturn = await Return.create({
      user: req.user.id,
      order: orderId,
      product: productId,
      reason,
      proof: proofFiles,
      status: "Return Requested",
    });

    logger.info(`Return request created successfully: returnId=${newReturn.id}, status=${newReturn.status}`);

    res.status(201).json({
      success: true,
      message: "Return request submitted successfully",
      data: newReturn,
    });
  } catch (error) {
    logger.error(`Error creating return request for user ${req.user?.id}: ${error.message}`);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// GET /api/admin/returns
exports.getAllReturns = async (req, res) => {
  try {
    logger.info("-----getAllReturns----- Admin fetching all return requests");

    const returns = await Return.find()
      .populate("user", "fullname email")
      .populate("order", "orderStatus total")
      .populate("product", "name price");

    if (!returns || returns.length === 0) {
      logger.warn("-----getAllReturns----- No return requests found");
    } else {
      logger.info(`-----getAllReturns----- ${returns.length} return requests fetched`);
    }

    res.json({ success: true, data: returns });
  } catch (err) {
    logger.error(`-----getAllReturns----- Error fetching return requests: ${err.message}`);
    res.status(500).json({ success: false, message: err.message });
  }
};
// PUT /api/admin/returns/:id
exports.updateReturnStatus = async (req, res) => {
  try {
    const { status, adminMessage } = req.body;
    const returnRequest = await Return.findById(req.params.returnId).populate("user", "email fullname");

    if (!returnRequest) {
      return res.status(404).json({ success: false, message: "Return request not found" });
    }

    returnRequest.status = status;
    returnRequest.adminMessage = adminMessage || "";
    await returnRequest.save();

    // ✅ Mail भेजना
    let subject, text;
    if (status === "Approved") {
      subject = "Your Return Request Approved";
      text = `Hello ${returnRequest.user.fullname},\n\nYour return request has been approved.Our support team will contact you shortly to confirm your order details.After confirmation, A replacement product will be delivered within 7-8 days.\n\nThank you for your patience and trust in us!`;
    } else if (status === "Rejected") {
      subject = "Your Return Request Rejected";
      text = `Hello ${returnRequest.user.fullname},\n\nYour return request has been cancelled. Please contact our support team for further assistance and discuss possible next steps..\n\nThank you!`;
    }

    await emailService.sendMail(
      returnRequest.user.email, //recipient
      subject,         //subject
      null,            //optional
      text             //plain text body
    );           //

    res.json({ success: true, message: `Return request ${status}`, data: returnRequest });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
    
