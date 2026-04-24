const Cart = require("../models/cart");
const Product = require("../models/product");


// Add to Cart
exports.addtoCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId, quantity, size, dimensions } = req.body;
    
    logger.info(`Add to cart request by user: ${userId}, product: ${productId}, qty: ${quantity}`);


    if (!productId || !quantity || quantity < 1) {
      logger.warn("Invalid input data for addToCart");

      return res.status(400).json({ message: "Invalid input data" });
    }

    let cart = await Cart.findOne({ user: userId });

    if (!cart) {
      // अगर cart नहीं है तो नया बनाओ
      logger.info("No cart found, creating new cart");

      cart = new Cart({
        user: userId,
        products: [{ product: productId, quantity, size, dimensions }],
      });
    } else {
      logger.info("Cart found, checking for existing product");

      // अगर cart है तो product check करो
      const existingProduct = cart.products.find(
        (p) => p.product.toString() === productId
      );

      if (existingProduct) {
        logger.info("Product already in cart, updating quantity and details")
        // अगर product पहले से है तो quantity बढ़ाओ
        existingProduct.quantity += quantity;

        // ✅ साथ ही size और dimensions भी update करो
        if (size) {
          existingProduct.size = size;
          logger.debug(`Updated size: ${size}`);

        }
        if (dimensions) {
          existingProduct.dimensions = dimensions;
          logger.debug(`Updated dimensions: ${JSON.stringify(dimensions)}`);
        }

        
      } else {
        logger.info("New product, adding to cart");
        // अगर product नया है तो push करो
        cart.products.push({ product: productId, quantity, size, dimensions });
      }
    }

    // // ✅ Auto Update Products (sold & stock)
    // for (let item of cart.products) {
    //   const product = await Product.findById(item.product);
    //   if (product) {
    //     if (product.quantity < item.quantity) {
    //       return res
    //         .status(400)
    //         .json({ message: `Not enough stock for ${product.name}` });
    //     }
    //     product.sold += item.quantity;
    //     product.quantity -= item.quantity;
    //     await product.save();
    //   }
    // }
    // let installationCharges = 0; // default = 0 (agar installation nahi chahiye)
    // if (installationRequired) {
    //   const totalProducts = cart.products.reduce((sum, p) => sum + p.quantity, 0);
    //   if (totalProducts >= 3) {
    //     installationCharges = 0; // free installation// 
    //     logger.info("Installation free (3 or more products)");
    //   } else if (totalProducts === 1) {
    //     installationCharges = 500; // example charge
    //     logger.info("Installation charges applied: 500 (single product)");
    //   } else {
    //     installationCharges = 200; // example charge for 2 products
    //     logger.info("Installation charges applied: 200 (two products)");
    //   }
    // } else {
    //   logger.info("Installation not required, charges = 0");
    // }
    // cart.installationCharges = installationCharges;

    await cart.save();
    logger.info(`Cart saved successfully for user: ${userId}`);
     // Populate ke saath response bheja
    const populatedCart = await Cart.findById(cart._id)
      .populate("products.product", "name price colour images");
    
    res.status(200).json({ message: "Item added to cart", cart: populatedCart });
   
  } catch (err) {
      logger.error(`Error in addToCart: ${err.message}`);
    res.status(500).json({ message: err.message });
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

    // Update size & dimensions if provided
    if (size) {
      productInCart.size = size;
      logger.debug(`Updated size for product ${productId}: ${size}`);
    }
    if (dimensions) {
      productInCart.dimensions = dimensions;
      logger.debug(`Updated dimensions for product ${productId}: ${JSON.stringify(dimensions)}`);
    }
    let installationCharges = 0; // default = 0 (agar installation nahi chahiye)
    if (installationRequired) {
      const totalProducts = cart.products.reduce((sum, p) => sum + p.quantity, 0);
      logger.info(`Total products in cart after update: ${totalProducts}`);

      if (totalProducts >= 3) {
        installationCharges = 0;
        logger.info("Installation free (3 or more products)");
      } else if (totalProducts === 1) {
        installationCharges = 500; // example charge
        logger.info("Installation charges applied: 500 (single product)");
      } else {
        installationCharges = 250; // example charge for 2 products
        logger.info("Installation charges applied: 200 (two products)");
      }
    } else {
      logger.info("Installation not required, charges = 0");
    }   
    cart.installationCharges = installationCharges;
    
    await cart.save();
    logger.info(`Cart updated successfully for user: ${userId}, installationCharges: ${installationCharges}`);

    const populatedCart = await Cart.findById(cart._id)
      .populate("products.product", "name price colour images");

    res.status(200).json({ message: "Cart updated", cart: populatedCart });
  } catch (err) {
    logger.error(`Error in updateCart: ${err.message}`);
    res.status(500).json({ message: err.message });
  }
};

// getcart
exports.getCart = async (req, res) => {
  try {
    const userId = req.user.id;
    // const cart = await Cart.findOne({ user: userId }).populate("products.product").populate("coupon"); // coupon details भी आएंगे
      const cart = await Cart.findOne({ user: userId })
      .populate("products.product", "name price colour images discount") // ✅ extra fields
      .populate("coupon");

    if (!cart || cart.products.length === 0) {
      logger.info(`Cart is empty for user: ${userId}`);
      return res.status(200).json({ message: "Cart is empty", cart: [] });
    }

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


    // Coupon discount
    let couponDiscount = 0;
    if (cart.coupon) {
      if (cart.coupon.discountType === "percentage") {
        couponDiscount = (subtotal * cart.coupon.discountValue) / 100;
        if (cart.coupon.maxDiscount && couponDiscount > cart.coupon.maxDiscount) {
          couponDiscount = cart.coupon.maxDiscount;
        }
      } else if (cart.coupon.discountType === "fixed") {
        couponDiscount = cart.coupon.discountValue;
      }
      logger.debug(`Coupon discount applied: ${couponDiscount}`);
    }

    //  Shipping (free or fixed)
    let shipping = 0;
    if (subtotal < 50000) {
      shipping = 500; // example
    }
    logger.debug(`Shipping charges: ${shipping}`);

  //  Tax (optional 10%)
    const tax = Math.round(subtotal * 0.1);
    logger.debug(`Tax calculated: ${tax}`);
  
  // const installationCharges = cart.installationCharges || 0;
    logger.debug(`Installation charges: ${installationCharges}`);

  //  Total
    const total = subtotal - discount - couponDiscount + shipping + tax + installationCharges;
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
      items: cart.products,
    });
  } catch (error) {
    logger.error(`Error in getCart: ${error.message}`);

    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
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