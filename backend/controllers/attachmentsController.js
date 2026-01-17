const Attachments = require('../models/attachments');

const getAttachments = async (req, res) => {
  try {
    const { q, sortBy, orderBy, itemsPerPage, page } = req.query;

    const searchQuery = typeof q === 'string' ? q : undefined;
    const sortByLocal = typeof sortBy === 'string' ? sortBy : '';
    const orderByLocal = typeof orderBy === 'string' ? orderBy : '';
    const itemsPerPageLocal = typeof itemsPerPage === 'string' ? parseInt(itemsPerPage, 10) : 10;
    const pageLocal = typeof page === 'string' ? parseInt(page, 10) : 1;

    const result = await Attachments.getAll({
      q: searchQuery,
      sortBy: sortByLocal,
      orderBy: orderByLocal,
      itemsPerPage: itemsPerPageLocal,
      page: pageLocal,
    });

    res.json(result);
  } catch (error) {
    console.error('Error in getAttachments:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const getAttachmentById = async (req, res) => {
  try {
    const { id } = req.params;
    const attachmentId = parseInt(id, 10);

    if (isNaN(attachmentId)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }

    const attachment = await Attachments.getById(attachmentId);

    if (!attachment) {
      return res.status(404).json({ message: 'Attachment not found' });
    }

    res.json(attachment);
  } catch (error) {
    console.error('Error in getAttachmentById:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const createAttachments = async (req, res) => {
  try {
    const { name, description, status, isActive } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Name is required' });
    }

    const newAttachment = await Attachments.create({ name, description, status, isActive });

    res.status(201).json(newAttachment);
  } catch (error) {
    console.error('Error in createAttachments:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const updateAttachments = async (req, res) => {
  try {
    const { id } = req.params;
    const attachmentId = parseInt(id, 10);
    const { name, description, status, isActive } = req.body;

    if (isNaN(attachmentId)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }

    if (!name) {
      return res.status(400).json({ message: 'Name is required' });
    }

    const updatedAttachment = await Attachments.update(attachmentId, { name, description, status, isActive });

    if (!updatedAttachment) {
      return res.status(404).json({ message: 'Attachment not found' });
    }

    res.json(updatedAttachment);
  } catch (error) {
    console.error('Error in updateAttachments:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const deleteAttachments = async (req, res) => {
  try {
    const { id } = req.params;
    const attachmentId = parseInt(id, 10);

    if (isNaN(attachmentId)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }

    const deleted = await Attachments.delete(attachmentId);

    if (!deleted) {
      return res.status(404).json({ message: 'Attachment not found' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error in deleteAttachments:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  getAttachments,
  getAttachmentById,
  createAttachments,
  updateAttachments,
  deleteAttachments,
};
