// const jwt = require("jsonwebtoken");

// const admintokenMiddleware = (req, res, next) => {
//   try {
//     // Header से token निकालना
//     const authHeader = req.headers["authorization"];
//     if (!authHeader) {
//       return res.status(401).json({ error: "No token, access denied" });
//     }

//     // Format check: "Bearer <token>"
//     const token = authHeader.split(" ")[1];
//     if (!token) {
//       return res.status(401).json({ error: "Invalid token format" });
//     }

//     // Token verify करना
//     jwt.verify(token, process.env.JWT_SECRET || "yourSecretKey", (err, decoded) => {
//       if (err) {
//         return res.status(401).json({ error: "Invalid or expired token" });
//       }

//       // decoded payload को request में attach करना
//       req.admin = decoded; // इसमें id और role होंगे
//       next();
//     });
//   } catch (err) {
//     res.status(500).json({ error: "Token verification failed" });
//   }
// };

// module.exports = admintokenMiddleware;