const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contactController');

// user form submit Routes
router.post('/create',contactController.createContact);

//admin dashbored
router.get('/contacts',contactController.getAllContacts);

module.exports = router;