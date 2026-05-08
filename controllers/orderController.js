const Cart = require("../models/cart"); 
const Order = require("../models/order");
const logger= require("../helper/logger");
const coupon = require("../models/coupon");

exports.getOrderSummary = async (req, res) => {
  try {
    const userId = req.user.id;
    const cart = await Cart.findOne({ user: userId })
      .populate("products.product")
      .populate("coupon");

    if (!cart || cart.products.length === 0) {
      logger.warn(`Order summary requested by user ${userId}, but cart is empty`);
      return res.status(200).json({ message: "Cart is empty", summary: {} });
    }

    // Subtotal
    let subtotal = 0;
    cart.products.forEach((item) => {
      subtotal += item.product.price * item.quantity;
    });
    logger.info(`Subtotal calculated: ${subtotal}`);
    
    // Product Discount
    let discount = 0;
    cart.products.forEach((item) => {
      if (item.product.discount) {
        discount += (item.product.price * item.quantity * item.product.discount) / 100;
      }
    });
    logger.info(`Product discount calculated: ${discount}`);
    
    // Coupon Discount
    let couponDiscount = 0;
    if (cart.coupon) {
      if (cart.coupon.discountType === "percentage") {
        couponDiscount = (subtotal * cart.coupon.discountValue) / 100;
        if (cart.coupon.maxDiscount && couponDiscount > cart.coupon.maxDiscount) {
          couponDiscount = cart.coupon.maxDiscount;
        }
      } else if (cart.coupon.discountType === "fixed") {
        couponDiscount = cart.coupon.discountValue;
      }
      logger.info(`Coupon discount applied: ${couponDiscount}`);
    }

    // Shipping
    let shipping = subtotal < 10000 ? 500 : 0;
    logger.info(`Shipping charges: ${shipping}`);
    
    // Tax
    const tax = Math.round(subtotal * 0.1);
    logger.info(`Tax calculated: ${tax}`);

    // Installation Required & Charges
    const installationRequired = cart.installationRequired || false;
   let installationCharges = 0;

    if (installationRequired) {
     const totalProducts = cart.products.reduce((sum, p) => sum + p.quantity, 0);
     if (totalProducts >= 3) {
      installationCharges = 0;
    } else if (totalProducts === 1) {
      installationCharges = 500;
    } else {
      installationCharges = 250;
    }
  }
  logger.info(`Installation required: ${installationRequired},installationcharges: ${installationCharges}`);


    
    // // Installation Charges
    // const installationCharges = cart.installationCharges || 0;
    // logger.info(`Installation charges: ${installationCharges}`);

    // Final Total
    const total = subtotal - discount - couponDiscount + shipping + tax + installationCharges;
    logger.info(`Final total: ${total}`);;

    res.status(200).json({
      message: "Order summary generated",
      summary: {
        subtotal,
        discount,
        couponDiscount,
        shipping,
        tax,
        installationRequired,
        installationCharges, // 
        total,
        items: cart.products,
        coupon: cart.coupon || null,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
exports.createOrder = async (req, res) => {
  try {
    const userId = req.user.id;   // JWT से userId लेना बेहतर है
    const { shippingAddress } = req.body;

    logger.info(`Order creation started for userId: ${userId}`);

    const cart = await Cart.findOne({ user: userId })
      .populate("products.product")
      .populate("coupon");

    if (!cart || cart.products.length === 0) {
      logger.warn(`Cart is empty for userId: ${userId}`);
      return res.status(400).json({ message: "Cart is empty" });
    }

    // Items mapping
    const items = cart.products.map((item) => ({
      productId: item.product._id,
      name: item.product.name,
      price: item.product.price,
      quantity: item.quantity,
      size: item.size,
      dimensions: item.dimensions,
    }));

    // Subtotal
    let subtotal = 0;
    cart.products.forEach((item) => {
      subtotal += item.product.price * item.quantity;
    });

    // Product Discount
    let discount = 0;
    cart.products.forEach((item) => {
      if (item.product.discount) {
        discount += (item.product.price * item.quantity * item.product.discount) / 100;
      }
    });

    // Coupon Discount
    let couponDiscount = 0;
    if (cart.coupon) {
      if (cart.coupon.discountType === "percentage") {
        couponDiscount = (subtotal * cart.coupon.discountValue) / 100;
        if (cart.coupon.maxDiscount && couponDiscount > cart.coupon.maxDiscount) {
          couponDiscount = cart.coupon.maxDiscount;
        }
      } else if (cart.coupon.discountType === "fixed") {
        couponDiscount = cart.coupon.discountValue;
      }
    }

    // Shipping
    let shipping = subtotal < 10000 ? 500 : 0;

    // Tax
    const tax = Math.round(subtotal * 0.1);

    const installationRequired = cart.installationRequired || false;
    let installationCharges = 0;

    if (installationRequired) {
     const totalProducts = cart.products.reduce((sum, p) => sum + p.quantity, 0);
     if (totalProducts >= 3) {
      installationCharges = 0;
    } else if (totalProducts === 1) {
      installationCharges = 500;
    } else {
      installationCharges = 250;
    }
  }
  logger.info(`Installationrequired: ${installationRequired},installationcharges: ${installationCharges}`);

    // // ✅ Installation Charges (from cart)
    // const installationCharges = cart.installationCharges || 0;
    // logger.info(`Installation charges applied: ${installationCharges}`);

    // Final Total
    const total = subtotal - discount - couponDiscount + shipping + tax + installationCharges;
    logger.info(
      `Order calculation done: subtotal=${subtotal}, discount=${discount}, couponDiscount=${couponDiscount}, shipping=${shipping}, tax=${tax},installationCharges=${installationCharges}, total=${total}`
    );
    // //  Billing Address Logic
    // const finalBillingAddress = useSameBilling ? shippingAddress : billingAddress;
    //  if (!finalBillingAddress) {
    //   logger.info("----BillingAddress----Billing address is required")
    //   return res.status(400).json({ message: "Billing address is required" });
    // }



    //  Create Order
    const order = new Order({
      userId,
      products: items,
      shippingAddress,
      
      subtotal,
      discount,
      couponDiscount,
      shipping,
      tax,
      installationRequired,
      installationCharges, //
      total,
      coupon: cart.coupon ? cart.coupon._id : null,
      
    });

    await order.save();
    logger.info(`Order saved successfully for userId: ${userId}, orderId: ${order._id}`);

    // Clear cart
    await Cart.deleteOne({ user: userId });
    logger.info(`Cart cleared for userId: ${userId}`);

    res.json({ message: "Order created successfully", order });
  } catch (err) {
    logger.error(`Order creation error for userId: ${req.user.id}, error: ${err.message}`);
    res.status(500).json({ message: err.message });
  }
};
// Get Orders by User
exports.getOrders = async (req, res) => {
  try {
    const userId = req.user.id; // JWT से आया userId

    logger.info(`Fetching orders for userId: ${userId}`);

    const orders = await Order.find({ userId }).sort({ createdAt: -1 });

    if (!orders.length) {
      logger.warn(`No orders found for userId: ${userId}`);
      return res.status(404).json({ message: "No orders found" });
    }

    res.status(200).json({ message: "Orders fetched successfully", orders });
  } catch (err) {
    logger.error(`Error fetching orders: ${err.message}`);
    res.status(500).json({ message: err.message });
  }
};
// Get all orders (Admin Dashboard)
exports.getAllOrders = async (req, res) => {
  try {
    // Optional: check if logged-in user is admin
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied. Admins only." });
    }
    const { date } = req.query;   // frontend से query param आएगा
    let filter = {};
    
    if (date) {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0); // start of day

      const end = new Date(date);
      end.setHours(23, 59, 59, 999); // end of day

      filter.createdAt = { $gte: start, $lte: end };
    }
    const orders = await Order.find(filter)
      .populate("userId", "firstname email") // user info bhi dikhane ke liye
      .sort({ createdAt: -1 });

    if (!orders.length) {
      return res.status(404).json({ message: "No orders found" });
    }

    res.status(200).json({
      message: "All orders fetched successfully",
      orders
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Delete Order (Admin Dashboard)
exports.deleteOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    // ✅ only admin do
    if (req.user.role !== "admin") {
      logger.info("----access denied. admin only")
      return res.status(403).json({ message: "Access denied. Admins only." });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      logger.info("-----order----Not found")
      return res.status(404).json({ message: "Order not found" });
    }

    await Order.findByIdAndDelete(orderId);
    logger.info("---deleted----order deleted successfully")
    res.status(200).json({ message: "Order deleted successfully" });
  } catch (err) {
    logger.error("----error-------")
    res.status(500).json({ message: err.message });
  }
};

// Update Order Status (Admin)
exports.updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { orderStatus } = req.body;

    logger.info(`Admin updating order status for orderId: ${orderId}`);

    const order = await Order.findById(orderId);
    if (!order) {
      logger.warn(`Order not found: ${orderId}`);
      return res.status(404).json({ message: "Order not found" });
    }

    // Update order status
    order.orderStatus = orderStatus;

    // Push new status into timeline
    order.statusTimeline.push({
      status: orderStatus,
      date: new Date()
    });

    await order.save();

    logger.info(`Order status updated: orderId=${orderId}, Status=${orderStatus}`);

    res.status(200).json({ 
      message: "Order status updated successfully", 
      order 
    });
  } catch (err) {
    logger.error(`Error updating order status: ${err.message}`);
    res.status(500).json({ message: err.message });
  }
};
// Track Order (User Side)
// exports.trackOrder = async (req, res) => {
//   try {
//     const userId = req.user.id;   // JWT से userId
//     const { orderId } = req.params;

//     logger.info(`User ${userId} tracking orderId: ${orderId}`);

//     const order = await Order.findById({ _id: orderId, userId });
//     if (!order) {
//       logger.warn(`Order not found for userId=${userId}, orderId=${orderId}`);
//       return res.status(404).json({ message: "Order not found" });
//     }

//     res.status(200).json({
//       message: "Order tracking details fetched successfully",
//       currentStatus: order.orderStatus,
//       statusTimeline: order.statusTimeline,
//     });
//   } catch (err) {
//     logger.error(`Error tracking order: ${err.message}`);
//     res.status(500).json({ message: err.message });
//   }
// };
 exports.trackOrder = async (req, res) => {
  try {
    const userId = req.user.id;   // JWT से userId
    const { orderId } = req.params;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Ownership check
    if (order.userId.toString() !== userId) {
      return res.status(403).json({ message: "Not authorized to view this order" });
    }

    res.status(200).json({
      message: "Order tracking details fetched successfully",
      currentStatus: order.orderStatus,   // ✅ अब latest status मिलेगा
      statusTimeline: order.statusTimeline,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
  