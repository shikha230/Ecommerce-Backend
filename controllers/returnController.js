const Return = require("../models/return");
const logger = require("../helper/logger");
const Order = require("../models/order");   // path अपने project structure के हिसाब से बदलें

const sendMail = require("../helper/emailServices"); // जहां आपने sendMail export किया है

exports.createReturnRequest = async (req, res) => {
  try {
    const { orderId, productId, reason } = req.body;
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
      .populate("user", "name email")
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
    const returnRequest = await Return.findById(req.params.id).populate("user", "email name");

    if (!returnRequest) {
      return res.status(404).json({ success: false, message: "Return request not found" });
    }

    returnRequest.status = status;
    returnRequest.adminMessage = adminMessage || "";
    await returnRequest.save();

    // ✅ Mail भेजना
    let subject, text;
    if (status === "Return Approved") {
      subject = "Your Return Request Approved";
      text = `Hello ${returnRequest.user.name},\n\nYour return request has been approved. A replacement product will be delivered within 7-8 days.\n\nThank you!`;
    } else {
      subject = "Your Return Request Cancelled";
      text = `Hello ${returnRequest.user.name},\n\nYour return request has been cancelled. Please contact our support team for further assistance.\n\nThank you!`;
    }

    await sendMail(returnRequest.user.email, subject, null, text);

    res.json({ success: true, message: `Return request ${status}`, data: returnRequest });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
    
