const mongoose = require("mongoose");

const searchSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    keyword: {
      type: String,
      required: true
    },
    resultsCount: {
      type: Number,
      default: 0
    },
    category: {
      type: String
    }
  },
  { timestamps: true } // createdAt, updatedAt auto add होंगे
);

module.exports = mongoose.model("Search", searchSchema);