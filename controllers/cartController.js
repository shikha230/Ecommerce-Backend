const Cart = require("../models/cart");
const Product = require("../models/product");


// Add to Cart
exports.addtoCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId, quantity, size, dimensions } = req.body;

    if (!productId || !quantity || quantity < 1) {
      return res.status(400).json({ message: "Invalid input data" });
    }

    let cart = await Cart.findOne({ user: userId });

    if (!cart) {
      // अगर cart नहीं है तो नया बनाओ
      cart = new Cart({
        user: userId,
        products: [{ product: productId, quantity, size, dimensions }],
      });
    } else {
      // अगर cart है तो product check करो
      const existingProduct = cart.products.find(
        (p) => p.product.toString() === productId
      );

      if (existingProduct) {
        // अगर product पहले से है तो quantity बढ़ाओ
        existingProduct.quantity += quantity;

        // ✅ साथ ही size और dimensions भी update करो
        if (size) {
          existingProduct.size = size;
        }
        if (dimensions) {
          existingProduct.dimensions = dimensions;
        }
      } else {
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

    await cart.save();
    res.status(200).json({ message: "Item added to cart", cart });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
   
// update cart
 exports.updateCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId, action, size, dimensions } = req.body;

    if (!productId) {
      return res.status(400).json({ message: "Invalid input data" });
    }

    let cart = await Cart.findOne({ user: userId });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    //  Find product in cart
    const productInCart = cart.products.find(
      (p) => p.product.toString() === productId
    );
    if (!productInCart) {
      return res.status(404).json({ message: "Product not found in cart" });
    }

    //  Update quantity
    if (action === "increment") {
      productInCart.quantity += 1;
    } else if (action === "decrement") {
      productInCart.quantity -= 1;
      if (productInCart.quantity <= 0) {
        cart.products = cart.products.filter(
          (p) => p.product.toString() !== productId
        );
      }
    }

    // Update size & dimensions if provided
    if (size) {
      productInCart.size = size;
    }
    if (dimensions) {
      productInCart.dimensions = dimensions;
    }

    await cart.save();
    res.status(200).json({ message: "Cart updated", cart });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
// getcart
exports.getCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const cart = await Cart.findOne({ user: userId }).populate("products.product").populate("coupon"); // coupon details भी आएंगे
    if (!cart || cart.products.length === 0) {
      return res.status(200).json({ message: "Cart is empty", cart: [] });
    }

    // 🔹 Calculate subtotal
    let subtotal = 0;
    cart.products.forEach((item) => {
      const price = item.product.price;
      const quantity = item.quantity;
      subtotal += price * quantity;
    });

    //  Discount (example: product.discount %)
    let discount = 0;
    cart.products.forEach((item) => {
      if (item.product.discount) {
        discount += (item.product.price * item.quantity * item.product.discount) / 100;
      }
    });
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
    }

    //  Shipping (free or fixed)
    let shipping = 0;
    if (subtotal < 50000) {
      shipping = 500; // example
    }

    //  Tax (optional 10%)
    const tax = Math.round(subtotal * 0.1);

    //  Total
    const total = subtotal - discount - couponDiscount + shipping + tax;
    //  Single response with everything
    res.status(200).json({
      cart,
      subtotal,
      discount,
      shipping,
      tax,
      total,
      items: cart.products,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};
//  Remove Product
exports.removeCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId } = req.body;

    if (!productId)
      return res.status(400).json({ message: "Invalid input data" });

    let cart = await Cart.findOne({ user: userId });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    cart.products = cart.products.filter(
      (p) => p.product.toString() !== productId,
    );

    await cart.save();
    res.status(200).json({ message: "Item removed from cart", cart });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ✅ Remove Entire Cart
exports.deleteCart = async (req, res) => {
  try {
    const { userId } = req.params;
    await Cart.findOneAndDelete({ user: userId });
    res.status(200).json({ message: "Cart deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
