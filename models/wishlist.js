const mongoose = require("mongoose");

const wishlistSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true
    },
    products: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true
        },
        size: {
          type: String,
          enum: ["small", "medium", "large"],
          required: false
        },
        // dimensions: [{
        //     length: { type: Number, select: false },
        //     width: { type: Number, select: false },
        //     height: { type: Number, select: false },
        //     unit: { type: String, default: "mm" } // optional unit field
        //     }
        // ],
      }
    ]
  },
  { timestamps: true }
);

const Wishlist = mongoose.model("Wishlist", wishlistSchema);
module.exports = Wishlist;