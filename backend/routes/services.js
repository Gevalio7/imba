const express = require('express');
const router = express.Router();
const {
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
router.post('/', createServices);

// POST /services/:id/customers/:customerId - добавить компанию к сервису
router.post('/:id/customers/:customerId', addServiceCustomer);

// POST /services/:id/attachments - загрузить файлы для сервиса
router.post('/:id/attachments', upload.array('files', 10), uploadServiceAttachments);

// PUT /services/:id/sla - установить SLA для сервиса
router.put('/:id/sla', setServiceSLA);

// PUT /services/:id
router.put('/:id', updateServices);

// DELETE /services/:id
router.delete('/:id', deleteServices);

// DELETE /services/:id/customers/:customerId - удалить компанию от сервиса
router.delete('/:id/customers/:customerId', removeServiceCustomer);

// DELETE /services/:id/attachments/:attachmentId - удалить вложение от сервиса
router.delete('/:id/attachments/:attachmentId', removeServiceAttachment);

module.exports = router;
