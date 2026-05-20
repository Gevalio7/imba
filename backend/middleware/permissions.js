const Roles = require('../models/roles')
const Agents = require('../models/agents')
const { pool } = require('../config/db')

/**
 * Получить ID ролей агента через группы
 */
const getAgentRoleIds = async agentId => {
  try {
    const result = await pool.query(`
      SELECT DISTINCT agr.role_id
      FROM agents_groups_agents aga
      JOIN agents_groups ag ON aga.agents_group_id = ag.id AND ag.is_active = true
      LEFT JOIN agents_groups_roles agr ON agr.agents_group_id = ag.id
      WHERE aga.agent_id = $1
    `, [agentId])

    return result.rows.map(row => row.role_id).filter(id => id !== null)
  }
  catch (error) {
    console.error('Error getting agent role IDs:', error)

    return []
  }
}

/**
 * Middleware для проверки разрешений агента
 * req.user должен содержать id агента
 */
const checkPermission = permission => {
  return async (req, res, next) => {
    console.log(`🔐 checkPermission: ${permission}, user: ${req.user?.id}, path: ${req.path}`)
    try {
      // Если нет user.id - пропускаем (для API ключей или анонимных запросов)
      if (!req.user?.id) {
        console.log(`⚠️ No user ID, skipping permission check for: ${permission}`)

        return next()
      }

      // Получаем разрешения агента
      const agent = await Agents.getById(req.user.id)
      if (!agent)
        return res.status(403).json({ message: 'Agent not found' })

      // Получаем роли агента через группы
      const roleIds = await getAgentRoleIds(req.user.id)

      // Если нет ролей - запрещаем
      if (roleIds.length === 0) {
        console.log(`🚫 No roles assigned to agent ${req.user.id}`)

        return res.status(403).json({ message: 'No role assigned. Please contact administrator.' })
      }

      // Проверяем разрешение для всех ролей агента
      let hasPermission = false
      for (const roleId of roleIds) {
        const rolePermission = await Roles.hasPermission(roleId, permission)
        if (rolePermission) {
          hasPermission = true
          break
        }
      }

      if (!hasPermission) {
        console.log(`🚫 Permission denied: ${permission} for agent ${req.user.id} (roles ${roleIds.join(', ')})`)

        return res.status(403).json({
          message: `Permission denied: ${permission}`,
          required: permission,
        })
      }

      console.log(`✅ Permission granted: ${permission} for agent ${req.user.id}`)
      next()
    }
    catch (error) {
      console.error('Error in checkPermission middleware:', error)

      return res.status(500).json({ message: 'Internal server error' })
    }
  }
}

/**
 * Получить разрешения агента для использования в контроллере
 */
const getAgentPermissions = async agentId => {
  try {
    // Получаем роли агента через группы
    const roleIds = await getAgentRoleIds(agentId)

    if (roleIds.length === 0)
      return {}

    // Собираем все разрешения из всех ролей агента
    const allPermissions = {}
    for (const roleId of roleIds) {
      const rolePermissions = await Roles.getPermissions(roleId)

      Object.assign(allPermissions, rolePermissions)
    }

    return allPermissions
  }
  catch (error) {
    console.error('Error getting agent permissions:', error)

    return {}
  }
}

/**
 * Фильтровать тикеты по уровню доступа.
 *
 * В новой модели видимость списка тикетов управляется правом
 * `menu_tickets_list_read`:
 *   - есть → агент видит все тикеты (бывшее `see_all_tickets`)
 *   - нет  → только свои (owner_id) (бывшее `see_own_tickets`)
 *
 * TODO(scoping): прежняя модель различала уровни видимости
 * own/department/company/all. Если нужны промежуточные scopes, ввести
 * либо отдельные коды (menu_tickets_list_company_read,
 * menu_tickets_list_department_read), либо использовать числовой level
 * у строки role_permissions (7=all, 5=company, 4=department, 0=own).
 */
const getTicketVisibilityFilter = async agentId => {
  try {
    const permissions = await getAgentPermissions(agentId)

    // Если есть право на чтение списка тикетов — нет фильтра
    if (permissions.menu_tickets_list_read)
      return null

    // Иначе — только свои тикеты
    return {
      condition: 't.owner_id = $1',
      params: [agentId],
    }
  }
  catch (error) {
    console.error('Error getting ticket visibility filter:', error)

    return {
      condition: 't.owner_id = $1',
      params: [agentId],
    }
  }
}

module.exports = {
  checkPermission,
  getAgentPermissions,
  getTicketVisibilityFilter,
}
