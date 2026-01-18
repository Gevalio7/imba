const { pool } = require('../config/db');
  
  class WebServices {
    static tableName = 'web_services';
    static fields = 'name, description, endpoint, method, isActive, lastTested, status';
  static async getAll(options = {}) {
    const { q, sortBy, orderBy = 'asc', itemsPerPage = 10, page = 1 } = options;

    try {
      let whereClause = '';
      let params = [];
      let paramIndex = 1;

      if (q) {
        const searchFields = this.fields.split(', ');
        const conditions = searchFields.map(field => field + ' ILIKE $' + paramIndex).join(' OR ');
        whereClause = "WHERE " + conditions;
        params.push('%' + q + '%');
        paramIndex++;
      }

      let orderClause = '';
      const sortableFields = this.fields.split(', ').concat(['created_at', 'updated_at']);
      if (sortBy && sortableFields.includes(sortBy)) {
        orderClause = `ORDER BY ${sortBy} ${orderBy === 'desc' ? 'DESC' : 'ASC'}`;
      }

      const offset = (page - 1) * itemsPerPage;

      // Get total count
      const countQuery = `SELECT COUNT(*) as total FROM ${WebServices.tableName} ${whereClause}`;
      const countResult = await pool.query(countQuery, params);
      const total = parseInt(countResult.rows[0].total);

      // Get paginated data
      const dataQuery = `SELECT id, ${this.fields}, created_at as "createdAt", updated_at as "updatedAt", status, is_active as "isActive" FROM ${WebServices.tableName} ${whereClause} ${orderClause} LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(itemsPerPage, offset);
      const dataResult = await pool.query(dataQuery, params);

      return {
        web_services: dataResult.rows,
        total,
      };
    } catch (error) {
      console.error('Error in getAll:', error);
      throw error;
    }
  }

  static async getById(id) {
    try {
      const result = await pool.query(`SELECT id, ${this.fields}, created_at as "createdAt", updated_at as "updatedAt", status, is_active as "isActive" FROM ${WebServices.tableName} WHERE id = $1`, [id]);

      return result.rows[0] || null;
    } catch (error) {
      console.error('Error in getById:', error);
      throw error;
    }
  }

  static async create(webservice) {
    try {
      const fieldList = this.fields.split(', ');
      const placeholders = fieldList.map((_, i) => `$${i + 1}`).join(', ');
      const values = fieldList.map(field => webservice[field]);
      values.push(webservice.status || 1, webservice.isActive !== undefined ? webservice.isActive : true);
      const result = await pool.query(`INSERT INTO ${WebServices.tableName} (${this.fields}, status, is_active) VALUES (${placeholders}, $${fieldList.length + 1}, $${fieldList.length + 2}) RETURNING id, ${this.fields}, created_at as "createdAt", updated_at as "updatedAt", status, is_active as "isActive"`, values);

      return result.rows[0];
    } catch (error) {
      console.error('Error in create:', error);
      throw error;
    }
  }

  static async update(id, webservice) {
    try {
      const fieldList = this.fields.split(', ');
      const setClause = fieldList.map((field, i) => `${field} = $${i + 1}`).join(', ');
      const values = fieldList.map(field => webservice[field]);
      values.push(webservice.status !== undefined ? webservice.status : undefined, webservice.isActive !== undefined ? webservice.isActive : undefined, id);
      const result = await pool.query(`UPDATE ${WebServices.tableName} SET ${setClause}${webservice.status !== undefined ? ', status = $${fieldList.length + 1}' : ''}${webservice.isActive !== undefined ? ', is_active = $${fieldList.length + ' + (webservice.status !== undefined ? 2 : 1) + '}' : ''}, updated_at = CURRENT_TIMESTAMP WHERE id = $${fieldList.length + ' + (webservice.status !== undefined && webservice.isActive !== undefined ? 3 : webservice.status !== undefined || webservice.isActive !== undefined ? 2 : 1) + '} RETURNING id, ${this.fields}, created_at as "createdAt", updated_at as "updatedAt", status, is_active as "isActive"`, values);

      return result.rows[0] || null;
    } catch (error) {
      console.error('Error in update:', error);
      throw error;
    }
  }

  static async delete(id) {
    try {
      const result = await pool.query(`DELETE FROM ${WebServices.tableName} WHERE id = $1`, [id]);

      return result.rowCount > 0;
    } catch (error) {
      console.error('Error in delete:', error);
      throw error;
    }
  }
}

module.exports = WebServices;
