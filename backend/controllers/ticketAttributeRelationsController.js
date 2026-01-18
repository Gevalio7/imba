const TicketAttributeRelations = require('../models/ticketAttributeRelations');

const getTicketAttributeRelations = async (req, res) => {
  try {
    const { q, sortBy, orderBy, itemsPerPage, page } = req.query;

    const searchQuery = typeof q === 'string' ? q : undefined;
    const sortByLocal = typeof sortBy === 'string' ? sortBy : '';
    const orderByLocal = typeof orderBy === 'string' ? orderBy : '';
    const itemsPerPageLocal = typeof itemsPerPage === 'string' ? parseInt(itemsPerPage, 10) : 10;
    const pageLocal = typeof page === 'string' ? parseInt(page, 10) : 1;

    const result = await TicketAttributeRelations.getAll({
      q: searchQuery,
      sortBy: sortByLocal,
      orderBy: orderByLocal,
      itemsPerPage: itemsPerPageLocal,
      page: pageLocal,
    });

    res.json(result);
  } catch (error) {
    console.error('Error in getTicketAttributeRelations:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const getTicketAttributeRelationById = async (req, res) => {
  try {
    const { id } = req.params;
    const ticketattributerelationId = parseInt(id, 10);

    if (isNaN(ticketattributerelationId)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }

    const ticketattributerelation = await TicketAttributeRelations.getById(ticketattributerelationId);

    if (!ticketattributerelation) {
      return res.status(404).json({ message: 'TicketAttributeRelation not found' });
    }

    res.json(ticketattributerelation);
  } catch (error) {
    console.error('Error in getTicketAttributeRelationById:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const createTicketAttributeRelations = async (req, res) => {
  try {
    const data = {};
    data.name = req.body.name;
    data.description = req.body.description;
    data.status = req.body.status;
    data.isActive = req.body.isActive;

    if (!data.name) {
      return res.status(400).json({ message: 'name is required' });
    }

    const newTicketAttributeRelation = await TicketAttributeRelations.create(data);

    res.status(201).json(newTicketAttributeRelation);
  } catch (error) {
    console.error('Error in createTicketAttributeRelations:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const updateTicketAttributeRelations = async (req, res) => {
  try {
    const { id } = req.params;
    const ticketattributerelationId = parseInt(id, 10);
    const data = {};
    data.name = req.body.name;
    data.description = req.body.description;
    data.status = req.body.status;
    data.isActive = req.body.isActive;

    if (isNaN(ticketattributerelationId)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }

    if (!data.name) {
      return res.status(400).json({ message: 'name is required' });
    }

    const updatedTicketAttributeRelation = await TicketAttributeRelations.update(ticketattributerelationId, data);

    if (!updatedTicketAttributeRelation) {
      return res.status(404).json({ message: 'TicketAttributeRelation not found' });
    }

    res.json(updatedTicketAttributeRelation);
  } catch (error) {
    console.error('Error in updateTicketAttributeRelations:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const deleteTicketAttributeRelations = async (req, res) => {
  try {
    const { id } = req.params;
    const ticketattributerelationId = parseInt(id, 10);

    if (isNaN(ticketattributerelationId)) {
      return res.status(400).json({ message: 'Invalid ID' });
    }

    const deleted = await TicketAttributeRelations.delete(ticketattributerelationId);

    if (!deleted) {
      return res.status(404).json({ message: 'TicketAttributeRelation not found' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error in deleteTicketAttributeRelations:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  getTicketAttributeRelations,
  getTicketAttributeRelationById,
  createTicketAttributeRelations,
  updateTicketAttributeRelations,
  deleteTicketAttributeRelations,
};
