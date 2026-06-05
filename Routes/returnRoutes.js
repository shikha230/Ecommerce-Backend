const express = require("express");
const router = express.Router();
const returnController = require("../controllers/returnController"); // adjust path
const tokenMiddleware  = require("../middleware/tokenMiddleware");
const { uploadProof } = require("../middleware/uploads");

//  Create new return request (user)
router.get("/returns/:orderId/",tokenMiddleware,returnController.getReturnOrder);

router.post("/returns",tokenMiddleware,uploadProof.array("proof",4), returnController.createReturnRequest);

//  Update return status (admin)
router.put("/:returnId",tokenMiddleware, returnController.updateReturnStatus);

//  Get all returns for logged-in user
router.get("/returns-request",tokenMiddleware, returnController.getAllReturns);





module.exports = router;
