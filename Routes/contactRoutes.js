const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contactController');
const tokenMiddleware = require("../middleware/tokenMiddleware");

// 🔹 Create Contact (User inquiry)
router.post("/create-message", contactController.createContact);

// 🔹 Get Contacts (User → only own, Admin → all)
router.get("/inquiry",tokenMiddleware, contactController.getContacts);

// 🔹 Delete Contact (User → own only, Admin → any)
router.delete("/inquiry/:id", tokenMiddleware, contactController.deleteContact);

module.exports = router;
