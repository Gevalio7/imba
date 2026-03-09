const express = require('express');
const router = express.Router();
const {
  getBackups,
  createDatabaseBackup,
  createFilesystemBackup,
  deleteBackup,
  downloadBackup,
  getScheduleSettings,
  saveScheduleSettings,
} = require('../controllers/backupController');

// GET /backup - список всех бэкапов
router.get('/', getBackups);

// POST /backup/database - создать бэкап базы данных
router.post('/database', createDatabaseBackup);

// POST /backup/filesystem - создать бэкап файловой системы
router.post('/filesystem', createFilesystemBackup);

// DELETE /backup/:id - удалить бэкап
router.delete('/:id', deleteBackup);

// GET /backup/:id/download - скачать бэкап
router.get('/:id/download', downloadBackup);

// GET /backup/settings - получить настройки расписания
router.get('/settings', getScheduleSettings);

// POST /backup/settings - сохранить настройки расписания
router.post('/settings', saveScheduleSettings);

module.exports = router;
