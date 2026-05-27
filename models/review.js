const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: true,
    }, 
    comment: { 
        type: String, 
        required: true 
    }, // ✅ नया field

  
   // ✅ नया field: Dummy User (sirf admin use karega)
    dummyUser: {
      firstName: { type: String },
      lastName: { type: String },
      createdByAdmin: { type: Boolean, default: false } // flag to identify internally
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Review", reviewSchema);
