import express from 'express';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import authRoutes from './routes/authRoutes';
import productRoutes from './routes/productRoutes';
import orderRoutes from './routes/orderRoutes';
import transactionRoutes from './routes/transactionRoutes';
import notificationRoutes from './routes/notificationRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
import { errorHandler } from './middleware/errorMiddleware';

// Fix for TypeScript errors regarding 'require' and 'module'
declare const require: any;
declare const module: any;

dotenv.config();

const app = express();

// 1. Security Headers
app.use(helmet());

// 2. Data Sanitization (Prevent NoSQL Injection)
app.use(mongoSanitize());

// 3. Rate Limiting (Prevent Brute Force/DDoS)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again after 15 minutes'
});
app.use('/api', limiter);

// 4. CORS Config for Production
const corsOptions = {
  origin: process.env.CLIENT_URL || '*', // In production, replace '*' with specific domain
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Middleware
app.use(express.json()); // Parse JSON bodies

// Database Connection (Optimized for Serverless)
let isConnected = false;
const connectDB = async () => {
  if (isConnected) return;
  
  if (mongoose.connection.readyState === 1) {
    isConnected = true;
    return;
  }

  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || '');
    isConnected = true;
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error: any) {
    console.error(`Error: ${error.message}`);
    // Do not exit process in serverless; let the request fail gracefully
  }
};

// Middleware to ensure DB is connected for every request
app.use(async (req, res, next) => {
  await connectDB();
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Base route
app.get('/', (req, res) => {
  res.send('SmartGrocer AI API is running...');
});

// Error Handling (Must be last middleware)
app.use(errorHandler);

// Only listen if running directly (Dev mode), otherwise export for Vercel
// We check if require is defined to ensure it doesn't crash in strict ESM environments
if (typeof require !== 'undefined' && require.main === module) {
  const PORT = process.env.PORT || 5000;
  connectDB().then(() => {
    app.listen(PORT, () => {
      console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
    });
  });
}

export default app;