const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Конфигурация из переменных окружения
const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = process.env.DB_PORT || '5432';
const DB_USER = process.env.DB_USER || 'postgres';
const DB_PASSWORD = process.env.DB_PASSWORD || 'postgres';
const DB_NAME = process.env.DB_NAME || 'test_entities_db';

const BACKUP_DIR = path.join(__dirname, '..', 'backups');

// Убедимся, что директория для бэкапов существует
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

// Функция для выполнения shell команды
const execCommand = (command, args) => {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { shell: true, env: { ...process.env, PGPASSWORD: DB_PASSWORD } });
    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve(stdout);
      } else {
        reject(new Error(stderr || `Command failed with code ${code}`));
      }
    });

    child.on('error', (err) => {
      reject(err);
    });
  });
};

// Получить список всех бэкапов с пагинацией
const getBackups = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const type = req.query.type || 'all';
    
    const files = fs.readdirSync(BACKUP_DIR);
    let backups = files
      .filter(file => file.endsWith('.tar.gz') || file.endsWith('.sql.gz'))
      .map(file => {
        const filePath = path.join(BACKUP_DIR, file);
        const stats = fs.statSync(filePath);
        const isDbBackup = file.includes('db') || file.includes('backup_db');
        const backupType = isDbBackup ? 'database' : 'filesystem';
        
        return {
          id: file.replace(/\.(tar\.gz|sql\.gz)$/, ''),
          filename: file,
          path: filePath,
          size: stats.size,
          sizeFormatted: formatBytes(stats.size),
          createdAt: stats.birthtime,
          type: backupType,
        };
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Фильтрация по типу
    if (type !== 'all') {
      backups = backups.filter(b => b.type === type);
    }

    const total = backups.length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedBackups = backups.slice(startIndex, endIndex);

    res.json({
      data: paginatedBackups,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    console.error('Error getting backups:', error);
    res.status(500).json({ message: 'Ошибка при получении списка бэкапов', error: error.message });
  }
};

// Создать бэкап базы данных
const createDatabaseBackup = async (req, res) => {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const backupFile = path.join(BACKUP_DIR, `backup_db_${timestamp}.sql`);
    const archiveFile = path.join(BACKUP_DIR, `backup_db_${timestamp}.tar.gz`);

    console.log('Создание бэкапа базы данных...');

    // Создаем бэкап с помощью pg_dump
    const dumpArgs = [
      '-h', DB_HOST,
      '-p', DB_PORT,
      '-U', DB_USER,
      '-d', DB_NAME,
      '--format=custom',
      '--compress=9',
      '--verbose',
      '-f', backupFile
    ];

    await execCommand('pg_dump', dumpArgs);

    // Архивируем
    console.log('Архивирование бэкапа...');
    await execCommand('tar', ['-czf', archiveFile, '-C', BACKUP_DIR, path.basename(backupFile)]);

    // Удаляем оригинальный файл
    fs.unlinkSync(backupFile);

    const stats = fs.statSync(archiveFile);
    
    // Запускаем очистку после создания бэкапа
    await cleanupOldBackups();
    
    res.json({
      success: true,
      message: 'Бэкап базы данных успешно создан',
      backup: {
        id: `backup_db_${timestamp}`,
        filename: path.basename(archiveFile),
        path: archiveFile,
        size: stats.size,
        sizeFormatted: formatBytes(stats.size),
        createdAt: new Date(),
        type: 'database',
      }
    });
  } catch (error) {
    console.error('Error creating database backup:', error);
    res.status(500).json({ message: 'Ошибка при создании бэкапа базы данных', error: error.message });
  }
};

// Создать бэкап файловой системы
const createFilesystemBackup = async (req, res) => {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const archiveFile = path.join(BACKUP_DIR, `backup_files_${timestamp}.tar.gz`);

    console.log('Создание бэкапа файловой системы...');

    // Определяем корневую директорию проекта
    const projectRoot = path.join(__dirname, '..');

    // Создаем архив всего проекта с учетом .gitignore
    // Используем tar с --exclude-ignore для исключения файлов по .gitignore
    const args = [
      '-czf', archiveFile,
      '--exclude=node_modules',
      '--exclude=*.log',
      '--exclude=.git',
      '--exclude=backups/*.tar.gz',
      '--exclude=backups/*.sql',
      '--exclude=backups/*.sql.gz',
      '-C', projectRoot,
      '.'
    ];

    await execCommand('tar', args);

    const stats = fs.statSync(archiveFile);

    // Запускаем очистку после создания бэкапа
    await cleanupOldBackups();

    res.json({
      success: true,
      message: 'Бэкап файловой системы успешно создан',
      backup: {
        id: `backup_files_${timestamp}`,
        filename: path.basename(archiveFile),
        path: archiveFile,
        size: stats.size,
        sizeFormatted: formatBytes(stats.size),
        createdAt: new Date(),
        type: 'filesystem',
      }
    });
  } catch (error) {
    console.error('Error creating filesystem backup:', error);
    res.status(500).json({ message: 'Ошибка при создании бэкапа файловой системы', error: error.message });
  }
};

