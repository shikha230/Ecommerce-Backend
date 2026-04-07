const express = require("express");
const router = express.Router();
const dashboredController = require("../controllers/dashboredController");
const tokenMiddleware =require("../middleware/tokenMiddleware");


router.get("/stats",tokenMiddleware, dashboredController.getCustomerStats);
router.get("/list", tokenMiddleware,dashboredController.getCustomersList);

module.exports = router;