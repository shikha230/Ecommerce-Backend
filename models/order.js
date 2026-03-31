// models/Order.js
const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    products: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
        quantity: { type: Number, required: true },
        size: { type: String },
        dimensions: {
          length: Number,
          width: Number,
          height: Number,
          unit: String,
        },
        price: { type: Number, required: true },
      },
    ],

    subtotal: {
      type: Number,
      required: true,
    },

    shipping: {
      type: Number,
      default: 0,
    },

    tax: Number,

    total: {
      type: Number,
      required: true,
    },
    shippingAddress:{
         contact: {
             email: {
                type: String,
                lowercase: true,
                trim: true,
                 match: [/^\S+@\S+\.\S+$/, "Please use valid email"],
                 },
            phone: {
                type: String,
                match: [/^[6-9]\d{9}$/, "Please enter valid 10 digit phone number"],
            },
        },
        delivery: {
            country: { type: String, required: true },
            firstname: { type: String, required: true },
            lastname: { type: String, required: true },
            address: { type: String, required: true },
            city: { type: String, required: true },
            state: { type: String, required: true },
            pincode: {
                type: String,
                required: true,
                match: [/^[1-9][0-9]{5}$/, "Invalid Pincode"],
            },
            phone: {
                type: String,
                required: true,
                match: [/^[6-9]\d{9}$/, "Please enter valid 10 digit phone number"],
            },
        },
    
    },
    Status: {
      type: String,
      enum: ["Pending", "Placed", "Paid", "Shipped", "Delivered", "Cancelled"],
      default: "Pending",
    },
  },
  { timestamps: true }
);

// Custom validation: at least one of email or phone must be present
orderSchema.pre("validate", async function () {
  if (
    !this.shippingAddress.contact.email &&
    !this.shippingAddress.contact.phone
  ) {
    throw new Error("Either email or phone number must be provided.");
  }
});

module.exports = mongoose.model("Order", orderSchema);
