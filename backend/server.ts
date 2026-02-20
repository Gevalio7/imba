import cors from 'cors';
import 'dotenv/config';
import express, { Application, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { errorHandler, notFound } from './middleware/errorHandler';

const app: Application = express();
const PORT: string | number = process.env.PORT || 3000;

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
console.log(`📁 Static files served from /uploads`);

// Логирование запросов в dev режиме
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });
}

// Import all routes dynamically
const routesPath = path.join(__dirname, 'routes');
console.log(`🔍 Looking for routes in: ${routesPath}`);
if (fs.existsSync(routesPath)) {
  const routeFiles = fs.readdirSync(routesPath).filter(file => file.endsWith('.js'));
  console.log(`📁 Found ${routeFiles.length} route files`);
  routeFiles.forEach(file => {
    const routeName = file.replace('.js', '');
    const route = require(path.join(routesPath, file));
    app.use(`/api/${routeName}`, route);
    console.log(`✅ Loaded route: /api/${routeName}`);
  });
} else {
  console.log(`❌ Routes directory not found: ${routesPath}`);
}

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ 
    status: 'OK', 
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// API info endpoint
app.get('/api', (req: Request, res: Response) => {
  res.json({
    message: 'API is running',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      api: '/api/*',
    },
  });
});

// 404 handler - должен быть перед error handler
app.use(notFound);

// Error handling middleware - должен быть последним
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📊 Database: ${process.env.DB_NAME || 'test_entities_db'}`);
});
