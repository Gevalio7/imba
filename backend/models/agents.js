const { pool } = require('../config/db');

// Функция для преобразования camelCase в snake_case
function toSnakeCase(str) {
  return str.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase();
}

class Agents {
  static tableName = 'agents';
  static fields = 'firstName, lastName, login, password, email, mobilePhone, telegramAccount, avatar';

  static async getAll(options = {}) {
    const { q, sortBy, orderBy = 'asc', itemsPerPage = 1000, page = 1, isActive } = options;


    try {
      let whereConditions = [];
      let params = [];
      let paramIndex = 1;

      // Поиск по тексту
      if (q) {
        const searchFields = this.fields.split(', ');
        const conditions = searchFields.map(field => `a.${toSnakeCase(field)} ILIKE $${paramIndex}`).join(' OR ');
        whereConditions.push(`(${conditions})`);
        params.push(`%${q}%`);
        paramIndex++;
      }
      
      // Фильтр по статусу (isActive)
      if (isActive !== undefined) {
        whereConditions.push(`a.is_active = $${paramIndex}`);
        params.push(isActive);
        paramIndex++;
      }
      
      const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

      let orderClause = '';
      const sortableFields = this.fields.split(', ').concat(['created_at', 'updated_at', 'groups']);
      if (sortBy && sortableFields.includes(sortBy)) {
        if (sortBy === 'groups') {
          // Для сортировки по группам используем имя первой группы из агрегата
          orderClause = `ORDER BY COALESCE((SELECT MIN(ag2.name) FROM agents_groups_agents aga2 JOIN agents_groups ag2 ON aga2.agents_group_id = ag2.id WHERE aga2.agent_id = a.id AND ag2.is_active = true), '') ${orderBy === 'desc' ? 'DESC' : 'ASC'}`;
        } else {
          const sortField = sortBy === 'created_at' || sortBy === 'updated_at' ? sortBy : `a.${toSnakeCase(sortBy)}`;
          orderClause = `ORDER BY ${sortField} ${orderBy === 'desc' ? 'DESC' : 'ASC'}`;
        }
      }

      const offset = (page - 1) * itemsPerPage;

      // Get total count
      const countQuery = `SELECT COUNT(DISTINCT a.id) as total FROM ${Agents.tableName} a LEFT JOIN agents_groups_agents aga ON a.id = aga.agent_id LEFT JOIN agents_groups ag ON aga.agents_group_id = ag.id AND ag.is_active = true ${whereClause}`;
      const countResult = await pool.query(countQuery, params);
      const total = parseInt(countResult.rows[0].total);

      // Get paginated data
      const sqlFields = this.fields.split(', ').map(f => {
        const snake = toSnakeCase(f);
        return `a.${snake} as "${f}"`;
      }).join(', ');
      // Одна строка на агента: только идентификаторы, фронтенд резолвит названия сам
      const dataQuery = `
      WITH agent_groups_agg AS (
        SELECT
          aga.agent_id,
          json_agg(
            json_build_object(
              'id', ag.id,
              'roleId', ag.role_id
            ) ORDER BY ag.id
          ) FILTER (WHERE ag.id IS NOT NULL) as groups_json
        FROM agents_groups_agents aga
        JOIN agents_groups ag ON aga.agents_group_id = ag.id AND ag.is_active = true
        GROUP BY aga.agent_id
      )
      SELECT
        a.id,
        ${sqlFields},
        a.created_at as "createdAt",
        a.updated_at as "updatedAt",
        a.is_active as "isActive",
        aga.groups_json as groups
      FROM ${Agents.tableName} a
      LEFT JOIN agent_groups_agg aga ON a.id = aga.agent_id
      ${whereClause}
      ${orderClause} LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(itemsPerPage, offset);
      const dataResult = await pool.query(dataQuery, params);
      
      return {
        agents: dataResult.rows,
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
        `SELECT id, ${sqlFields}, created_at as "createdAt", updated_at as "updatedAt", is_active as "isActive", role_id as "roleId", avatar FROM ${Agents.tableName} a WHERE a.id = $1`,
        [id]
      );

      return result.rows[0] || null;
    } catch (error) {
      console.error('Error in getById:', error);
      throw error;
    }
  }

  static async create(agent) {
    try {
      // Проверяем уникальность login
      if (agent.login) {
        const loginCheck = await pool.query(
          'SELECT id FROM agents WHERE login = $1',
          [agent.login]
        );
        if (loginCheck.rows.length > 0) {
          const error = new Error('Агент с таким логином уже существует');
          error.statusCode = 409;
          throw error;
        }
      }

      // Проверяем уникальность email
      if (agent.email) {
        const emailCheck = await pool.query(
          'SELECT id FROM agents WHERE email = $1',
          [agent.email]
        );
        if (emailCheck.rows.length > 0) {
          const error = new Error('Агент с таким email уже существует');
          error.statusCode = 409;
          throw error;
        }
      }

      const fieldList = this.fields.split(', ');
      const placeholders = fieldList.map((_, i) => `$${i + 1}`).join(', ');
      const values = fieldList.map(field => agent[field]);
      
      // Добавляем isActive
      values.push(agent.isActive !== undefined ? agent.isActive : true);
      
      // Преобразуем имена полей в snake_case для SQL
      const sqlFieldsInsert = fieldList.map(f => toSnakeCase(f)).join(', ');
      const sqlFieldsSelect = fieldList.map(f => {
        const snake = toSnakeCase(f);
        return snake === f ? f : `${snake} as "${f}"`;
      }).join(', ');
      
      const query = `INSERT INTO ${Agents.tableName} (${sqlFieldsInsert}, is_active) VALUES (${placeholders}, $${fieldList.length + 1}) RETURNING id, ${sqlFieldsSelect}, created_at as "createdAt", updated_at as "updatedAt", is_active as "isActive", role_id as "roleId"`;
      const result = await pool.query(query, values);

      return result.rows[0];
    } catch (error) {
      console.error('Error in create:', error);
      throw error;
    }
  }

  static async update(id, agent) {
    try {
      // Проверяем уникальность login (исключая текущего агента)
      if (agent.login) {
        const loginCheck = await pool.query(
          'SELECT id FROM agents WHERE login = $1 AND id != $2',
          [agent.login, id]
        );
        if (loginCheck.rows.length > 0) {
          const error = new Error('Агент с таким логином уже существует');
          error.statusCode = 409;
          throw error;
        }
      }

      // Проверяем уникальность email (исключая текущего агента)
      if (agent.email) {
        const emailCheck = await pool.query(
          'SELECT id FROM agents WHERE email = $1 AND id != $2',
          [agent.email, id]
        );
        if (emailCheck.rows.length > 0) {
          const error = new Error('Агент с таким email уже существует');
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
        if (agent[field] !== undefined) {
          updates.push(`${toSnakeCase(field)} = $${paramIndex}`);
          values.push(agent[field]);
          paramIndex++;
        }
      });

      // Добавляем isActive если передан
      if (agent.isActive !== undefined) {
        updates.push(`is_active = $${paramIndex}`);
        values.push(agent.isActive);
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

      // Роли больше не назначаются напрямую агентам, а только через группы

      const query = `UPDATE ${Agents.tableName} SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING id, ${sqlFields}, created_at as "createdAt", updated_at as "updatedAt", is_active as "isActive", role_id as "roleId"`;
      const result = await pool.query(query, values);

      return result.rows[0] || null;
    } catch (error) {
      console.error('Error in update:', error);
      throw error;
    }
  }

  static async delete(id) {
    try {
      const result = await pool.query(`DELETE FROM ${Agents.tableName} WHERE id = $1`, [id]);

      return result.rowCount > 0;
    } catch (error) {
      console.error('Error in delete:', error);
      throw error;
    }
  }
}

module.exports = Agents;
