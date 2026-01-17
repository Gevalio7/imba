const { pool } = require('../config/db');
  
  class ProcessesAutomationSettings {
    static tableName = 'processes_automation_settings';
    static fields = 'name, description';
  static async getAll(options = {}) {
    const { q, sortBy, orderBy = 'asc', itemsPerPage = 10, page = 1 } = options;

    try {
      let whereClause = '';
      let params = [];
      let paramIndex = 1;

      if (q) {
        const fieldList = this.fields.split(', ');
        whereClause = `WHERE ${fieldList[0]} ILIKE $1 OR ${fieldList[1]} ILIKE $1`;
        params.push(`%${q}%`);
        paramIndex++;
      }

      let orderClause = '';
      const sortableFields = this.fields.split(', ').concat(['created_at', 'updated_at']);
      if (sortBy && sortableFields.includes(sortBy)) {
        orderClause = `ORDER BY ${sortBy} ${orderBy === 'desc' ? 'DESC' : 'ASC'}`;
      }

      const offset = (page - 1) * itemsPerPage;

      // Get total count
      const countQuery = `SELECT COUNT(*) as total FROM ${ProcessesAutomationSettings.tableName} ${whereClause}`;
      const countResult = await pool.query(countQuery, params);
      const total = parseInt(countResult.rows[0].total);

      // Get paginated data
      const dataQuery = `SELECT id, ${this.fields}, created_at as "createdAt", updated_at as "updatedAt", status, is_active as "isActive" FROM ${ProcessesAutomationSettings.tableName} ${whereClause} ${orderClause} LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(itemsPerPage, offset);
      const dataResult = await pool.query(dataQuery, params);

      return {
        processes_automation_settings: dataResult.rows,
        total,
      };
    } catch (error) {
      console.error('Error in getAll:', error);
      throw error;
    }
  }

  static async getById(id) {
    try {
      const result = await pool.query(`SELECT id, ${this.fields}, created_at as "createdAt", updated_at as "updatedAt", status, is_active as "isActive" FROM ${ProcessesAutomationSettings.tableName} WHERE id = $1`, [id]);

      return result.rows[0] || null;
    } catch (error) {
      console.error('Error in getById:', error);
      throw error;
    }
  }

  static async create(processesautomationsetting) {
    try {
      const fieldList = this.fields.split(', ');
      const result = await pool.query(`INSERT INTO ${ProcessesAutomationSettings.tableName} (${this.fields}, status, is_active) VALUES ($1, $2, $3, $4) RETURNING id, ${this.fields}, created_at as "createdAt", updated_at as "updatedAt", status, is_active as "isActive"`, [processesautomationsetting[fieldList[0]], processesautomationsetting[fieldList[1]], processesautomationsetting.status, processesautomationsetting.isActive]);

      return result.rows[0];
    } catch (error) {
      console.error('Error in create:', error);
      throw error;
    }
  }

  static async update(id, processesautomationsetting) {
    try {
      const fieldList = this.fields.split(', ');
      const result = await pool.query(`UPDATE ${ProcessesAutomationSettings.tableName} SET ${fieldList[0]} = $1, ${fieldList[1]} = $2, status = $3, is_active = $4, updated_at = CURRENT_TIMESTAMP WHERE id = $5 RETURNING id, ${this.fields}, created_at as "createdAt", updated_at as "updatedAt", status, is_active as "isActive"`, [processesautomationsetting[fieldList[0]], processesautomationsetting[fieldList[1]], processesautomationsetting.status, processesautomationsetting.isActive, id]);

      return result.rows[0] || null;
    } catch (error) {
      console.error('Error in update:', error);
      throw error;
    }
  }

  static async delete(id) {
    try {
      const result = await pool.query(`DELETE FROM ${ProcessesAutomationSettings.tableName} WHERE id = $1`, [id]);

      return result.rowCount > 0;
    } catch (error) {
      console.error('Error in delete:', error);
      throw error;
    }
  }
}

module.exports = ProcessesAutomationSettings;
