const express = require("express");
const router = express.Router();
const cartController = require("../controllers/cartController");
const tokenMiddleware = require("../middleware/tokenMiddleware");

// Add product to cart
router.post("/add-cart", tokenMiddleware, cartController.addtoCart);

// Update user's cart
router.put("/update-cart", tokenMiddleware, cartController.updateCart);


// Get user's cart
router.get("/get-cart/:userId", tokenMiddleware, cartController.getCart);

// Remove product from cart
router.delete("/remove-product", tokenMiddleware, cartController.removeCart);

// Remove entire Cart
router.delete("/delete-cart/:userId", cartController.deleteCart);



module.exports = router;