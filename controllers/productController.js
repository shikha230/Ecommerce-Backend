const mongoose = require("mongoose");
const Product = require("../models/product");
const Category = require("../models/category");
const Search = require("../models/search");
const logger = require("../helper/logger");


// Create Product
// Create Product (Admin only)
exports.createProduct = async (req, res) => {
  try {
    if (req.user.role !== "admin" && req.user.role !== "superadmin") {
      logger.warn("-----createProduct----- Access denied: User tried to create product");
      return res.status(403).json({ message: "Access denied: Admin only" });
    }

    const { name, price,discount,images,colour,size,quantity,description,specification, inStock, featured,sold,category, dimensions } = req.body;
     const product = new Product({
      name,
      price,
      discount,
      images,
      colour,
      size,
      quantity,
      description,
      specification,
      inStock,
      category,
      featured,
      sold,
      dimensions
    });
    

    await product.save();
    logger.info("-----createProduct----- Product created successfully: " + product.name);
    res.status(201).json({ message: "Product created successfully", product });
  } catch (err) {
    logger.error("-----createProduct----- Server error: " + err.message);
    res.status(500).json({ error: err.message });
  }
};

// ✅ Get All Products (with Pagination(admin ))
exports.getProduct = async (req, res) => {
  try {
    let { page, limit } = req.query;
    page = parseInt(page) || 1;
    limit = parseInt(limit) || 10;

    if (page < 1 || limit < 1) {
      logger.info("----getProducts-----Page and limit must be positive integers")
      return res.status(400).json({ message: "Page and limit must be positive integers" });
    }

    const skip = (page - 1) * limit;
    const totalProduct = await Product.countDocuments();
    const products = await Product.find()
      .populate("category")
      .skip(skip)
      .limit(limit);
    
    res.status(200).json({
      totalProduct,
      currentPage: page,
      totalPages: Math.ceil(totalProduct / limit),
      products
    });
  } catch (err) {
    logger.error("----getProducts-----error")
    res.status(500).json({ message: err.message });
  }
};

// ✅ Get Product by Name(admin+user)
exports.getProductByName = async (req, res) => {
  try {
    const { name } = req.params;
    if (!name){ 
      logger.info("----getproductsbyname-----Product name is required")
      return res.status(400).json({ message: "Product name is required" });
    }
    const product = await Product.findOne({ name: { $regex: new RegExp(name, "i") } }).populate("category");
    if (!product) {
      logger.info("----getproductsbyname-----Product not found")
      return res.status(404).json({ message: "Product not found" });
    }
    res.status(200).json({ product });
  } catch (err) {
    logger.error("----getproductsbyname-----error")
    res.status(500).json({ message: err.message });
  }
};
// Get product by ID
exports.getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate product ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      logger.info("----getproductsbyId-----Invalid product Id")
      return res.status(400).json({ error: "Invalid product ID" });
    }

    // Find product and populate category
    const product = await Product.findById(id).populate("category");
    if (!product) {
      logger.info("----getproductsbyId-----product not found")
      return res.status(404).json({ error: "Product not found" });
    }
    logger.info("----getproductsbyId-----Product fetched successfully")
    res.status(200).json({ message: "Product fetched successfully", product });
  } catch (error) {
    logger.error("---getproductbyId-----error")
    res.status(500).json({ error: "Server error", details: error.message });
  }
};
exports.updateProduct = async (req, res) => {
  try {
    if (req.user.role !== "admin" && req.user.role !== "superadmin") {
      return res.status(403).json({ message: "Access denied: Admin only" });
    }

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: "Invalid product ID" });
    }

    const product = await Product.findById(req.params.id);
    if (!product || product.is_delete) {
      return res.status(404).json({ message: "Product not found" });
    }

    // ✅ Validations only if field is provided
    if (req.body.price !== undefined && req.body.price < 0) {
      return res.status(400).json({ error: "Price must be positive" });
    }

    if (req.body.discount !== undefined && (req.body.discount < 0 || req.body.discount > 100)) {
      return res.status(400).json({ error: "Discount must be between 0 and 100" });
    }

    if (req.body.quantity !== undefined && req.body.quantity < 0) {
      return res.status(400).json({ error: "Quantity must be positive" });
    }

    if (req.body.category !== undefined) {
      if (!mongoose.Types.ObjectId.isValid(req.body.category)) {
        return res.status(400).json({ error: "Invalid category ID" });
      }
      const categoryExists = await Category.findById(req.body.category);
      if (!categoryExists) {
        return res.status(404).json({ error: "Category not found" });
      }
    }

    // ✅ Partial update
    Object.assign(product, req.body);

    await product.save();
    res.json({ message: "Product updated successfully", product });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
   
// ✅ Soft Delete Product
// Soft Delete Product (Admin only)
exports.deleteProduct = async (req, res) => {
  try {
    if (req.user.role !== "admin" && req.user.role !== "superadmin") {
      logger.warn("-----deleteProduct----- Access denied: User tried to delete product");
      return res.status(403).json({ message: "Access denied: Admin only" });
    }

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      logger.error("-----deleteProduct----- Invalid product ID: " + req.params.id);
      return res.status(400).json({ error: "Invalid product ID" });
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { is_delete: true },
      { new: true }
    );
     if (!product) {
      logger.error("-----deleteProduct----- Product not found: " + req.params.id);
      return res.status(404).json({ message: "Product not found" });
    }

    logger.info("-----deleteProduct----- Product deleted successfully: " + product.name);
    res.json({ message: "Product deleted successfully" });
  } catch (err) {
    logger.error("-----deleteProduct----- Server error: " + err.message);
    res.status(500).json({ error: err.message });
  }
};



