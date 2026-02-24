const { pool } = require('../config/db');

// Функция для преобразования camelCase в snake_case
function toSnakeCase(str) {
  return str.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase();
}

class CustomerUsers {
  static tableName = 'customer_users';
  static fields = 'firstName, lastName, login, password, email, mobilePhone, telegramAccount';

  static async getAll(options = {}) {
    const { q, sortBy, orderBy = 'asc', itemsPerPage = 10, page = 1, isActive } = options;

    try {
      let whereConditions = [];
      let params = [];
      let paramIndex = 1;

      // Поиск по тексту
      if (q) {
        const searchFields = this.fields.split(', ');
        const conditions = searchFields.map(field => `${toSnakeCase(field)} ILIKE $${paramIndex}`).join(' OR ');
        whereConditions.push(`(${conditions})`);
        params.push(`%${q}%`);
        paramIndex++;
      }
      
      // Фильтр по статусу (isActive)
      if (isActive !== undefined) {
        whereConditions.push(`is_active = $${paramIndex}`);
        params.push(isActive);
        paramIndex++;
      }
      
      const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

      let orderClause = '';
      const sortableFields = this.fields.split(', ').concat(['created_at', 'updated_at']);
      if (sortBy && sortableFields.includes(sortBy)) {
        const sortField = sortBy === 'created_at' || sortBy === 'updated_at' ? sortBy : toSnakeCase(sortBy);
        orderClause = `ORDER BY ${sortField} ${orderBy === 'desc' ? 'DESC' : 'ASC'}`;
      }

      const offset = (page - 1) * itemsPerPage;

      // Get total count
      const countQuery = `SELECT COUNT(*) as total FROM ${CustomerUsers.tableName} ${whereClause}`;
      const countResult = await pool.query(countQuery, params);
      const total = parseInt(countResult.rows[0].total);

      // Get paginated data
      const sqlFields = this.fields.split(', ').map(f => {
        const snake = toSnakeCase(f);
        return snake === f ? f : `${snake} as "${f}"`;
      }).join(', ');
      const dataQuery = `SELECT id, ${sqlFields}, created_at as "createdAt", updated_at as "updatedAt", is_active as "isActive" FROM ${CustomerUsers.tableName} ${whereClause} ${orderClause} LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(itemsPerPage, offset);
      const dataResult = await pool.query(dataQuery, params);

      return {
        customerUsers: dataResult.rows,
        total,
      };
    } catch (error) {
      console.error('Error in getAll:', error);
      throw error;
    }
  }

  static async getById(id) {
    try {
      // Преобразуем имена полей в snake_case для SQL
      const sqlFields = this.fields.split(', ').map(f => {
        const snake = toSnakeCase(f);
        return snake === f ? f : `${snake} as "${f}"`;
      }).join(', ');
      const result = await pool.query(
        `SELECT id, ${sqlFields}, created_at as "createdAt", updated_at as "updatedAt", is_active as "isActive" FROM ${CustomerUsers.tableName} WHERE id = $1`,
        [id]
      );

      return result.rows[0] || null;
    } catch (error) {
      console.error('Error in getById:', error);
      throw error;
    }
  }

  static async create(customeruser) {
    try {
      // Проверяем уникальность login
      if (customeruser.login) {
        const loginCheck = await pool.query(
          'SELECT id FROM customer_users WHERE login = $1',
          [customeruser.login]
        );
        if (loginCheck.rows.length > 0) {
          const error = new Error('Клиент с таким логином уже существует');
          error.statusCode = 409;
          throw error;
        }
      }

      // Проверяем уникальность email
      if (customeruser.email) {
        const emailCheck = await pool.query(
          'SELECT id FROM customer_users WHERE email = $1',
          [customeruser.email]
        );
        if (emailCheck.rows.length > 0) {
          const error = new Error('Клиент с таким email уже существует');
          error.statusCode = 409;
          throw error;
        }
      }

      const fieldList = this.fields.split(', ');
      const placeholders = fieldList.map((_, i) => `$${i + 1}`).join(', ');
      const values = fieldList.map(field => customeruser[field]);
      
      // Добавляем isActive
      values.push(customeruser.isActive !== undefined ? customeruser.isActive : true);
      
      // Преобразуем имена полей в snake_case для SQL
      const sqlFieldsInsert = fieldList.map(f => toSnakeCase(f)).join(', ');
      const sqlFieldsSelect = fieldList.map(f => {
        const snake = toSnakeCase(f);
        return snake === f ? f : `${snake} as "${f}"`;
      }).join(', ');
      
      const query = `INSERT INTO ${CustomerUsers.tableName} (${sqlFieldsInsert}, is_active) VALUES (${placeholders}, $${fieldList.length + 1}) RETURNING id, ${sqlFieldsSelect}, created_at as "createdAt", updated_at as "updatedAt", is_active as "isActive"`;
      const result = await pool.query(query, values);

      return result.rows[0];
    } catch (error) {
      console.error('Error in create:', error);
      throw error;
    }
  }

  static async update(id, customeruser) {
    try {
      // Проверяем уникальность login (исключая текущего клиента)
      if (customeruser.login) {
        const loginCheck = await pool.query(
          'SELECT id FROM customer_users WHERE login = $1 AND id != $2',
          [customeruser.login, id]
        );
        if (loginCheck.rows.length > 0) {
          const error = new Error('Клиент с таким логином уже существует');
          error.statusCode = 409;
          throw error;
        }
      }

      // Проверяем уникальность email (исключая текущего клиента)
      if (customeruser.email) {
        const emailCheck = await pool.query(
          'SELECT id FROM customer_users WHERE email = $1 AND id != $2',
          [customeruser.email, id]
        );
        if (emailCheck.rows.length > 0) {
          const error = new Error('Клиент с таким email уже существует');
          error.statusCode = 409;
          throw error;
        }
      }

      const fieldList = this.fields.split(', ');
      const updates = [];
      const values = [];
      let paramIndex = 1;

      // Обновляем только переданные поля
      fieldList.forEach(field => {
        if (customeruser[field] !== undefined) {
          updates.push(`${toSnakeCase(field)} = $${paramIndex}`);
          values.push(customeruser[field]);
          paramIndex++;
        }
      });

      // Добавляем isActive если передан
      if (customeruser.isActive !== undefined) {
        updates.push(`is_active = $${paramIndex}`);
        values.push(customeruser.isActive);
        paramIndex++;
      }

      // Всегда обновляем updated_at
      updates.push('updated_at = CURRENT_TIMESTAMP');

      // Добавляем id в конец
      values.push(id);

      // Преобразуем имена полей в snake_case для SQL
      const sqlFields = fieldList.map(f => {
        const snake = toSnakeCase(f);
        return snake === f ? f : `${snake} as "${f}"`;
      }).join(', ');

      const query = `UPDATE ${CustomerUsers.tableName} SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING id, ${sqlFields}, created_at as "createdAt", updated_at as "updatedAt", is_active as "isActive"`;
      const result = await pool.query(query, values);

      return result.rows[0] || null;
    } catch (error) {
      console.error('Error in update:', error);
      throw error;
    }
  }

  static async delete(id) {
    try {
      const result = await pool.query(`DELETE FROM ${CustomerUsers.tableName} WHERE id = $1`, [id]);

      return result.rowCount > 0;
    } catch (error) {
      console.error('Error in delete:', error);
      throw error;
    }
  }
}

module.exports = CustomerUsers;
