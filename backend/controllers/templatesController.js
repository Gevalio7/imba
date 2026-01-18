const Templates = require('../models/templates');

const getTemplates = async (req, res) => {
  try {
    const { q, sortBy, orderBy, itemsPerPage, page } = req.query;

    const searchQuery = typeof q === 'string' ? q : undefined;
    const sortByLocal = typeof sortBy === 'string' ? sortBy : '';
    const orderByLocal = typeof orderBy === 'string' ? orderBy : '';
    const itemsPerPageLocal = typeof itemsPerPage === 'string' ? parseInt(itemsPerPage, 10) : 10;
    const pageLocal = typeof page === 'string' ? parseInt(page, 10) : 1;

    const result = await Templates.getAll({
      q: searchQuery,
      sortBy: sortByLocal,
      orderBy: orderByLocal,
      itemsPerPage: itemsPerPageLocal,
      page: pageLocal,
    });

    res.json(result);
  } catch (error) {
    console.error('Error in getTemplates:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const getTemplateById = async (req, res) => {
  try {
    const { id } = req.params;
    const templateId = parseInt(id, 10);

    if (isNaN(templateId)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }

    const template = await Templates.getById(templateId);

    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }

    res.json(template);
  } catch (error) {
    console.error('Error in getTemplateById:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const createTemplates = async (req, res) => {
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

    const newTemplate = await Templates.create(data);

    res.status(201).json(newTemplate);
  } catch (error) {
    console.error('Error in createTemplates:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const updateTemplates = async (req, res) => {
  try {
    const { id } = req.params;
    const templateId = parseInt(id, 10);
    const data = {};
    data.name = req.body.name;
    data.message = req.body.message;
    data.status = req.body.status;
    data.isActive = req.body.isActive;
    data.status = req.body.status;
    data.isActive = req.body.isActive;

    if (isNaN(templateId)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }

    if (!data.name) {
      return res.status(400).json({ message: 'name is required' });
    }

    const updatedTemplate = await Templates.update(templateId, data);

    if (!updatedTemplate) {
      return res.status(404).json({ message: 'Template not found' });
    }

    res.json(updatedTemplate);
  } catch (error) {
    console.error('Error in updateTemplates:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const deleteTemplates = async (req, res) => {
  try {
    const { id } = req.params;
    const templateId = parseInt(id, 10);

    if (isNaN(templateId)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }

    const deleted = await Templates.delete(templateId);

    if (!deleted) {
      return res.status(404).json({ message: 'Template not found' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error in deleteTemplates:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  getTemplates,
  getTemplateById,
  createTemplates,
  updateTemplates,
  deleteTemplates,
};
