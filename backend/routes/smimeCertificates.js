const express = require('express');
const router = express.Router();
const {
  getSmimeCertificates,
  getSmimeCertificateById,
  createSmimeCertificates,
  updateSmimeCertificates,
  deleteSmimeCertificates,
} = require('../controllers/smimeCertificatesController');

// GET /smimeCertificates - список с query params
router.get('/', getSmimeCertificates);

// GET /smimeCertificates/:id
router.get('/:id', getSmimeCertificateById);

// POST /smimeCertificates
router.post('/', createSmimeCertificates);

// PUT /smimeCertificates/:id
router.put('/:id', updateSmimeCertificates);

// DELETE /smimeCertificates/:id
router.delete('/:id', deleteSmimeCertificates);

module.exports = router;
