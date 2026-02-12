import { Request, Response } from 'express';
import { Order, Product, User, Transaction } from '../schemas';
import { AuthRequest } from '../middleware/authMiddleware';

const TAX_RATE = 0; // 0% Tax

// @desc    Create new order (Customer or Manager manual bill)
// @route   POST /api/orders
// @access  Private
export const addOrderItems = async (req: any, res: Response) => {
  try {
    const { orderItems, amountPaid, customerId, paymentMethod } = req.body;

    if (orderItems && orderItems.length === 0) {
      return res.status(400).json({ message: 'No order items' });
    }

    // Determine Customer: Manager can specify customerId, otherwise use logged-in user
    let targetUserId = req.user._id;
    if (req.user.role === 'MANAGER' && customerId) {
      targetUserId = customerId;
    }

    // 1. Fetch Products & Calculate Prices Server-Side (Security)
    let dbOrderItems = [];
    let subtotal = 0;

    for (const item of orderItems) {
      const product = await Product.findById(item.product || item.id); // Handle both formats
      
      if (!product) {
        return res.status(404).json({ message: `Product not found: ${item.name}` });
      }
      
      if (product.stock < item.quantity) {
        return res.status(400).json({ message: `Insufficient stock for ${product.name}` });
      }

      // Snapshot of price/name at time of order
      const itemTotal = product.price * item.quantity;
      subtotal += itemTotal;

      dbOrderItems.push({
        product: product._id,
        name: product.name,
        price: product.price,
        quantity: item.quantity,
        total: itemTotal
      });

      // 2. Update Inventory
      product.stock -= item.quantity;
      await product.save();
    }

    // 3. Calculate Totals
    const tax = subtotal * TAX_RATE;
    const total = subtotal + tax; // No discount logic yet for simplicity
    
    // Determine Payment Status
    let status = 'PENDING';
    if (amountPaid >= total) {
      status = 'PAID';
    } else if (amountPaid > 0) {
      status = 'PARTIAL';
    }

    // 4. Create Order
    const order = new Order({
      customer: targetUserId,
      items: dbOrderItems,
      pricing: {
        subtotal,
        tax,
        discount: 0,
        total
      },
      payment: {
        amountPaid,
        status,
        method: paymentMethod || (amountPaid > 0 ? 'CASH' : 'PENDING') // Use provided method or default
      }
    });

    const createdOrder = await order.save();

    // 5. Create Transactions (Ledger)
    
    // Debit: The cost of the order (User owes this)
    await Transaction.create({
      user: targetUserId,
      order: createdOrder._id,
      amount: total,
      type: 'DEBIT',
      description: `Order #${createdOrder._id} Charge`
    });

    // Credit: The payment made (User pays this)
    if (amountPaid > 0) {
      await Transaction.create({
        user: targetUserId,
        order: createdOrder._id,
        amount: amountPaid,
        type: 'CREDIT',
        description: `Payment for Order #${createdOrder._id}`
      });
    }

    // 6. Update User Pending Dues
    const pendingAmount = total - amountPaid;
    if (pendingAmount !== 0) {
      const userToUpdate = await User.findById(targetUserId);
      if (userToUpdate) {
        userToUpdate.pendingDues += pendingAmount;
        await userToUpdate.save();
      }
    }

    res.status(201).json(createdOrder);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
export const getOrderById = async (req: any, res: Response) => {
  try {
    const order = await Order.findById(req.params.id).populate('customer', 'name email');

    if (order) {
      // Ensure user can only see their own orders unless manager
      if (req.user.role !== 'MANAGER' && order.customer._id.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Not authorized to view this order' });
      }
      res.json(order);
    } else {
      res.status(404).json({ message: 'Order not found' });
    }
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get logged in user orders
// @route   GET /api/orders/myorders
// @access  Private
export const getMyOrders = async (req: AuthRequest, res: Response) => {
  try {
    const orders = await Order.find({ customer: req.user._id }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all orders
// @route   GET /api/orders
// @access  Private/Manager
export const getOrders = async (req: Request, res: Response) => {
  try {
    const orders = await Order.find({}).populate('customer', 'id name').sort({ createdAt: -1 });
    res.json(orders);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};