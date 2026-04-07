const User = require("../models/User"); 
const Order = require("../models/order");
const logger = require("../helper/logger");


exports.getCustomerStats = async (req, res) => { 
    try { 
        const totalCustomers = await User.countDocuments(); 
        const activeCustomers = await User.countDocuments({ 
            status: "Active" 
        }); 
        
        const startOfMonth = new Date();      //new this month
        startOfMonth.setDate(1); 
        
        const newCustomers = await User.countDocuments({ 
            createdAt: { $gte: startOfMonth } 
        }); 
        
        const returningCustomers = await User.countDocuments({ 
            orders: { $gt: 1 } 
        }); 
        
        const returningRate = totalCustomers === 0 ? 0 
        : ((returningCustomers / totalCustomers) * 100).toFixed(2); 
        
        
        res.json({ 
            totalCustomers, 
            activeCustomers, 
            newCustomers, 
            returningRate: returningRate + "%"
         }); 
        } catch (err){
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
                        name: 1,
                        email: 1,
                        totalOrder: 1,
                        totalSpent: 1,
                        
                        lastOrder: 1
                    }
                }
            ]);
            res.json(customers);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }