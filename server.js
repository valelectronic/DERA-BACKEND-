import express from 'express';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes.js';
import cartRoutes from './routes/cart.routes.js';
import productRoutes from './routes/product.routes.js';
import couponRoutes from './routes/coupon.routes.js';
import paymentRoutes from './routes/payment.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';
import { connectDB } from './lib/db.js';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import verifyPaymentRoutes from './routes/verifyPayment.routes.js';
dotenv.config();
const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json({ limit: "10mb" }));
app.use(cookieParser());
app.use(cors({
  origin: ["http://localhost:5173", "https://dera-frontend.vercel.app"],
  credentials: true,
}));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/product", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/verifyPayment", verifyPaymentRoutes);



app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK' });
});

app.get("/", (req, res) => {
  res.send("SOPHY E-SHOP API is running!..........");
});

// Connect DB first, then start server
connectDB().then(() => {
  app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
  });
});
