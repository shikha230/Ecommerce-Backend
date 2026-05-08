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
const paymentRoutes = require("./Routes/paymentRoutes");
const contactRoutes = require("./Routes/contactRoutes");
const customerRoutes = require("./Routes/customerRoutes");
const reviewRoutes = require("./Routes/reviewRoutes");



const path = require("path");

const cors = require("cors");
const allowedOrigins = [
  "http://187.77.99.134",
  "http://localhost:3000",
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5175",
   "http://localhost:5176",
  "http://localhost:5177",
];

const connect = require("./config/connect");
connect();

const app = express();
// app.use(cors());
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      const isNgrok = origin.includes("ngrok-free.app");
      const isAllowedIP = allowedOrigins.includes(origin);

      if (isAllowedIP || isNgrok) {
        callback(null, true);
      } else {
        console.log("Blocked by CORS:", origin);
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "ngrok-skip-browser-warning",
    ],
  }),
);

app.use(express.json({ limit: '20mb' }));
// EJS setup
app.use(express.urlencoded({limit: '20mb', extended: true }));
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views")); // views folder

// public routes
app.use("/api/auth", authRoutes);
app.use("/api/product", productRoutes);
app.use("/api/category", categoryRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/status", adminRoutes);
app.use("/api/coupon", couponRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/order", orderRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/review", reviewRoutes);

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Error handling middleware (routes ke baad)
app.use((err, req, res, next) => {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'File too large. Max 20MB allowed.' });
  }
  // Agar koi aur error hai to usko bhi handle kiya
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});




//Test route for EJS page
app.get("/", (req, res) => {
  res.render("payment"); // views/payment.ejs को render करेगा
});

// logger.info("debugg");

app.listen(3000, () => logger.info("Server running on port 3000"));
