const Cart = require("../models/cart");
const Product = require("../models/product");
const logger = require("../helper/logger");

exports.addtoCart = async (req, res) => {
  try {
      //Login validation
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: "Please login first to add items to cart"
      });
    }
    const userId = req.user.id;
    const { productId, quantity, size, dimensions } = req.body;

    logger.info(`Add to cart request by user: ${userId}, product: ${productId}, qty: ${quantity}`);

    if (!productId || !quantity || quantity < 1) {
      logger.warn("Invalid input data for addToCart");
      return res.status(400).json({ message: "Invalid input data" });
    }

    // ✅ Product fetch karo taaki installationRequired flag mil sake
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    let cart = await Cart.findOne({ user: userId });

    if (!cart) {
      logger.info("No cart found, creating new cart");

      cart = new Cart({
        user: userId,
        products: [{
          product: productId,
          quantity,
          size,
          dimensions,
          installationRequired: product.installationRequired   // ✅ yaha product ka flag use karo
        }],
         isActive: true   // ✅ cart create hone par active mark karo
  
      });
    } else {
      logger.info("Cart found, checking for existing product");

      const existingProduct = cart.products.find(
        (p) => p.product.toString() === productId
      );

      if (existingProduct) {
        logger.info("Product already in cart, updating quantity and details");
        existingProduct.quantity += quantity;

        if (size) existingProduct.size = size;
        if (dimensions) existingProduct.dimensions = dimensions;

        // ✅ installationRequired ko product ke flag se sync karo
        existingProduct.installationRequired = product.installationRequired;
      } else {
        logger.info("New product, adding to cart");
        cart.products.push({
          product: productId,
          quantity,
          size,
          dimensions,
          installationRequired: product.installationRequired   // ✅ yaha bhi add kiya
        });
      }
      cart.isActive = true; // ✅ product add/update hone par cart active hi rahe
    }

    await cart.save();
    logger.info(`Cart saved successfully for user: ${userId}`);

    const populatedCart = await Cart.findById(cart._id)
      .populate("products.product", "name price colour images installationRequired averageRating numReviews");

    res.status(200).json({ message: "Item added to cart", cart: populatedCart });
  } catch (err) {
    console.error("AddToCart Error:", err);
    res.status(500).json({
      message: "Server error",
      error: err.message,
      stack: err.stack
    });
  }
};

// update cart

exports.updateCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId, action, size, dimensions,installationRequired } = req.body;

    logger.info(`UpdateCart request by user: ${userId}, product: ${productId}, action: ${action},installationRequired: ${installationRequired}`);

   

    if (!productId) {
      logger.warn("Invalid input data: productId missing");
      return res.status(400).json({ message: "Invalid input data" });
    }

    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
      logger.warn(`Cart not found for user: ${userId}`);
      return res.status(404).json({ message: "Cart not found" });
    }

    const productInCart = cart.products.find(
      (p) => p.product.toString() === productId
    );
    if (!productInCart) {
      logger.warn(`Product ${productId} not found in cart for user: ${userId}`);
      return res.status(404).json({ message: "Product not found in cart" });
    }

    // Update quantity
    if (action === "increment") {
      productInCart.quantity += 1;
      logger.info(`Incremented quantity for product ${productId}, new qty: ${productInCart.quantity}`);
    } else if (action === "decrement") {
      productInCart.quantity -= 1;
      logger.info(`Decremented quantity for product ${productId}, new qty: ${productInCart.quantity}`);

      if (productInCart.quantity <= 0) {
        cart.products = cart.products.filter(
          (p) => p.product.toString() !== productId
        );
        logger.info(`Removed product ${productId} from cart as qty <= 0`);
      }
    }

    // ✅ Cart active/inactive check
    if (cart.products.length === 0) {
        cart.isActive = false;
    }   else {
        cart.isActive = true;
    }

    // Update size & dimensions if provided
    if (size) {
      productInCart.size = size;
      logger.debug(`Updated size for product ${productId}: ${size}`);
    }
    if (dimensions) {
      productInCart.dimensions = dimensions;
      logger.debug(`Updated dimensions for product ${productId}: ${JSON.stringify(dimensions)}`);
    }
   
    // 🔑 Logic: Admin ne product ke liye installationRequired true kiya hai
    // Lekin user decide karega ki charges lagen ya nahi
    let installationCharges = 0;

// Count total quantity of products जिनमें admin ने installationRequired true किया है
// और user ने भी Yes चुना है
const installationProductCount = cart.products.reduce((count, p) => {
  if (p.product.installationRequired && p.installationRequired === true) {
    count += p.quantity;  // ✅ quantity भी जोड़ें
  }
  return count;
}, 0);

