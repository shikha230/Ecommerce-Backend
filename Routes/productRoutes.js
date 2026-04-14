const express = require("express");
const router = express.Router();
const tokenMiddleware =require("../middleware/tokenMiddleware");

const productController = require('../controllers/productController');
const { uploadProduct } = require("../middleware/uploads");


// Admin restricted
router.post("/create", tokenMiddleware, productController.createProduct);
router.put("/update/:id", tokenMiddleware, productController.updateProduct);
router.delete("/delete/:id", tokenMiddleware, productController.deleteProduct);



// Admin and Users
router.get('/products',productController.getProduct);
router.get('/by-name/:name',productController.getProductByName);
router.get('/by-id/:id',tokenMiddleware, productController.getProductById);
router.get('/by-category/:categoryId',productController.getProductByCategory);
// Product related routes
 router.get("/searchProducts",tokenMiddleware,productController.searchProducts);


router.get('/products/:featured', productController.getfeaturedProduct);
router.get('/products/best-selling',productController.getbestSellingProduct);
router.get('/byfilter/price',productController.getfilterByPrice);
router.get("/recent-searches",tokenMiddleware,productController.getrecentSearches);



router.post("/upload/photos",tokenMiddleware,uploadProduct.array("productImages", 5),productController.uploadProductImages);
 
// ek product ke liye max 5 images uploadProductImages




module.exports = router;