const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
    firstname: { type: String, required: true },
    lastname: { type: String },
    email: { type: String, required: true, lowercase: true },
    inquiryType: { type: String, required: true },
    yourMessage: { type: String, required: true },
    phone: {
                type: String,
                match: [/^[6-9]\d{9}$/, "Please enter valid 10 digit phone number"],
            },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: false } // 👈 link to User
}, { timestamps: true });

module.exports = mongoose.model('Contact', contactSchema);