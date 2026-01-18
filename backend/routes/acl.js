const express = require('express');
const router = express.Router();
const {
  getAcl,
  getAclById,
  createAcl,
  updateAcl,
  deleteAcl,
} = require('../controllers/aclController');

// GET /acl - список с query params
router.get('/', getAcl);

// GET /acl/:id
router.get('/:id', getAclById);

// POST /acl
router.post('/', createAcl);

// PUT /acl/:id
router.put('/:id', updateAcl);

// DELETE /acl/:id
router.delete('/:id', deleteAcl);

module.exports = router;
