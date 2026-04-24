const mongoose = require("mongoose");

const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user", // या "User" अगर तुम्हारे पास अलग User model है
      required: true,
      unique: true, // ✅ हर user की सिर्फ एक cart होगी
    },
    products: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        quantity: {
          type: Number,
          default: 1,
          min: [1, "Quantity must be at least 1"],
        },
        dimensions: [
          {
            length: { type: Number, required: false },
            width: { type: Number, required: false },
            height: { type: Number, required: false },
            unit: { type: String, default: "mm" }, // optional unit field
          },
        ],
        size: {
          type: String,
          enum: ["small", "medium", "large"],
          required: false
        },
      },
    ],
    
  installationCharges: {
    type: Number,
    default: null
  },

  coupon: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Coupon",
      default: null,
    },
  },
  { timestamps: true },
);

const Cart = mongoose.model("Cart", cartSchema);
module.exports = Cart;
