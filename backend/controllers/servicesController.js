const Services = require('../models/services');
const ServiceAttachments = require('../models/serviceAttachments');
const { asyncHandler } = require('../middleware/errorHandler');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Настройка multer для загрузки файлов в память
const storage = multer.memoryStorage();
const allowedMimes = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'application/pdf',
  'application/msword', 
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain', 'text/csv',
  'application/zip', 'application/x-rar-compressed',
];
const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB лимит
  fileFilter: (req, file, cb) => {
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Неподдерживаемый тип файла: ${file.mimetype}`), false);
    }
  }
});

const getServices = asyncHandler(async (req, res) => {
  const { q, sortBy, orderBy, itemsPerPage, page } = req.query;

  const searchQuery = typeof q === 'string' ? q : undefined;
  const sortByLocal = typeof sortBy === 'string' ? sortBy : '';
  const orderByLocal = typeof orderBy === 'string' ? orderBy : '';
  const itemsPerPageLocal = typeof itemsPerPage === 'string' ? parseInt(itemsPerPage, 10) : 10;
  const pageLocal = typeof page === 'string' ? parseInt(page, 10) : 1;

  const result = await Services.getAll({
    q: searchQuery,
    sortBy: sortByLocal,
    orderBy: orderByLocal,
    itemsPerPage: itemsPerPageLocal,
    page: pageLocal,
  });

  // Оптимизированное получение информации о вложениях (один запрос для всех сервисов)
  const serviceIds = result.services.map(s => s.id);
  let attachmentsMap = {};
  
  if (serviceIds.length > 0) {
    const attachmentsFlags = await ServiceAttachments.hasAttachmentsBatch(serviceIds);
    attachmentsMap = attachmentsFlags;
  }

  // Добавляем информацию о наличии вложений для каждого сервиса
  const servicesWithFlags = result.services.map(service => ({
    ...service,
    hasAttachments: attachmentsMap[service.id] || false
  }));

  res.json({ services: servicesWithFlags, total: result.total });
});

const getServiceById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const serviceId = parseInt(id, 10);

  if (isNaN(serviceId)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  const service = await Services.getById(serviceId);

  if (!service) {
    return res.status(404).json({ message: 'Service not found' });
  }

  // Получаем компании для сервиса
  const customers = await Services.getCustomers(serviceId);
  service.customers = customers;

  // Получаем вложения для сервиса
  const attachmentsResult = await ServiceAttachments.getAll({ serviceId });
  service.attachments = attachmentsResult.attachments;

  // Получаем SLA для сервиса (связь 1 к 1)
  const sla = await Services.getSLA(serviceId);
  service.sla = sla;

  res.json(service);
});

const createServices = asyncHandler(async (req, res) => {
  const data = {};
  data.name = req.body.name;
  data.comment = req.body.comment;
  data.type = req.body.type;

  // Добавляем isActive если передан
  if (req.body.isActive !== undefined) {
    data.isActive = req.body.isActive;
  }

  // Валидация обязательных полей
  if (!data.name) {
    return res.status(400).json({ message: 'name is required' });
  }

  const newService = await Services.create(data);

  // Устанавливаем компании если переданы
  if (req.body.customerIds && Array.isArray(req.body.customerIds)) {
    await Services.setCustomers(newService.id, req.body.customerIds);
  }

  // Устанавливаем SLA если передан (связь 1 к 1)
  if (req.body.slaId !== undefined) {
    await Services.setSLA(newService.id, req.body.slaId);
  }

  // Получаем сервис с компаниями, вложениями и SLA
  const customers = await Services.getCustomers(newService.id);
  const attachmentsResult = await ServiceAttachments.getAll({ serviceId: newService.id });
  const sla = await Services.getSLA(newService.id);

  res.status(201).json({ ...newService, customers, attachments: attachmentsResult.attachments, sla });
});

const updateServices = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const serviceId = parseInt(id, 10);

  if (isNaN(serviceId)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  const data = {};
  if (req.body.name !== undefined) data.name = req.body.name;
  if (req.body.comment !== undefined) data.comment = req.body.comment;
  if (req.body.type !== undefined) data.type = req.body.type;

  // Добавляем isActive если передан
  if (req.body.isActive !== undefined) {
    data.isActive = req.body.isActive;
  }

  const updatedService = await Services.update(serviceId, data);

  if (!updatedService) {
    return res.status(404).json({ message: 'Service not found' });
  }

  // Обновляем компании если переданы
  if (req.body.customerIds !== undefined) {
    await Services.setCustomers(serviceId, req.body.customerIds);
  }

  // Обновляем SLA если передан (связь 1 к 1)
  if (req.body.slaId !== undefined) {
    await Services.setSLA(serviceId, req.body.slaId);
  }

  // Получаем сервис с компаниями, вложениями и SLA
  const customers = await Services.getCustomers(serviceId);
  const attachmentsResult = await ServiceAttachments.getAll({ serviceId });
  const sla = await Services.getSLA(serviceId);

  res.json({ ...updatedService, customers, attachments: attachmentsResult.attachments, sla });
});

const deleteServices = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const serviceId = parseInt(id, 10);

  if (isNaN(serviceId)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  const deleted = await Services.delete(serviceId);

  if (!deleted) {
    return res.status(404).json({ message: 'Service not found' });
  }

  res.status(204).send();
});

// Получить компании сервиса
const getServiceCustomers = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const serviceId = parseInt(id, 10);

  if (isNaN(serviceId)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  const customers = await Services.getCustomers(serviceId);
  res.json({ customers });
});

// Добавить компанию к сервису
const addServiceCustomer = asyncHandler(async (req, res) => {
  const { id, customerId } = req.params;
  const serviceId = parseInt(id, 10);
  const customerIdInt = parseInt(customerId, 10);

  if (isNaN(serviceId) || isNaN(customerIdInt)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  const result = await Services.addCustomer(serviceId, customerIdInt);
  if (!result) {
    return res.status(400).json({ message: 'Customer already linked to service' });
  }

  res.status(201).json(result);
});

// Удалить компанию от сервиса
const removeServiceCustomer = asyncHandler(async (req, res) => {
  const { id, customerId } = req.params;
  const serviceId = parseInt(id, 10);
  const customerIdInt = parseInt(customerId, 10);

  if (isNaN(serviceId) || isNaN(customerIdInt)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  const result = await Services.removeCustomer(serviceId, customerIdInt);
  if (!result) {
    return res.status(404).json({ message: 'Customer link not found' });
  }

  res.status(204).send();
});

// ========== ЭНДПОИНТЫ ДЛЯ ВЛОЖЕНИЙ ==========

// Получить вложения сервиса
const getServiceAttachments = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const serviceId = parseInt(id, 10);

  if (isNaN(serviceId)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  const result = await ServiceAttachments.getAll({ serviceId });
  res.json({ attachments: result.attachments });
});

// Удалить вложение сервиса
const removeServiceAttachment = asyncHandler(async (req, res) => {
  const { id, attachmentId } = req.params;
  const serviceId = parseInt(id, 10);
  const attachmentIdInt = parseInt(attachmentId, 10);

  if (isNaN(serviceId) || isNaN(attachmentIdInt)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  // Проверяем, что вложение принадлежит этому сервису
  const attachment = await ServiceAttachments.getById(attachmentIdInt);
  if (!attachment || attachment.serviceId !== serviceId) {
    return res.status(404).json({ message: 'Attachment not found for this service' });
  }

  const deleted = await ServiceAttachments.delete(attachmentIdInt);
  if (!deleted) {
    return res.status(404).json({ message: 'Attachment not found' });
  }

  res.status(204).send();
});

// ========== ЭНДПОИНТЫ ДЛЯ SLA ==========

// Получить SLA сервиса
const getServiceSLA = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const serviceId = parseInt(id, 10);

  if (isNaN(serviceId)) {
    return res.status(400).json({ message: 'Invalid ID' });
  }

  const sla = await Services.getSLA(serviceId);
  res.json({ sla });
});

// Установить SLA для сервиса
const setServiceSLA = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const serviceId = parseInt(id, 10);
  // Принимаем slaId из body (для PUT запроса без параметра в URL)
  const slaIdInt = req.body.slaId !== undefined ? 
    (req.body.slaId ? parseInt(req.body.slaId, 10) : null) : null;

  if (isNaN(serviceId)) {
    return res.status(400).json({ message: 'Invalid service ID' });
  }

  // Проверяем существование сервиса
  const service = await Services.getById(serviceId);
  if (!service) {
    return res.status(404).json({ message: 'Service not found' });
  }

  await Services.setSLA(serviceId, slaIdInt);
  const sla = await Services.getSLA(serviceId);
  res.json({ sla });
});

// ========== ЗАГРУЗКА ФАЙЛОВ ==========

// Загрузить файлы для сервиса
const uploadServiceAttachments = async (req, res) => {
  try {
    const { id } = req.params;
    const serviceId = parseInt(id, 10);

    if (isNaN(serviceId)) {
      return res.status(400).json({ message: 'Invalid service ID' });
    }

    // Проверяем существование сервиса
    const service = await Services.getById(serviceId);
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    const uploadedAttachments = [];

    for (const file of req.files) {
      // Сохраняем файл на диск
      const filename = await ServiceAttachments.saveFile(file);
      
      // Создаем запись в базе
      const attachment = await ServiceAttachments.create({
        serviceId,
        filename,
        originalName: file.originalname,
        mimetype: file.mimetype,
        filesize: file.size,
        uploaderId: req.user?.id || null,
      });

      uploadedAttachments.push(attachment);
    }

    res.status(201).json({ attachments: uploadedAttachments });
  } catch (error) {
    console.error('Error uploading files:', error);
    res.status(500).json({ message: 'Error uploading files' });
  }
};

// Скачать файл вложения
const downloadServiceAttachment = async (req, res) => {
  try {
    const { id, attachmentId } = req.params;
    const serviceId = parseInt(id, 10);
    const attachmentIdInt = parseInt(attachmentId, 10);

    if (isNaN(serviceId) || isNaN(attachmentIdInt)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }

    // Получаем информацию о вложении
    const attachment = await ServiceAttachments.getById(attachmentIdInt);
    if (!attachment || attachment.serviceId !== serviceId) {
      return res.status(404).json({ message: 'Attachment not found for this service' });
    }

    // Формируем путь к файлу с защитой от Path Traversal
    const uploadsDir = path.resolve(__dirname, '..', 'uploads', 'services');
    const filePath = path.resolve(uploadsDir, attachment.filePath);
    
    // Проверяем, что путь находится внутри разрешённой директории
    if (!filePath.startsWith(uploadsDir + path.sep)) {
      console.error('Path traversal attempt detected:', attachment.filePath);
      return res.status(400).json({ message: 'Invalid file path' });
    }
    
    // Проверяем существование файла
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'File not found' });
    }

    // Отправляем файл с правильным заголовком Content-Disposition
    res.download(filePath, attachment.fileName, (err) => {
      if (err) {
        console.error('Error downloading file:', err);
        if (!res.headersSent) {
          res.status(500).json({ message: 'Error downloading file' });
        }
      }
    });
  } catch (error) {
    console.error('Error downloading file:', error);
    res.status(500).json({ message: 'Error downloading file' });
  }
};

module.exports = {
  getServices,
  getServiceById,
  createServices,
  updateServices,
  deleteServices,
  getServiceCustomers,
  addServiceCustomer,
  removeServiceCustomer,
  // Вложения
  getServiceAttachments,
  removeServiceAttachment,
  uploadServiceAttachments,
  downloadServiceAttachment,
  upload,
  // SLA
  getServiceSLA,
  setServiceSLA,
};
