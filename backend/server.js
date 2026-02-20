const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Статическая раздача загруженных файлов
const uploadsPath = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
}
app.use('/uploads', express.static(uploadsPath));
console.log('📁 Static files served from /uploads');

// Логирование запросов в dev режиме
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });
}

// Import all routes dynamically
const routesPath = path.join(__dirname, 'routes');
if (fs.existsSync(routesPath)) {
  const routeFiles = fs.readdirSync(routesPath).filter(file => file.endsWith('.js'));
  routeFiles.forEach(file => {
    const routeName = file.replace('.js', '');
    const route = require(path.join(routesPath, file));
    app.use(`/api/${routeName}`, route);
    console.log(`✅ Loaded route: /api/${routeName}`);
  });
}

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// API info endpoint
app.get('/api', (req, res) => {
  res.json({
    message: 'API is running',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      api: '/api/*',
    },
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: `Not Found - ${req.path}` });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!', error: err.message });
});

app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📊 Database: ${process.env.DB_NAME || 'test_entities_db'}`);
});
