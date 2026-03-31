const User = require("../models/User"); 
const logger = require("../helper/logger");


exports.getCustomerStats = async (req, res) => { 
    try { 
        const totalCustomers = await User.countDocuments(); 
        const activeCustomers = await User.countDocuments({ 
            status: "Active" 
        }); 
        
        const startOfMonth = new Date(); 
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