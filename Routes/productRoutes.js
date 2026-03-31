const express = require("express");
const router = express.Router();
const tokenMiddleware =require("../middleware/tokenMiddleware");

const productController = require('../controllers/productController');

// Admin restricted
router.post("/create", tokenMiddleware, productController.createProduct);
router.put("/update/:id", tokenMiddleware, productController.updateProduct);
router.delete("/delete/:id", tokenMiddleware, productController.deleteProduct);



// Admin and Users
router.get('/products', tokenMiddleware,productController.getProduct);
router.get('/by-name/:name', tokenMiddleware,productController.getProductByName);
router.get('/by-id/:id',tokenMiddleware, productController.getProductById);
router.get('/by-category/:categoryId', tokenMiddleware,productController.getProductByCategory);
router.get('/products/:featured',tokenMiddleware, productController.getfeaturedProduct);
router.get('/products/best-selling', tokenMiddleware,productController.getbestSellingProduct);
router.get('/byfilter/price', tokenMiddleware,productController.getfilterByPrice);



module.exports = router;