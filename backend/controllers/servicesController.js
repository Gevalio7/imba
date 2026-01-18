const Services = require('../models/services');

const getServices = async (req, res) => {
  try {
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

    res.json(result);
  } catch (error) {
    console.error('Error in getServices:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const getServiceById = async (req, res) => {
  try {
    const { id } = req.params;
    const serviceId = parseInt(id, 10);

    if (isNaN(serviceId)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }

    const service = await Services.getById(serviceId);

    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    res.json(service);
  } catch (error) {
    console.error('Error in getServiceById:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const createServices = async (req, res) => {
  try {
    const data = {};
    data.name = req.body.name;
    data.comment = req.body.comment;
    data.status = req.body.status;
    data.isActive = req.body.isActive;
    data.status = req.body.status;
    data.isActive = req.body.isActive;

    if (!data.name) {
      return res.status(400).json({ message: 'name is required' });
    }

    const newService = await Services.create(data);

    res.status(201).json(newService);
  } catch (error) {
    console.error('Error in createServices:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const updateServices = async (req, res) => {
  try {
    const { id } = req.params;
    const serviceId = parseInt(id, 10);
    const data = {};
    data.name = req.body.name;
    data.comment = req.body.comment;
    data.status = req.body.status;
    data.isActive = req.body.isActive;
    data.status = req.body.status;
    data.isActive = req.body.isActive;

    if (isNaN(serviceId)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }

    if (!data.name) {
      return res.status(400).json({ message: 'name is required' });
    }

    const updatedService = await Services.update(serviceId, data);

    if (!updatedService) {
      return res.status(404).json({ message: 'Service not found' });
    }

    res.json(updatedService);
  } catch (error) {
    console.error('Error in updateServices:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const deleteServices = async (req, res) => {
  try {
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
  } catch (error) {
    console.error('Error in deleteServices:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  getServices,
  getServiceById,
  createServices,
  updateServices,
  deleteServices,
};
