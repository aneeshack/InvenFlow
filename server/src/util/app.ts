import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv'
import cookieParser from 'cookie-parser';
import morgan from "morgan";
import { errorHandler } from '../middlewares/errorMiddleware';
import helmet from 'helmet';
import authRoutes from '../routes/authRoutes'
import itemRoutes from '../routes/itemRoutes'
import reportRoutes from '../routes/reportRoutes'
import customerRoutes from '../routes/customerRoutes'
import salesRoutes from '../routes/salesRoutes'
dotenv.config();


const app = express();
app.use(helmet()); 

app.use(morgan("dev"));


const corsOptions = {
  origin: process.env.FRONTEND_URL,
  methods: 'GET, HEAD, PUT, POST, PATCH, DELETE',
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use('/',authRoutes)
app.use('/item',itemRoutes)
app.use('/sales',salesRoutes)
app.use('/report',reportRoutes)
app.use('/customer',customerRoutes)

app.use(errorHandler)

export default app;