const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    fullname: {
      type: String,
      required: [true, "FullName is required"],
      minlength: [3, "Name must be at least 3 characters"],
      maxlength: [50, "Name cannot exceed 50 characters"],
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email address"],
    },

    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters"],
    },

    otp: {
      type: String,
    }, // OTP string
    otpExpire: { type: Date }, // OTP expiry time

    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },
    lastname:{
      type:String,
    },
    address: { 
      type: String
     },
     phone: {
                type: String,
                match: [/^[6-9]\d{9}$/, "Please enter valid 10 digit phone number"],
            },
    orders: {
      type: Number,
      default: 0,
    },
    totalSpent: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("User", userSchema);
