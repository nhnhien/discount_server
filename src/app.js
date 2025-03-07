import express from 'express';
import cors from 'cors';
import userRouter from './router/user.js';
import productRouter from './router/product.js';
import uploadRouter from './router/upload.js';
import marketRouter from './router/market.js';
import categoryRouter from './router/category.js';

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

app.use('/api/user', userRouter);
app.use('/api/product', productRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/market', marketRouter);
app.use('/api/category', categoryRouter);

export default app;