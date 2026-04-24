// product.model.js
// models/Product.js
const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Product name is required"],
    trim: true,
    minlength:[3,"Product name must be at least 3 characters"],
    maxlength:[100,"Products name cannot exceed 100 characters"],
  },
  price: {
    type:Number,
    required:[true,"Price is required"],
     min: [0, "Price cannot be negative"]
  },
  discount: {
    type: Number,
    default: 0,
    min: [0, "Discount cannot be negative"]
  },
  
    //  image: {
    //  type:String,
    //  default:""        //agr image nahi hai toh filhal

  // },
  images: [
  {
    type: String,
    default: ""
  }
],
  colour: {
    type: String,
    trim: true
  },
  size: {
    type: String,
    enum: ["small", "medium", "large"],
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: [0, "Quantity cannot be negative"]
  },
  description: {
    type: String,
    trim: true
  },
  specification: {
    type: String,
    trim: true
  },
  inStock: {
    type: Boolean,
    default: true
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",   // Category model से link
    required: [true, "Category is required"]
  },
  dimensions: [
    {
      length: { type: Number, required: true },
      width: { type: Number, required: true },
      height: { type: Number, required: true },
      unit: { type: String, default: "mm" } // optional unit field
    }
  ],

  featured: { 
    type: Boolean, 
    default: false
  },
  sold: { 
    type: Number,
     default: 0 
 },
  is_delete: { 
    type: Boolean, 
    default: false }
}, { timestamps: true });

const Product = mongoose.model("Product", productSchema);
module.exports = Product;
    
      