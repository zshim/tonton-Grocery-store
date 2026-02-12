import { Product, User, UserRole, Order, PaymentStatus, PaymentMethod } from './types';

export const TAX_RATE = 0; // 0%

// Manually defined users (Admin, Managers, Specific Customers)
const MANUAL_USERS: User[] = [
  {
    id: 'u1',
    name: 'Admin Manager',
    email: 'admin@store.com',
    phone: '9999999999',
    role: UserRole.MANAGER,
    pendingDues: 0
  },
  {
    id: 'u4',
    name: 'Sarah Connor',
    email: 'sarah@store.com',
    phone: '9999999998',
    role: UserRole.MANAGER,
    pendingDues: 0
  },
  {
    id: 'u5',
    name: 'Mike Ross',
    email: 'mike@store.com',
    phone: '9999999997',
    role: UserRole.MANAGER,
    pendingDues: 0
  },
  {
    id: 'u2',
    name: 'John Doe',
    email: 'john@example.com',
    phone: '1234567890',
    role: UserRole.CUSTOMER,
    pendingDues: 3500.00
  },
  {
    id: 'u3',
    name: 'Jane Smith',
    email: 'jane@example.com',
    phone: '9876543210',
    role: UserRole.CUSTOMER,
    pendingDues: 0
  },
  {
    id: 'u6',
    name: 'Alice Johnson',
    email: 'alice@example.com',
    phone: '9876543211',
    role: UserRole.CUSTOMER,
    pendingDues: 120.50
  },
  {
    id: 'u7',
    name: 'Bob Williams',
    email: 'bob@example.com',
    phone: '9876543212',
    role: UserRole.CUSTOMER,
    pendingDues: 0
  },
  {
    id: 'u8',
    name: 'Charlie Brown',
    email: 'charlie@example.com',
    phone: '9876543213',
    role: UserRole.CUSTOMER,
    pendingDues: 500.00
  },
  {
    id: 'u9',
    name: 'Diana Prince',
    email: 'diana@example.com',
    phone: '9876543214',
    role: UserRole.CUSTOMER,
    pendingDues: 0
  }
];

// Programmatically generate 2000 additional mock customers
const GENERATED_CUSTOMERS: User[] = Array.from({ length: 2000 }, (_, index) => {
  const idSuffix = index + 1000;
  // Generate valid-looking unique phone numbers starting from 7000000000
  const phoneNumber = (7000000000 + index).toString(); 
  
  return {
    id: `gen_u${idSuffix}`,
    name: `Customer ${index + 1}`,
    email: `customer${idSuffix}@demo.store`,
    phone: phoneNumber,
    role: UserRole.CUSTOMER,
    // Randomly assign dues to approx 15% of users
    pendingDues: index % 7 === 0 ? parseFloat((Math.random() * 800 + 50).toFixed(2)) : 0
  };
});

export const MOCK_USERS: User[] = [...MANUAL_USERS, ...GENERATED_CUSTOMERS];

const MANUAL_PRODUCTS: Product[] = [
  {
    id: 'p1',
    name: 'Organic Bananas',
    category: 'Fruits',
    price: 60.00,
    stock: 150,
    unit: 'kg',
    description: 'Fresh, organic bananas sourced directly from local farmers.',
    imageUrl: 'https://picsum.photos/200/200?random=1'
  },
  {
    id: 'p2',
    name: 'Whole Milk',
    category: 'Dairy',
    price: 75.00,
    stock: 40,
    unit: 'liter',
    description: 'Creamy and nutritious whole milk, rich in calcium.',
    imageUrl: 'https://picsum.photos/200/200?random=2'
  },
  {
    id: 'p3',
    name: 'Sourdough Bread',
    category: 'Bakery',
    price: 120.00,
    stock: 25,
    unit: 'loaf',
    description: 'Artisanal sourdough bread with a perfect crust.',
    imageUrl: 'https://picsum.photos/200/200?random=3'
  },
  {
    id: 'p4',
    name: 'Basmati Rice',
    category: 'Grains',
    price: 850.00,
    stock: 50,
    unit: 'bag',
    description: 'Premium aged Basmati rice, perfect for biryanis.',
    imageUrl: 'https://picsum.photos/200/200?random=4'
  },
  {
    id: 'p5',
    name: 'Cheddar Cheese',
    category: 'Dairy',
    price: 450.00,
    stock: 30,
    unit: 'block',
    description: 'Sharp cheddar cheese aged for 12 months.',
    imageUrl: 'https://picsum.photos/200/200?random=5'
  }
];

// Helper to generate consistent mock data
const CATEGORIES = [
  "Fruits", "Vegetables", "Dairy & Milk", "Bakery", "Eggs & Meat", 
  "Grains & Rice", "Spices & Masalas", "Oil & Ghee", "Snacks & Chips", 
  "Beverages", "Instant Food", "Household", "Personal Care", 
  "Baby Care", "Pet Food", "Frozen Food", "Health & Wellness"
];

const GENERATED_PRODUCTS: Product[] = Array.from({ length: 3000 }, (_, index) => {
  const category = CATEGORIES[index % CATEGORIES.length];
  const idSuffix = index + 1000;
  
  // Random price between 10 and 2000
  const price = Math.floor(Math.random() * 1990) + 10;
  
  // Random stock between 0 and 200
  const stock = Math.floor(Math.random() * 201);
  
  // Determine unit based on category approximation
  let unit = 'pc';
  if (['Fruits', 'Vegetables', 'Grains & Rice'].includes(category)) unit = 'kg';
  if (['Dairy & Milk', 'Beverages', 'Oil & Ghee'].includes(category)) unit = 'liter';
  if (['Snacks & Chips', 'Spices & Masalas', 'Frozen Food'].includes(category)) unit = 'pack';

  return {
    id: `gen_p${idSuffix}`,
    name: `${category.split(' ')[0]} Item ${idSuffix}`,
    category: category,
    price: price,
    stock: stock,
    unit: unit,
    description: `High quality ${category.toLowerCase()} item number ${idSuffix}.`,
    imageUrl: `https://picsum.photos/200/200?random=${idSuffix}`
  };
});

export const MOCK_PRODUCTS: Product[] = [...MANUAL_PRODUCTS, ...GENERATED_PRODUCTS];

export const MOCK_ORDERS: Order[] = [
  {
    id: 'o1',
    customerId: 'u2',
    customerName: 'John Doe',
    items: [
      { ...MANUAL_PRODUCTS[0], quantity: 2 },
      { ...MANUAL_PRODUCTS[2], quantity: 1 }
    ],
    subtotal: 240.00,
    tax: 0,
    discount: 0,
    total: 240.00,
    amountPaid: 240.00,
    status: PaymentStatus.PAID,
    paymentMethod: PaymentMethod.CASH,
    date: new Date(Date.now() - 86400000 * 2).toISOString() // 2 days ago
  },
  {
    id: 'o2',
    customerId: 'u2',
    customerName: 'John Doe',
    items: [
      { ...MANUAL_PRODUCTS[3], quantity: 1 }
    ],
    subtotal: 850.00,
    tax: 0,
    discount: 0,
    total: 850.00,
    amountPaid: 0,
    status: PaymentStatus.PENDING,
    paymentMethod: PaymentMethod.NA,
    date: new Date(Date.now() - 86400000 * 5).toISOString() // 5 days ago
  }
];