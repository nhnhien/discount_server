import express from 'express';
import cors from 'cors';
import userRouter from './router/user.js';
import productRouter from './router/product.js';
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

export default app;