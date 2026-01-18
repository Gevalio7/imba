const { pool } = require('../config/db');
  
  class EmailAddresses {
    static tableName = 'email_addresses';
    static fields = 'name, message, status, isActive';
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
      const countQuery = `SELECT COUNT(*) as total FROM ${EmailAddresses.tableName} ${whereClause}`;
      const countResult = await pool.query(countQuery, params);
      const total = parseInt(countResult.rows[0].total);

      // Get paginated data
      const dataQuery = `SELECT id, ${this.fields}, created_at as "createdAt", updated_at as "updatedAt", status, is_active as "isActive" FROM ${EmailAddresses.tableName} ${whereClause} ${orderClause} LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(itemsPerPage, offset);
      const dataResult = await pool.query(dataQuery, params);

      return {
        email_addresses: dataResult.rows,
        total,
      };
    } catch (error) {
      console.error('Error in getAll:', error);
      throw error;
    }
  }

  static async getById(id) {
    try {
      const result = await pool.query(`SELECT id, ${this.fields}, created_at as "createdAt", updated_at as "updatedAt", status, is_active as "isActive" FROM ${EmailAddresses.tableName} WHERE id = $1`, [id]);

      return result.rows[0] || null;
    } catch (error) {
      console.error('Error in getById:', error);
      throw error;
    }
  }

  static async create(emailaddresse) {
    try {
      const fieldList = this.fields.split(', ');
      const placeholders = fieldList.map((_, i) => `$${i + 1}`).join(', ');
      const values = fieldList.map(field => emailaddresse[field]);
      values.push(emailaddresse.status || 1, emailaddresse.isActive !== undefined ? emailaddresse.isActive : true);
      const result = await pool.query(`INSERT INTO ${EmailAddresses.tableName} (${this.fields}, status, is_active) VALUES (${placeholders}, $${fieldList.length + 1}, $${fieldList.length + 2}) RETURNING id, ${this.fields}, created_at as "createdAt", updated_at as "updatedAt", status, is_active as "isActive"`, values);

      return result.rows[0];
    } catch (error) {
      console.error('Error in create:', error);
      throw error;
    }
  }

  static async update(id, emailaddresse) {
    try {
      const fieldList = this.fields.split(', ');
      const setClause = fieldList.map((field, i) => `${field} = $${i + 1}`).join(', ');
      const values = fieldList.map(field => emailaddresse[field]);
      values.push(emailaddresse.status !== undefined ? emailaddresse.status : undefined, emailaddresse.isActive !== undefined ? emailaddresse.isActive : undefined, id);
      const result = await pool.query(`UPDATE ${EmailAddresses.tableName} SET ${setClause}${emailaddresse.status !== undefined ? ', status = $${fieldList.length + 1}' : ''}${emailaddresse.isActive !== undefined ? ', is_active = $${fieldList.length + ' + (emailaddresse.status !== undefined ? 2 : 1) + '}' : ''}, updated_at = CURRENT_TIMESTAMP WHERE id = $${fieldList.length + ' + (emailaddresse.status !== undefined && emailaddresse.isActive !== undefined ? 3 : emailaddresse.status !== undefined || emailaddresse.isActive !== undefined ? 2 : 1) + '} RETURNING id, ${this.fields}, created_at as "createdAt", updated_at as "updatedAt", status, is_active as "isActive"`, values);

      return result.rows[0] || null;
    } catch (error) {
      console.error('Error in update:', error);
      throw error;
    }
  }

  static async delete(id) {
    try {
      const result = await pool.query(`DELETE FROM ${EmailAddresses.tableName} WHERE id = $1`, [id]);

      return result.rowCount > 0;
    } catch (error) {
      console.error('Error in delete:', error);
      throw error;
    }
  }
}

module.exports = EmailAddresses;
