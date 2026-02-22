const TicketStatusHistory = require('../models/ticketStatusHistory');
const { asyncHandler } = require('../middleware/errorHandler');

// GET /api/ticketStatusHistory/:ticketId - Получить историю переходов для тикета
const getStatusHistory = asyncHandler(async (req, res) => {
  const { ticketId } = req.params;
  const id = parseInt(ticketId, 10);

  if (isNaN(id)) {
    return res.status(400).json({ message: 'Invalid ticket ID' });
  }

  const history = await TicketStatusHistory.getByTicketId(id);

  res.json({ history });
});

// GET /api/ticketStatusHistory/:ticketId/statistics - Получить статистику по статусам
const getStatusStatistics = asyncHandler(async (req, res) => {
  const { ticketId } = req.params;
  const id = parseInt(ticketId, 10);

  if (isNaN(id)) {
    return res.status(400).json({ message: 'Invalid ticket ID' });
  }

  const statistics = await TicketStatusHistory.getStatusStatistics(id);

  res.json({ statistics });
});

module.exports = {
  getStatusHistory,
  getStatusStatistics,
};
