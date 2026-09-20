import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { connectDB } from './config/db.js';
import authRoutes from './routes/auth.js';
import reportRoutes from './routes/reports.js';
import userRoutes from './routes/users.js';
import statisticsRoutes from './routes/statistics.js';
import notificationRoutes from './routes/notifications.js';
import activityRoutes from './routes/activity.js';
import contactRoutes from './routes/contact.js';
import analyticsRoutes from './routes/analytics.js';
import User from './models/User.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './swagger.js';
import { globalLimiter } from './middleware/rateLimit.js';

const app = express();
app.set('trust proxy', 1);
const port = process.env.PORT || 5000;
const configuredOrigins = (process.env.CLIENT_URL || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
const allowedOrigins = [...new Set([
  'http://localhost:5173',
  'https://hazardwatch-dagupan.vercel.app',
  ...configuredOrigins,
])];
console.log('[CORS] Allowed origins:', allowedOrigins);
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https://res.cloudinary.com', 'https://tile.openstreetmap.org'],
      connectSrc: ["'self'", ...allowedOrigins, 'https://api.cloudinary.com', 'https://nominatim.openstreetmap.org', 'https://hazardwatch-dagupan.onrender.com'],
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
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error(`CORS origin not allowed: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '2mb' }));
app.use('/api', globalLimiter);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use('/api/auth', authRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/users', userRoutes);
app.use('/api/statistics', statisticsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/analytics', analyticsRoutes);
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