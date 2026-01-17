const { pool } = require('../config/db');
  
  class CustomerUsersServices {
    static tableName = 'customer_users_services';
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
      const countQuery = `SELECT COUNT(*) as total FROM ${CustomerUsersServices.tableName} ${whereClause}`;
      const countResult = await pool.query(countQuery, params);
      const total = parseInt(countResult.rows[0].total);

      // Get paginated data
      const dataQuery = `SELECT id, name, description, created_at as "createdAt", updated_at as "updatedAt", status, is_active as "isActive" FROM ${CustomerUsersServices.tableName} ${whereClause} ${orderClause} LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(itemsPerPage, offset);
      const dataResult = await pool.query(dataQuery, params);

      return {
        customer_users_services: dataResult.rows,
        total,
      };
    } catch (error) {
      console.error('Error in getAll:', error);
      throw error;
    }
  }

  static async getById(id) {
    try {
      const result = await pool.query(`SELECT id, name, description, created_at as "createdAt", updated_at as "updatedAt", status, is_active as "isActive" FROM ${CustomerUsersServices.tableName} WHERE id = $1`, [id]);

      return result.rows[0] || null;
    } catch (error) {
      console.error('Error in getById:', error);
      throw error;
    }
  }

  static async create(customerusersservice) {
    try {
      const result = await pool.query(`INSERT INTO ${CustomerUsersServices.tableName} (name, description, status, is_active) VALUES ($1, $2, $3, $4) RETURNING id, name, description, created_at as "createdAt", updated_at as "updatedAt", status, is_active as "isActive"`, [customerusersservice.name, customerusersservice.description, customerusersservice.status, customerusersservice.isActive]);

      return result.rows[0];
    } catch (error) {
      console.error('Error in create:', error);
      throw error;
    }
  }

  static async update(id, customerusersservice) {
    try {
      const result = await pool.query(`UPDATE ${CustomerUsersServices.tableName} SET name = $1, description = $2, status = $3, is_active = $4, updated_at = CURRENT_TIMESTAMP WHERE id = $5 RETURNING id, name, description, created_at as "createdAt", updated_at as "updatedAt", status, is_active as "isActive"`, [customerusersservice.name, customerusersservice.description, customerusersservice.status, customerusersservice.isActive, id]);

      return result.rows[0] || null;
    } catch (error) {
      console.error('Error in update:', error);
      throw error;
    }
  }

  static async delete(id) {
    try {
      const result = await pool.query(`DELETE FROM ${CustomerUsersServices.tableName} WHERE id = $1`, [id]);

      return result.rowCount > 0;
    } catch (error) {
      console.error('Error in delete:', error);
      throw error;
    }
  }
}

module.exports = CustomerUsersServices;