// Удалить бэкап
const deleteBackup = async (req, res) => {
  try {
    const { id } = req.params;
    const filePath = path.join(BACKUP_DIR, `${id}.tar.gz`);
    const sqlFilePath = path.join(BACKUP_DIR, `${id}.sql.gz`);

    let deleted = false;

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      deleted = true;
    } else if (fs.existsSync(sqlFilePath)) {
      fs.unlinkSync(sqlFilePath);
      deleted = true;
    }

    if (deleted) {
      res.json({ success: true, message: 'Бэкап успешно удален' });
    } else {
      res.status(404).json({ message: 'Бэкап не найден' });
    }
  } catch (error) {
    console.error('Error deleting backup:', error);
    res.status(500).json({ message: 'Ошибка при удалении бэкапа', error: error.message });
  }
};

// Скачать бэкап
const downloadBackup = async (req, res) => {
  try {
    const { id } = req.params;
    const filePath = path.join(BACKUP_DIR, `${id}.tar.gz`);
    const sqlFilePath = path.join(BACKUP_DIR, `${id}.sql.gz`);

    let file = filePath;
    if (!fs.existsSync(filePath) && fs.existsSync(sqlFilePath)) {
      file = sqlFilePath;
    }

    if (!fs.existsSync(file)) {
      return res.status(404).json({ message: 'Бэкап не найден' });
    }

    res.download(file, path.basename(file));
  } catch (error) {
    console.error('Error downloading backup:', error);
    res.status(500).json({ message: 'Ошибка при скачивании бэкапа', error: error.message });
  }
};

// Получить настройки расписания
const getScheduleSettings = async (req, res) => {
  try {
    const configPath = path.join(__dirname, 'backup-config.json');
    
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      res.json(config);
    } else {
      res.json({
        database: {
          enabled: false,
          schedule: '0 2 * * *', // По умолчанию в 2:00 ночи
          retentionDays: 7,
        },
        filesystem: {
          enabled: false,
          schedule: '0 3 * * *', // По умолчанию в 3:00 ночи
          retentionDays: 7,
        }
      });
    }
  } catch (error) {
    console.error('Error getting schedule settings:', error);
    res.status(500).json({ message: 'Ошибка при получении настроек расписания', error: error.message });
  }
};

// Сохранить настройки расписания
const saveScheduleSettings = async (req, res) => {
  try {
    const configPath = path.join(__dirname, 'backup-config.json');
    const config = req.body;

    // Валидация
    if (config.database) {
      if (config.database.schedule && !isValidCron(config.database.schedule)) {
        return res.status(400).json({ message: 'Неверный формат расписания для базы данных' });
      }
    }
    if (config.filesystem) {
      if (config.filesystem.schedule && !isValidCron(config.filesystem.schedule)) {
        return res.status(400).json({ message: 'Неверный формат расписания для файловой системы' });
      }
    }

    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

    // Запускаем очистку после сохранения настроек
    await cleanupOldBackups();

    res.json({ success: true, message: 'Настройки расписания сохранены', config });
  } catch (error) {
    console.error('Error saving schedule settings:', error);
    res.status(500).json({ message: 'Ошибка при сохранении настроек расписания', error: error.message });
  }
};

// Вспомогательная функция для форматирования размера файла
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Простая проверка cron выражения
function isValidCron(cron) {
  const parts = cron.trim().split(/\s+/);
  if (parts.length < 5 || parts.length > 6) return false;
  return true;
}

// Функция для удаления просроченных бэкапов
const cleanupOldBackups = async () => {
  try {
    const configPath = path.join(__dirname, 'backup-config.json');
    
    if (!fs.existsSync(configPath)) {
      console.log('Конфигурация бэкапов не найдена, пропускаем очистку');
      return;
    }

    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    const dbRetentionDays = config.database?.retentionDays || 7;
    const fsRetentionDays = config.filesystem?.retentionDays || 7;

    const files = fs.readdirSync(BACKUP_DIR);
    const now = new Date();
    let deletedCount = 0;

    for (const file of files) {
      if (!file.endsWith('.tar.gz') && !file.endsWith('.sql.gz')) {
        continue;
      }

      const filePath = path.join(BACKUP_DIR, file);
      const stats = fs.statSync(filePath);
      const isDbBackup = file.includes('db') || file.includes('backup_db');
      const retentionDays = isDbBackup ? dbRetentionDays : fsRetentionDays;
      
      const createdDate = new Date(stats.birthtime);
      const ageInDays = (now - createdDate) / (1000 * 60 * 60 * 24);

      if (ageInDays > retentionDays) {
        console.log(`Удаление просроченного бэкапа: ${file} (возраст: ${ageInDays.toFixed(1)} дней, лимит: ${retentionDays} дней)`);
        fs.unlinkSync(filePath);
        deletedCount++;
      }
    }

    if (deletedCount > 0) {
      console.log(`Удалено ${deletedCount} просроченных бэкапов`);
    }
  } catch (error) {
    console.error('Error cleaning up old backups:', error);
  }
};

module.exports = {
  getBackups,
  createDatabaseBackup,
  createFilesystemBackup,
  deleteBackup,
  downloadBackup,
  getScheduleSettings,
  saveScheduleSettings,
  cleanupOldBackups,
};
