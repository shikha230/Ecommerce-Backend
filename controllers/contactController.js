// / controllers
const Contact  = require("../models/contact");

const logger = require("../helper/logger"); // मान लो आपने logger utility बनाई है

// createcontact
exports.createContact = async (req, res) => {
  try {
    const { firstname, lastname, email, phone, inquiryType, yourMessage } = req.body;

    if (!firstname || !email || !phone || !yourMessage || !inquiryType) {
      logger.warn("-----createContact----- Missing required fields");
      return res.status(400).json({ 
        message: "First name, email, phone, inquiryType and yourMessage are required" 
      });
    }

    const contact = await Contact.create({
      firstname,
      lastname,
      email,
      phone,
      inquiryType,
      yourMessage
      // 👈 user field हटा दिया
    });

    logger.info(`-----createContact----- ContactID: ${contact.id} created`);
    res.status(201).json({
      success: true,
      message: "Message sent successfully",
      data: contact
    });
  } catch (error) {
    logger.error("-----createContact----- Error", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};
 exports.getContacts = async (req, res) => {
  try {
    let contacts;

    if (req.user.role === "admin") {
      // Admin → सभी contacts
      contacts = await Contact.find().populate("user").sort({ createdAt: -1 });
      logger.info(`-----getContacts----- Admin: ${req.user.id}, Found: ${contacts.length}`);
    } else {
      // User → सिर्फ अपनी inquiries
      contacts = await Contact.find({ user: req.user.id }).sort({ createdAt: -1 });
      logger.info(`-----getContacts----- User: ${req.user.id}, Found: ${contacts.length}`);
    }

    res.status(200).json({ success: true, data: contacts });
  } catch (error) {
    logger.error("-----getContacts----- Error", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};
   
exports.deleteContact = async (req, res) => {
  try {
    const { id } = req.params;
    const contact = await Contact.findById(id);

    if (!contact) {
      logger.warn(`-----deleteContact----- Contact not found, ID: ${id}`);
      return res.status(404).json({ success: false, message: "Contact not found" });
    }

    // सिर्फ admin delete कर सके
    if (req.user.role !== "admin") {
      logger.warn(`-----deleteContact----- Unauthorized delete attempt by User: ${req.user.id}`);
      return res.status(403).json({ success: false, message: "Only admin can delete inquiries" });
    }

    await contact.deleteOne();
    logger.info(`-----deleteContact----- Admin: ${req.user.id}, Deleted ContactID: ${id}`);
    return res.status(200).json({ success: true, message: "Contact deleted by admin" });

  } catch (error) {
    logger.error("-----deleteContact----- Error", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};
