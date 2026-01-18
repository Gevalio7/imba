const { pool } = require('../config/db');

class User {
  // Получить всех пользователей
  static async getAll(options = {}) {
    const { page = 1, limit = 10, search = '', sortBy = 'id', sortOrder = 'ASC' } = options;
    const offset = (page - 1) * limit;

    let query = `
      SELECT id, login, first_name, last_name, email, is_active, created_at, updated_at
      FROM users
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    if (search) {
      query += ` AND (login ILIKE $${paramIndex} OR email ILIKE $${paramIndex} OR first_name ILIKE $${paramIndex} OR last_name ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    query += ` ORDER BY ${sortBy} ${sortOrder}`;
    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    const countQuery = `SELECT COUNT(*) FROM users WHERE 1=1 ${search ? `AND (login ILIKE '%${search}%' OR email ILIKE '%${search}%')` : ''}`;
    const countResult = await pool.query(countQuery);

    return {
      data: result.rows,
      total: parseInt(countResult.rows[0].count),
      page,
      limit,
    };
  }

  // Получить пользователя по ID
  static async getById(id) {
    const result = await pool.query(
      'SELECT id, login, first_name, last_name, email, is_active, created_at, updated_at FROM users WHERE id = $1',
      [id]
    );
    return result.rows[0];
  }

  // Получить пользователя по логину
  static async getByLogin(login) {
    const result = await pool.query(
      'SELECT * FROM users WHERE login = $1',
      [login]
    );
    return result.rows[0];
  }

  // Получить пользователя по email
  static async getByEmail(email) {
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    return result.rows[0];
  }

  // Создать пользователя
  static async create(data) {
    const { login, password, firstName, lastName, email, isActive = true } = data;
    
    const result = await pool.query(
      `INSERT INTO users (login, password, first_name, last_name, email, is_active, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
       RETURNING id, login, first_name, last_name, email, is_active, created_at, updated_at`,
      [login, password, firstName, lastName, email, isActive]
    );
    
    return result.rows[0];
  }

  // Обновить пользователя
  static async update(id, data) {
    const fields = [];
    const values = [];
    let paramIndex = 1;

    if (data.login !== undefined) {
      fields.push(`login = $${paramIndex++}`);
      values.push(data.login);
    }
    if (data.password !== undefined) {
      fields.push(`password = $${paramIndex++}`);
      values.push(data.password);
    }
    if (data.firstName !== undefined) {
      fields.push(`first_name = $${paramIndex++}`);
      values.push(data.firstName);
    }
    if (data.lastName !== undefined) {
      fields.push(`last_name = $${paramIndex++}`);
      values.push(data.lastName);
    }
    if (data.email !== undefined) {
      fields.push(`email = $${paramIndex++}`);
      values.push(data.email);
    }
    if (data.isActive !== undefined) {
      fields.push(`is_active = $${paramIndex++}`);
      values.push(data.isActive);
    }

    fields.push(`updated_at = NOW()`);
    values.push(id);

    const query = `
      UPDATE users
      SET ${fields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING id, login, first_name, last_name, email, is_active, created_at, updated_at
    `;

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  // Удалить пользователя
  static async delete(id) {
    const result = await pool.query(
      'DELETE FROM users WHERE id = $1 RETURNING id',
      [id]
    );
    return result.rows[0];
  }
}

module.exports = User;
