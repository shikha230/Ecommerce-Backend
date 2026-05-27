const express = require("express");
const router = express.Router();
const reviewController = require("../controllers/reviewController");
const tokenMiddleware = require("../middleware/tokenMiddleware");
// Add review
router.post("/review-add/:id",tokenMiddleware,reviewController.addReview);

//get review
router.get("/get-review/:id",tokenMiddleware,reviewController.getProductReviews);

// Update review (user or admin)
router.put("/update/:reviewId",tokenMiddleware,reviewController.updateReview);

// Delete review (user or admin)
router.delete("/remove/:reviewId",tokenMiddleware,reviewController.deleteReview);

module.exports = router;
