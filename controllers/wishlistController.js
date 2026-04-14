const Wishlist = require("../models/wishlist");
const Cart = require("../models/cart");
const logger = require("../helper/logger");

// Add to Wishlist
exports.addtoWishlist = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId } = req.body;

    logger.info(`AddToWishlist: user=${userId}, product=${productId}`);

    let wishlist = await Wishlist.findOne({ user: userId });
    if (!wishlist) {
      logger.info("AddToWishlist: creating new wishlist for user");
      wishlist = new Wishlist({ user: userId, products: [] });
    }
    const exists = wishlist.products.find(
      (p) => p.product.toString() === productId
    );
    if (exists) {
      logger.warn("AddToWishlist: product already exists in wishlist");
      return res.status(400).json({ message: "Product already in wishlist" });
    }
    wishlist.products.push({ product: productId });
    await wishlist.save();
 // 🔹 Populate product details before sending response
    wishlist = await Wishlist.findOne({ user: userId }).populate("products.product");

    logger.info("AddToWishlist: product added successfully");
    res.status(200).json({ message: "Added to wishlist", wishlist });
  } catch (err) {
    logger.error(`AddToWishlist Error: ${err.message}`);
    res.status(500).json({ message: err.message });
  }
};
 
exports.getWishlist = async (req, res) => {
  try {
    const userId = req.user.id;
    logger.info(`GetWishlist: user=${userId}`);

    const wishlist = await Wishlist.findOne({ user: userId })
      .populate({
        path: "products.product",   // nested path
        model: "Product"            // explicitly tell mongoose which model
      });

    if (!wishlist || wishlist.products.length === 0) {
      logger.info("GetWishlist: wishlist is empty");
      return res.status(200).json({ message: "Wishlist is empty", wishlist: [] });
    }

    logger.info("GetWishlist: wishlist fetched successfully");
    res.status(200).json({ wishlist });
  } catch (err) {
    logger.error(`GetWishlist Error: ${err.message}`);
    res.status(500).json({ message: err.message });
  }
};



// Remove from Wishlist
exports.removeWishlist = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId } = req.body;

    logger.info(`RemoveFromWishlist: user=${userId}, product=${productId}`);

    let wishlist = await Wishlist.findOne({ user: userId });
    if (!wishlist) {
      logger.warn("RemoveFromWishlist: wishlist not found");
      return res.status(404).json({ message: "Wishlist not found" });
    }

    wishlist.products = wishlist.products.filter(
      (p) => p.product.toString() !== productId
    );
    await wishlist.save();

    logger.info("RemoveFromWishlist: product removed successfully");
    res.status(200).json({ message: "Removed from wishlist", wishlist });
  } catch (err) {
    logger.error(`RemoveFromWishlist Error: ${err.message}`);
    res.status(500).json({ message: err.message });
  }
};

// Move product from Wishlist to Cart
exports.movetoCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId } = req.body;

    logger.info(`MoveToCart: user=${userId}, product=${productId}`);

    let wishlist = await Wishlist.findOne({ user: userId });
    if (!wishlist) {
      logger.warn("MoveToCart: wishlist not found");
      return res.status(404).json({ message: "Wishlist not found" });
    }

    const productInWishlist = wishlist.products.find(
      (p) => p.product.toString() === productId
    );
    if (!productInWishlist) {
      logger.warn("MoveToCart: product not found in wishlist");
      return res.status(404).json({ message: "Product not found in wishlist" });
    }

    // Remove from wishlist
    wishlist.products = wishlist.products.filter(
      (p) => p.product.toString() !== productId
    );
    await wishlist.save();
    logger.info("MoveToCart: product removed from wishlist");

    // Add to cart
    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
      logger.info("MoveToCart: creating new cart for user");
      cart = new Cart({ user: userId, products: [] });
    }

    cart.products.push({
      product: productId,
      quantity: 1,
      size: productInWishlist.size,
      dimensions: productInWishlist.dimensions
    });
    await cart.save();

    logger.info("MoveToCart: product moved to cart successfully");
    res.status(200).json({ message: "Moved to cart", cart });
  } catch (err) {
    logger.error(`MoveToCart Error: ${err.message}`);
    res.status(500).json({ message: err.message });
  }
};

   

   