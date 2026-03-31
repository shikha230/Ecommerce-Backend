const express = require("express");
const logger = require("./helper/logger");
require("dotenv").config();
const authRoutes = require("./Routes/authRoutes");
const productRoutes = require("./Routes/productRoutes");
const categoryRoutes = require("./Routes/categoryRoutes");
const adminRoutes = require("./Routes/adminRoutes");
const couponRoutes = require("./Routes/couponRoutes");
const cartRoutes = require("./Routes/cartRoutes");
const wishlistRoutes = require("./Routes/wishlistRoutes");
const orderRoutes = require("./Routes/orderRoutes");





const connect = require("./config/connect");
connect();
const app = express();

app.use(express.json());
// public routes
app.use("/api/auth", authRoutes);
app.use("/api/product", productRoutes);
app.use("/api/category", categoryRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/status", adminRoutes);
app.use("/api/coupon", couponRoutes)
app.use("/api/cart", cartRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/order", orderRoutes);





// logger.info("debugg");

app.listen(3000, () => logger.info("Server running on port 3000"));