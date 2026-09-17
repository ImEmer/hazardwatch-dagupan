import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { connectDB } from './config/db.js';
import authRoutes from './routes/auth.js';
import reportRoutes from './routes/reports.js';
import userRoutes from './routes/users.js';
import statisticsRoutes from './routes/statistics.js';
import notificationRoutes from './routes/notifications.js';
import activityRoutes from './routes/activity.js';
import contactRoutes from './routes/contact.js';
import User from './models/User.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';

const app = express();
const port = process.env.PORT || 5000;
const apiOrigin = process.env.CLIENT_URL || 'https://hazardwatch-dagupan.onrender.com';
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https://res.cloudinary.com', 'https://tile.openstreetmap.org'],
      connectSrc: ["'self'", 'https://api.cloudinary.com', 'https://nominatim.openstreetmap.org', apiOrigin, 'https://hazardwatch-dagupan.vercel.app'],
      fontSrc: ["'self'", 'data:'],
      frameAncestors: ["'none'"],
    },
  },
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  frameguard: { action: 'deny' },
  noSniff: true,
  xssFilter: true,
}));


app.use(cors({
  origin: [
    'https://hazardwatch-dagupan.vercel.app',
    'http://localhost:5173',
    'https://hazardwatch-dagupan.onrender.com'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '2mb' }));
app.use('/api/auth', rateLimit({ windowMs: 15 * 60 * 1000, limit: 100 }), authRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/users', userRoutes);
app.use('/api/statistics', statisticsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/contact', contactRoutes);
app.get('/api/health', (req, res) => res.json({ success: true, service: 'hazardwatch-api' }));
app.use(notFound);
app.use(errorHandler);

connectDB().then(async () => {
  if (!await User.exists({ role: 'superadmin', status: { $ne: 'deleted' } })) {
    console.warn('WARNING: No active superadmin account exists in the database.');
  }
  app.listen(port, () => console.log(`HazardWatch API listening on port ${port}`));
}).catch((error) => {
  console.error('Unable to start API:', error.message);
  process.exit(1);
});