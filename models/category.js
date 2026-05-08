// category.model.js
const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema({
  categoryName: {
    type: String,
    required: [true, "Category name is required"],
    unique: true,
    trim: true,
    minlength: [3, "Category name must be at least 3 characters"],
    maxlength: [50, "Category name cannot exceed 50 characters"]
  },
   description: {
    type: String,
    trim: true,
    maxlength: [200, "Description cannot exceed 200 characters"],
    default: ""   // optional field
  
  },
  
  is_delete: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

// Model create करना
const Category = mongoose.model("Category", categorySchema);

module.exports = Category;