if (installationProductCount === 1) {
  installationCharges = 500;
  logger.info("Installation charges applied: 500 (single installation-required product)");
} else if (installationProductCount === 2) {
  installationCharges = 250;
  logger.info("Installation charges applied: 250 (two installation-required products)");
} else if (installationProductCount >= 3) {
  installationCharges = 0;
  logger.info("Installation free (3 or more installation-required products)");
} else {
  installationCharges = 0; // user ने No चुना या admin ने false किया
  logger.info("No installation required products, charges = 0");
}

    
     cart.installationCharges = installationCharges;
     await cart.save();

     const populatedCart = await Cart.findById(cart._id)
      .populate("products.product", "name price colour images installationRequired averageRating numReviews ");
      
       res.status(200).json({ 
        message: "Cart updated", 
      cart: populatedCart 
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// getcart
exports.getCart = async (req, res) => {
  try {
    const userId = req.user.id;
    // const cart = await Cart.findOne({ user: userId }).populate("products.product").populate("coupon"); // coupon details भी आएंगे
      const cart = await Cart.findOne({ user: userId })
      .populate("products.product", "name price colour images discount installationRequired averageRating numReviews") // ✅ extra fields
      

    if (!cart || cart.products.length === 0) {
      logger.info(`Cart is empty for user: ${userId}`);
      return res.status(200).json({ message: "Cart is empty", cart: [],
        isActive: false   // ✅ empty cart ke case mein inactive
      });
    }

    // ✅ Active/inactive check
    cart.isActive = cart.products.length > 0; 
    

    // 🔹 Calculate subtotal
    let subtotal = 0;
    cart.products.forEach((item) => {
      const price = item.product.price;
      const quantity = item.quantity;
      subtotal += price * quantity;
    });
     logger.debug(`Subtotal calculated: ${subtotal}`);


    //  Discount (example: product.discount %)
    let discount = 0;
    cart.products.forEach((item) => {
      if (item.product.discount) {
        discount += (item.product.price * item.quantity * item.product.discount) / 100;
      }
    });
    logger.debug(`Product discount calculated: ${discount}`);


    // // Coupon discount
    // let couponDiscount = 0;
    // if (cart.coupon) {
    //   if (cart.coupon.discountType === "percentage") {
    //     couponDiscount = (subtotal * cart.coupon.discountValue) / 100;
    //     if (cart.coupon.maxDiscount && couponDiscount > cart.coupon.maxDiscount) {
    //       couponDiscount = cart.coupon.maxDiscount;
    //     }
    //   } else if (cart.coupon.discountType === "fixed") {
    //     couponDiscount = cart.coupon.discountValue;
    //   }
    //   logger.debug(`Coupon discount applied: ${couponDiscount}`);
    // }

    //  Shipping (free or fixed)
    let shipping = 0;
    if (subtotal < 10000) {
      shipping = 500; // example
    }
    logger.debug(`Shipping charges: ${shipping}`);

  //  Tax (optional 10%)
    const tax = Math.round(subtotal * 0.1);
    logger.debug(`Tax calculated: ${tax}`);
  
   let installationCharges = 0;

// Count total quantity of products जिनमें admin ने installationRequired true किया है
// और user ने भी Yes चुना है
const installationProductCount = cart.products.reduce((count, p) => {
  if (p.product.installationRequired && p.installationRequired === true) {
    count += p.quantity;  // ✅ quantity भी जोड़ें
  }
  return count;
}, 0);

if (installationProductCount === 1) {
  installationCharges = 500;
  logger.info("Installation charges applied: 500 (single installation-required product)");
} else if (installationProductCount === 2) {
  installationCharges = 250;
  logger.info("Installation charges applied: 250 (two installation-required products)");
} else if (installationProductCount >= 3) {
  installationCharges = 0;
  logger.info("Installation free (3 or more installation-required products)");
} else {
  installationCharges = 0; // user ने No चुना या admin ने false किया
  logger.info("No installation required products, charges = 0");
}

 
  
//  Total
    const total = subtotal - discount  + shipping + tax + installationCharges;
    logger.info(`Cart total for user ${userId}: ${total}`);;
    

  //  Single response with everything
    res.status(200).json({
      cart,
      subtotal,
      discount,
      shipping,
      tax,
      installationCharges,
      total,
      items: cart.products,// har product ke saath installationRequired flag aa jayega
      isActive: cart.isActive   // ✅ response mein include karo
    });
    
 } catch (error) {
    logger.error(`Error in getCart: ${error.message}`);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
// Remove Product
exports.removeCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId } = req.body;

    logger.info(`RemoveCart request by user: ${userId}, product: ${productId}`);

    if (!productId) {
      logger.warn("Invalid input data: productId missing");
      return res.status(400).json({ message: "Invalid input data" });
    }

    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
      logger.warn(`Cart not found for user: ${userId}`);
      return res.status(404).json({ message: "Cart not found" });
    }

    const beforeCount = cart.products.length;
    cart.products = cart.products.filter(
      (p) => p.product.toString() !== productId
    );
    const afterCount = cart.products.length;

    if (beforeCount === afterCount) {
      logger.warn(`Product ${productId} not found in cart for user: ${userId}`);
    } else {
      logger.info(`Product ${productId} removed from cart for user: ${userId}`);
    }
     
    // Active/inactive check
    if (cart.products.length === 0) {
      cart.isActive = false;
      logger.info(`Cart is now inactive for user: ${userId}`);
    } else {
      cart.isActive = true;
      logger.info(`Cart remains active for user: ${userId}`);
    }

    await cart.save();
    logger.info(`Cart saved successfully after removal for user: ${userId}`);


    res.status(200).json({ message: "Item removed from cart", cart });
  } catch (err) {
    logger.error(`Error in removeCart: ${err.message}`);
    res.status(500).json({ message: err.message });
  }
};



//Remove Entire Cart
exports.deleteCart = async (req, res) => {
  try {
    const { userId } = req.params;
    logger.info(`DeleteCart request for user: ${userId}`);

    const deletedCart = await Cart.findOneAndDelete({ user: userId });

    if (!deletedCart) {
      logger.warn(`No cart found to delete for user: ${userId}`);
      return res.status(404).json({ message: "Cart not found" });
    }

    logger.info(`Cart deleted successfully for user: ${userId}`);
    res.status(200).json({ message: "Cart deleted successfully" });
  } catch (error) {
    logger.error(`Error in deleteCart for user: ${req.params.userId} - ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};