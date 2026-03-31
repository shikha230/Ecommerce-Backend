const express = require("express");
const router = express.Router();
const tokenMiddleware =require("../middleware/tokenMiddleware");
const categoryController = require('../controllers/categoryController');

// ✅ Admin restricted routes
router.post("/create", tokenMiddleware, categoryController.createCategory);
router.put("/:id", tokenMiddleware, categoryController.updateCategory);
router.delete("/:id", tokenMiddleware, categoryController.deleteCategory);

// ✅ Public routes (User + Admin both)
router.get("/", categoryController.getCategories);
router.get("/:id", categoryController.getCategoryById);


module.exports = router;