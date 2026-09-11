import express from 'express';
import cors from 'cors';
import bookingsRouter from './routes/bookings.js';
import farmersRouter from './routes/farmers.js';
import queuesRouter from './routes/queues.js';
import notificationsRouter from './routes/notifications.js';
import adminRouter from './routes/admin.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Request logger for debugging
app.use((req, res, next) => {
  console.log(`[API] ${req.method} ${req.url}`);
  next();
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'KisanX Backend API & SQLite Database are running',
    timestamp: new Date().toISOString(),
    database: 'SQLite (node:sqlite)'
  });
});

// Mount Routes
app.use('/api/bookings', bookingsRouter);
app.use('/api/farmers', farmersRouter);
app.use('/api/queues', queuesRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/admin', adminRouter);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Server Error]', err);
  res.status(500).json({ success: false, error: err.message || 'Internal server error' });
});

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 KisanX Backend API Server running on http://localhost:${PORT}`);
});
