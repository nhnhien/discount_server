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
import priceComparisonRouter from './router/priceComparison.js'; // Add the new router
import shippingFeeRouter from './router/shippingFee.js';
import helmet from 'helmet';

const app = express();


app.use(express.json());

app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'"],
      imgSrc: ["'self'", "data:"],
    },
  })
);


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
app.use('/api/price-comparison', priceComparisonRouter); 
app.use('/api/shipping-fees', shippingFeeRouter);

export default app;
