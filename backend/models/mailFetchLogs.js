const { pool } = require('../config/db');

class MailFetchLogs {
  static tableName = 'mail_fetch_logs';

  static async create(entry) {
    const query = `INSERT INTO ${MailFetchLogs.tableName} (mail_account_id, started_at, finished_at, emails_found, tickets_created, errors) VALUES ($1, $2, $3, $4, $5, $6)`;
    const values = [entry.mail_account_id, entry.started_at, entry.finished_at, entry.emails_found, entry.tickets_created, entry.errors];
    try {
      await pool.query(query, values);
      return true;
    } catch (err) {
      console.error('Error inserting mail fetch log', err);
      return false;
    }
  }
}

module.exports = MailFetchLogs;