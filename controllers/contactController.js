// / controllers

const Contact = require("../models/contact");

// Create Contact (User Inquiry)
exports.createContact = async (req, res) => {
try {
const { firstName, lastName, email, subject, message } = req.body;

// 🔹 Validation
if (!firstName || !email || !message) {
    return res.status(400).json({
        message: "First name, email and message are required",
    });
}

//  Save to DB
    const contact = await Contact.create({
        firstName,
        lastName,
        email,
        subject,
        message,
    });
    res.status(201).json({
        success: true,
        message: "Message sent successfully",
        data: contact,
    });
} catch (error) {
    res.status(500).json({
        message: "Server Error",
        error: error.message,
    });
}
};


// Get all inquiries (Admin use)
exports.getAllContacts = async (req, res) => {
    try {
        const contacts = await Contact.find().sort({ createdAt: -1 });
        res.status(200).json({
            success: true,
            count: contacts.length,
            data: contacts,
        });
    } catch (error) {
        res.status(500).json({
            message: "Server Error",
        });
    }
};
