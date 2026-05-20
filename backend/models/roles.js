const { pool } = require('../config/db')

// Функция для преобразования camelCase в snake_case
function toSnakeCase(str) {
  return str.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase()
}

class Roles {
  static tableName = 'roles'
  static fields = 'name, message'

  static async getAll(options = {}) {
    const { q, sortBy, orderBy = 'asc', itemsPerPage = 1000, page = 1 } = options

    try {
      let whereClause = ''
      const params = []
      let paramIndex = 1

      if (q) {
        const searchFields = this.fields.split(', ')
        const conditions = searchFields.map(field => `${toSnakeCase(field)} ILIKE $${paramIndex}`).join(' OR ')

        whereClause = `WHERE ${conditions}`
        params.push(`%${q}%`)
        paramIndex++
      }

      let orderClause = ''
      const sortableFields = this.fields.split(', ').concat(['created_at', 'updated_at'])
      if (sortBy && sortableFields.includes(sortBy))
        orderClause = `ORDER BY ${sortBy} ${orderBy === 'desc' ? 'DESC' : 'ASC'}`

      const offset = (page - 1) * itemsPerPage

      // Get total count
      const countQuery = `SELECT COUNT(*) as total FROM ${Roles.tableName} ${whereClause}`
      const countResult = await pool.query(countQuery, params)
      const total = Number.parseInt(countResult.rows[0].total)

      // Get paginated data
      // Преобразуем имена полей в snake_case для SQL
      const sqlFields = this.fields.split(', ').map(f => {
        const snake = toSnakeCase(f)

        return snake === f ? f : `${snake} as "${f}"`
      }).join(', ')

      const dataQuery = `SELECT id, ${sqlFields}, created_at as "createdAt", updated_at as "updatedAt", is_active as "isActive" FROM ${Roles.tableName} ${whereClause} ${orderClause} LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`

      params.push(itemsPerPage, offset)

      const dataResult = await pool.query(dataQuery, params)

      return {
        roles: dataResult.rows,
        total,
      }
    }
    catch (error) {
      console.error('Error in getAll:', error)
      throw error
    }
  }

  static async getById(id) {
    try {
      // Преобразуем имена полей в snake_case для SQL
      const sqlFields = this.fields.split(', ').map(f => {
        const snake = toSnakeCase(f)

        return snake === f ? f : `${snake} as "${f}"`
      }).join(', ')

      const result = await pool.query(
        `SELECT id, ${sqlFields}, created_at as "createdAt", updated_at as "updatedAt", is_active as "isActive" FROM ${Roles.tableName} WHERE id = $1`,
        [id],
      )

      return result.rows[0] || null
    }
    catch (error) {
      console.error('Error in getById:', error)
      throw error
    }
  }

  static async create(role) {
    try {
      const fieldList = this.fields.split(', ')
      const placeholders = fieldList.map((_, i) => `$${i + 1}`).join(', ')
      const values = fieldList.map(field => role[field])

      // Добавляем isActive
      values.push(role.isActive !== undefined ? role.isActive : true)

      // Преобразуем имена полей в snake_case для SQL
      const sqlFieldsInsert = fieldList.map(f => toSnakeCase(f)).join(', ')

      const sqlFieldsSelect = fieldList.map(f => {
        const snake = toSnakeCase(f)

        return snake === f ? f : `${snake} as "${f}"`
      }).join(', ')

      const query = `INSERT INTO ${Roles.tableName} (${sqlFieldsInsert}, is_active) VALUES (${placeholders}, $${fieldList.length + 1}) RETURNING id, ${sqlFieldsSelect}, created_at as "createdAt", updated_at as "updatedAt", is_active as "isActive"`
      const result = await pool.query(query, values)

      return result.rows[0]
    }
    catch (error) {
      console.error('Error in create:', error)
      throw error
    }
  }

