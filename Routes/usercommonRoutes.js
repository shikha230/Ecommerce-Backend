const express = require("express");
const router = express.Router();
const userCommonController=require("../controllers/userCommonController");
const tokenMiddleware = require("../middleware/tokenMiddleware");

router.get("/check-token",tokenMiddleware,userCommonController.getCurrentUser);

module.exports = router;


