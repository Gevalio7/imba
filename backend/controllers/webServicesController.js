const WebServices = require('../models/webServices');

const getWebServices = async (req, res) => {
  try {
    const { q, sortBy, orderBy, itemsPerPage, page } = req.query;

    const searchQuery = typeof q === 'string' ? q : undefined;
    const sortByLocal = typeof sortBy === 'string' ? sortBy : '';
    const orderByLocal = typeof orderBy === 'string' ? orderBy : '';
    const itemsPerPageLocal = typeof itemsPerPage === 'string' ? parseInt(itemsPerPage, 10) : 10;
    const pageLocal = typeof page === 'string' ? parseInt(page, 10) : 1;

    const result = await WebServices.getAll({
      q: searchQuery,
      sortBy: sortByLocal,
      orderBy: orderByLocal,
      itemsPerPage: itemsPerPageLocal,
      page: pageLocal,
    });

    res.json(result);
  } catch (error) {
    console.error('Error in getWebServices:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const getWebServiceById = async (req, res) => {
  try {
    const { id } = req.params;
    const webserviceId = parseInt(id, 10);

    if (isNaN(webserviceId)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }

    const webservice = await WebServices.getById(webserviceId);

    if (!webservice) {
      return res.status(404).json({ message: 'WebService not found' });
    }

    res.json(webservice);
  } catch (error) {
    console.error('Error in getWebServiceById:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const createWebServices = async (req, res) => {
  try {
    const { name, description, status, isActive } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Name is required' });
    }

    const newWebService = await WebServices.create({ name, description, status, isActive });

    res.status(201).json(newWebService);
  } catch (error) {
    console.error('Error in createWebServices:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const updateWebServices = async (req, res) => {
  try {
    const { id } = req.params;
    const webserviceId = parseInt(id, 10);
    const { name, description, status, isActive } = req.body;

    if (isNaN(webserviceId)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }

    if (!name) {
      return res.status(400).json({ message: 'Name is required' });
    }

    const updatedWebService = await WebServices.update(webserviceId, { name, description, status, isActive });

    if (!updatedWebService) {
      return res.status(404).json({ message: 'WebService not found' });
    }

    res.json(updatedWebService);
  } catch (error) {
    console.error('Error in updateWebServices:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const deleteWebServices = async (req, res) => {
  try {
    const { id } = req.params;
    const webserviceId = parseInt(id, 10);

    if (isNaN(webserviceId)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }

    const deleted = await WebServices.delete(webserviceId);

    if (!deleted) {
      return res.status(404).json({ message: 'WebService not found' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error in deleteWebServices:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  getWebServices,
  getWebServiceById,
  createWebServices,
  updateWebServices,
  deleteWebServices,
};
