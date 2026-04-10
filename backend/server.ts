console.log('🚀 Запуск server.ts...');
import cors from 'cors';
import 'dotenv/config';
import express, { Application, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { errorHandler, notFound } from './middleware/errorHandler';
// @ts-ignore
const { pool } = require('./config/db');
// @ts-ignore
import TicketSchedules from './models/ticketSchedules';
// @ts-ignore
const { TicketScheduleLogs } = require('./models/ticketSchedules');
// @ts-ignore
import Tickets from './models/tickets';
// @ts-ignore
import { cleanupOldBackups } from './controllers/backupController';

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

// Функция для выполнения просроченных расписаний
const processDueSchedules = async () => {
  try {
    console.log('🔄 Проверка расписаний тикетов...', new Date().toISOString());

    // Сначала деактивируем истекшие расписания
    console.log('📅 Проверяем истекшие расписания...');
    const deactivatedResult = await (pool as any).query(`
      UPDATE ticket_schedules
      SET is_active = false, updated_at = CURRENT_TIMESTAMP
      WHERE is_active = true AND end_date IS NOT NULL AND end_date < CURRENT_DATE
    `);
    if (deactivatedResult.rowCount > 0) {
      console.log(`📅 Деактивировано ${deactivatedResult.rowCount} истекших расписаний`);
    }

    console.log('📋 Получаем просроченные расписания...');
    const dueSchedules = await (TicketSchedules as any).getDueSchedules();
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

          // Получаем актуальный тикет для клонирования
          console.log(`🎫 Получаем тикет с ID ${schedule.ticketId} (тип: ${typeof schedule.ticketId}) для расписания ${schedule.id}`);
          const ticketId = typeof schedule.ticketId === 'string' ? parseInt(schedule.ticketId, 10) : schedule.ticketId;
          console.log(`🎫 Преобразованный ticketId: ${ticketId}`);
          const originalTicket = await (Tickets as any).getById(ticketId, true);
          console.log(`🎫 Результат getById:`, originalTicket ? 'найден' : 'не найден');
          if (!originalTicket) {
            console.error(`❌ Оригинальный тикет для расписания ID ${schedule.id} не найден (ticketId: ${schedule.ticketId})`);
            
            // Записываем лог ошибки
            const errorTime = new Date();
            await (TicketScheduleLogs as any).create({
              scheduleId: schedule.id,
              executedAt: errorTime.toISOString(),
              status: 'error',
              errorMessage: `Тикет с ID ${schedule.ticketId} не найден`,
              details: { ticketId: schedule.ticketId }
            });
            
            // Снимаем блокировку
            await (pool as any).query(`UPDATE ticket_schedules SET updated_at = CURRENT_TIMESTAMP WHERE id = $1`, [schedule.id]);
            continue;
          }

        console.log(`📝 Создаём тикет для расписания ID ${schedule.id}...`);

        // Обновляем время последнего и следующего запуска
        const executionTime = new Date();

        // Создаём новый тикет - клонируем актуальный с префиксом
        const ticketNumber = await (Tickets as any).generateTicketNumber();
        const newTicket = await (Tickets as any).create({
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

        // Записываем лог выполнения
        await (TicketScheduleLogs as any).create({
          scheduleId: schedule.id,
          executedAt: executionTime.toISOString(),
          createdTicketId: newTicket.id,
          createdTicketNumber: ticketNumber,
          status: 'success',
          details: { originalTicketId: schedule.ticketId }
        });

        const { calculateNextRunAt } = require('./models/ticketSchedules');
        const nextScheduleData = {
          scheduleType: schedule.scheduleType,
          scheduleTime: schedule.scheduleTime,
          scheduleDays: schedule.scheduleDays,
          scheduleDayOfMonth: schedule.scheduleDayOfMonth,
          startDate: schedule.startDate,
          endDate: schedule.endDate,
        };
        let nextRunAt = (calculateNextRunAt as any)(nextScheduleData);

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

        console.log(`⏰ Обновляем время для расписания ID ${schedule.id}: last_run_at=${executionTime.toISOString()}, next_run_at=${nextRunAt?.toISOString()}`);
        const updateResult = await (TicketSchedules as any).updateRunTime(schedule.id, executionTime.toISOString(), nextRunAt?.toISOString());
        console.log(`✅ Результат обновления: ${JSON.stringify(updateResult)}`);

        // Проверяем, что обновление сработало
        const checkResult = await (pool as any).query('SELECT id, last_run_at, next_run_at FROM ticket_schedules WHERE id = $1', [schedule.id]);
        console.log(`🔍 Проверка после обновления: ${JSON.stringify(checkResult.rows[0])}`);

      } catch (err) {
        console.error(`❌ Ошибка при выполнении расписания ID ${schedule.id}:`, err);
        // В случае ошибки снимаем блокировку
        await (pool as any).query(`UPDATE ticket_schedules SET updated_at = CURRENT_TIMESTAMP WHERE id = $1`, [schedule.id]);
      }
    }
  } catch (err) {
    console.error('❌ Ошибка при проверке расписаний:', err);
  }
};

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

// Временный маршрут для тестирования БД
app.post('/test-db', async (req, res) => {
  try {
    console.log('🧪 Тестируем подключение к БД...');
    const result = await pool.query('SELECT NOW() as current_time');
    console.log('✅ БД работает:', result.rows[0]);

    res.json({
      message: 'БД протестирована',
      current_time: result.rows[0]
    });
  } catch (error) {
    console.error('❌ Ошибка в тесте БД:', error);
    res.status(500).json({ error: (error as Error).message });
  }
});

// Временный маршрут для тестирования расписаний
app.post('/test-schedules', async (req, res) => {
  try {
    console.log('🧪 Ручной запуск processDueSchedules...');
    await processDueSchedules();
    res.json({ message: 'Функция processDueSchedules выполнена' });
  } catch (error) {
    console.error('❌ Ошибка в тестовом маршруте расписаний:', error);
    res.status(500).json({ error: (error as Error).message });
  }
});

// 404 handler - должен быть перед error handler
app.use(notFound);

// Error handling middleware - должен быть последним
app.use(errorHandler);

app.listen(PORT, async () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📊 Database: ${process.env.DB_NAME || 'test_entities_db'}`);

  // Запускаем очистку старых бэкапов при старте сервера
  console.log('🧹 Запуск очистки старых бэкапов...');
  await (cleanupOldBackups as any)();
  console.log('✅ Очистка бэкапов завершена');

  // Запускаем cron для расписаний
  console.log('⏰ Запуск планировщика расписаний...');
  setInterval(processDueSchedules, 60 * 1000); // Каждую минуту
  
  // Запускаем проверку расписаний через 5 секунд после старта
  console.log('🧪 Тестируем расписания сразу...');
  setTimeout(async () => {
    try {
      console.log('🔥 Вызываем processDueSchedules...');
      await processDueSchedules();
      console.log('✅ processDueSchedules завершен успешно');
    } catch (err) {
      console.error('❌ Ошибка в processDueSchedules:', err);
    }
  }, 5000);
});
