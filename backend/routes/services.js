const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const { protect } = require('../middleware/auth');
const {
  getServices,
  getServiceById,
  createServices,
  updateServices,
  deleteServices,
  getServiceCustomers,
  addServiceCustomer,
  removeServiceCustomer,
  getServiceAttachments,
  removeServiceAttachment,
  uploadServiceAttachments,
  downloadServiceAttachment,
  upload,
  getServiceSLA,
  setServiceSLA,
} = require('../controllers/servicesController');

// GET /services - список с query params
router.get('/', getServices);

// GET /services/:id
router.get('/:id', getServiceById);

// GET /services/:id/customers - получить компании сервиса
router.get('/:id/customers', getServiceCustomers);

// GET /services/:id/attachments - получить вложения сервиса
router.get('/:id/attachments', getServiceAttachments);

// GET /services/:id/attachments/:attachmentId/download - скачать вложение
router.get('/:id/attachments/:attachmentId/download', downloadServiceAttachment);

// GET /services/:id/sla - получить SLA сервиса
router.get('/:id/sla', getServiceSLA);

// POST /services
router.post('/', protect, createServices);

// POST /services/:id/customers/:customerId - добавить компанию к сервису
router.post('/:id/customers/:customerId', protect, addServiceCustomer);

// POST /services/:id/attachments - загрузить файлы для сервиса
router.post('/:id/attachments', protect, upload.array('files', 10), uploadServiceAttachments);

// PUT /services/:id/sla - установить SLA для сервиса
router.put('/:id/sla', protect, setServiceSLA);

// PUT /services/:id
router.put('/:id', protect, updateServices);

// DELETE /services/:id
router.delete('/:id', protect, deleteServices);

// DELETE /services/:id/customers/:customerId - удалить компанию от сервиса
router.delete('/:id/customers/:customerId', protect, removeServiceCustomer);

// DELETE /services/:id/attachments/:attachmentId - удалить вложение от сервиса
router.delete('/:id/attachments/:attachmentId', protect, removeServiceAttachment);

module.exports = router;
