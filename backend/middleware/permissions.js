const Roles = require('../models/roles');
const Agents = require('../models/agents');
const { pool } = require('../config/db');

/**
 * Получить ID ролей агента через группы
 */
const getAgentRoleIds = async (agentId) => {
  try {
    const result = await pool.query(`
      SELECT DISTINCT agr.role_id
      FROM agents_groups_agents aga
      JOIN agents_groups ag ON aga.agents_group_id = ag.id AND ag.is_active = true
      LEFT JOIN agents_groups_roles agr ON agr.agents_group_id = ag.id
      WHERE aga.agent_id = $1
    `, [agentId]);
    
    return result.rows.map(row => row.role_id).filter(id => id !== null);
  } catch (error) {
    console.error('Error getting agent role IDs:', error);
    return [];
  }
};

/**
 * Middleware для проверки разрешений агента
 * req.user должен содержать id агента
 */
const checkPermission = (permission) => {
  return async (req, res, next) => {
    try {
      // Если нет user.id - пропускаем (для API ключей или анонимных запросов)
      if (!req.user?.id) {
        console.log(`⚠️ No user ID, skipping permission check for: ${permission}`);
        return next();
      }

      // Получаем разрешения агента
      const agent = await Agents.getById(req.user.id);
      if (!agent) {
        return res.status(403).json({ message: 'Agent not found' });
      }

      // Получаем роли агента через группы
      const roleIds = await getAgentRoleIds(req.user.id);
      
      // Если нет ролей - запрещаем
      if (roleIds.length === 0) {
        console.log(`🚫 No roles assigned to agent ${req.user.id}`);
        return res.status(403).json({ message: 'No role assigned. Please contact administrator.' });
      }

      // Проверяем разрешение для всех ролей агента
      let hasPermission = false;
      for (const roleId of roleIds) {
        const rolePermission = await Roles.hasPermission(roleId, permission);
        if (rolePermission) {
          hasPermission = true;
          break;
        }
      }
      
      if (!hasPermission) {
        console.log(`🚫 Permission denied: ${permission} for agent ${req.user.id} (roles ${roleIds.join(', ')})`);
        return res.status(403).json({ 
          message: `Permission denied: ${permission}`,
          required: permission
        });
      }

      console.log(`✅ Permission granted: ${permission} for agent ${req.user.id}`);
      next();
    } catch (error) {
      console.error('Error in checkPermission middleware:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  };
};

/**
 * Получить разрешения агента для использования в контроллере
 */
const getAgentPermissions = async (agentId) => {
  try {
    // Получаем роли агента через группы
    const roleIds = await getAgentRoleIds(agentId);
    
    if (roleIds.length === 0) {
      return {};
    }
    
    // Собираем все разрешения из всех ролей агента
    const allPermissions = {};
    for (const roleId of roleIds) {
      const rolePermissions = await Roles.getPermissions(roleId);
      Object.assign(allPermissions, rolePermissions);
    }
    
    return allPermissions;
  } catch (error) {
    console.error('Error getting agent permissions:', error);
    return {};
  }
};

/**
 * Фильтровать тикеты по уровню доступа
 * Возвращает SQL условие WHERE для фильтрации
 */
const getTicketVisibilityFilter = async (agentId) => {
  try {
    const permissions = await getAgentPermissions(agentId);
    
    // Super user видит все тикеты
    if (permissions.super_user || permissions.see_all_tickets) {
      return null; // Нет фильтра - видит все
    }

    // Для агента строим условие
    const conditions = [];
    
    // Агент видит тикеты, где он является владельцем (ownerId)
    conditions.push(`t.owner_id = ${agentId}`);
    
    // Если есть see_company_tickets - видит все тикеты компании
    // (требуется логика определения компании агента)
    
    // Если есть see_department_tickets - видит тикеты отдела
    // (требуется логика определения отдела агента)
    
    return conditions.join(' OR ');
  } catch (error) {
    console.error('Error getting ticket visibility filter:', error);
    // При ошибке показываем только свои тикеты
    return `t.owner_id = ${agentId}`;
  }
};

module.exports = {
  checkPermission,
  getAgentPermissions,
  getTicketVisibilityFilter
};
