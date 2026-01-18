const { pool } = require('../config/db');
  
  class SmimeCertificates {
    static tableName = 'smime_certificates';
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
      const countQuery = `SELECT COUNT(*) as total FROM ${SmimeCertificates.tableName} ${whereClause}`;
      const countResult = await pool.query(countQuery, params);
      const total = parseInt(countResult.rows[0].total);

      // Get paginated data
      const dataQuery = `SELECT id, ${this.fields}, created_at as "createdAt", updated_at as "updatedAt", status, is_active as "isActive" FROM ${SmimeCertificates.tableName} ${whereClause} ${orderClause} LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(itemsPerPage, offset);
      const dataResult = await pool.query(dataQuery, params);

      return {
        smime_certificates: dataResult.rows,
        total,
      };
    } catch (error) {
      console.error('Error in getAll:', error);
      throw error;
    }
  }

  static async getById(id) {
    try {
      const result = await pool.query(`SELECT id, ${this.fields}, created_at as "createdAt", updated_at as "updatedAt", status, is_active as "isActive" FROM ${SmimeCertificates.tableName} WHERE id = $1`, [id]);

      return result.rows[0] || null;
    } catch (error) {
      console.error('Error in getById:', error);
      throw error;
    }
  }

  static async create(smimecertificate) {
    try {
      const fieldList = this.fields.split(', ');
      const placeholders = fieldList.map((_, i) => `$${i + 1}`).join(', ');
      const values = fieldList.map(field => smimecertificate[field]);
      values.push(smimecertificate.status || 1, smimecertificate.isActive !== undefined ? smimecertificate.isActive : true);
      const result = await pool.query(`INSERT INTO ${SmimeCertificates.tableName} (${this.fields}, status, is_active) VALUES (${placeholders}, $${fieldList.length + 1}, $${fieldList.length + 2}) RETURNING id, ${this.fields}, created_at as "createdAt", updated_at as "updatedAt", status, is_active as "isActive"`, values);

      return result.rows[0];
    } catch (error) {
      console.error('Error in create:', error);
      throw error;
    }
  }

  static async update(id, smimecertificate) {
    try {
      const fieldList = this.fields.split(', ');
      const setClause = fieldList.map((field, i) => `${field} = $${i + 1}`).join(', ');
      const values = fieldList.map(field => smimecertificate[field]);
      values.push(smimecertificate.status !== undefined ? smimecertificate.status : undefined, smimecertificate.isActive !== undefined ? smimecertificate.isActive : undefined, id);
      const result = await pool.query(`UPDATE ${SmimeCertificates.tableName} SET ${setClause}${smimecertificate.status !== undefined ? ', status = $${fieldList.length + 1}' : ''}${smimecertificate.isActive !== undefined ? ', is_active = $${fieldList.length + ' + (smimecertificate.status !== undefined ? 2 : 1) + '}' : ''}, updated_at = CURRENT_TIMESTAMP WHERE id = $${fieldList.length + ' + (smimecertificate.status !== undefined && smimecertificate.isActive !== undefined ? 3 : smimecertificate.status !== undefined || smimecertificate.isActive !== undefined ? 2 : 1) + '} RETURNING id, ${this.fields}, created_at as "createdAt", updated_at as "updatedAt", status, is_active as "isActive"`, values);

      return result.rows[0] || null;
    } catch (error) {
      console.error('Error in update:', error);
      throw error;
    }
  }

  static async delete(id) {
    try {
      const result = await pool.query(`DELETE FROM ${SmimeCertificates.tableName} WHERE id = $1`, [id]);

      return result.rowCount > 0;
    } catch (error) {
      console.error('Error in delete:', error);
      throw error;
    }
  }
}

module.exports = SmimeCertificates;
