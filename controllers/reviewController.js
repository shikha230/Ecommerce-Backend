const mongoose = require("mongoose");
const Product = require("../models/product");
const Review = require("../models/review");
const logger= require("../helper/logger");

exports.addReview = async (req, res) => {
  try {
    const { rating, comment, dummyFirstName, dummyLastName, asVerified  } = req.body;
    const { id } = req.params; // productId
    console.log("👉 req.params:", req.params);

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid product ID" });
    }

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    // 🔑 Check: Agar admin hai aur dummy name bheja hai → allow without userId
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized: Please login" });
    }

    let review;
   // 🔑 Admin case: dummy user OR verified user
    if (req.user.role === "admin") {
      if (dummyFirstName && dummyLastName) {
        // Admin creating dummy review
        review = new Review({
          product: id,
          rating,
          comment,
          dummyUser: {
            firstName: dummyFirstName,
            lastName: dummyLastName,
            createdByAdmin: true
          }
        });
      } else if (asVerified) {
        // Admin writing as verified user (own account)
        review = new Review({
          product: id,
          user: req.user.id,
          rating,
          comment
        });
      }
    } else {
      // Normal user review
      review = new Review({
        product: id,
        user: req.user.id,
        rating,
        comment
      });
    }
    await review.save();
    res.status(201).json({
      message: "Review added successfully",
      review: {
        _id: review._id,
        product: review.product,
        rating: review.rating,
        comment: review.comment,
        createdAt: review.createdAt,
         userName: review.dummyUser
      ? `${review.dummyUser.firstName} ${review.dummyUser.lastName}`
      : (req.user.fullname || "Verified User")
  }
      //     ? `${review.dummyUser.firstName} ${review.dummyUser.lastName}`
      //     : (req.user.fullname || "Verified User")
      // }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getProductReviews = async (req, res) => {
  try {
    const { id } = req.params; // productId from URL

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid product ID" });
    }

    const reviews = await Review.find({ product: id })
      .populate("user", "fullname email _id")
      .populate("product", "name price");

    if (!reviews || reviews.length === 0) {
      return res.json({ message: "No reviews yet for this product" });
    }

    res.json({
      success: true,
      message: "Reviews fetched successfully",
      reviews
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};





// // review update

// exports.updateReview = async (req, res) => {
//   try {
//     const { reviewId } = req.params;
//     const { rating, comment } = req.body;

//     const review = await Review.findById(reviewId);
//     if (!review) {
//       return res.status(404).json({ message: "Review not found" });
//     }

//     // ✅ Check permissions
//     if (req.user.role === "admin" || review.user.toString() === req.user._id.toString()) {
//       // Update fields
//       review.rating = rating || review.rating;
//       review.comment = comment || review.comment;

//       await review.save();

//       return res.status(200).json({ message: "Review updated successfully", review });
//     } else {
//       return res.status(403).json({ message: "You are not allowed to update this review" });
//     }
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };

   exports.updateReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { rating, comment, dummyFirstName, dummyLastName } = req.body;

    logger.info("Incoming update request", { reviewId, rating, comment, dummyFirstName, dummyLastName });
    logger.info("Current user", req.user);

    const review = await Review.findById(reviewId);
    logger.info("Review fetched from DB", review);

    // if (!review) {
    //   logger.warn("Review not found", { reviewId });
    //   return res.status(404).json({ message: "Review not found", reviewId });
    // // }
   if (!review) {
  // ⭐ Console mein raw info print karo
  console.warn("⚠️ Review not found in DB");
  console.log("👉 ReviewId received from request:", reviewId);

  // ⭐ Agar productId bhi available hai to uske reviews print karo
   if (req.params.id) {
    const productReviews = await Review.find({ product: req.params.id });
    console.log("👉 All reviews for this product:", productReviews);
   }

  // ⭐ Logger mein structured info save karo
  logger.warn("Review not found", { 
    reviewId, 
    productId: req.params.id || null, 
    user: req.user 
  });

  // ⭐ Response mein extra info bhejo (sirf debugging ke liye)
  return res.status(404).json({ 
    message: "Review not found", 
    reviewId, 
     
  });
}
    const currentUserId = req.user.id?.toString();
    const isOwner = review.user && review.user.toString() === currentUserId;
    const isAdmin = req.user.role === "admin";

    logger.info("Permission check", { isOwner, isAdmin, currentUserId, reviewUser: review.user?.toString() });

    if (isOwner && !isAdmin) {
      review.rating = rating || review.rating;
      review.comment = comment || review.comment;
    } else if (isAdmin && review.user && review.user.toString() === currentUserId) {
      review.rating = rating || review.rating;
      review.comment = comment || review.comment;
    } else if (isAdmin && review.dummyUser) {
      review.rating = rating || review.rating;
      review.comment = comment || review.comment;
      if (dummyFirstName) review.dummyUser.firstName = dummyFirstName;
      if (dummyLastName) review.dummyUser.lastName = dummyLastName;
    } else {
      logger.error("Unauthorized update attempt", { user: req.user, reviewId });
      return res.status(403).json({ message: "You are not allowed to update this review" });
    }

    await review.save();
    await review.populate("user", "fullname");

    logger.info("Review updated successfully", { reviewId });

    return res.status(200).json({
      message: "Review updated successfully",
      review: {
        id: review.id,
        product: review.product,
        rating: review.rating,
        comment: review.comment,
        createdAt: review.createdAt,
        userName: review.dummyUser
          ? `${review.dummyUser.firstName} ${review.dummyUser.lastName}`
          : (review.user?.fullname || "Verified User")
      }
    });
  } catch (error) {
    logger.error("Update Review Error", { message: error.message, stack: error.stack });
    console.error("❌ Update Review Error:", error); // ⭐ console log bhi add kar diya
    res.status(500).json({ error: error.message, stack: error.stack });
  }
};   


exports.deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    const currentUserId = req.user.id?.toString();
    const isOwner = review.user && review.user.toString() === currentUserId;
    const isAdmin = req.user.role === "admin";

    if (isOwner && !isAdmin) {
      await Review.findByIdAndDelete(reviewId);
      return res.status(200).json({ message: "Review deleted successfully" });
    } else if (isAdmin) {
      await Review.findByIdAndDelete(reviewId);
      return res.status(200).json({ message: "Review deleted successfully by admin" });
    } else {
      return res.status(403).json({ message: "You are not allowed to delete this review" });
    }

  } catch (error) {
    console.error("❌ Delete Review Error:", error); // ⭐ console log
    res.status(500).json({ error: error.message, stack: error.stack });
  }
};   