  static async update(id, role) {
    try {
      const fieldList = this.fields.split(', ')
      const updates = []
      const values = []
      let paramIndex = 1

      // Обновляем только переданные поля
      fieldList.forEach(field => {
        if (role[field] !== undefined) {
          updates.push(`${toSnakeCase(field)} = $${paramIndex}`)
          values.push(role[field])
          paramIndex++
        }
      })

      // Добавляем isActive если передан
      if (role.isActive !== undefined) {
        updates.push(`is_active = $${paramIndex}`)
        values.push(role.isActive)
        paramIndex++
      }

      // Всегда обновляем updated_at
      updates.push('updated_at = CURRENT_TIMESTAMP')

      // Добавляем id в конец
      values.push(id)

      // Преобразуем имена полей в snake_case для SQL
      const sqlFields = fieldList.map(f => {
        const snake = toSnakeCase(f)

        return snake === f ? f : `${snake} as "${f}"`
      }).join(', ')

      const query = `UPDATE ${Roles.tableName} SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING id, ${sqlFields}, created_at as "createdAt", updated_at as "updatedAt", is_active as "isActive"`
      const result = await pool.query(query, values)

      return result.rows[0] || null
    }
    catch (error) {
      console.error('Error in update:', error)
      throw error
    }
  }

  static async delete(id) {
    try {
      const result = await pool.query(`DELETE FROM ${Roles.tableName} WHERE id = $1`, [id])

      return result.rowCount > 0
    }
    catch (error) {
      console.error('Error in delete:', error)
      throw error
    }
  }

  // ========== Методы для работы с разрешениями ==========

  // Описания числовых уровней доступа (Linux-подобная модель)
  static getLevelDescriptions() {
    return {
      777: 'Полный доступ для всех (rwx/rwx/rwx)',
      755: 'Полный доступ для владельца, чтение/удаление для остальных (rwx/r-x/r-x)',
      744: 'Полный доступ для владельца, только чтение для остальных (rwx/r--/r--)',
      700: 'Полный доступ только для владельца (rwx/---/---)',
      666: 'Чтение и запись для всех (rw-/rw-/rw-)',
      644: 'Чтение и запись для владельца, только чтение для остальных (rw-/r--/r--)',
      600: 'Чтение и запись только для владельца (rw-/---/---)',
      444: 'Только чтение для всех (r--/r--/r--)',
      400: 'Только чтение для владельца (r--/---/---)',
      0: 'Нет доступа (---)',
    }
  }

  // Каноничный список разделов меню. Каждый раздел даёт три разрешения: _read, _write, _delete.
  // Добавление нового пункта меню = добавление одной строки сюда.
  static getMenuItems() {
    return [
      // Дашборды
      { base: 'menu_dashboard', label: 'Дашборд (Аналитика)' },

      // Тикеты
      { base: 'menu_tickets_list', label: 'Список обращений' },
      { base: 'menu_tickets_create', label: 'Создать обращение' },
      { base: 'menu_tickets_schedules', label: 'Расписания тикетов' },

      // Чат / Канбан
      { base: 'menu_chat', label: 'Чат' },
      { base: 'menu_kanban', label: 'Канбан' },

      // Агенты
      { base: 'menu_agents', label: 'Агенты' },

      // База знаний
      { base: 'menu_knowledge_base', label: 'База знаний' },

      // Сервисы
      { base: 'menu_services', label: 'Сервисы' },

      // Компании
      { base: 'menu_companies_list', label: 'Компании' },
      { base: 'menu_companies_groups', label: 'Отделы и филиалы' },
      { base: 'menu_companies_users', label: 'Сотрудники' },
      { base: 'menu_companies_structure', label: 'Структура компании' },

      // Роли и разрешения
      { base: 'menu_roles_list', label: 'Роли' },
      { base: 'menu_permissions', label: 'Разрешения' },

      // Настройки тикетов
      { base: 'menu_queues', label: 'Очереди' },
      { base: 'menu_types', label: 'Типы тикетов' },
      { base: 'menu_type_categories', label: 'Категории тикетов' },
      { base: 'menu_states', label: 'Статусы' },
      { base: 'menu_priorities', label: 'Приоритеты' },
      { base: 'menu_sla', label: 'SLA' },
      { base: 'menu_templates', label: 'Шаблоны' },
      { base: 'menu_template_queues', label: 'Очереди шаблонов' },
      { base: 'menu_workflows', label: 'Рабочие процессы' },
      { base: 'menu_greetings', label: 'Приветствия' },
      { base: 'menu_signatures', label: 'Подписи' },
      { base: 'menu_auto_responses', label: 'Автоответы' },
      { base: 'menu_attachments', label: 'Вложения' },
      { base: 'menu_tickets_system_configuration', label: 'Конфигурация тикетов' },

      // Почта
      { base: 'menu_email_addresses', label: 'Адреса почты' },
      { base: 'menu_post_master_mail_accounts', label: 'Почтовые аккаунты' },

      // Система
      { base: 'menu_calendars', label: 'Календари' },
      { base: 'menu_session_management', label: 'Сессии' },
      { base: 'menu_system_log', label: 'Системный лог' },

      // Прочее
      { base: 'menu_backup', label: 'Резервное копирование' },
      { base: 'menu_integrity_check', label: 'Контроль целостности' },
    ]
  }

