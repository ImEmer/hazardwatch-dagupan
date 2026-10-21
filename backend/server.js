import 'dotenv/config';
import http from 'http';
import crypto from 'crypto';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import jwt from 'jsonwebtoken';
import { Server } from 'socket.io';
import { setActivitySocketServer } from './utils/logActivity.js';
import { connectDB } from './config/db.js';
import authRoutes from './routes/auth.js';
import reportRoutes from './routes/reports.js';
import userRoutes from './routes/users.js';
import statisticsRoutes from './routes/statistics.js';
import activityRoutes from './routes/activity.js';
import contactRoutes from './routes/contact.js';
import analyticsRoutes from './routes/analytics.js';
import notificationRoutes from './routes/notifications.js';
import systemRoutes from './routes/system.js';
import User from './models/User.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './swagger.js';
import { globalLimiter } from './middleware/rateLimit.js';
import cron from 'node-cron';
import { runBackup } from './scripts/backup.js';
import TokenBlacklist from './models/TokenBlacklist.js';
import { enforceMaintenanceMode } from './middleware/maintenance.js';

const app = express();
const server = http.createServer(app);
app.set('trust proxy', 1);
const port = process.env.PORT || 5000;
const configuredOrigins = (process.env.CLIENT_URL || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
const allowedOrigins = [...new Set([
  'http://localhost:5173',
  'http://localhost:4173',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:4173',
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
      imgSrc: ["'self'", 'data:', 'https://res.cloudinary.com', 'https://tile.openstreetmap.org', 'https://server.arcgisonline.com', 'https://tile.opentopomap.org'],
      connectSrc: ["'self'", ...allowedOrigins, `http://localhost:${port}`, `http://127.0.0.1:${port}`, 'https://api.cloudinary.com', 'https://nominatim.openstreetmap.org', 'https://hazardwatch-dagupan.onrender.com', 'https://server.arcgisonline.com', 'https://tile.opentopomap.org'],
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


const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error(`CORS origin not allowed: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
app.options('/*splat', cors(corsOptions));

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});
setActivitySocketServer(io);
console.log('[socket] Socket.IO initialized');

io.use(async (socket, next) => {
  const token = socket.handshake.auth?.token;
  if (typeof token !== 'string' || !token) {
    socket.data.user = null;
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.purpose || !decoded.id) return next(new Error('A full access token is required.'));

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    if (await TokenBlacklist.exists({ token: tokenHash })) return next(new Error('Token has been revoked.'));

    const user = await User.findById(decoded.id).select('_id role barangay authVersion isActive');
    if (!user || !user.isActive || (decoded.authVersion || 0) !== (user.authVersion || 0)) {
      return next(new Error('User is inactive or the session has been revoked.'));
    }

    socket.data.user = user;
    next();
  } catch {
    next(new Error('Authentication failed.'));
  }
});

io.on('connection', (socket) => {
  const { role, barangay } = socket.data.user || {};
  if (role === 'admin' || role === 'superadmin') {
    socket.join('room:admin');
    if (role === 'superadmin') socket.join('room:superadmin');
    console.log(`[socket] ${role} joined room:admin`);
  }
  if (role === 'barangay' && barangay) {
    socket.join(`room:barangay:${barangay}`);
    console.log(`[socket] barangay joined room:barangay:${barangay}`);
  }
});
app.set('io', io);

app.use(express.json({ limit: '2mb' }));
app.use('/api', globalLimiter);
app.use('/api', enforceMaintenanceMode);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use('/api/auth', authRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/users', userRoutes);
app.use('/api/statistics', statisticsRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/system', systemRoutes);
app.get('/api/health', (req, res) => res.json({ success: true, service: 'hazardwatch-api' }));
app.use(notFound);
app.use(errorHandler);

connectDB().then(async () => {
  if (!await User.exists({ role: 'superadmin', status: { $ne: 'deleted' } })) {
    console.warn('WARNING: No active superadmin account exists in the database.');
  }
  if (process.env.BACKUP_CRON_ENABLED === 'true') {
    const backupConfigPresent = ['B2_KEY_ID', 'B2_APP_KEY', 'B2_BUCKET_ID'].every((key) => process.env[key]);
    if (!backupConfigPresent) {
      console.warn('[backup] Cron is enabled but Backblaze credentials are incomplete.');
    } else {
      const schedule = process.env.BACKUP_CRON_SCHEDULE || '0 2 * * *';
      cron.schedule(schedule, () => runBackup().catch(() => {}), { timezone: process.env.BACKUP_TIMEZONE || 'UTC' });
      console.log(`[backup] Daily backup scheduled: ${schedule} (${process.env.BACKUP_TIMEZONE || 'UTC'}).`);
    }
  }
  server.listen(port, () => console.log(`HazardWatch API listening on port ${port}`));
}).catch((error) => {
  console.error('Unable to start API:', error.message);
  process.exit(1);
});