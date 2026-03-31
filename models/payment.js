// models/Payment.js
const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  cardNumber: { type: String, required: true },
  expiry: { type: String, required: true },
  cvv: { type: String, required: true },
  amount: { type: Number, required: true }
});

module.exports = mongoose.model("Payment", paymentSchema);