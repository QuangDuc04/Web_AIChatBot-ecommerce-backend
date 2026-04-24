import 'reflect-metadata';
import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { AppDataSource } from './config/database';
import routes from './routes';
import { errorHandler } from './middlewares/error.middleware';
import { apiLimiter } from './middlewares/rateLimiter.middleware';
import { setupSocketServer } from './sockets';
import { startExpiredConfirmationJob } from './jobs/expiredConfirmation.job';
import { startChatKnowledgeCleanupJob } from './jobs/chatKnowledgeCleanup.job';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 5000;

// Trust reverse proxy (Nginx / Cloudflare) so req.ip reflects the real client IP.
// Without this, IP-based rate-limits see the proxy IP and treat all traffic as
// one caller. TRUST_PROXY should be an integer (hop count) or 'true' in prod.
const trustProxy = process.env.TRUST_PROXY;
if (trustProxy) {
  const asNumber = Number(trustProxy);
  app.set('trust proxy', Number.isFinite(asNumber) ? asNumber : trustProxy === 'true');
}

// Middleware
app.use(helmet());
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:3000')
  .split(',')
  .map((o) => o.trim());

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: origin ${origin} không được phép`));
  },
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
app.use('/api', apiLimiter);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api', routes);

// Error handler (must be last)
app.use(errorHandler);

// Database connection & server start
AppDataSource.initialize()
  .then(() => {
    console.log('Database connected successfully');

    // Setup Socket.IO
    const io = setupSocketServer(httpServer);
    app.set('io', io);

    // Start background jobs
    startExpiredConfirmationJob();
    startChatKnowledgeCleanupJob();

    httpServer.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`API: http://localhost:${PORT}/api`);
      console.log(`Socket.IO: ws://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Database connection failed:', error);
    process.exit(1);
  });

export default app;
