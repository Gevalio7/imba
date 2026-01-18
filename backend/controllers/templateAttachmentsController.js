const TemplateAttachments = require('../models/templateAttachments');

const getTemplateAttachments = async (req, res) => {
  try {
    const { q, sortBy, orderBy, itemsPerPage, page } = req.query;

    const searchQuery = typeof q === 'string' ? q : undefined;
    const sortByLocal = typeof sortBy === 'string' ? sortBy : '';
    const orderByLocal = typeof orderBy === 'string' ? orderBy : '';
    const itemsPerPageLocal = typeof itemsPerPage === 'string' ? parseInt(itemsPerPage, 10) : 10;
    const pageLocal = typeof page === 'string' ? parseInt(page, 10) : 1;

    const result = await TemplateAttachments.getAll({
      q: searchQuery,
      sortBy: sortByLocal,
      orderBy: orderByLocal,
      itemsPerPage: itemsPerPageLocal,
      page: pageLocal,
    });

    res.json(result);
  } catch (error) {
    console.error('Error in getTemplateAttachments:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const getTemplateAttachmentById = async (req, res) => {
  try {
    const { id } = req.params;
    const templateattachmentId = parseInt(id, 10);

    if (isNaN(templateattachmentId)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }

    const templateattachment = await TemplateAttachments.getById(templateattachmentId);

    if (!templateattachment) {
      return res.status(404).json({ message: 'TemplateAttachment not found' });
    }

    res.json(templateattachment);
  } catch (error) {
    console.error('Error in getTemplateAttachmentById:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const createTemplateAttachments = async (req, res) => {
  try {
    const data = {};
    data.name = req.body.name;
    data.message = req.body.message;
    data.status = req.body.status;
    data.isActive = req.body.isActive;
    data.status = req.body.status;
    data.isActive = req.body.isActive;

    if (!data.name) {
      return res.status(400).json({ message: 'name is required' });
    }

    const newTemplateAttachment = await TemplateAttachments.create(data);

    res.status(201).json(newTemplateAttachment);
  } catch (error) {
    console.error('Error in createTemplateAttachments:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const updateTemplateAttachments = async (req, res) => {
  try {
    const { id } = req.params;
    const templateattachmentId = parseInt(id, 10);
    const data = {};
    data.name = req.body.name;
    data.message = req.body.message;
    data.status = req.body.status;
    data.isActive = req.body.isActive;
    data.status = req.body.status;
    data.isActive = req.body.isActive;

    if (isNaN(templateattachmentId)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }

    if (!data.name) {
      return res.status(400).json({ message: 'name is required' });
    }

    const updatedTemplateAttachment = await TemplateAttachments.update(templateattachmentId, data);

    if (!updatedTemplateAttachment) {
      return res.status(404).json({ message: 'TemplateAttachment not found' });
    }

    res.json(updatedTemplateAttachment);
  } catch (error) {
    console.error('Error in updateTemplateAttachments:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const deleteTemplateAttachments = async (req, res) => {
  try {
    const { id } = req.params;
    const templateattachmentId = parseInt(id, 10);

    if (isNaN(templateattachmentId)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }

    const deleted = await TemplateAttachments.delete(templateattachmentId);

    if (!deleted) {
      return res.status(404).json({ message: 'TemplateAttachment not found' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error in deleteTemplateAttachments:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  getTemplateAttachments,
  getTemplateAttachmentById,
  createTemplateAttachments,
  updateTemplateAttachments,
  deleteTemplateAttachments,
};
