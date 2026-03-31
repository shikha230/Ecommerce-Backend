const Coupon = require("../models/coupon");
const Cart = require("../models/cart");


// Create Coupon (Admin)
exports.createCoupon = async (req, res) => {
  try {
    const { code, discountType, discountValue, minAmount, maxDiscount, expiryDate, applicableProducts, applicableCategory } = req.body;

    const coupon = new Coupon({
      code,
      discountType,
      discountValue,
      minAmount,
      maxDiscount,
      expiryDate,
      applicableProducts,
      applicableCategory,
      isActive: true,
    });

    await coupon.save();
    res.status(201).json({ message: "Coupon created successfully", coupon });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update Coupon (Admin)
exports.updateCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    const { code, discountType, discountValue, minAmount, maxDiscount, expiryDate, applicableProducts, applicableCategory, isActive } = req.body;

    const coupon = await Coupon.findByIdAndUpdate(
      id,
      { code, discountType, discountValue, minAmount, maxDiscount, expiryDate, applicableProducts, applicableCategory, isActive },
      { new: true }
    );

    if (!coupon) return res.status(404).json({ message: "Coupon not found" });

    res.status(200).json({ message: "Coupon updated successfully", coupon });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Deactivate Coupon (Admin)
exports.deactivateCoupon = async (req, res) => {
  try {
    const { id } = req.params;

    const coupon = await Coupon.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );

    if (!coupon) return res.status(404).json({ message: "Coupon not found" });

    res.status(200).json({ message: "Coupon deactivated successfully", coupon });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete Coupon (Admin)
exports.deleteCoupon = async (req, res) => {
  try {
    const { id } = req.params;

    const coupon = await Coupon.findByIdAndDelete(id);

    if (!coupon) return res.status(404).json({ message: "Coupon not found" });

    res.status(200).json({ message: "Coupon deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get All Coupons (Admin)
exports.getAllCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find().populate("applicableProducts").populate("applicableCategory");
    res.status(200).json({ coupons });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// User side
exports.applyCouponcode = async (req, res) => {
  try {
    const userId = req.user.id;
    const { code } = req.body;

    const cart = await Cart.findOne({ user: userId })
      .populate("products.product")
      .populate("coupon");

    if (!cart) return res.status(404).json({ message: "Cart not found" });

    const coupon = await Coupon.findOne({ code, isActive: true });
    if (!coupon) return res.status(400).json({ message: "Invalid or expired coupon" });

    if (coupon.expiryDate < new Date()) {
      return res.status(400).json({ message: "Coupon expired" });
    }

    // ✅ Check minimum cart amount
    let subtotal = 0;
    cart.products.forEach(item => {
      subtotal += item.product.price * item.quantity;
    });
    if (subtotal < coupon.minAmount) {
      return res.status(400).json({ message: `Minimum cart amount should be ${coupon.minAmount}` });
    }

    // ✅ Check applicable products/categories
    if (coupon.applicableProducts.length > 0) {
      const productIds = cart.products.map(p => p.product._id.toString());
      const isApplicable = productIds.some(id => coupon.applicableProducts.includes(id));
      if (!isApplicable) {
        return res.status(400).json({ message: "Coupon not applicable on selected products" });
      }
    }

    if (coupon.applicableCategory.length > 0) {
      const categoryIds = cart.products.map(p => p.product.category.toString());
      const isApplicable = categoryIds.some(id => coupon.applicableCategory.includes(id));
      if (!isApplicable) {
        return res.status(400).json({ message: "Coupon not applicable on selected categories" });
      }
    }

    // ✅ Apply discount
    let discount = 0;
    if (coupon.discountType === "percentage") {
      discount = (subtotal * coupon.discountValue) / 100;
      if (coupon.maxDiscount && discount > coupon.maxDiscount) {
        discount = coupon.maxDiscount;
      }
    } else if (coupon.discountType === "fixed") {
      discount = coupon.discountValue;
    }

    cart.coupon = coupon._id;
    await cart.save();

    res.status(200).json({
      message: "Coupon applied successfully",
      discount,
      finalAmount: subtotal - discount,
      cart
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