  // Получить все доступные разрешения (единая модель: menu_<раздел>_<read|write|delete>)
  static getAvailablePermissions() {
    const out = []

    const opTypes = [
      { suffix: 'read', label: 'чтение', level: 444 },
      { suffix: 'write', label: 'запись', level: 644 },
      { suffix: 'delete', label: 'удаление', level: 744 },
    ]

    for (const item of this.getMenuItems()) {
      for (const t of opTypes) {
        out.push({
          code: `${item.base}_${t.suffix}`,
          name: `${item.label} (${t.label})`,
          category: item.base,
          level: t.level,
        })
      }
    }

    return out
  }

  // Карта (Map) кодов доступных разрешений в их метаданные (быстрый доступ)
  static _availablePermissionsMap() {
    const map = new Map()
    for (const p of this.getAvailablePermissions())
      map.set(p.code, p)

    return map
  }

  // Получить все уникальные разрешения, существующие в БД
  static async getAllDatabasePermissions() {
    try {
      const result = await pool.query(
        'SELECT DISTINCT permission FROM role_permissions ORDER BY permission',
      )

      return result.rows.map(row => row.permission)
    }
    catch (error) {
      console.error('Error getting database permissions:', error)

      return []
    }
  }

  // Определить уровень доступа по суффиксу кода (для разрешений, отсутствующих в getAvailablePermissions)
  static _inferLevelFromCode(code) {
    if (!code || typeof code !== 'string')
      return 0
    if (code.endsWith('_delete'))
      return 744
    if (code.endsWith('_write'))
      return 644
    if (code.endsWith('_read'))
      return 444

    return 444
  }

  // Определить категорию по префиксу кода
  static _inferCategoryFromCode(code) {
    if (!code || typeof code !== 'string')
      return 'other'
    if (code.startsWith('menu_'))
      return 'menu'
    const parts = code.split('_')

    return parts.length > 1 ? parts[0] : 'other'
  }

  // Сформировать удобочитаемое имя из кода (fallback)
  static _humanNameFromCode(code) {
    return code
  }

  // Синхронизация: вернуть объединённый список разрешений (модель + БД), без дубликатов
  static async syncPermissionsWithDatabase() {
    try {
      const dbPermissions = await this.getAllDatabasePermissions()
      const map = this._availablePermissionsMap()

      // Добавляем те разрешения из БД, которых нет в модели
      for (const code of dbPermissions) {
        if (!map.has(code)) {
          map.set(code, {
            code,
            name: this._humanNameFromCode(code),
            category: this._inferCategoryFromCode(code),
            level: this._inferLevelFromCode(code),
          })
        }
      }

      // Возвращаем массив, упорядоченный по category, затем code
      return Array.from(map.values()).sort((a, b) => {
        if (a.category !== b.category)
          return a.category.localeCompare(b.category)

        return a.code.localeCompare(b.code)
      })
    }
    catch (error) {
      console.error('Error syncing permissions with database:', error)

      return this.getAvailablePermissions()
    }
  }

