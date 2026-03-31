const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Импорт функции очистки бэкапов
const { cleanupOldBackups } = require('./controllers/backupController');

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

// ========== CRON ДЛЯ АВТОМАТИЧЕСКОГО СОЗДАНИЯ ТИКЕТОВ ==========
const TicketSchedules = require('./models/ticketSchedules');
const Tickets = require('./models/tickets');

// Функция для выполнения просроченных расписаний
const processDueSchedules = async () => {
  try {
    console.log('🔄 Проверка расписаний тикетов...');
    const dueSchedules = await TicketSchedules.getDueSchedules();
    
    if (dueSchedules.length > 0) {
      console.log(`📋 Найдено ${dueSchedules.length} расписаний для выполнения`);
      
      for (const schedule of dueSchedules) {
        try {
          // Создаём новый тикет
          const ticketNumber = await Tickets.generateTicketNumber();
          const newTicket = await Tickets.create({
            ticketNumber,
            title: schedule.title,
            description: schedule.description,
            typeId: schedule.typeId,
            categoryId: schedule.categoryId,
            priorityId: schedule.priorityId,
            queueId: schedule.queueId,
            stateId: schedule.stateId,
            ownerId: schedule.ownerId,
            executorAgentIds: schedule.executorAgentIds,
            executorGroupIds: schedule.executorGroupIds,
            companyId: schedule.companyId,
            serviceId: schedule.serviceId,
            slaId: schedule.slaId,
          });
          
          console.log(`✅ Создан тикет #${ticketNumber} по расписанию ID ${schedule.id}`);
          
          // Обновляем время последнего и следующего запуска
          const lastRunAt = new Date();
          const { calculateNextRunAt } = require('./models/ticketSchedules');
          const nextScheduleData = {
            scheduleType: schedule.scheduleType,
            scheduleTime: schedule.scheduleTime,
            scheduleDays: schedule.scheduleDays,
            scheduleDayOfMonth: schedule.scheduleDayOfMonth,
            startDate: schedule.startDate,
            endDate: schedule.endDate,
          };
          const nextRunAt = calculateNextRunAt(nextScheduleData);
          
          await TicketSchedules.updateRunTime(schedule.id, lastRunAt, nextRunAt);
        } catch (err) {
          console.error(`❌ Ошибка при выполнении расписания ID ${schedule.id}:`, err);
        }
      }
    } else {
      console.log('✅ Нет расписаний для выполнения');
    }
  } catch (err) {
    console.error('❌ Ошибка при проверке расписаний:', err);
  }
}

// Запускаем cron каждую минуту
setInterval(processDueSchedules, 60 * 1000);

// Также запускаем при старте сервера (с небольшой задержкой)
setTimeout(processDueSchedules, 5000);

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

app.listen(PORT, async () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📊 Database: ${process.env.DB_NAME || 'test_entities_db'}`);
  
  // Запускаем очистку старых бэкапов при старте сервера
  console.log('🧹 Запуск очистки старых бэкапов...');
  await cleanupOldBackups();
  console.log('✅ Очистка бэкапов завершена');
});
