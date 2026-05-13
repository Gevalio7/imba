console.log('🚀 Запуск server.js...');
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Импорт функции очистки бэкапов
const { cleanupOldBackups } = require('./controllers/backupController');

// Импорт БД
const { pool } = require('./config/db');

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

// ========== CRON ДЛЯ ЗАВЕРШЕНИЯ НЕАКТИВНЫХ СЕССИЙ ==========
const SessionManagement = require('./models/sessionManagement');

// Функция для выполнения просроченных расписаний
const processDueSchedules = async () => {
  try {
    console.log('🔄 Проверка расписаний тикетов...', new Date().toISOString());

    // Сначала деактивируем истекшие расписания
    console.log('📅 Проверяем истекшие расписания...');
    const deactivatedResult = await pool.query(`
      UPDATE ticket_schedules
      SET is_active = false, updated_at = CURRENT_TIMESTAMP
      WHERE is_active = true AND end_date IS NOT NULL AND end_date < CURRENT_DATE
    `);
    if (deactivatedResult.rowCount > 0) {
      console.log(`📅 Деактивировано ${deactivatedResult.rowCount} истекших расписаний`);
    }

    console.log('📋 Получаем просроченные расписания...');
    const dueSchedules = await TicketSchedules.getDueSchedules();
    console.log(`📋 Найдено ${dueSchedules.length} расписаний для выполнения`);
    console.log(`📋 Найдено ${dueSchedules.length} расписаний для выполнения`);
    
    if (dueSchedules.length > 0) {
      console.log(`📋 Найдено ${dueSchedules.length} расписаний для выполнения`);
      
      for (const schedule of dueSchedules) {
        try {
          console.log(`🔍 Обрабатываем расписание ID ${schedule.id}, next_run_at: ${schedule.nextRunAt}`);

          // Проверяем, что расписание действительно просрочено (максимум на 5 минут)
          const now = new Date();
          const scheduleNextRunAt = new Date(schedule.nextRunAt);
          const timeDiff = now.getTime() - scheduleNextRunAt.getTime();

          if (timeDiff < -300000) { // Если next_run_at больше чем на 5 минут в будущем
            console.log(`⏰ Пропускаем расписание ID ${schedule.id} - next_run_at в будущем (${Math.round(timeDiff / 1000)} сек)`);
            continue;
          }

          // Временно убрана блокировка для тестирования

          // Получаем актуальный тикет для клонирования
          const originalTicket = await Tickets.getById(schedule.ticketId);
          if (!originalTicket) {
            console.error(`❌ Оригинальный тикет для расписания ID ${schedule.id} не найден`);
            continue;
          }

          console.log(`📝 Создаём тикет для расписания ID ${schedule.id}...`);

          // Создаём новый тикет - клонируем актуальный с префиксом
          const ticketNumber = await Tickets.generateTicketNumber();
          const newTicket = await Tickets.create({
            ticketNumber,
            title: `${schedule.titlePrefix || 'Расписание (Р) '}${originalTicket.title}`,
            description: originalTicket.description,
            typeId: originalTicket.typeId,
            categoryId: originalTicket.categoryId,
            priorityId: originalTicket.priorityId,
            queueId: originalTicket.queueId,
            stateId: originalTicket.stateId,
            ownerId: originalTicket.ownerId,
            executorAgentIds: originalTicket.executorAgentIds,
            executorGroupIds: originalTicket.executorGroupIds,
            companyId: originalTicket.companyId,
            serviceId: originalTicket.serviceId,
            slaId: originalTicket.slaId,
          });

          console.log(`✅ Создан тикет #${ticketNumber} по расписанию ID ${schedule.id} (клонирован из #${originalTicket.ticketNumber})`);

          // Обновляем время последнего и следующего запуска
          const executionTime = new Date();
          const { calculateNextRunAt } = require('./models/ticketSchedules');
          const nextScheduleData = {
            scheduleType: schedule.scheduleType,
            scheduleTime: schedule.scheduleTime,
            scheduleDays: schedule.scheduleDays,
            scheduleDayOfMonth: schedule.scheduleDayOfMonth,
            startDate: schedule.startDate,
            endDate: schedule.endDate,
          };
          let nextRunAt = calculateNextRunAt(nextScheduleData);

          // Если следующее время выполнения в прошлом или null - исправляем
          if (!nextRunAt || nextRunAt <= executionTime) {
            console.log(`⚠️ Исправляем next_run_at для расписания ID ${schedule.id}`);
            // Для ежедневного расписания устанавливаем завтра в то же время
            const tomorrow = new Date(executionTime);
            tomorrow.setDate(tomorrow.getDate() + 1);
            const [hours, minutes] = (schedule.scheduleTime || '09:00').split(':').map(Number);
            tomorrow.setHours(hours, minutes, 0, 0);
            nextRunAt = tomorrow;
          }

          console.log(`⏰ Обновляем время для расписания ID ${schedule.id}: last_run_at=${executionTime}, next_run_at=${nextRunAt}`);
          await TicketSchedules.updateRunTime(schedule.id, executionTime, nextRunAt);
        } catch (err) {
          console.error(`❌ Ошибка при выполнении расписания ID ${schedule.id}:`, err);
          // В случае ошибки снимаем блокировку
          await pool.query(`UPDATE ticket_schedules SET updated_at = CURRENT_TIMESTAMP WHERE id = $1`, [schedule.id]);
        }
      }
    } else {
      console.log('✅ Нет расписаний для выполнения');
    }
  } catch (err) {
    console.error('❌ Ошибка при проверке расписаний:', err);
  }
}

// Функция для завершения неактивных сессий
const terminateIdleSessions = async () => {
  try {
    const idleTimeoutMinutes = parseInt(process.env.SESSION_IDLE_TIMEOUT_MINUTES || '60');
    console.log(`🔄 Проверка неактивных сессий (таймаут: ${idleTimeoutMinutes} мин)...`);

    const terminatedCount = await SessionManagement.terminateIdleSessions(idleTimeoutMinutes);

    if (terminatedCount > 0) {
      console.log(`🛑 Завершено ${terminatedCount} неактивных сессий`);
    } else {
      console.log('✅ Неактивных сессий не найдено');
    }
  } catch (err) {
    console.error('❌ Ошибка при завершении неактивных сессий:', err);
  }
};



// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});

// Временный маршрут для тестирования расписаний
app.post('/test-schedules', async (req, res) => {
  try {
    console.log('🧪 Ручной запуск processDueSchedules...');
    await processDueSchedules();
    res.json({ message: 'Функция processDueSchedules выполнена' });
  } catch (error) {
    console.error('❌ Ошибка в тестовом маршруте:', error);
    res.status(500).json({ error: error.message });
  }
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

  // Запускаем cron для расписаний
  console.log('⏰ Запуск планировщика расписаний...');
  setInterval(processDueSchedules, 60 * 1000); // Каждую минуту
  setTimeout(processDueSchedules, 5000); // Через 5 секунд после запуска

  // Запускаем cron для завершения неактивных сессий
  console.log('⏰ Запуск планировщика завершения сессий...');
  setInterval(terminateIdleSessions, 5 * 60 * 1000); // Каждые 5 минут
  setTimeout(terminateIdleSessions, 10000); // Через 10 секунд после запуска

  // Для тестирования - запускаем сразу
  console.log('🧪 Тестируем расписания сразу...');
  setTimeout(() => {
    console.log('🔥 Вызываем processDueSchedules...');
    processDueSchedules().catch(err => console.error('❌ Ошибка в processDueSchedules:', err));
  }, 1000);
});
