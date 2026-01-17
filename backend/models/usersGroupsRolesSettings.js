const { pool } = require('../config/db');
  
  class UsersGroupsRolesSettings {
    static tableName = 'users_groups_roles_settings';
  static async getAll(options = {}) {
    const { q, sortBy, orderBy = 'asc', itemsPerPage = 10, page = 1 } = options;

    try {
      let whereClause = '';
      let params = [];
      let paramIndex = 1;

      if (q) {
        whereClause = 'WHERE name ILIKE $1 OR description ILIKE $1';
        params.push(`%${q}%`);
        paramIndex++;
      }

      let orderClause = '';
      if (sortBy && ['name', 'description', 'created_at', 'updated_at'].includes(sortBy)) {
        orderClause = `ORDER BY ${sortBy} ${orderBy === 'desc' ? 'DESC' : 'ASC'}`;
      }

      const offset = (page - 1) * itemsPerPage;

      // Get total count
      const countQuery = `SELECT COUNT(*) as total FROM ${UsersGroupsRolesSettings.tableName} ${whereClause}`;
      const countResult = await pool.query(countQuery, params);
      const total = parseInt(countResult.rows[0].total);

      // Get paginated data
      const dataQuery = `SELECT id, name, description, created_at as "createdAt", updated_at as "updatedAt", status, is_active as "isActive" FROM ${UsersGroupsRolesSettings.tableName} ${whereClause} ${orderClause} LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(itemsPerPage, offset);
      const dataResult = await pool.query(dataQuery, params);

      return {
        users_groups_roles_settings: dataResult.rows,
        total,
      };
    } catch (error) {
      console.error('Error in getAll:', error);
      throw error;
    }
  }

  static async getById(id) {
    try {
      const result = await pool.query(`SELECT id, name, description, created_at as "createdAt", updated_at as "updatedAt", status, is_active as "isActive" FROM ${UsersGroupsRolesSettings.tableName} WHERE id = $1`, [id]);

      return result.rows[0] || null;
    } catch (error) {
      console.error('Error in getById:', error);
      throw error;
    }
  }

  static async create(usersgroupsrolessetting) {
    try {
      const result = await pool.query(`INSERT INTO ${UsersGroupsRolesSettings.tableName} (name, description, status, is_active) VALUES ($1, $2, $3, $4) RETURNING id, name, description, created_at as "createdAt", updated_at as "updatedAt", status, is_active as "isActive"`, [usersgroupsrolessetting.name, usersgroupsrolessetting.description, usersgroupsrolessetting.status, usersgroupsrolessetting.isActive]);

      return result.rows[0];
    } catch (error) {
      console.error('Error in create:', error);
      throw error;
    }
  }

  static async update(id, usersgroupsrolessetting) {
    try {
      const result = await pool.query(`UPDATE ${UsersGroupsRolesSettings.tableName} SET name = $1, description = $2, status = $3, is_active = $4, updated_at = CURRENT_TIMESTAMP WHERE id = $5 RETURNING id, name, description, created_at as "createdAt", updated_at as "updatedAt", status, is_active as "isActive"`, [usersgroupsrolessetting.name, usersgroupsrolessetting.description, usersgroupsrolessetting.status, usersgroupsrolessetting.isActive, id]);

      return result.rows[0] || null;
    } catch (error) {
      console.error('Error in update:', error);
      throw error;
    }
  }

  static async delete(id) {
    try {
      const result = await pool.query(`DELETE FROM ${UsersGroupsRolesSettings.tableName} WHERE id = $1`, [id]);

      return result.rowCount > 0;
    } catch (error) {
      console.error('Error in delete:', error);
      throw error;
    }
  }
}

module.exports = UsersGroupsRolesSettings;
