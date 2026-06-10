const Cart = require("../models/cart");
const Order = require("../models/order");
const logger = require("../helper/logger");
// const coupon = require("../models/coupon");
const Product = require("../models/product");

exports.getOrderSummary = async (req, res) => {
  try {
    const userId = req.user.id;
    const { source, orderId } = req.query;

    let items = [];
    let order = null; //// ✅ declare globally

    if (source === "buynow" && orderId) {
      order = await Order.findById(orderId).populate(
        "products.product",
        "name price discount colour images installationRequired",
      );
      console.log("OrderId received:", orderId);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      items = order.products;
    } else {
      const cart = await Cart.findOne({ user: userId }).populate(
        "products.product",
        "name price discount colour images installationRequired",
      );

      if (!cart || cart.products.length === 0) {
        return res.status(200).json({ message: "Cart is empty", summary: {} });
      }
      items = cart.products;
    }

    // Subtotal
    let subtotal = 0;
    items.forEach((item) => {
      subtotal += item.product.price * item.quantity;
    });

    // Product Discount
    let discount = 0;
    items.forEach((item) => {
      if (item.product.discount) {
        discount +=
          (item.product.price * item.quantity * item.product.discount) / 100;
      }
    });

    // Shipping
    let shipping = subtotal < 10000 ? 500 : 0;

    // Tax
    const tax = Math.round(subtotal * 0.1);

    let installationCharges = 0;
    const installationProductCount = items.reduce((count, p) => {
      const adminAllowed = p.product?.installationRequired === true;
      const userSelected = p.installationRequired === true;

      if (adminAllowed && userSelected) {
        count += p.quantity;
      }

      return count;
    }, 0);

    console.log("Installation Product Count:", installationProductCount);

    if (installationProductCount === 1) {
      installationCharges = 500;
      logger.info(
        "Installation charges applied: 500 (single installation-required product)",
      );
    } else if (installationProductCount === 2) {
      installationCharges = 250;
      logger.info(
        "Installation charges applied: 250 (two installation-required products)",
      );
    } else if (installationProductCount >= 3) {
      installationCharges = 0;
      logger.info(
        "Installation free (3 or more installation-required products)",
      );
    } else {
      installationCharges = 0; // user ने No चुना या admin ने false किया
      logger.info("No installation required products, charges = 0");
    }

    const total = subtotal - discount + shipping + tax + installationCharges;

    res.status(200).json({
      message: "Order summary generated",
      summary: {
        source,
        orderId: order?._id || null,
        subtotal,
        discount,
        shipping,
        tax,
        installationCharges,
        total,
        items,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
exports.createOrder = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: "Please login first to create an order",
      });
    }

    const userId = req.user.id;
    const { shippingAddress } = req.body;

    const cart = await Cart.findOne({ user: userId }).populate(
      "products.product",
      "name price images discount quantity inStock installationRequired",
    );

    if (!cart || cart.products.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    const items = cart.products.map((item) => ({
      product: item.product._id,
      name: item.product.name,
      images: item.product.images,
      price: item.product.price,
      quantity: item.quantity,
      size: item.size,
      dimensions: item.dimensions,
      installationRequired: item.installationRequired,
    }));

    let subtotal = 0;
    cart.products.forEach((item) => {
      subtotal += item.product.price * item.quantity;
    });

    let discount = 0;
    cart.products.forEach((item) => {
      if (item.product.discount) {
        discount +=
          (item.product.price * item.quantity * item.product.discount) / 100;
      }
    });

    let shipping = subtotal < 10000 ? 500 : 0;
    const tax = Math.round(subtotal * 0.1);
    let installationCharges = 0;

    const installationProductCount = cart.products.reduce((count, p) => {
      const adminAllowed = p.product?.installationRequired === true;
      const userSelected = p.installationRequired === true;

      if (adminAllowed && userSelected) {
        count += p.quantity;
      }
      return count;
    }, 0);

    // Charges calculation
    if (installationProductCount === 1) {
      installationCharges = 500;
    } else if (installationProductCount === 2) {
      installationCharges = 250;
    } else if (installationProductCount >= 3) {
      installationCharges = 0; // free
    } else {
      installationCharges = 0; // ✅ user ने No चुना या admin ने false किया
    }

    const total = subtotal - discount + shipping + tax + installationCharges;

    const order = new Order({
      userId,
      products: items,
      shippingAddress,
      subtotal,
      discount,
      shipping,
      tax,
      installationCharges,
      total,
      source: "cart",
    });

    await order.save();
    res.json({ message: "Order created successfully", order });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
exports.buyNow = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: "Please login first to buy product",
      });
    }

    const userId = req.user.id;
    const { productId, quantity = 1, installationRequired } = req.body; // ✅ sirf product fields lo

    // ✅ Product fetch karo
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // ✅ Order item mapping
    const item = {
      product: product._id,
      name: product.name,
      images: product.images,
      price: product.price,
      quantity,
      size: req.body.size || null,
      dimensions: req.body.dimensions || null,
      installationRequired: installationRequired || false,
    };

    // Subtotal
    const subtotal = product.price * quantity;

    // Discount
    let discount = 0;
    if (product.discount) {
      discount = (subtotal * product.discount) / 100;
    }

    // Shipping
    let shipping = subtotal < 10000 ? 500 : 0;

    // Tax
    const tax = Math.round(subtotal * 0.1);

    let installationCharges = 0;

    const adminAllowed = product.installationRequired === true;
    const userSelected =
      installationRequired === true || installationRequired === "true";

    if (adminAllowed && userSelected) {
      if (quantity === 1) {
        installationCharges = 500;
      } else if (quantity === 2) {
        installationCharges = 250;
      } else if (quantity >= 3) {
        installationCharges = 0;
      }
    } else {
      installationCharges = 0;
    }
    //  Final total
    const total = subtotal - discount + shipping + tax + installationCharges;

    //  Order create (shippingAddress abhi empty rakho)
    const order = new Order({
      userId,
      products: [item],
      subtotal,
      discount,
      shipping,
      tax,
      installationCharges,
      total,
      coupon: null,
      shippingAddress: {}, // ✅ empty, checkout page par fill hoga
      paymentStatus: "Pending",
      orderStatus: "Pending",
      source: "buynow", // ✅ Add this field
    });

    await order.save();

    res.json({
      success: true,
      message: "Order created successfully via Buy Now",
      orderId: order._id,
    });
  } catch (err) {
    console.error("Order summary error:", err);
    res.status(500).json({ message: err.message });
  }
};
exports.updateOrderAddress = async (req, res) => {
  try {
    const { orderId } = req.params; // URL से orderId लेना
    const { shippingAddress } = req.body; // Body से पूरा shippingAddress object लेना

    // Order fetch करो
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // // अगर पहले से address है और आप overwrite नहीं करना चाहते तो check डाल सकते हैं
    // if (order.shippingAddress && Object.keys(order.shippingAddress).length > 0) {
    //   return res.status(400).json({
    //     message: "Shipping address already exists for this order"
    //   });
    // }

    // नया address assign करो
    order.shippingAddress = {
      contact: {
        email: shippingAddress.contact?.email,
        phone: shippingAddress.contact?.phone,
      },
      delivery: {
        country: shippingAddress.delivery?.country,
        firstname: shippingAddress.delivery?.firstname,
        lastname: shippingAddress.delivery?.lastname,
        address: shippingAddress.delivery?.address,
        city: shippingAddress.delivery?.city,
        state: shippingAddress.delivery?.state,
        pincode: shippingAddress.delivery?.pincode,
        phone: shippingAddress.delivery?.phone,
      },
    };

    await order.save();

    res.json({ message: "Shipping address updated successfully", order });
  } catch (err) {
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
    const { date } = req.query; // frontend से query param आएगा
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
      orders,
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
      logger.info("----access denied. admin only");
      return res.status(403).json({ message: "Access denied. Admins only." });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      logger.info("-----order----Not found");
      return res.status(404).json({ message: "Order not found" });
    }

    await Order.findByIdAndDelete(orderId);
    logger.info("---deleted----order deleted successfully");
    res.status(200).json({ message: "Order deleted successfully" });
  } catch (err) {
    logger.error("----error-------");
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
      date: new Date(),
    });

    await order.save();

    logger.info(
      `Order status updated: orderId=${orderId}, Status=${orderStatus}`,
    );

    res.status(200).json({
      message: "Order status updated successfully",
      order,
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
    const userId = req.user.id; // JWT से userId
    const { orderId } = req.params;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Ownership check
    if (order.userId.toString() !== userId) {
      return res
        .status(403)
        .json({ message: "Not authorized to view this order" });
    }

    res.status(200).json({
      message: "Order tracking details fetched successfully",
      currentStatus: order.orderStatus, // ✅ अब latest status मिलेगा
      statusTimeline: order.statusTimeline,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