  // Получить разрешения роли
  static async getPermissions(roleId) {
    try {
      const result = await pool.query(
        `SELECT permission, is_granted FROM role_permissions WHERE role_id = $1`,
        [roleId],
      )

      // Преобразуем в объект { permission: is_granted }
      const permissions = {}

      result.rows.forEach(row => {
        permissions[row.permission] = row.is_granted
      })

      return permissions
    }
    catch (error) {
      console.error('Error in getPermissions:', error)
      throw error
    }
  }

  // Получить все разрешения роли с деталями
  static async getAllPermissionsWithDetails(roleId) {
    try {
      // Получаем все разрешения, которые есть в БД для данной роли
      // Также пробуем получить колонку level (если она существует)
      let result
      let hasLevelColumn = true
      try {
        result = await pool.query(
          `SELECT permission, is_granted, level FROM role_permissions WHERE role_id = $1`,
          [roleId],
        )
      }
      catch (e) {
        // Колонки level может не быть — fallback
        hasLevelColumn = false
        result = await pool.query(
          `SELECT permission, is_granted FROM role_permissions WHERE role_id = $1`,
          [roleId],
        )
      }

      // Карты для быстрого доступа
      const grantedPermissions = {}
      const roleLevels = {}

      result.rows.forEach(row => {
        grantedPermissions[row.permission] = row.is_granted
        if (hasLevelColumn && row.level !== null && row.level !== undefined)
          roleLevels[row.permission] = row.level
      })

      // Получаем синхронизированный список всех разрешений (модель + БД)
      const availablePermissions = await this.syncPermissionsWithDatabase()

      // Формируем результат: каждое доступное разрешение + флаг is_granted + level
      return availablePermissions.map(p => ({
        code: p.code,
        name: p.name,
        category: p.category,
        level: roleLevels[p.code] !== undefined ? roleLevels[p.code] : (p.level || 0),
        default_level: p.level || 0,
        is_granted: grantedPermissions[p.code] === true,
      }))
    }
    catch (error) {
      console.error('Error in getAllPermissionsWithDetails:', error)
      throw error
    }
  }

  // Установить числовой уровень доступа для разрешения роли
  static async setPermissionLevel(roleId, permission, level) {
    try {
      // Убедимся, что строка role_permissions существует
      const upsert = `
        INSERT INTO role_permissions (role_id, permission, is_granted, level)
        VALUES ($1, $2, COALESCE((SELECT is_granted FROM role_permissions WHERE role_id = $1 AND permission = $2), false), $3)
        ON CONFLICT (role_id, permission) DO UPDATE SET level = EXCLUDED.level, updated_at = CURRENT_TIMESTAMP
      `

      await pool.query(upsert, [roleId, permission, level])

      return true
    }
    catch (error) {
      console.error('Error in setPermissionLevel:', error)
      throw error
    }
  }

  // Установить разрешения роли (upsert — не затирает прочие записи и сохраняет level)
  static async setPermissions(roleId, permissions) {
    try {
      const client = await pool.connect()
      try {
        await client.query('BEGIN')

        // Upsert каждой переданной пары (permission -> is_granted)
        for (const [permission, is_granted] of Object.entries(permissions)) {
          await client.query(
            `INSERT INTO role_permissions (role_id, permission, is_granted)
             VALUES ($1, $2, $3)
             ON CONFLICT (role_id, permission)
             DO UPDATE SET is_granted = EXCLUDED.is_granted, updated_at = CURRENT_TIMESTAMP`,
            [roleId, permission, !!is_granted],
          )
        }

        await client.query('COMMIT')

        return true
      }
      catch (error) {
        await client.query('ROLLBACK')
        throw error
      }
      finally {
        client.release()
      }
    }
    catch (error) {
      console.error('Error in setPermissions:', error)
      throw error
    }
  }

  // Проверить разрешение
  static async hasPermission(roleId, permission) {
    try {
      const result = await pool.query(
        `SELECT is_granted FROM role_permissions WHERE role_id = $1 AND permission = $2`,
        [roleId, permission],
      )

      return result.rows.length > 0 && result.rows[0].is_granted
    }
    catch (error) {
      console.error('Error in hasPermission:', error)
      throw error
    }
  }
}

module.exports = Roles