// ✅ Get Products by Category
exports.getProductByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;

    // Validate category ID
    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
      logger.info("----getProductsByCategory-----Invalid category Id");
      return res.status(400).json({ error: "Invalid category ID" });
    }

    const categoryExists = await Category.findById(categoryId);
    if (!categoryExists) {
      logger.info("----getProductsByCategory-----Category not found");
      return res.status(404).json({ error: "Category not found" });
    }

    const product = await Product.find({ category: categoryId, is_delete: { $ne: true } })
      .populate("category");

    if (!product || product.length === 0) {
      logger.info("----getProductsByCategory-----No products found in this category");
      return res.status(404).json({ message: "No products found in this category" });
    }

    res.status(200).json({ product });
  } catch (error) {
    logger.error("----getProductsByCategory-----error");
    res.status(500).json({ error: "Server error", details: error.message });
  }
};
// ✅ Get Featured Products
exports.getfeaturedProduct = async (req, res) => {
  try {
    const product = await Product.find({ featured: true, is_delete: { $ne: true } })
      .populate("category")
      .sort({ createdAt: -1 }); // latest featured first

    if (!product || product.length === 0) {
      logger.info("----getFeaturedProducts-----No featured products found");
      return res.status(404).json({ message: "No featured products found" });
    }

    res.status(200).json({ product });
  } catch (error) {
    logger.error("----getFeaturedProducts-----error");
    res.status(500).json({ error: "Server error", details: error.message });
  }
};

// ✅ Get Best Selling Products
exports.getbestSellingProduct = async (req, res) => {
  try {
    let { limit } = req.query;
    limit = parseInt(limit) || 10; // default top 10
    console.log("Limit value:", limit);
    const product = await Product.find({ is_delete: { $ne: true } })
      .populate("category")
      .sort({ sold: -1 }) // highest sold first
      .limit(limit);
    
    if (!product || product.length === 0) {
      logger.info("----getBestSellingProducts-----No best selling products found");
      return res.status(404).json({ message: "No best selling products found" });
    }

    logger.info("----getBestSellingProducts-----Best selling products fetched successfully");
    res.status(200).json({ product });
  } catch (error) {
    logger.error("----getBestSellingProducts-----error");
    res.status(500).json({ error: "Server error", details: error.message });
  }
};     
//  Filter Products by Price (High to Low / Low to High)
exports.getfilterByPrice = async (req, res) => {
  try {
    let { sort } = req.query; 
    sort = sort?.toLowerCase();
    // sort = "asc" (low to high) OR "desc" (high to low)

    if (!sort || (sort !== "asc" && sort !== "desc")) {
      logger.info("----filterByPrice-----Invalid sort value");
      return res.status(400).json({ message: "Sort must be 'asc' or 'desc'" });
    }

    const products = await Product.find({ is_delete: { $ne: true } })
      .populate("category")
      .sort({ price: sort === "asc" ? 1 : -1 });

    if (!products || products.length === 0) {
      logger.info("----filterByPrice-----No products found");
      return res.status(404).json({ message: "No products found" });
    }

    logger.info("----filterByPrice-----Products fetched successfully");
    res.status(200).json({ products });
  } catch (error) {
    logger.error("----filterByPrice-----error");
    res.status(500).json({ error: "Server error", details: error.message });
  }
};
// searchProducts
exports.searchProducts = async (req, res) => {
  try {
    const keyword = req.query.q;
    const regex = new RegExp(keyword, "i");

    // पहले category collection में matching categories खोजें
    const categories = await Category.find({ name: { $regex: regex } }).select("_id");

    const products = await Product.find({
      $or: [
        { name: { $regex: regex } },
        { category: { $in: categories.map(c => c._id) } }
      ]
    }).populate("category"); // category details भी लाना चाहें तो

    await Search.create({
      user: req.user.id,
      keyword,
      resultsCount: products.length
    });

    logger.info(`-----searchProducts-----User: ${req.user._id}, Keyword: ${keyword}, Results: ${products.length}`);
    res.json(products);
  } catch (error) {
    logger.error("-----searchProducts-----Error", error);
    res.status(500).json({ message: error.message });
  }
};

// Recent Searches
exports.getrecentSearches = async (req, res) => {
  try {
    const searches = await Search.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .limit(5);

    logger.info(`-----getRecentSearches-----User: ${req.user._id}, Found: ${searches.length}`);
    res.json(searches);
  } catch (error) {
    logger.error("-----getRecentSearches-----Server error in getRecentSearches", error);
    res.status(500).json({ message: error.message });
  }
};
// upload Images
exports.uploadProductImages = async (req, res) => {
  try {
    // ✅ Role check
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Only admins can upload product images" });
    }

    // multer se multiple files aayengi
    const filenames = req.files.map(file => file.filename);

    // productId body se aayega
    const product = await Product.findByIdAndUpdate(
      req.body.productId,
      { $push: { images: { $each: filenames } } }, 
      { new: true }
    );

    // ✅ Logger
    console.log(`[UPLOAD] Admin ${req.user.id} uploaded images for product ${req.body.productId}:`, filenames);

    res.json({ message: "Product images uploaded successfully", product });
  } catch (err) {
    console.error(`[ERROR] Upload failed: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
};