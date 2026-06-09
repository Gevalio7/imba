const { pool } = require('../config/db')

class MailFetchLogs {
  static tableName = 'mail_fetch_logs'

   static async create(entry) {
     const query = `INSERT INTO ${MailFetchLogs.tableName} (mail_account_id, started_at, finished_at, emails_found, tickets_created, errors) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`
     // Map from entry fields to table columns
     const values = [
       entry.mail_account_id || entry.account_id || null,
       entry.started_at || new Date(),
       entry.finished_at || null,
       entry.emails_found || 0,
       entry.tickets_created || 0,
       entry.errors || entry.error_message || null
     ]
     try {
       const res = await pool.query(query, values)

       return res.rows[0] || null
     }
     catch (err) {
       console.error('[MailFetchLogs.create] SQL ERROR:', err.message)
       console.error('[MailFetchLogs.create] Values:', JSON.stringify(values))
       throw err
     }
   }

  static async getAll(options = {}) {
    const { q, page = 1, itemsPerPage = 10, sortBy = 'started_at', orderBy = 'desc', mailAccountId, fromDate, toDate } = options
    try {
      const offset = (page - 1) * itemsPerPage
      const params = []
      let where = ''
      let paramIndex = 1

      const conditions = []

      if (q) {
        conditions.push(`(m.errors ILIKE $${paramIndex} OR p.name ILIKE $${paramIndex})`)
        params.push(`%${q}%`)
        paramIndex++
      }

      if (mailAccountId) {
        conditions.push(`m.mail_account_id = $${paramIndex}`)
        params.push(mailAccountId)
        paramIndex++
      }

      if (fromDate) {
        conditions.push(`m.started_at >= $${paramIndex}`)
        params.push(fromDate)
        paramIndex++
      }

      if (toDate) {
        conditions.push(`m.started_at <= $${paramIndex}`)
        params.push(toDate)
        paramIndex++
      }

      if (conditions.length > 0) {
        where = `WHERE ${conditions.join(' AND ')}`
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

  static async getStats(options = {}) {
    const { mailAccountId, fromDate, toDate } = options
    const params = []
    let where = ''
    let paramIndex = 1

    const conditions = []

    if (mailAccountId) {
      conditions.push(`m.mail_account_id = $${paramIndex}`)
      params.push(mailAccountId)
      paramIndex++
    }

    if (fromDate) {
      conditions.push(`m.started_at >= $${paramIndex}`)
      params.push(fromDate)
      paramIndex++
    }

    if (toDate) {
      conditions.push(`m.started_at <= $${paramIndex}`)
      params.push(toDate)
      paramIndex++
    }

    if (conditions.length > 0) {
      where = `WHERE ${conditions.join(' AND ')}`
    }

    const query = `
      SELECT 
        COUNT(*) as total_runs,
        COALESCE(SUM(m.emails_found), 0) as total_emails_found,
        COALESCE(SUM(m.tickets_created), 0) as total_tickets_created,
        COALESCE(SUM(CASE WHEN m.errors IS NOT NULL AND m.errors != '' THEN 1 ELSE 0 END), 0) as runs_with_errors,
        MIN(m.started_at) as first_run,
        MAX(m.started_at) as last_run
      FROM ${MailFetchLogs.tableName} m
      ${where}
    `

    try {
      const res = await pool.query(query, params)
      return res.rows[0] || {}
    }
    catch (err) {
      console.error('Error in MailFetchLogs.getStats', err)
      throw err
    }
  }
}

module.exports = MailFetchLogs
