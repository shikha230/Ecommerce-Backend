const User = require("../models/User"); 
const Order = require("../models/order");
const logger = require("../helper/logger");



exports.getCustomerStats = async (req, res) => { 
    try { 
        const totalCustomers = await User.countDocuments(); 
        const activeCustomers = await User.countDocuments({ status: "Active" }); 
        
        const startOfMonth = new Date();      
        startOfMonth.setDate(1); 
        
        const newCustomers = await User.countDocuments({ createdAt: { $gte: startOfMonth } }); 
        const returningCustomers = await User.countDocuments({ orders: { $gt: 1 } }); 
        
        const returningRate = totalCustomers === 0 ? 0 
            : ((returningCustomers / totalCustomers) * 100).toFixed(2); 
        
        logger.info("-----getCustomerStats----- Stats fetched successfully");
        
        res.json({ 
            totalCustomers, 
            activeCustomers, 
            newCustomers, 
            returningRate: returningRate + "%"
        }); 
    } catch (err){
        logger.error("-----getCustomerStats----- Server error: " + err.message);
        res.status(500).json({ error: err.message }); 
    } 
};
  
exports.getCustomersList = async (req, res) => {
    try {
        const customers = await User.aggregate([
            {
                $lookup: {
                    from: "orders",
                    localField: "_id",
                    foreignField: "user",
                    as: "orders"
                }
            },
            {
                $addFields: {
                    totalOrders: { $size: "$orders" },
                    totalSpent: { $sum: "$orders.amount" },
                    lastOrder: { $max: "$orders.createdAt" }
                }
            },
            {
                $project: {
                    fullname: 1,   // better to use fullname instead of name
                    email: 1,
                    totalOrders: 1,
                    totalSpent: 1,
                    lastOrder: 1
                }
            }
        ]);

        logger.info("-----getCustomersList----- Customers list fetched successfully, count: " + customers.length);
        
        res.json(customers);
    } catch (error) {
        logger.error("-----getCustomersList----- Server error: " + error.message);
        res.status(500).json({ message: error.message });
    }
};

exports.deleteCustomer = async (req, res) => {
  try {
    // Access control: only admin/superadmin
    if (req.user.role !== "admin" && req.user.role !== "superadmin") {
      logger.warn("-----deleteCustomer----- Access denied: User tried to delete customer");
      return res.status(403).json({ message: "Access denied: Admin only" });
    }

    const { id } = req.params; // customer id from URL

    const customer = await User.findById(id);
    if (!customer) {
      logger.error("-----deleteCustomer----- Customer not found: " + id);
      return res.status(404).json({ message: "Customer not found" });
    }

    await User.findByIdAndDelete(id);

    logger.info("-----deleteCustomer----- Customer deleted successfully: " + customer.fullname);
    res.status(200).json({ message: "Customer deleted successfully" });
  } catch (err) {
    logger.error("-----deleteCustomer----- Server error: " + err.message);
    res.status(500).json({ error: err.message });
  }
};
