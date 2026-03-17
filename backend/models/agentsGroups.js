const { pool } = require('../config/db');

// Функция для преобразования camelCase в snake_case
function toSnakeCase(str) {
  return str.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase();
}

class AgentsGroups {
  static tableName = 'agents_groups';
  static fields = 'name';

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
      const countQuery = `SELECT COUNT(*) as total FROM ${AgentsGroups.tableName} ${whereClause}`;
      const countResult = await pool.query(countQuery, params);
      const total = parseInt(countResult.rows[0].total);

      // Get paginated data - преобразуем имена полей в snake_case для SQL
      const sqlFields = this.fields.split(', ').map(f => {
        const snake = toSnakeCase(f);
        // Добавляем префикс таблицы для избежания неоднозначности
        return snake === f ? `ag.${snake}` : `ag.${snake} as "${f}"`;
      }).join(', ');
      
      // Исправлено: Добавлены знаки $ перед параметрами
      const dataQuery = `SELECT ag.id, ${sqlFields}, ag.created_at as "createdAt", ag.updated_at as "updatedAt", ag.is_active as "isActive", ag.role_id as "roleId" FROM ${AgentsGroups.tableName} ag ${whereClause} ${orderClause} LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(itemsPerPage, offset);
      const dataResult = await pool.query(dataQuery, params);

      // Загружаем роли для каждой группы из таблицы agents_groups_roles
      const groups = dataResult.rows;
      if (groups.length > 0) {
        const groupIds = groups.map(g => g.id);
        const rolesResult = await pool.query(
          `SELECT agr.agents_group_id as "groupId", agr.role_id as "roleId", r.name as "roleName"
           FROM agents_groups_roles agr
           JOIN roles r ON r.id = agr.role_id
           WHERE agr.agents_group_id = ANY($1)`,
          [groupIds]
        );
        
        // Группируем роли по groupId
        const rolesByGroup = {};
        rolesResult.rows.forEach(row => {
          if (!rolesByGroup[row.groupId]) {
            rolesByGroup[row.groupId] = [];
          }
          rolesByGroup[row.groupId].push({ id: row.roleId, name: row.roleName });
        });
        
        // Добавляем роли к каждой группе
        groups.forEach(group => {
          group.roles = rolesByGroup[group.id] || [];
          // Для обратной совместимости оставляем roleId (первая роль)
          if (group.roles.length > 0 && !group.roleId) {
            group.roleId = group.roles[0].id;
          }
        });
      }

      return {
        agentsGroups: groups,
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
        // Добавляем префикс таблицы для избежания неоднозначности
        return snake === f ? `ag.${snake}` : `ag.${snake} as "${f}"`;
      }).join(', ');
      const result = await pool.query(
        `SELECT ag.id, ${sqlFields}, ag.created_at as "createdAt", ag.updated_at as "updatedAt", ag.is_active as "isActive", ag.role_id as "roleId" FROM ${AgentsGroups.tableName} ag WHERE ag.id = $1`,
        [id]
      );

      const group = result.rows[0] || null;
      
      if (group) {
        // Загружаем роли из таблицы agents_groups_roles
        const rolesResult = await pool.query(
          `SELECT agr.role_id as "roleId", r.name as "roleName"
           FROM agents_groups_roles agr
           JOIN roles r ON r.id = agr.role_id
           WHERE agr.agents_group_id = $1`,
          [id]
        );
        group.roles = rolesResult.rows.map(r => ({ id: r.roleId, name: r.roleName }));
        // Для обратной совместимости
        if (group.roles.length > 0 && !group.roleId) {
          group.roleId = group.roles[0].id;
        }
      }

      return group;
    } catch (error) {
      console.error('Error in getById:', error);
      throw error;
    }
  }

  static async create(agentsgroup) {
    try {
      const fieldList = this.fields.split(', ');
      const placeholders = fieldList.map((_, i) => `$${i + 1}`).join(', ');
      const values = fieldList.map(field => agentsgroup[field]);
      
      // Добавляем isActive
      values.push(agentsgroup.isActive !== undefined ? agentsgroup.isActive : true);
      
      // Преобразуем имена полей в snake_case для SQL
      const sqlFieldsInsert = fieldList.map(f => toSnakeCase(f)).join(', ');
      const sqlFieldsSelect = fieldList.map(f => {
        const snake = toSnakeCase(f);
        return snake === f ? f : `${snake} as "${f}"`;
      }).join(', ');
      
      // Для обратной совместимости сохраняем role_id (первая роль из массива или одиночная)
      let primaryRoleId = null;
      if (agentsgroup.roleIds && Array.isArray(agentsgroup.roleIds) && agentsgroup.roleIds.length > 0) {
        primaryRoleId = agentsgroup.roleIds[0];
      } else if (agentsgroup.roleId !== undefined) {
        primaryRoleId = agentsgroup.roleId;
      }
      
      const query = `INSERT INTO ${AgentsGroups.tableName} (${sqlFieldsInsert}, is_active, role_id) VALUES (${placeholders}, $${fieldList.length + 1}, $${fieldList.length + 2}) RETURNING id, ${sqlFieldsSelect}, created_at as "createdAt", updated_at as "updatedAt", is_active as "isActive", role_id as "roleId"`;
      
      values.push(primaryRoleId);
      
      const result = await pool.query(query, values);
      const newGroup = result.rows[0];

      // Сохраняем роли в таблицу agents_groups_roles
      const roleIds = agentsgroup.roleIds && Array.isArray(agentsgroup.roleIds) 
        ? agentsgroup.roleIds 
        : (agentsgroup.roleId ? [agentsgroup.roleId] : []);
      
      if (roleIds.length > 0) {
        for (const roleId of roleIds) {
          await pool.query(
            `INSERT INTO agents_groups_roles (agents_group_id, role_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
            [newGroup.id, roleId]
          );
        }
      }

      // Загружаем роли для ответа
      const rolesResult = await pool.query(
        `SELECT agr.role_id as "roleId", r.name as "roleName"
         FROM agents_groups_roles agr
         JOIN roles r ON r.id = agr.role_id
         WHERE agr.agents_group_id = $1`,
        [newGroup.id]
      );
      newGroup.roles = rolesResult.rows.map(r => ({ id: r.roleId, name: r.roleName }));

      return newGroup;
    } catch (error) {
      console.error('Error in create:', error);
      throw error;
    }
  }

  static async update(id, agentsgroup) {
    try {
      const updates = [];
      const values = [];
      let paramIndex = 1;

      // Всегда обновляем name если передан
      if (agentsgroup.name !== undefined) {
        updates.push(`name = $${paramIndex}`);
        values.push(agentsgroup.name);
        paramIndex++;
      }

      // Обновляем roleId если передан (может быть null) - для обратной совместимости
      let primaryRoleId = undefined;
      if (agentsgroup.roleIds !== undefined && Array.isArray(agentsgroup.roleIds)) {
        primaryRoleId = agentsgroup.roleIds.length > 0 ? agentsgroup.roleIds[0] : null;
      } else if (agentsgroup.roleId !== undefined) {
        primaryRoleId = agentsgroup.roleId;
      }
      
      if (primaryRoleId !== undefined) {
        updates.push(`role_id = $${paramIndex}`);
        values.push(primaryRoleId);
        paramIndex++;
      }

      // Добавляем isActive если передан
      if (agentsgroup.isActive !== undefined) {
        updates.push(`is_active = $${paramIndex}`);
        values.push(agentsgroup.isActive);
        paramIndex++;
      }

      // Всегда обновляем updated_at
      updates.push('updated_at = CURRENT_TIMESTAMP');

      // Добавляем id в конец
      values.push(id);

      const query = `UPDATE ${AgentsGroups.tableName} SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING id, name, role_id as "roleId", created_at as "createdAt", updated_at as "updatedAt", is_active as "isActive"`;
      const result = await pool.query(query, values);
      const updatedGroup = result.rows[0] || null;

      if (updatedGroup) {
        // Обновляем роли в таблице agents_groups_roles
        if (agentsgroup.roleIds !== undefined) {
          // Удаляем все старые роли
          await pool.query(`DELETE FROM agents_groups_roles WHERE agents_group_id = $1`, [id]);
          
          // Добавляем новые роли
          if (Array.isArray(agentsgroup.roleIds) && agentsgroup.roleIds.length > 0) {
            for (const roleId of agentsgroup.roleIds) {
              await pool.query(
                `INSERT INTO agents_groups_roles (agents_group_id, role_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
                [id, roleId]
              );
            }
          }
        } else if (agentsgroup.roleId !== undefined) {
          // Обратная совместимость: одна роль
          await pool.query(`DELETE FROM agents_groups_roles WHERE agents_group_id = $1`, [id]);
          if (agentsgroup.roleId !== null) {
            await pool.query(
              `INSERT INTO agents_groups_roles (agents_group_id, role_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
              [id, agentsgroup.roleId]
            );
          }
        }

        // Загружаем роли для ответа
        const rolesResult = await pool.query(
          `SELECT agr.role_id as "roleId", r.name as "roleName"
           FROM agents_groups_roles agr
           JOIN roles r ON r.id = agr.role_id
           WHERE agr.agents_group_id = $1`,
          [id]
        );
        updatedGroup.roles = rolesResult.rows.map(r => ({ id: r.roleId, name: r.roleName }));
      }

      return updatedGroup;
    } catch (error) {
      console.error('Error in update:', error);
      throw error;
    }
  }

  static async delete(id) {
    try {
      const result = await pool.query(`DELETE FROM ${AgentsGroups.tableName} WHERE id = $1`, [id]);

      return result.rowCount > 0;
    } catch (error) {
      console.error('Error in delete:', error);
      throw error;
    }
  }

  static async getAgents(groupId) {
    try {
      // Поля агента в camelCase
      const agentFields = 'firstName, lastName, login, password, email, mobilePhone, telegramAccount';
      const sqlFields = agentFields.split(', ').map(f => {
        const snake = toSnakeCase(f);
        return snake === f ? f : `${snake} as "${f}"`;
      }).join(', ');

      const result = await pool.query(
        `SELECT a.id, ${sqlFields}, a.created_at as "createdAt", a.updated_at as "updatedAt", a.is_active as "isActive"
         FROM agents a
         JOIN agents_groups_agents aga ON a.id = aga.agent_id
         WHERE aga.agents_group_id = $1
         ORDER BY a.first_name, a.last_name`,
        [groupId]
      );
      return result.rows;
    } catch (error) {
      console.error('Error in getAgents:', error);
      throw error;
    }
  }

  static async addAgent(groupId, agentId) {
    try {
      await pool.query(
        `INSERT INTO agents_groups_agents (agents_group_id, agent_id)
         VALUES ($1, $2)
         ON CONFLICT (agents_group_id, agent_id) DO NOTHING`,
        [groupId, agentId]
      );
    } catch (error) {
      console.error('Error in addAgent:', error);
      throw error;
    }
  }

  static async removeAgent(groupId, agentId) {
    try {
      await pool.query(
        `DELETE FROM agents_groups_agents
         WHERE agents_group_id = $1 AND agent_id = $2`,
        [groupId, agentId]
      );
    } catch (error) {
      console.error('Error in removeAgent:', error);
      throw error;
    }
  }
}

module.exports = AgentsGroups;
