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
 
dotenv.config();
const app = express();
const port = process.env.PORT || 3000;

//middlewares 
app.use(express.json());
app.use(cookieParser())
 
//routes
app.use("/api/auth",authRoutes)
app.use("/api/product",productRoutes)
app.use("/api/cart", cartRoutes)
app.use("/api/coupons",couponRoutes)
app.use("/api/payments",paymentRoutes)
app.use("/api/analytics",analyticsRoutes)



app.listen(port,() => {
    
    console.log(` Server is running on http://localhost:${port}`);
    connectDB()
});
