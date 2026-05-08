const mongoose = require("mongoose");
const Product = require("../models/product");
const Review = require("../models/review");



exports.addReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const { id } = req.params; // productId

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid product ID" });
    }

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    // ✅ कोई भी login हुआ user review दे सकता है
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "Unauthorized: Please login to add a review" });
    }

    const review = new Review({
      product: id,
      user: req.user.id,   // middleware/login के हिसाब से id इस्तेमाल करें
      rating,
      comment
    });

    await review.save();

    res.status(201).json({ message: "Review added successfully", review });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// // getreview
// exports.getProductReviews = async (req, res) => {
//   try {
//     const { id } = req.params; // productId

//     //  Optional: validate productId
//     if (!mongoose.Types.ObjectId.isValid(id)) {
//       return res.status(400).json({ error: "Invalid product ID" });
//     }
//     const reviews = await Review.find({ product: id })
//       .populate("user", "fullname email")
//       .populate("product", "name price");
    
//     if (reviews.length === 0) {
//         return res.json({ message: "No reviews yet for this product" });
//     }  
   
//     res.json(reviews);
// }   catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };
exports.getProductReviews = async (req, res) => {
  try {
    const { id } = req.params; // productId

    // Validate productId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid product ID" });
    }

    // सभी reviews निकालें
    const reviews = await Review.find({ product: id })
      .populate("user", "fullname email  _id")
      .populate("product", "name price");

    if (reviews.length === 0) {
      return res.json({ message: "No reviews yet for this product" });
    }

    // ✅ Current logged-in user का review अलग करें
    let userReview = [];
    let otherReviews = [];

    if (req.user && req.user._id) {
      userReview = reviews.filter(
        r => r.user && r.user._id && r.user._id.toString() === req.user._id.toString()
      );
      otherReviews = reviews.filter(
        r => r.user && r.user._id && r.user._id.toString() !== req.user._id.toString()
      );
    } else {
      otherReviews = reviews;
    }
    //  Response में पहले user का review और फिर बाकी
    res.json({
      message: "Reviews fetched successfully",
      reviews: [...userReview, ...otherReviews]
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// review update

exports.updateReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { rating, comment } = req.body;

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    // ✅ Check permissions
    if (req.user.role === "admin" || review.user.toString() === req.user._id.toString()) {
      // Update fields
      review.rating = rating || review.rating;
      review.comment = comment || review.comment;

      await review.save();

      return res.status(200).json({ message: "Review updated successfully", review });
    } else {
      return res.status(403).json({ message: "You are not allowed to update this review" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
// delete review
exports.deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    // ✅ Check permissions
    if (req.user.role === "admin" || review.user.toString() === req.user._id.toString()) {
      await Review.findByIdAndDelete(reviewId);
      return res.status(200).json({ message: "Review deleted successfully" });
    } else {
      return res.status(403).json({ message: "You are not allowed to delete this review" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
