import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes';
import { connectRedis } from './configs/redis';
import { ResponseUtil } from './utils/responseUtils';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Status check endpoint
app.get('/status', (req: Request, res: Response) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'HRIS Backend is running',
    timestamp: new Date().toISOString()
  });
});

// Routes
app.use('/api/auth', authRoutes);

// 404 handler
app.use((req, res, next) => {
  res.status(404).json(ResponseUtil.error('404 Not Found'));
});

// global error handler
app.use((err: any, req: any, res: any, next: any) => {
  console.error(err.stack);
  res.status(500).json(ResponseUtil.error('Internal Server Error'));
});

(async () => {
  try {
    await connectRedis();
  } catch (e) {
    console.error('Failed to connect to Redis:', e);
  }

  app.listen(PORT as number, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
})();