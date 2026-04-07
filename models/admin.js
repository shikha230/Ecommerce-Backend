const mongoose = require("mongoose");

const adminSchema = new mongoose.Schema(
  {
   firstname: {
      type: String,
      required: [true, "Admin name is required"],
      trim: true,
      minlength: [3, "Name must be at least 3 characters"],
      maxlength: [50, "Name cannot exceed 50 characters"]
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email address"]
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"]
    },
    role: {
      type: String,
      enum: ["admin", "superadmin"],
      default: "admin",
      department:String,
    },
    profileImage:{
      type:String,
      default:""
    },
    
    lastname:{
      type:String,
    },
    phone: {
                type: String,
                required: true,
                match: [/^[6-9]\d{9}$/, "Please enter valid 10 digit phone number"],
          },        
    
    lastLogin:Date,
    
    NotificationsEnabled:{
      type:Boolean,
      default:true,
    },
    isActive: {
      device:String,
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

// Model create करना
const Admin = mongoose.model("Admin", adminSchema);

module.exports = Admin;