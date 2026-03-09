const Roles = require('../models/roles');
const Agents = require('../models/agents');

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

      // Если нет роли - запрещаем
      if (!agent.roleId) {
        return res.status(403).json({ message: 'No role assigned' });
      }

      // Проверяем разрешение
      const hasPermission = await Roles.hasPermission(agent.roleId, permission);
      
      if (!hasPermission) {
        console.log(`🚫 Permission denied: ${permission} for agent ${req.user.id} (role ${agent.roleId})`);
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
    const agent = await Agents.getById(agentId);
    if (!agent || !agent.roleId) {
      return {};
    }
    return await Roles.getPermissions(agent.roleId);
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
