const { pool } = require('../config/db');

class TicketStatusHistory {
  static tableName = 'ticket_status_history';

  /**
   * Получить историю переходов статусов для тикета
   * @param {number} ticketId - ID тикета
   * @returns {Array} Массив записей истории переходов
   */
  static async getByTicketId(ticketId) {
    try {
      const result = await pool.query(
        `SELECT 
          tsh.id,
          tsh.ticket_id as "ticketId",
          tsh.from_status_id as "fromStatusId",
          tsh.to_status_id as "toStatusId",
          tsh.changed_by as "changedBy",
          COALESCE(tsh.transition_time, tsh.created_at) as "transitionTime",
          tsh.time_in_previous_status as "timeInPreviousStatus",
          tsh.action_label as "actionLabel",
          tsh.comment,
          tsh.created_at as "createdAt",
          fs.name as "fromStatusName",
          fs.color as "fromStatusColor",
          ts.name as "toStatusName",
          ts.color as "toStatusColor",
          a.first_name || ' ' || a.last_name as "changedByName"
        FROM ${TicketStatusHistory.tableName} tsh
        LEFT JOIN states fs ON tsh.from_status_id = fs.id
        LEFT JOIN states ts ON tsh.to_status_id = ts.id
        LEFT JOIN agents a ON tsh.changed_by = a.id
        WHERE tsh.ticket_id = $1
        ORDER BY COALESCE(tsh.transition_time, tsh.created_at) DESC`,
        [ticketId]
      );

      return result.rows;
    } catch (error) {
      console.error('Error in getByTicketId:', error);
      throw error;
    }
  }

  /**
   * Получить последний переход для тикета
   * @param {number} ticketId - ID тикета
   * @returns {Object|null} Последняя запись перехода
   */
  static async getLastTransition(ticketId) {
    try {
      const result = await pool.query(
        `SELECT 
          tsh.id,
          tsh.ticket_id as "ticketId",
          tsh.from_status_id as "fromStatusId",
          tsh.to_status_id as "toStatusId",
          tsh.changed_by as "changedBy",
          COALESCE(tsh.transition_time, tsh.created_at) as "transitionTime",
          tsh.time_in_previous_status as "timeInPreviousStatus",
          tsh.action_label as "actionLabel"
        FROM ${TicketStatusHistory.tableName} tsh
        WHERE tsh.ticket_id = $1
        ORDER BY COALESCE(tsh.transition_time, tsh.created_at) DESC
        LIMIT 1`,
        [ticketId]
      );

      return result.rows[0] || null;
    } catch (error) {
      console.error('Error in getLastTransition:', error);
      throw error;
    }
  }

  /**
   * Записать переход статуса
   * @param {Object} data - Данные перехода
   * @returns {Object} Созданная запись
   */
  static async create(data) {
    try {
      const { ticketId, fromStatusId, toStatusId, changedBy, timeInPreviousStatus, actionLabel } = data;

      const result = await pool.query(
        `INSERT INTO ${TicketStatusHistory.tableName} (
          ticket_id, from_status_id, to_status_id, changed_by, 
          time_in_previous_status, action_label
        ) 
        VALUES ($1, $2, $3, $4, $5, $6) 
        RETURNING 
          id, 
          ticket_id as "ticketId",
          from_status_id as "fromStatusId",
          to_status_id as "toStatusId",
          changed_by as "changedBy",
          transition_time as "transitionTime",
          time_in_previous_status as "timeInPreviousStatus",
          action_label as "actionLabel",
          created_at as "createdAt"`,
        [ticketId, fromStatusId || null, toStatusId, changedBy || null, timeInPreviousStatus || null, actionLabel || null]
      );

      return result.rows[0];
    } catch (error) {
      console.error('Error in create:', error);
      throw error;
    }
  }

  /**
   * Записать переход статуса с автоматическим расчётом времени в предыдущем статусе
   * @param {number} ticketId - ID тикета
   * @param {number|null} fromStatusId - Исходный статус
   * @param {number} toStatusId - Новый статус
   * @param {number|null} changedBy - ID пользователя, изменившего статус
   * @param {string|null} actionLabel - Метка действия из workflow
   * @returns {Object} Созданная запись
   */
  static async recordTransition(ticketId, fromStatusId, toStatusId, changedBy, actionLabel = null) {
    try {
      // Получаем последний переход для расчёта времени
      const lastTransition = await TicketStatusHistory.getLastTransition(ticketId);
      
      let timeInPreviousStatus = null;
      if (lastTransition) {
        // Вычисляем интервал между текущим временем и временем последнего перехода
        const result = await pool.query(
          `SELECT $1::timestamp with time zone - $2::timestamp with time zone as interval`,
          [new Date().toISOString(), lastTransition.transitionTime.toISOString()]
        );
        timeInPreviousStatus = result.rows[0].interval;
      }

      return await TicketStatusHistory.create({
        ticketId,
        fromStatusId,
        toStatusId,
        changedBy,
        timeInPreviousStatus,
        actionLabel,
      });
    } catch (error) {
      console.error('Error in recordTransition:', error);
      throw error;
    }
  }

  /**
   * Получить статистику по статусам для тикета
   * @param {number} ticketId - ID тикета
   * @returns {Array} Статистика по времени в каждом статусе
   */
  static async getStatusStatistics(ticketId) {
    try {
      const result = await pool.query(
        `SELECT 
          ts.id as "statusId",
          ts.name as "statusName",
          ts.color as "statusColor",
          SUM(EXTRACT(EPOCH FROM tsh.time_in_previous_status)) as "totalSeconds",
          COUNT(tsh.id) as "visitCount"
        FROM ${TicketStatusHistory.tableName} tsh
        JOIN states ts ON tsh.to_status_id = ts.id
        WHERE tsh.ticket_id = $1 AND tsh.time_in_previous_status IS NOT NULL
        GROUP BY ts.id, ts.name, ts.color
        ORDER BY totalSeconds DESC`,
        [ticketId]
      );

      return result.rows;
    } catch (error) {
      console.error('Error in getStatusStatistics:', error);
      throw error;
    }
  }

  /**
   * Удалить историю переходов для тикета
   * @param {number} ticketId - ID тикета
   * @returns {boolean} Успешность удаления
   */
  static async deleteByTicketId(ticketId) {
    try {
      const result = await pool.query(
        `DELETE FROM ${TicketStatusHistory.tableName} WHERE ticket_id = $1`,
        [ticketId]
      );

      return result.rowCount > 0;
    } catch (error) {
      console.error('Error in deleteByTicketId:', error);
      throw error;
    }
  }
}

module.exports = TicketStatusHistory;
