const mongoose = require("mongoose");

const returnSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },

    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },

    reason: {
      type: String,
      enum: ["Damaged Product Received", "Wrong Product Received"],
      required: true,
    },

    proof:[ 
      {
      type: String,
    },
    ],
    
    status: {
      type: String,
      enum: [
        "Return Requested",
        //  " Approved",
        "Approved",
          "Rejected",
        // "Product Picked Up",
        // "Replacement Shipped",
        // "Replacement Delivered",
      ],
      default: "Return Requested",
    },
    // adminMessage: {
    //   type: String,
    // },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Return", returnSchema);
