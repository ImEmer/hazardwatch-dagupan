import 'dotenv/config';
import fs from 'fs';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { connectDB } from './config/db.js';
import authRoutes from './routes/auth.js';
import reportRoutes from './routes/reports.js';
import userRoutes from './routes/users.js';
import statisticsRoutes from './routes/statistics.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';

const app = express();
const port = process.env.PORT || 5000;
fs.mkdirSync('uploads', { recursive: true });

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json({ limit: '2mb' }));
app.use('/uploads', express.static('uploads'));
app.use('/api/auth', rateLimit({ windowMs: 15 * 60 * 1000, limit: 100 }), authRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/users', userRoutes);
app.use('/api/statistics', statisticsRoutes);
app.get('/api/health', (req, res) => res.json({ success: true, service: 'hazardwatch-api' }));
app.use(notFound);
app.use(errorHandler);

connectDB().then(() => app.listen(port, () => console.log(`HazardWatch API listening on port ${port}`))).catch((error) => {
  console.error('Unable to start API:', error.message);
  process.exit(1);
});
