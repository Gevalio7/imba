const { pool } = require('../config/db');
  
  class RolesGroups {
    static tableName = 'roles_groups';
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
      const countQuery = `SELECT COUNT(*) as total FROM ${RolesGroups.tableName} ${whereClause}`;
      const countResult = await pool.query(countQuery, params);
      const total = parseInt(countResult.rows[0].total);

      // Get paginated data
      const dataQuery = `SELECT id, ${this.fields}, created_at as "createdAt", updated_at as "updatedAt", status, is_active as "isActive" FROM ${RolesGroups.tableName} ${whereClause} ${orderClause} LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(itemsPerPage, offset);
      const dataResult = await pool.query(dataQuery, params);

      return {
        roles_groups: dataResult.rows,
        total,
      };
    } catch (error) {
      console.error('Error in getAll:', error);
      throw error;
    }
  }

  static async getById(id) {
    try {
      const result = await pool.query(`SELECT id, ${this.fields}, created_at as "createdAt", updated_at as "updatedAt", status, is_active as "isActive" FROM ${RolesGroups.tableName} WHERE id = $1`, [id]);

      return result.rows[0] || null;
    } catch (error) {
      console.error('Error in getById:', error);
      throw error;
    }
  }

  static async create(rolesgroup) {
    try {
      const fieldList = this.fields.split(', ');
      const placeholders = fieldList.map((_, i) => `$${i + 1}`).join(', ');
      const values = fieldList.map(field => rolesgroup[field]);
      values.push(rolesgroup.status || 1, rolesgroup.isActive !== undefined ? rolesgroup.isActive : true);
      const result = await pool.query(`INSERT INTO ${RolesGroups.tableName} (${this.fields}, status, is_active) VALUES (${placeholders}, $${fieldList.length + 1}, $${fieldList.length + 2}) RETURNING id, ${this.fields}, created_at as "createdAt", updated_at as "updatedAt", status, is_active as "isActive"`, values);

      return result.rows[0];
    } catch (error) {
      console.error('Error in create:', error);
      throw error;
    }
  }

  static async update(id, rolesgroup) {
    try {
      const fieldList = this.fields.split(', ');
      const setClause = fieldList.map((field, i) => `${field} = $${i + 1}`).join(', ');
      const values = fieldList.map(field => rolesgroup[field]);
      values.push(rolesgroup.status !== undefined ? rolesgroup.status : undefined, rolesgroup.isActive !== undefined ? rolesgroup.isActive : undefined, id);
      const result = await pool.query(`UPDATE ${RolesGroups.tableName} SET ${setClause}${rolesgroup.status !== undefined ? ', status = $${fieldList.length + 1}' : ''}${rolesgroup.isActive !== undefined ? ', is_active = $${fieldList.length + ' + (rolesgroup.status !== undefined ? 2 : 1) + '}' : ''}, updated_at = CURRENT_TIMESTAMP WHERE id = $${fieldList.length + ' + (rolesgroup.status !== undefined && rolesgroup.isActive !== undefined ? 3 : rolesgroup.status !== undefined || rolesgroup.isActive !== undefined ? 2 : 1) + '} RETURNING id, ${this.fields}, created_at as "createdAt", updated_at as "updatedAt", status, is_active as "isActive"`, values);

      return result.rows[0] || null;
    } catch (error) {
      console.error('Error in update:', error);
      throw error;
    }
  }

  static async delete(id) {
    try {
      const result = await pool.query(`DELETE FROM ${RolesGroups.tableName} WHERE id = $1`, [id]);

      return result.rowCount > 0;
    } catch (error) {
      console.error('Error in delete:', error);
      throw error;
    }
  }
}

module.exports = RolesGroups;
