require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profile');
const farmerRoutes = require('./routes/farmer');
const processorRoutes = require('./routes/processor');
const distributorRoutes = require('./routes/distributor');
const retailerRoutes = require('./routes/retailer');
const paymentRoutes = require('./routes/payments');
const orderRoutes = require('./routes/orders');
const walletRoutes = require('./routes/wallet');
const notificationRoutes = require('./routes/notifications');
const { handleDbError } = require('./utils/errorHandler');

const app = express();

const allowedOrigins = process.env.FRONTEND_URL 
  ? process.env.FRONTEND_URL.split(',').map(url => url.trim())
  : ['http://localhost:3000', 'http://localhost:3001'];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json({ limit: '10mb' })); // increased limit for base64 images

// Auth, Profile & Payments routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/payments', paymentRoutes);


// Supply chain role routes
app.use('/api/v1/farmer', farmerRoutes);
app.use('/api/v1/processor', processorRoutes);
app.use('/api/v1/distributor', distributorRoutes);
app.use('/api/v1/retailer', retailerRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/wallet', walletRoutes);
app.use('/api/v1/notifications', notificationRoutes);

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));

const { startNotificationCleanup } = require('./utils/cleanup');

// Global Error Handler
app.use((err, req, res, next) => {
  return handleDbError(err, res);
});

const PORT = process.env.PORT || 5000;
// Only listen if not running in test mode
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    // Start background tasks
    startNotificationCleanup();
  });
}

module.exports = app;

