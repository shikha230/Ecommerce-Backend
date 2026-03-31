// models/Coupon.js
const mongoose = require("mongoose");

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
    },

    discountType: {
      type: String,
      enum: ["percentage", "fixed"],
      required: true,
    },

    discountValue: {
      type: Number,
      required: true,
    },

    minAmount: {
      type: Number,
      default: 0,
    },

    maxDiscount: Number,

    expiryDate: {
      type: Date,
      required: true,
    },
    
    applicableProducts: [
        { type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
    applicableCategory: [
        { type: mongoose.Schema.Types.ObjectId, ref: "Category" }],
  

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Coupon", couponSchema);
