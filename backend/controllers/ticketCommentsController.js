const TicketComments = require('../models/ticketComments')
const Tickets = require('../models/tickets')
const Queues = require('../models/queues')
const notificationService = require('../services/notificationService')
const { asyncHandler } = require('../middleware/errorHandler')

const getAll = asyncHandler(async (req, res) => {
  const { ticketId, q, sortBy, orderBy, itemsPerPage, page } = req.query

  const result = await TicketComments.getAll({
    ticketId,
    q,
    sortBy,
    orderBy,
    itemsPerPage: itemsPerPage ? Number.parseInt(itemsPerPage) : 100,
    page: page ? Number.parseInt(page) : 1,
  })

  res.json(result)
})

const getById = asyncHandler(async (req, res) => {
  const comment = await TicketComments.getById(req.params.id)
  if (!comment)
    return res.status(404).json({ error: 'Comment not found' })

  res.json(comment)
})

const create = asyncHandler(async (req, res) => {
  const comment = await TicketComments.create(req.body)

  // =====================================================
  // Уведомление при добавлении комментария агентом
  // =====================================================
  if (comment.ticketId && comment.authorId && !comment.isInternal) {
    try {
      const ticket = await Tickets.getById(comment.ticketId)
      if (ticket && ticket.queueId) {
        const queue = await Queues.getById(ticket.queueId)
        if (queue && queue.templateCommentTicketId) {
          // Получить имя автора
          const author = comment.authorName || comment.authorLogin || `Agent #${comment.authorId}`

notificationService.sendTicketNotification(ticket, queue, queue.templateCommentTicketId, {
            event: 'agent_reply',
            comment: {
              text: comment.content,
              author: author,
              content: comment.content,
            },
          }).catch(err => {
            console.warn('[TICKET_COMMENTS] Failed to queue comment notification:', err.message)
          })
        }
      }
    } catch (notifyErr) {
      console.warn('[TICKET_COMMENTS] Failed to send comment notification:', notifyErr.message)
    }
  }

  res.status(201).json(comment)
})

const update = asyncHandler(async (req, res) => {
  const comment = await TicketComments.update(req.params.id, req.body)
  if (!comment)
    return res.status(404).json({ error: 'Comment not found' })

  res.json(comment)
})

const remove = asyncHandler(async (req, res) => {
  const deleted = await TicketComments.delete(req.params.id)
  if (!deleted)
    return res.status(404).json({ error: 'Comment not found' })

  res.json({ success: true })
})

module.exports = {
  getAll,
  getById,
  create,
  update,
  remove,
}