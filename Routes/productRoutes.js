const express = require("express");
const router = express.Router();
const tokenMiddleware =require("../middleware/tokenMiddleware");

const productController = require('../controllers/productController');

// Admin restricted
router.post("/create", tokenMiddleware, productController.createProduct);
router.put("/update/:id", tokenMiddleware, productController.updateProduct);
router.delete("/delete/:id", tokenMiddleware, productController.deleteProduct);



// Admin and Users
router.get('/products',productController.getProduct);
router.get('/by-name/:name',productController.getProductByName);
router.get('/by-id/:id',tokenMiddleware, productController.getProductById);
router.get('/by-category/:categoryId',productController.getProductByCategory);
router.get('/products/:featured', productController.getfeaturedProduct);
router.get('/products/best-selling',productController.getbestSellingProduct);
router.get('/byfilter/price',productController.getfilterByPrice);



module.exports = router;