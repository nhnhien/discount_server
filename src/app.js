import express from 'express';
import cors from 'cors';
import authRouter from './router/auth.js';
import userRouter from './router/user.js';
import productRouter from './router/product.js';
import uploadRouter from './router/upload.js';
import marketRouter from './router/market.js';
import categoryRouter from './router/category.js';
import discountRouter from './router/discount.js';
import cpRouter from './router/cp.js';
import priceHistoryRouter from './router/priceHistory.js';
import qbRouter from './router/qb.js';
import cartRouter from './router/cart.js';
import orderRouter from './router/order.js';
import addressRouter from './router/address.js';
import paymentRouter from './router/payment.js';

const app = express();

app.use(express.json());

app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

//Routes

app.use('/api/auth', authRouter);
app.use('/api/user', userRouter);
app.use('/api/product', productRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/market', marketRouter);
app.use('/api/category', categoryRouter);
app.use('/api/discount', discountRouter);
app.use('/api/cp', cpRouter);
app.use('/api/price-history', priceHistoryRouter);
app.use('/api/qb', qbRouter);
app.use('/api/cart', cartRouter);
app.use('/api/order', orderRouter);
app.use('/api/address', addressRouter);
app.use('/api/payment', paymentRouter);

export default app;