const Category = require("../models/category");
const Joi = require('joi');
const mongoose = require("mongoose");
const logger = require("../helper/logger");

// Joi Validation Schema
const categoryValidationSchema = Joi.object({
  categoryName: Joi.string().min(3).max(50).required(),
  description: Joi.string().max(200).allow(""),
});

// Create Category (Admin only)
exports.createCategory = async (req, res) => {
  try {
    if (req.user.role !== "admin" && req.user.role !== "superadmin") {
      logger.warn("-----createCategory----- Access denied: User tried to create category");
      return res.status(403).json({ message: "Access denied: Admin only" });
    }

    const { error } = categoryValidationSchema.validate(req.body);
    if (error) {
      logger.error("-----createCategory----- Validation error: " + error.details[0].message);
      return res.status(400).json({ error: error.details[0].message });
    }

    const existing = await Category.findOne({ categoryName: req.body.categoryName });
    if (existing) {
      logger.error("-----createCategory----- Category already exists: " + req.body.categoryName);
      return res.status(400).json({ error: "Category name already exists" });
    }

    const category = new Category(req.body);
    await category.save();
    logger.info("-----createCategory----- Category created successfully: " + category.categoryName);
    res.status(201).json(category);
  } catch (err) {
    logger.error("-----createCategory----- Server error: " + err.message);
    res.status(500).json({ error: err.message });
  }
};

// Get All Categories (User + Admin)
exports.getCategories = async (req, res) => {
  try {
    const category = await Category.find({ is_delete: false });
    logger.info("-----getCategories----- Fetched all categories");
    res.json(category);
  } catch (err) {
    logger.error("-----getCategories----- Server error: " + err.message);
    res.status(500).json({ error: err.message });
  }
};

// Get Single Category by ID (User + Admin)
exports.getCategoryById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      logger.error("-----getCategoryById----- Invalid category ID: " + req.params.id);
      return res.status(400).json({ error: "Invalid category ID" });
    }

    const category = await Category.findById(req.params.id);
    if (!category || category.is_delete) {
      logger.error("-----getCategoryById----- Category not found: " + req.params.id);
      return res.status(404).json({ message: "Category not found" });
    }

    logger.info("-----getCategoryById----- Category fetched: " + category.categoryName);
    res.json(category);
  } catch (err) {
    logger.error("-----getCategoryById----- Server error: " + err.message);
    res.status(500).json({ error: err.message });
  }
};

// Update Category (Admin only)
exports.updateCategory = async (req, res) => {
  try {
    if (req.user.role !== "admin" && req.user.role !== "superadmin") {
      logger.warn("-----updateCategory----- Access denied: User tried to update category");
      return res.status(403).json({ message: "Access denied: Admin only" });
    }

    const { error } = categoryValidationSchema.validate(req.body);
    if (error) {
      logger.error("-----updateCategory----- Validation error: " + error.details[0].message);
      return res.status(400).json({ error: error.details[0].message });
    }

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      logger.error("-----updateCategory----- Invalid category ID: " + req.params.id);
      return res.status(400).json({ error: "Invalid category ID" });
    }

    const category = await Category.findById(req.params.id);
    if (!category || category.is_delete) {
      logger.error("-----updateCategory----- Category not found or deleted: " + req.params.id);
      return res.status(404).json({ message: "Category not found" });
    }

    category.categoryName = req.body.categoryName || category.categoryName;
    category.description = req.body.description || category.description;

    await category.save();
    logger.info("-----updateCategory----- Category updated successfully: " + category.categoryName);
    res.json(category);
  } catch (err) {
    logger.error("-----updateCategory----- Server error: " + err.message);
    res.status(500).json({ error: err.message });
  }
};

// Soft Delete Category (Admin only)
exports.deleteCategory = async (req, res) => {
  try {
    if (req.user.role !== "admin" && req.user.role !== "superadmin") {
      logger.warn("-----deleteCategory----- Access denied: User tried to delete category");
      return res.status(403).json({ message: "Access denied: Admin only" });
    }

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      logger.error("-----deleteCategory----- Invalid category ID: " + req.params.id);
      return res.status(400).json({ error: "Invalid category ID" });
    }

    const category = await Category.findByIdAndUpdate(
      req.params.id,
      { is_delete: true },
      { new: true }
    );

    if (!category) {
      logger.error("-----deleteCategory----- Category not found: " + req.params.id);
      return res.status(404).json({ message: "Category not found" });
    }

    logger.info("-----deleteCategory----- Category deleted successfully: " + category.categoryName);
    res.json({ message: "Category deleted successfully" });
  } catch (err) {
    logger.error("-----deleteCategory----- Server error: " + err.message);
    res.status(500).json({ error: err.message });
  }
};