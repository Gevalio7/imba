const { pool } = require('../config/db');

// Функция для преобразования camelCase в snake_case
function toSnakeCase(str) {
  return str.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase();
}

class Roles {
  static tableName = 'roles';
  static fields = 'name, message';

  static async getAll(options = {}) {
    const { q, sortBy, orderBy = 'asc', itemsPerPage = 1000, page = 1 } = options;

    try {
      let whereClause = '';
      let params = [];
      let paramIndex = 1;

      if (q) {
        const searchFields = this.fields.split(', ');
        const conditions = searchFields.map(field => `${toSnakeCase(field)} ILIKE $${paramIndex}`).join(' OR ');
        whereClause = `WHERE ${conditions}`;
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
      const countQuery = `SELECT COUNT(*) as total FROM ${Roles.tableName} ${whereClause}`;
      const countResult = await pool.query(countQuery, params);
      const total = parseInt(countResult.rows[0].total);

      // Get paginated data
      // Преобразуем имена полей в snake_case для SQL
      const sqlFields = this.fields.split(', ').map(f => {
        const snake = toSnakeCase(f);
        return snake === f ? f : `${snake} as "${f}"`;
      }).join(', ');
      const dataQuery = `SELECT id, ${sqlFields}, created_at as "createdAt", updated_at as "updatedAt", is_active as "isActive" FROM ${Roles.tableName} ${whereClause} ${orderClause} LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(itemsPerPage, offset);
      const dataResult = await pool.query(dataQuery, params);

      return {
        roles: dataResult.rows,
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
        `SELECT id, ${sqlFields}, created_at as "createdAt", updated_at as "updatedAt", is_active as "isActive" FROM ${Roles.tableName} WHERE id = $1`,
        [id]
      );

      return result.rows[0] || null;
    } catch (error) {
      console.error('Error in getById:', error);
      throw error;
    }
  }

  static async create(role) {
    try {
      const fieldList = this.fields.split(', ');
      const placeholders = fieldList.map((_, i) => `$${i + 1}`).join(', ');
      const values = fieldList.map(field => role[field]);
      
      // Добавляем isActive
      values.push(role.isActive !== undefined ? role.isActive : true);
      
      // Преобразуем имена полей в snake_case для SQL
      const sqlFieldsInsert = fieldList.map(f => toSnakeCase(f)).join(', ');
      const sqlFieldsSelect = fieldList.map(f => {
        const snake = toSnakeCase(f);
        return snake === f ? f : `${snake} as "${f}"`;
      }).join(', ');
      
      const query = `INSERT INTO ${Roles.tableName} (${sqlFieldsInsert}, is_active) VALUES (${placeholders}, $${fieldList.length + 1}) RETURNING id, ${sqlFieldsSelect}, created_at as "createdAt", updated_at as "updatedAt", is_active as "isActive"`;
      const result = await pool.query(query, values);

      return result.rows[0];
    } catch (error) {
      console.error('Error in create:', error);
      throw error;
    }
  }

  static async update(id, role) {
    try {
      const fieldList = this.fields.split(', ');
      const updates = [];
      const values = [];
      let paramIndex = 1;

      // Обновляем только переданные поля
      fieldList.forEach(field => {
        if (role[field] !== undefined) {
          updates.push(`${toSnakeCase(field)} = $${paramIndex}`);
          values.push(role[field]);
          paramIndex++;
        }
      });

      // Добавляем isActive если передан
      if (role.isActive !== undefined) {
        updates.push(`is_active = $${paramIndex}`);
        values.push(role.isActive);
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

      const query = `UPDATE ${Roles.tableName} SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING id, ${sqlFields}, created_at as "createdAt", updated_at as "updatedAt", is_active as "isActive"`;
      const result = await pool.query(query, values);

      return result.rows[0] || null;
    } catch (error) {
      console.error('Error in update:', error);
      throw error;
    }
  }

  static async delete(id) {
    try {
      const result = await pool.query(`DELETE FROM ${Roles.tableName} WHERE id = $1`, [id]);

      return result.rowCount > 0;
    } catch (error) {
      console.error('Error in delete:', error);
      throw error;
    }
  }

  // ========== Методы для работы с разрешениями ==========

  // Получить все доступные разрешения
  static getAvailablePermissions() {
    return [
      // Супер-пользователь
      { code: 'super_user', name: 'Супер-пользователь (полный доступ)', category: 'admin' },
      
      // Тикеты
      { code: 'create_ticket', name: 'Создание заявок', category: 'tickets' },
      { code: 'see_own_tickets', name: 'Видеть только свои заявки', category: 'tickets' },
      { code: 'reply_to_tickets', name: 'Отвечать на заявки', category: 'tickets' },
      { code: 'internal_notes', name: 'Внутренние заметки', category: 'tickets' },
      { code: 'change_status', name: 'Менять статус/приоритет', category: 'tickets' },
      { code: 'see_all_tickets', name: 'Видеть все заявки', category: 'tickets' },
      { code: 'see_department_tickets', name: 'Видеть заявки отдела', category: 'tickets' },
      { code: 'see_company_tickets', name: 'Видеть заявки компании', category: 'tickets' },
      
      // База знаний
      { code: 'kb_read', name: 'Доступ к БЗ (чтение)', category: 'knowledge_base' },
      { code: 'kb_write', name: 'Доступ к БЗ (создание/редактирование)', category: 'knowledge_base' },
      
      // Отчёты и настройки
      { code: 'view_reports', name: 'Просмотр отчётов', category: 'reports' },
      { code: 'system_settings', name: 'Настройка системы', category: 'settings' },
      { code: 'manage_users', name: 'Управление пользователями', category: 'settings' },
    ];
  }

  // Получить разрешения роли
  static async getPermissions(roleId) {
    try {
      const result = await pool.query(
        `SELECT permission, is_granted FROM role_permissions WHERE role_id = $1`,
        [roleId]
      );
      
      // Преобразуем в объект { permission: is_granted }
      const permissions = {};
      result.rows.forEach(row => {
        permissions[row.permission] = row.is_granted;
      });
      
      return permissions;
    } catch (error) {
      console.error('Error in getPermissions:', error);
      throw error;
    }
  }

  // Получить разрешения роли с названиями
  static async getPermissionsWithDetails(roleId) {
    try {
      const availablePermissions = this.getAvailablePermissions();
      const result = await pool.query(
        `SELECT permission, is_granted FROM role_permissions WHERE role_id = $1`,
        [roleId]
      );
      
      // Создаем объект разрешений
      const grantedPermissions = {};
      result.rows.forEach(row => {
        grantedPermissions[row.permission] = row.is_granted;
      });
      
      // Добавляем информацию о разрешениях
      return availablePermissions.map(p => ({
        ...p,
        is_granted: grantedPermissions[p.code] || false
      }));
    } catch (error) {
      console.error('Error in getPermissionsWithDetails:', error);
      throw error;
    }
  }

  // Установить разрешения роли
  static async setPermissions(roleId, permissions) {
    try {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        
        // Удаляем старые разрешения
        await client.query('DELETE FROM role_permissions WHERE role_id = $1', [roleId]);
        
        // Добавляем новые разрешения
        for (const [permission, is_granted] of Object.entries(permissions)) {
          await client.query(
            `INSERT INTO role_permissions (role_id, permission, is_granted) VALUES ($1, $2, $3)`,
            [roleId, permission, is_granted]
          );
        }
        
        await client.query('COMMIT');
        return true;
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Error in setPermissions:', error);
      throw error;
    }
  }

  // Проверить разрешение
  static async hasPermission(roleId, permission) {
    try {
      const result = await pool.query(
        `SELECT is_granted FROM role_permissions WHERE role_id = $1 AND permission = $2`,
        [roleId, permission]
      );
      
      return result.rows.length > 0 && result.rows[0].is_granted;
    } catch (error) {
      console.error('Error in hasPermission:', error);
      throw error;
    }
  }

  // Получить разрешения агента по ID
  static async getAgentPermissions(agentId) {
    try {
      // Сначала получаем role_id агента
      const agentResult = await pool.query(
        `SELECT role_id FROM agents WHERE id = $1`,
        [agentId]
      );
      
      if (agentResult.rows.length === 0 || !agentResult.rows[0].role_id) {
        return {};
      }
      
      return await this.getPermissions(agentResult.rows[0].role_id);
    } catch (error) {
      console.error('Error in getAgentPermissions:', error);
      throw error;
    }
  }
}

module.exports = Roles;
