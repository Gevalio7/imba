const express = require('express');
const router = express.Router();
const {
  getAcls,
  getAclById,
  createAcls,
  updateAcls,
  deleteAcls,
} = require('../controllers/aclsController');

// GET /acls - список с query params
router.get('/', getAcls);

// GET /acls/:id
router.get('/:id', getAclById);

// POST /acls
router.post('/', createAcls);

// PUT /acls/:id
router.put('/:id', updateAcls);

// DELETE /acls/:id
router.delete('/:id', deleteAcls);

module.exports = router;
