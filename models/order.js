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
        name:{type:String},
        images: [
       {
         type: String,
          default: ""
         }
        ],
        quantity: { type: Number, required: true },
        size: { type: String },
        dimensions:[ {
          length: Number,
          width: Number,
          height: Number,
          unit: String,
        },
      ],

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
                required:false,
                lowercase: true,
                trim: true,
                 match: [/^\S+@\S+\.\S+$/, "Please use valid email"],
                 },
                //  phone feild optional now
            phone: {
                type: String,
                match: [/^[6-9]\d{9}$/, "Please enter valid 10 digit phone number"],
            },
        },
        delivery: {
            country: { type: String, required: false},
            firstname: { type: String, required: false },
            lastname: { type: String, required: false },
            address: { type: String, required:false },
            city: { type: String, required: false },
            state: { type: String, required: false },
            pincode: {
                type: String,
                required: false,
                match: [/^[1-9][0-9]{5}$/, "Invalid Pincode"],
            },
            phone: {
                type: String,
                required: false,
                match: [/^[6-9]\d{9}$/, "Please enter valid 10 digit phone number"],
            },
        },
    
    },
    installationRequired: {
    type: Boolean,
    default: false
  },
    installationCharges: { 
      type: Number, 
      default: 0 
  },
  source: { 
    type: String, 
    enum: ["cart", "buynow"], 
    required: true 
  },


   orderStatus: {
      type: String,
      enum: ["Pending", "Placed", "Payment Initiated","Paid", "Shipped", "Delivered", "Cancelled"],
      default: "Placed",
    },
    statusTimeline:[{
       status:String,
      date:{
        type:Date,
        default:Date.now,
      },
    },
  ],
  // Razorpay fields
    razorpayOrderId: { type: String },
    razorpayPaymentId: { type: String },
    razorpaySignature: { type: String },

  //  New field for payment status
    paymentStatus: {
    type: String,
    enum: ["Pending", "Successful", "Failed"],
    default: "Pending"
  },

  },
  { timestamps: true }
);

// Custom validation: at least one of email or phone must be present
// orderSchema.pre("validate", async function () {
//   if (
//     !this.shippingAddress.contact.email &&
//     !this.shippingAddress.contact.phone
//   ) {
//     throw new Error("Either email or phone number must be provided.");
//   }
// });

module.exports = mongoose.model("Order", orderSchema);
