const { pool } = require('../config/db')

class MailFetchLogs {
  static tableName = 'mail_fetch_logs'

  static async create(entry) {
    const query = `INSERT INTO ${MailFetchLogs.tableName} (mail_account_id, started_at, finished_at, emails_found, tickets_created, errors) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`
    const values = [entry.mail_account_id, entry.started_at, entry.finished_at, entry.emails_found, entry.tickets_created, entry.errors]
    try {
      const res = await pool.query(query, values)

      return res.rows[0] || null
    }
    catch (err) {
      console.error('Error inserting mail fetch log', err)

      return null
    }
  }

  static async getAll(options = {}) {
    const { q, page = 1, itemsPerPage = 10, sortBy = 'started_at', orderBy = 'desc' } = options
    try {
      const offset = (page - 1) * itemsPerPage
      const params = []
      let where = ''
      let paramIndex = 1

      if (q) {
        where = `WHERE m.errors ILIKE $${paramIndex} OR p.name ILIKE $${paramIndex} `
        params.push(`%${q}%`)
        paramIndex++
      }

      const order = `ORDER BY ${sortBy} ${orderBy.toUpperCase() === 'DESC' ? 'DESC' : 'ASC'}`

      const dataQuery = `
        SELECT m.id, m.mail_account_id, p.name as mail_account_name, m.started_at, m.finished_at, m.emails_found, m.tickets_created, 
          CASE WHEN char_length(m.errors) > 100 THEN substring(m.errors for 100) || '...' ELSE m.errors END as errors_preview
        FROM ${MailFetchLogs.tableName} m
        LEFT JOIN post_master_mail_accounts p ON p.id = m.mail_account_id
        ${where}
        ${order}
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `

      params.push(itemsPerPage, offset)

      const dataRes = await pool.query(dataQuery, params)

      const countQuery = `SELECT COUNT(*) as total FROM ${MailFetchLogs.tableName} m ${where}`
      const countRes = await pool.query(countQuery, params.slice(0, paramIndex - 1))
      const total = Number.parseInt(countRes.rows[0].total, 10) || 0

      return {
        mailFetchLogs: dataRes.rows,
        total,
      }
    }
    catch (err) {
      console.error('Error in MailFetchLogs.getAll', err)
      throw err
    }
  }

  static async getById(id) {
    try {
      const query = `SELECT m.*, p.name as mail_account_name FROM ${MailFetchLogs.tableName} m LEFT JOIN post_master_mail_accounts p ON p.id = m.mail_account_id WHERE m.id = $1`
      const res = await pool.query(query, [id])

      return res.rows[0] || null
    }
    catch (err) {
      console.error('Error in MailFetchLogs.getById', err)
      throw err
    }
  }
}

module.exports = MailFetchLogs
