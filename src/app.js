import express from 'express'
import cors from 'cors'
const app = express()
app.use(express.json());
app.use(
  cors({
     origin: '*',  
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
export default app;