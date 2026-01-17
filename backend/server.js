const express = require('express');
const cors = require('cors');
const { initializeDatabase } = require('./init-db');
const testEntitiesRouter = require('./routes/testEntities');

// Add global error handlers for debugging
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception in backend:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection in backend at:', promise, 'reason:', reason);
});

console.log('Backend server.js starting...');

const app = express();

app.use(cors());
app.use(express.json());
app.use('/api/apps/test-entities', testEntitiesRouter);

// Mock route for priorities
app.get('/api/priorities', (req, res) => {
  res.json([
    {
      id: 1,
      name: 'Высокий',
      color: '#dc3545',
      createdAt: '2023-01-01T00:00:00Z',
      updatedAt: '2023-01-01T00:00:00Z',
      status: 1,
      isActive: true
    },
    {
      id: 2,
      name: 'Средний',
      color: '#ffc107',
      createdAt: '2023-01-02T00:00:00Z',
      updatedAt: '2023-01-02T00:00:00Z',
      status: 1,
      isActive: true
    },
    {
      id: 3,
      name: 'Низкий',
      color: '#28a745',
      createdAt: '2023-01-03T00:00:00Z',
      updatedAt: '2023-01-03T00:00:00Z',
      status: 1,
      isActive: true
    }
  ]);
});

(async () => {
  try {
    console.log('Starting database initialization...');
    await initializeDatabase();
    console.log('Database initialized successfully.');

    app.listen(3000, () => {
      console.log('Server is running on port 3000');
    });
  } catch (error) {
    console.error('Error during server startup:', error);
    process.exit(1);
  }
})();
