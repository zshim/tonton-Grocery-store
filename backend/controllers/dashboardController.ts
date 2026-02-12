import { Request, Response } from 'express';
import { Order, Product, User } from '../schemas';
import { AuthRequest } from '../middleware/authMiddleware';

// @desc    Get aggregated stats for Manager Dashboard
// @route   GET /api/dashboard/manager
// @access  Private/Manager
export const getManagerStats = async (req: Request, res: Response) => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // 1. Today's Sales (Sum of Order Totals for today)
    const todaysOrders = await Order.find({
      createdAt: { $gte: todayStart, $lte: todayEnd }
    });
    // Fix: Access total from pricing object and cast to any to avoid TS issues
    const todaysSales = todaysOrders.reduce((acc, order: any) => acc + (order.pricing?.total || 0), 0);

    // 2. Total Revenue (All time)
    const allOrders = await Order.find({}); // In production, use aggregate() for better performance
    // Fix: Access total from pricing object
    const totalRevenue = allOrders.reduce((acc, order: any) => acc + (order.pricing?.total || 0), 0);

    // 3. Total Pending Dues (Sum of all users' dues)
    const allUsers = await User.find({});
    const totalPendingDues = allUsers.reduce((acc, user) => acc + (user.pendingDues || 0), 0);

    // 4. Low Stock Count
    const lowStockCount = await Product.countDocuments({ stock: { $lt: 2 }, isActive: true });

    // 5. Recent Orders (Customer Activity)
    const recentOrders = await Order.find({})
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('customer', 'name email');

    // 6. Top Selling Products (Simple aggregation)
    // Flatten all order items
    const allItems = allOrders.flatMap(o => o.items);
    const productSales: Record<string, number> = {};
    
    allItems.forEach(item => {
        const name = item.name || 'Unknown';
        productSales[name] = (productSales[name] || 0) + item.quantity;
    });

    // Sort and take top 5
    const topProducts = Object.entries(productSales)
        .map(([name, qty]) => ({ name, qty }))
        .sort((a, b) => b.qty - a.qty)
        .slice(0, 5);

    res.json({
      todaysSales,
      totalRevenue,
      totalPendingDues,
      lowStockCount,
      recentOrders,
      topProducts
    });

  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get aggregated stats for Customer Dashboard
// @route   GET /api/dashboard/customer
// @access  Private
export const getCustomerStats = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user._id;

    // 1. Order History Stats
    const myOrders = await Order.find({ customer: userId }).sort({ createdAt: -1 });
    // Fix: Access total from pricing object
    const totalSpent = myOrders.reduce((acc, order: any) => acc + (order.pricing?.total || 0), 0);
    
    // 2. Current Dues
    const user = await User.findById(userId);
    const pendingDues = user ? user.pendingDues : 0;

    // 3. Recent Orders (Last 3)
    const recentOrders = myOrders.slice(0, 3);

    res.json({
      totalOrders: myOrders.length,
      totalSpent,
      pendingDues,
      recentOrders
    });

  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};