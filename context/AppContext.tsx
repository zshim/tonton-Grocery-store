import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { User, Product, Order, CartItem, UserRole, PaymentStatus, Transaction, Notification, TransactionType, NotificationType, PaymentMethod } from '../types';
import { MOCK_USERS, MOCK_PRODUCTS, MOCK_ORDERS, TAX_RATE } from '../constants';
import { supabase } from '../services/supabaseClient';

interface AppContextType {
  user: User | null;
  products: Product[];
  orders: Order[];
  cart: CartItem[];
  users: User[];
  transactions: Transaction[];
  notifications: Notification[];
  loginWithPhone: (phone: string) => boolean;
  logout: () => void;
  register: (name: string, phone: string, role: UserRole) => void;
  sendOtp: (phone: string) => Promise<boolean>;
  verifyOtp: (phone: string, otp: string) => Promise<boolean>;
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateCartQuantity: (productId: string, delta: number) => void;
  clearCart: () => void;
  placeOrder: (amountPaid: number, paymentMethod: PaymentMethod, customerId?: string) => void;
  addProduct: (product: Product) => void;
  payDues: (amount: number, paymentMethod: PaymentMethod) => void;
  markNotificationRead: (id: string) => void;
  sendReminders: (message: string) => number;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Mock Data Extension
const MOCK_TRANSACTIONS: Transaction[] = [
  { id: 't1', userId: 'u2', amount: 6.91, type: TransactionType.DEBIT, description: 'Order #o1 Charge', date: new Date(Date.now() - 86400000 * 2).toISOString() },
  { id: 't2', userId: 'u2', amount: 6.91, type: TransactionType.CREDIT, description: 'Payment for Order #o1', paymentMethod: PaymentMethod.CASH, date: new Date(Date.now() - 86400000 * 2).toISOString() },
  { id: 't3', userId: 'u2', amount: 12.96, type: TransactionType.DEBIT, description: 'Order #o2 Charge', date: new Date(Date.now() - 86400000 * 5).toISOString() },
];

const MOCK_NOTIFICATIONS: Notification[] = [
  { id: 'n1', userId: 'u2', title: 'Payment Reminder', message: 'You have pending dues of ₹12.96. Please clear them soon.', type: NotificationType.REMINDER, isRead: false, date: new Date().toISOString() },
  { id: 'n2', userId: 'u2', title: 'Welcome!', message: 'Welcome to SmartGrocer AI.', type: NotificationType.SYSTEM, isRead: true, date: new Date(Date.now() - 100000000).toISOString() },
];

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [products, setProducts] = useState<Product[]>(MOCK_PRODUCTS);
  const [orders, setOrders] = useState<Order[]>(MOCK_ORDERS);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [users, setUsers] = useState<User[]>(MOCK_USERS);
  const [transactions, setTransactions] = useState<Transaction[]>(MOCK_TRANSACTIONS);
  const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS);

  // Fetch Orders from Supabase on load
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          // If table doesn't exist (PGRST205) or connection fails, strictly log warning and keep MOCK_ORDERS
          if (error.code === 'PGRST205') {
             console.warn("Supabase 'orders' table not found. Using local mock data. Please run the setup SQL script.");
          } else {
             console.error('Supabase Fetch Error:', error.message);
          }
          return;
        }

        if (data && data.length > 0) {
          const mappedOrders: Order[] = data.map((o: any) => ({
            id: o.id?.toString() || `o_${Math.random()}`,
            customerId: o.customer_id,
            customerName: o.customer_name,
            items: o.items || [], // Assumes JSONB
            subtotal: o.subtotal,
            tax: o.tax,
            discount: o.discount || 0,
            total: o.total,
            amountPaid: o.amount_paid,
            status: o.status as PaymentStatus,
            paymentMethod: o.payment_method as PaymentMethod,
            date: o.created_at
          }));
          setOrders(mappedOrders);
        }
      } catch (err) {
        console.error('Failed to connect to Supabase. Using mock data.', err);
      }
    };

    fetchOrders();
  }, []);

  // Auth Functions
  const sendOtp = async (phone: string): Promise<boolean> => {
    // Simulate API call delay
    return new Promise(resolve => {
      setTimeout(() => {
        console.log(`OTP sent to ${phone}: 123456`);
        resolve(true);
      }, 1000);
    });
  };

  const verifyOtp = async (phone: string, otp: string): Promise<boolean> => {
    // Simulate API verification
    return new Promise(resolve => {
      setTimeout(() => {
        // Mock OTP is always 123456
        resolve(otp === '123456');
      }, 800);
    });
  };

  const loginWithPhone = (phone: string): boolean => {
    const foundUser = users.find(u => u.phone === phone);
    if (foundUser) {
      setUser(foundUser);
      return true;
    }
    return false;
  };

  const register = (name: string, phone: string, role: UserRole) => {
    const newUser: User = {
      id: `u${Date.now()}`,
      name,
      phone,
      role,
      pendingDues: 0,
      email: `${name.toLowerCase().replace(' ', '')}@example.com` // Auto-generate placeholder email
    };
    setUsers([...users, newUser]);
    setUser(newUser);
  };

  const logout = () => {
    setUser(null);
    setCart([]);
  };

  // Cart & Order Logic
  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.id !== productId));
  };

  const updateCartQuantity = (productId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === productId) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const clearCart = () => setCart([]);

  const placeOrder = async (amountPaid: number, paymentMethod: PaymentMethod, customerId?: string) => {
    const targetUserId = customerId || user?.id;
    const targetUser = users.find(u => u.id === targetUserId);
    
    if (!targetUser) return;

    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = subtotal * TAX_RATE;
    const total = subtotal + tax;
    
    let status = PaymentStatus.PENDING;
    if (amountPaid >= total) status = PaymentStatus.PAID;
    else if (amountPaid > 0) status = PaymentStatus.PARTIAL;

    const orderDate = new Date().toISOString();

    const newOrder: Order = {
      id: `o${Date.now()}`, // Temporary local ID
      customerId: targetUser.id,
      customerName: targetUser.name,
      items: [...cart],
      subtotal,
      tax,
      discount: 0,
      total,
      amountPaid,
      status,
      paymentMethod: amountPaid > 0 ? paymentMethod : PaymentMethod.NA,
      date: orderDate
    };

    // 1. Optimistic UI Update
    setOrders(prev => [newOrder, ...prev]);

    // 2. Send to Supabase
    try {
      const { data, error } = await supabase.from('orders').insert([{
        customer_id: newOrder.customerId,
        customer_name: newOrder.customerName,
        items: newOrder.items,
        subtotal: newOrder.subtotal,
        tax: newOrder.tax,
        discount: newOrder.discount,
        total: newOrder.total,
        amount_paid: newOrder.amountPaid,
        status: newOrder.status,
        payment_method: newOrder.paymentMethod,
        created_at: newOrder.date
      }]).select(); // Select to return the inserted row including generated ID

      if (error) {
        console.error("Supabase Insert Error:", error.message);
        if (error.code === 'PGRST205') {
            alert("Database Error: 'orders' table not found. Please contact administrator.");
        }
      } else if (data && data[0]) {
        console.log("Order saved to Supabase successfully.");
        // Optional: Update local order ID with Supabase ID
        // setOrders(prev => prev.map(o => o.id === newOrder.id ? { ...o, id: data[0].id.toString() } : o));
      }
    } catch (err) {
      console.error("Supabase Exception:", err);
    }

    // Record Transactions (Local Mock Logic - Ideally move this to Supabase transactions table too)
    const debitTx: Transaction = {
      id: `t${Date.now()}_d`,
      userId: targetUser.id,
      orderId: newOrder.id,
      amount: total,
      type: TransactionType.DEBIT,
      description: `Order #${newOrder.id} Charge`,
      date: orderDate
    };
    
    const newTransactions = [debitTx];

    if (amountPaid > 0) {
      newTransactions.push({
        id: `t${Date.now()}_c`,
        userId: targetUser.id,
        orderId: newOrder.id,
        amount: amountPaid,
        type: TransactionType.CREDIT,
        description: `Payment for Order #${newOrder.id}`,
        paymentMethod,
        date: orderDate
      });
    }

    setTransactions(prev => [...newTransactions, ...prev]);
    
    // Update Dues
    if (status !== PaymentStatus.PAID) {
        const due = total - amountPaid;
        setUsers(prev => prev.map(u => u.id === targetUser.id ? { ...u, pendingDues: u.pendingDues + due } : u));
        if (user && user.id === targetUser.id) {
           setUser(prev => prev ? { ...prev, pendingDues: prev.pendingDues + due } : null);
        }
    }

    clearCart();
  };

  const addProduct = (product: Product) => {
    setProducts(prev => [...prev, product]);
  };

  const payDues = (amount: number, paymentMethod: PaymentMethod) => {
    if (!user) return;
    
    const creditTx: Transaction = {
        id: `t${Date.now()}_pay`,
        userId: user.id,
        amount: amount,
        type: TransactionType.CREDIT,
        description: 'Dues Payment',
        paymentMethod,
        date: new Date().toISOString()
    };

    setTransactions(prev => [creditTx, ...prev]);
    
    setUsers(prev => prev.map(u => u.id === user.id ? { ...u, pendingDues: u.pendingDues - amount } : u));
    setUser(prev => prev ? { ...prev, pendingDues: prev.pendingDues - amount } : null);
  };

  const markNotificationRead = (id: string) => {
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const sendReminders = (message: string) => {
    const debtors = users.filter(u => u.pendingDues > 0 && u.role === UserRole.CUSTOMER);
    const newNotes: Notification[] = debtors.map(u => ({
      id: `n${Date.now()}_${u.id}`,
      userId: u.id,
      title: 'Payment Reminder',
      message: message || `Reminder: You have pending dues of ₹${u.pendingDues.toFixed(2)}. Please clear them soon.`,
      type: NotificationType.REMINDER,
      isRead: false,
      date: new Date().toISOString()
    }));
    
    setNotifications(prev => [...newNotes, ...prev]);
    return debtors.length;
  };

  return (
    <AppContext.Provider value={{
      user,
      products,
      orders,
      cart,
      users,
      transactions,
      notifications,
      loginWithPhone,
      logout,
      register,
      sendOtp,
      verifyOtp,
      addToCart,
      removeFromCart,
      updateCartQuantity,
      clearCart,
      placeOrder,
      addProduct,
      payDues,
      markNotificationRead,
      sendReminders
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within AppProvider");
  return context;
};