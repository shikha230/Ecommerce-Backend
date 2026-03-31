const express = require("express");
const router = express.Router();

const wishlistController = require("../controllers/wishlistController");
const tokenMiddleware = require("../middleware/tokenMiddleware"); // अगर JWT auth है

router.post("/add", tokenMiddleware, wishlistController.addtoWishlist);
router.get("/get-wishlist", tokenMiddleware, wishlistController.getWishlist);
router.delete("/remove", tokenMiddleware, wishlistController.removeWishlist);
router.post("/move-to-cart", tokenMiddleware, wishlistController.movetoCart);



module.exports = router;