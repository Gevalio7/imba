<script setup lang="ts">
definePage({
  meta: {
    navActiveLink: 'apps-roles',
  },
})

import { computed, nextTick, onMounted, ref, triggerRef, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAbility } from '@casl/vue'
import { menuConfig } from '@/constants/roleMenuConfig'
import { useRolePermissions } from '@/composables/useRolePermissions'
import { useRoleForm } from '@/composables/useRoleForm'

const ability = useAbility()

// Route params
const route = useRoute()
const router = useRouter()
const roleId = ref(0)
const isNew = computed(() => !roleId.value)

// Composables
const { permissionsMap, getChildPermission, setChildPermission, updateParentState, toggleCategory, getParentState, getPermissionLevel, updatePermissionLevel, fetchPermissions } = useRolePermissions(roleId, isNew)
const { role, fetchRole, saveRole, cancel } = useRoleForm()

const loading = ref(false)
const saving = ref(false)
const superAdmin = ref(false)
const superAdminUpdating = ref(false)
const expandedPanels = ref(menuConfig.map(c => c.category))

const isToastVisible = ref(false)
const toastMessage = ref('')
const toastColor = ref('success')

const levelDescriptions = ref<Record<number, string>>({
  777: 'Полный доступ для всех (rwx/rwx/rwx)',
  755: 'Полный доступ для владельца, чтение/удаление для остальных (rwx/r-x/r-x)',
  744: 'Полный доступ для владельца, только чтение для остальных (rwx/r--/r--)',
  700: 'Полный доступ только для владельца (rwx/---/---)',
  666: 'Чтение и запись для всех (rw-/rw-/rw-)',
  644: 'Чтение и запись для владельца, только чтение для остальных (rw-/r--/r--)',
  600: 'Чтение и запись только для владельца (rw-/---/---)',
  444: 'Только чтение для всех (r--/r--/r--)',
  400: 'Только чтение для владельца (r--/---/---)',
  0: 'Нет доступа (---)'
})

const accessLevels = computed(() =>
  Object.entries(levelDescriptions.value)
    .map(([k, v]) => ({ level: parseInt(k, 10), description: v }))
    .sort((a, b) => b.level - a.level)
)

const getLevelDescription = (level: number): string => {
  return levelDescriptions.value[level] || `Уровень ${level}`
}

const showToast = (message: string, color: string = 'success') => {
  toastMessage.value = message
  toastColor.value = color
  isToastVisible.value = true
}

watch(superAdmin, async (newVal) => {
  if (superAdminUpdating.value) return

  if (!roleId.value || roleId.value === 0) {
    superAdminUpdating.value = true
    showToast('Сначала сохраните основную информацию роли', 'warning')
    superAdmin.value = !newVal
    nextTick(() => { superAdminUpdating.value = false })
    return
  }

  try {
    const permissionsToUpdate: Record<string, boolean> = {}

    permissionsMap.value.forEach((perm, code) => {
      const isParentPermission = menuConfig.some(cat =>
        `${cat.category}_read` === code ||
        `${cat.category}_write` === code ||
        `${cat.category}_delete` === code
      )

      if (!isParentPermission && (code.endsWith('_read') || code.endsWith('_write') || code.endsWith('_delete'))) {
        permissionsToUpdate[code] = newVal
        if (code.endsWith('_read')) perm.read = newVal
        else if (code.endsWith('_write')) perm.write = newVal
        else if (code.endsWith('_delete')) perm.delete = newVal
      }
    })

    triggerRef(permissionsMap)
    menuConfig.forEach(category => {
      if (category.children[0]?.code) {
        updateParentState(menuConfig, category.children[0].code)
      }
    })

    await $api(`/roles/${roleId.value}/permissions`, {
      method: 'PUT',
      body: { permissions: permissionsToUpdate }
    })
  } catch (err) {
    // rollback
    permissionsMap.value.forEach((perm, code) => {
      const isParentPermission = menuConfig.some(cat =>
        `${cat.category}_read` === code ||
        `${cat.category}_write` === code ||
        `${cat.category}_delete` === code
      )
      if (!isParentPermission && (code.endsWith('_read') || code.endsWith('_write') || code.endsWith('_delete'))) {
        if (code.endsWith('_read')) perm.read = !newVal
        else if (code.endsWith('_write')) perm.write = !newVal
        else if (code.endsWith('_delete')) perm.delete = !newVal
      }
    })
    triggerRef(permissionsMap)
    superAdminUpdating.value = true
    superAdmin.value = !newVal
    nextTick(() => { superAdminUpdating.value = false })
  }
})

onMounted(async () => {
  const id = route.query.id
  roleId.value = id && id !== 'undefined' ? parseInt(String(id), 10) : 0

  if (roleId.value) {
    await Promise.all([fetchRole(roleId.value), fetchPermissions(menuConfig)])
  } else {
    await fetchPermissions(menuConfig)
  }
})

  {
    category: 'menu_kanban',
    label: 'Канбан',
    children: [
      { id: 'apps-kanban', label: 'Канбан', code: 'menu_kanban' },
    ]
  },
  {
    category: 'menu_agents',
    label: 'Агенты',
    children: [
      { id: 'apps-agents', label: 'Список агентов', code: 'menu_agents' },
    ]
  },
  {
    category: 'menu_knowledge_base',
    label: 'База знаний',
    children: [
      { id: 'apps-knowledge-base', label: 'База знаний', code: 'menu_knowledge_base' },
    ]
  },
  {
    category: 'menu_services',
    label: 'Сервисы',
    children: [
      { id: 'apps-services', label: 'Сервисы', code: 'menu_services' },
    ]
  },
  {
    category: 'menu_companies',
    label: 'Наши компании',
    children: [
      { id: 'apps-customers', label: 'Компании', code: 'menu_companies_list' },
      { id: 'apps-customers-groups', label: 'Отделы и филиалы', code: 'menu_companies_groups' },
      { id: 'apps-customer-users', label: 'Сотрудники', code: 'menu_companies_users' },
      { id: 'apps-organization-structure', label: 'Структура компании', code: 'menu_companies_structure' },
    ]
  },
  {
    category: 'menu_roles',
    label: 'Роли',
    children: [
      { id: 'apps-roles', label: 'Роли', code: 'menu_roles_list' },
      { id: 'apps-permissions', label: 'Разрешения', code: 'menu_permissions' },
    ]
  },
  {
    category: 'menu_ticket_settings',
    label: 'Настройки Тикетов',
    children: [
      { id: 'apps-queues', label: 'Очереди', code: 'menu_queues' },
      { id: 'apps-types', label: 'Типы', code: 'menu_types' },
      { id: 'apps-type-categories', label: 'Категории', code: 'menu_type_categories' },
      { id: 'apps-states', label: 'Статусы', code: 'menu_states' },
      { id: 'apps-priorities', label: 'Приоритеты', code: 'menu_priorities' },
      { id: 'apps-sla', label: 'SLA', code: 'menu_sla' },
      { id: 'apps-templates', label: 'Шаблоны', code: 'menu_templates' },
      { id: 'apps-template-queues', label: 'Очереди шаблонов', code: 'menu_template_queues' },
      { id: 'apps-workflows', label: 'Рабочие процессы', code: 'menu_workflows' },
      { id: 'apps-greetings', label: 'Приветствия', code: 'menu_greetings' },
      { id: 'apps-signatures', label: 'Подписи', code: 'menu_signatures' },
      { id: 'apps-auto-responses', label: 'Автоответы', code: 'menu_auto_responses' },
      { id: 'apps-attachments', label: 'Вложения', code: 'menu_attachments' },
      { id: 'apps-settings-ticket-settings', label: 'Конфигурация системы', code: 'menu_tickets_system_configuration' }
    ]
  },
  {
    category: 'menu_email_settings',
    label: 'Настройка Почты',
    children: [
      { id: 'apps-email-addresses', label: 'Адреса', code: 'menu_email_addresses' },
      { id: 'apps-post-master-mail-accounts', label: 'Почтовые аккаунты', code: 'menu_post_master_mail_accounts' },
    ]
  },
  {
    category: 'menu_system',
    label: 'Система',
    children: [
      { id: 'apps-calendars', label: 'Календари', code: 'menu_calendars' },
      { id: 'apps-session-management', label: 'Сессии', code: 'menu_session_management' },
      { id: 'apps-system-log', label: 'Лог', code: 'menu_system_log' },
    ]
  },
  {
    category: 'menu_backup',
    label: 'Резервное копирование',
    children: [
      { id: 'apps-backup', label: 'Резервное копирование', code: 'menu_backup' },
    ]
  },
  {
    category: 'menu_integrity_check',
    label: 'Контроль целостности',
    children: [
      { id: 'apps-integrity-check', label: 'Контроль целостности', code: 'menu_integrity_check' },
    ]
  }
]

// Получить иконку для категории
const getCategoryIcon = (category: string): string => {
  const icons: Record<string, string> = {
    menu_tickets: 'bx-message-detail',
    menu_chat: 'bx-chat',
    menu_kanban: 'bx-grid',
    menu_agents: 'bx-user',
    menu_knowledge_base: 'bx-book',
    menu_services: 'bx-package',
    menu_companies: 'bx-buildings',
    menu_roles: 'bx-check-shield',
    menu_ticket_settings: 'bx-detail',
    menu_email_settings: 'bx-envelope',
    menu_system: 'bx-cog',
    menu_backup: 'bx-archive',
    menu_integrity_check: 'bx-shield'
  }
  return icons[category] || 'bx-menu'
}

// Получить цвет для категории
const getCategoryColor = (category: string): string => {
  const colors: Record<string, string> = {
    menu_tickets: 'primary',
    menu_chat: 'info',
    menu_kanban: 'warning',
    menu_agents: 'success',
    menu_knowledge_base: 'purple',
    menu_services: 'orange',
    menu_companies: 'teal',
    menu_roles: 'error',
    menu_ticket_settings: 'blue',
    menu_email_settings: 'indigo',
    menu_system: 'brown',
    menu_backup: 'grey',
    menu_integrity_check: 'deep-purple'
  }
  return colors[category] || 'grey'
}

// Получить permission для child
const getChildPermission = (childCode: string, type: 'read' | 'write' | 'delete'): boolean => {
  if (!permissionsMap.value) return false
  const permission = permissionsMap.value.get(`${childCode}_${type}`)
  return permission ? permission[type] : false
}

// Установить permission для child
const setChildPermission = async (childCode: string, type: 'read' | 'write' | 'delete', value: boolean) => {
  if (!childCode) {
    console.error('setChildPermission: childCode is undefined')
    return
  }

  if (!roleId.value || roleId.value === 0) {
    showToast('Сначала сохраните основную информацию роли', 'warning')
    return
  }

  const key = `${childCode}_${type}`
  const permission = permissionsMap.value.get(key)
  if (permission) {
    const oldRead = permission.read
    const oldWrite = permission.write
    const oldDelete = permission.delete

    try {
      let permissionsToUpdate: Record<string, boolean> = { [key]: value }

      if (type === 'write' && value) {
        permissionsToUpdate[`${childCode}_read`] = true
      } else if (type === 'delete' && value) {
        permissionsToUpdate[`${childCode}_read`] = true
        permissionsToUpdate[`${childCode}_write`] = true
      } else if (type === 'read' && !value) {
        permissionsToUpdate[`${childCode}_write`] = false
        permissionsToUpdate[`${childCode}_delete`] = false
      } else if (type === 'write' && !value) {
        permissionsToUpdate[`${childCode}_delete`] = false
      }

      // Optimistic update: обновляем UI сразу
      Object.entries(permissionsToUpdate).forEach(([permKey, permValue]) => {
        const p = permissionsMap.value.get(permKey)
        if (p) {
          const permType = permKey.endsWith('_read') ? 'read' : permKey.endsWith('_write') ? 'write' : 'delete'
          ;(p as any)[permType] = permValue
        }
      })
      triggerRef(permissionsMap)
      updateParentState(childCode)

      // Отправляем на сервер
      await $api(`/roles/${roleId.value}/permissions`, {
        method: 'PUT',
        body: { permissions: permissionsToUpdate }
      })

      console.log(`Permissions updated:`, permissionsToUpdate)
    } catch (err) {
      console.error(`Failed to update permissions:`, err)
      // Откатываем при ошибке
      permission.read = oldRead
      permission.write = oldWrite
      permission.delete = oldDelete
      triggerRef(permissionsMap)
      updateParentState(childCode)
      showToast('Ошибка сохранения разрешений', 'error')
    }
  }
}

// Обновить состояние родителя
const updateParentState = (childCode: string) => {
  // Найти категорию, к которой относится child
  const category = menuConfig.find(cat =>
    cat.children.some(child => child.code === childCode)
  )

  if (!category) return

  // Проверить каждый тип отдельно
  const types = ['read', 'write', 'delete'] as const

  types.forEach(type => {
    const allChecked = category.children.every(child =>
      getChildPermission(child.code!, type)
    )
    const someChecked = category.children.some(child =>
      getChildPermission(child.code!, type)
    )

    // Сохраняем состояние родителя в специальном поле
    const parentKey = `${category.category}_${type}`
    if (!permissionsMap.value.get(parentKey)) {
      permissionsMap.value.set(parentKey, {
        code: parentKey,
        name: category.label,
        category: category.category,
        level: 0,
        read: false,
        write: false,
        delete: false
      })
    }

    const parentPerm = permissionsMap.value.get(parentKey)!
    parentPerm[type] = allChecked
    ;(parentPerm as any)[`${type}_indeterminate`] = someChecked && !allChecked
  })

  triggerRef(permissionsMap)
}

// Переключить всю категорию
const toggleCategory = async (category: MenuCategory, type: 'read' | 'write' | 'delete', value: boolean) => {
  // Проверяем, что у нас есть ID роли для сохранения
  if (!roleId.value || roleId.value === 0) {
    showToast('Сначала сохраните основную информацию роли', 'warning')
    return
  }

  try {
    // Собираем все разрешения для отправки одним запросом
    const permissionsToUpdate: Record<string, boolean> = {}

    category.children.forEach(child => {
      if (child.code) {
        // Добавляем основное разрешение
        const key = `${child.code}_${type}`
        permissionsToUpdate[key] = value

        // Логика зависимостей для категории
        if (type === 'write' && value) {
          permissionsToUpdate[`${child.code}_read`] = true
        } else if (type === 'delete' && value) {
          permissionsToUpdate[`${child.code}_read`] = true
          permissionsToUpdate[`${child.code}_write`] = true
        } else if (type === 'read' && !value) {
          permissionsToUpdate[`${child.code}_write`] = false
          permissionsToUpdate[`${child.code}_delete`] = false
        } else if (type === 'write' && !value) {
          permissionsToUpdate[`${child.code}_delete`] = false
        }
      }
    })

    // Optimistic update: обновляем UI сразу
    Object.entries(permissionsToUpdate).forEach(([permKey, permValue]) => {
      const permission = permissionsMap.value.get(permKey)
      if (permission) {
        const permType = permKey.endsWith('_read') ? 'read' : permKey.endsWith('_write') ? 'write' : 'delete'
        ;(permission as any)[permType] = permValue
      }
    })
    triggerRef(permissionsMap)
    updateParentState(category.children[0]?.code || '')

    // Отправляем запрос на сервер
    await $api(`/roles/${roleId.value}/permissions`, {
      method: 'PUT',
      body: { permissions: permissionsToUpdate }
    })

    console.log(`Category ${category.category} ${type} permissions updated to ${value}`)
  } catch (err) {
    console.error(`Failed to update category ${category.category} permissions:`, err)
    // Откатываем — перезагружаем permissions с сервера
    await fetchPermissions()
    showToast('Ошибка сохранения разрешений категории', 'error')
  }
}

// Получить состояние родительского чекбокса (для indeterminate)
const getParentState = (category: MenuCategory, type: 'read' | 'write' | 'delete') => {
  const key = `${category.category}_${type}`
  const perm = permissionsMap.value.get(key)
  if (!perm) {
    // Если нет родительского пермишена, вычисляем на лету
    const allChecked = category.children.every(child =>
      getChildPermission(child.code!, type)
    )
    const someChecked = category.children.some(child =>
      getChildPermission(child.code!, type)
    )
    return {
      value: allChecked,
      indeterminate: someChecked && !allChecked
    }
  }

  return {
    value: perm[type],
    indeterminate: (perm as any)[`${type}_indeterminate`] || false
  }
}

// Загрузка данных
const fetchRole = async () => {
  if (isNew.value) return

  try {
    loading.value = true
    const data = await $api<Role>(`/roles/${roleId.value}`)
    role.value = data
  } catch (err) {
    console.error('Error fetching role:', err)
  } finally {
    loading.value = false
  }
}

const fetchPermissions = async () => {
  try {
    // Загружаем доступные разрешения с уровнями (синхронизированные с БД)
    const data = await $api<{ permissions: ApiPermission[]; levelDescriptions?: Record<number, string> }>(
      '/roles/permissions-with-levels'
    )

    console.log('Loaded permissions with levels from API:', data.permissions.length)

    if (data.levelDescriptions) {
      levelDescriptions.value = data.levelDescriptions
    }

    // Заполняем Map - преобразуем is_granted в read/write/delete + level
    data.permissions.forEach(perm => {
      let type: 'read' | 'write' | 'delete' | null = null
      if (perm.code.endsWith('_read')) type = 'read'
      else if (perm.code.endsWith('_write')) type = 'write'
      else if (perm.code.endsWith('_delete')) type = 'delete'

      const level = typeof perm.level === 'number' ? perm.level : 0
      const defaultLevel = typeof perm.default_level === 'number' ? perm.default_level : level

      if (type) {
        permissionsMap.value.set(perm.code, {
          code: perm.code,
          name: perm.name,
          category: perm.category,
          level,
          defaultLevel,
          read: type === 'read' ? perm.is_granted === true : false,
          write: type === 'write' ? perm.is_granted === true : false,
          delete: type === 'delete' ? perm.is_granted === true : false
        })
      } else {
        permissionsMap.value.set(perm.code, {
          code: perm.code,
          name: perm.name,
          category: perm.category,
          level,
          defaultLevel,
          read: perm.is_granted === true,
          write: false,
          delete: false
        })
      }
    })

    // Добавляем permissions для всех пунктов меню если их нет (на основе menuConfig)
    menuConfig.forEach(category => {
      category.children.forEach(child => {
        if (!child.code) return
        const variants: Array<{ code: string; default: number }> = [
          { code: `${child.code}_read`, default: 444 },
          { code: `${child.code}_write`, default: 644 },
          { code: `${child.code}_delete`, default: 744 }
        ]
        variants.forEach(v => {
          if (!permissionsMap.value.has(v.code)) {
            permissionsMap.value.set(v.code, {
              code: v.code,
              name: child.label,
              category: category.category,
              level: 0,
              defaultLevel: v.default,
              read: false,
              write: false,
              delete: false
            })
          }
        })
      })
    })

    // Если редактируем существующую роль, загружаем её разрешения с уровнями
    if (!isNew.value && roleId.value) {
      console.log('Loading permissions for role:', roleId.value)
      const rolePermissions = await $api<{ permissions: ApiPermission[] }>(
        `/roles/${roleId.value}/permissions`
      )

      console.log('Role permissions count:', rolePermissions.permissions?.length ?? 0)

      if (rolePermissions.permissions) {
        rolePermissions.permissions.forEach(perm => {
          const level = typeof perm.level === 'number' ? perm.level : 0
          const defaultLevel = typeof perm.default_level === 'number' ? perm.default_level : level

          if (!permissionsMap.value.has(perm.code)) {
            permissionsMap.value.set(perm.code, {
              code: perm.code,
              name: perm.name || perm.code,
              category: perm.category || 'other',
              level,
              defaultLevel,
              read: false,
              write: false,
              delete: false
            })
          }
          const p = permissionsMap.value.get(perm.code)!
          p.level = level
          p.defaultLevel = defaultLevel

          if (perm.code.endsWith('_read')) p.read = perm.is_granted === true
          else if (perm.code.endsWith('_write')) p.write = perm.is_granted === true
          else if (perm.code.endsWith('_delete')) p.delete = perm.is_granted === true
          else p.read = perm.is_granted === true
        })
      }

      // Триггерим реактивность после мутации объектов внутри Map
      triggerRef(permissionsMap)

      // Обновить состояния родителей
      menuConfig.forEach(category => {
        category.children.forEach(child => {
          if (child.code) {
            updateParentState(child.code!)
          }
        })
      })
    }

    console.log('Total permissions in map:', permissionsMap.value.size)
  } catch (err) {
    console.error('Error fetching permissions:', err)
  }
}

// Обновить уровень доступа для конкретного разрешения
const updatePermissionLevel = async (
  childCode: string,
  type: 'read' | 'write' | 'delete',
  newLevel: number
) => {
  if (!roleId.value || roleId.value === 0) {
    showToast('Сначала сохраните основную информацию роли', 'warning')
    return
  }

  const key = `${childCode}_${type}`
  const permission = permissionsMap.value.get(key)
  if (!permission) return

  const oldLevel = permission.level
  permission.level = newLevel

  try {
    await $api(`/roles/${roleId.value}/permissions-level`, {
      method: 'PUT',
      body: { permission: key, level: newLevel }
    })
    showToast(`Уровень доступа обновлён: ${newLevel}`)
  } catch (err) {
    console.error('Failed to update permission level:', err)
    permission.level = oldLevel
    showToast('Ошибка обновления уровня доступа', 'error')
  }
}

// Сохранение роли
const saveRole = async () => {
  if (!role.value.name.trim()) {
    showToast('Название роли обязательно', 'error')
    return
  }

  try {
    saving.value = true

    if (isNew.value) {
      // Создаем новую роль
      const savedRole = await $api<Role>('/roles', {
        method: 'POST',
        body: {
          name: role.value.name,
          message: role.value.message,
          isActive: role.value.isActive
        }
      })

      role.value.id = savedRole.id
      roleId.value = savedRole.id

      // Сохраняем разрешения для новой роли
      const permissionsObj: Record<string, boolean> = {}
      permissionsMap.value.forEach((perm, code) => {
        const isParentPermission = menuConfig.some(cat =>
          `${cat.category}_read` === code ||
          `${cat.category}_write` === code ||
          `${cat.category}_delete` === code
        )
        if (isParentPermission) return

        if (code.endsWith('_read') && perm.read) {
          permissionsObj[code] = true
        } else if (code.endsWith('_write') && perm.write) {
          permissionsObj[code] = true
        } else if (code.endsWith('_delete') && perm.delete) {
          permissionsObj[code] = true
        }
      })

      if (Object.keys(permissionsObj).length > 0) {
        await $api(`/roles/${savedRole.id}/permissions`, {
          method: 'PUT',
          body: { permissions: permissionsObj }
        })
      }

      showToast('Роль успешно создана')
      router.replace({ path: '/apps/roles/edit', query: { id: savedRole.id } })
    } else {
      // Обновляем существующую роль
      await $api<Role>(`/roles/${roleId.value}`, {
        method: 'PUT',
        body: {
          name: role.value.name,
          message: role.value.message,
          isActive: role.value.isActive
        }
      })
      showToast('Основная информация роли сохранена')

      // Если мы изменили роль текущего пользователя — применяем новые правила без выхода
      try {
        const cookieUserData = useCookie<any>('userData')
        const currentRoleId = cookieUserData.value?.roleId || cookieUserData.value?.roleId || null
        if (currentRoleId && Number(currentRoleId) === Number(roleId.value)) {
          try {
            const me = await $api('/auth/me', { method: 'GET' })
            let newRules = null
            try {
              const sess = await $api('/sessionManagement/current')
              if (sess && sess.userAbilityRules) newRules = sess.userAbilityRules
            } catch (e) {
              // ignore
            }

            if (!newRules && me && me.userAbilityRules) newRules = me.userAbilityRules

            if (newRules && Array.isArray(newRules)) {
              const rulesJson = JSON.stringify(newRules)
              if (typeof sessionStorage !== 'undefined') sessionStorage.setItem('userAbilityRules', rulesJson)
              localStorage.setItem('userAbilityRules', rulesJson)
              ability.update(newRules)
              const gp = useGlobalPermissions()
              await gp.loadPermissions()
              showToast('Права применены в текущей сессии', 'success')
            }
          } catch (err) {
            console.warn('Не удалось автоматически применить новые права текущему пользователю:', err)
          }
        }
      } catch (err) {
        console.warn('Ошибка при попытке применить права для текущего пользователя:', err)
      }
    }
  } catch (err) {
    console.error('Error saving role:', err)
    showToast('Ошибка сохранения роли', 'error')
  } finally {
    saving.value = false
  }
}

const cancel = () => {
  router.push('/apps/Roles')
}

// Инициализация
onMounted(async () => {
  const id = route.query.id
  roleId.value = id && id !== 'undefined' ? parseInt(String(id), 10) : 0

  if (roleId.value) {
    await Promise.all([fetchRole(), fetchPermissions()])
  } else {
    await fetchPermissions()
  }
})
</script>

<template>
  <VRow>
    <!-- Левая колонка - информация о роли -->
    <VCol
      cols="12"
      md="5"
      lg="4"
    >
      <VCard>
        <VCardText class="text-center pt-12">
          <VAvatar
            rounded
            :size="120"
            color="primary"
            variant="tonal"
            class="mb-4"
          >
            <VIcon icon="bx-shield" size="60" />
          </VAvatar>

          <h5 class="text-h5 mt-4">
            {{ role.name || 'Новая роль' }}
          </h5>

          <VChip
            label
            :color="role.isActive ? 'success' : 'error'"
            size="small"
            class="text-capitalize mt-4"
          >
            {{ role.isActive ? 'Активен' : 'Не активен' }}
          </VChip>
        </VCardText>

        <VCardText>
          <h5 class="text-h5">
            Информация
          </h5>

          <VDivider class="my-4" />

          <VList class="card-list mt-2">
            <VListItem v-if="role.id">
              <VListItemTitle>
                <h6 class="text-h6">
                  ID:
                  <span class="text-body-1">{{ role.id }}</span>
                </h6>
              </VListItemTitle>
            </VListItem>

            <VListItem v-if="role.createdAt">
              <VListItemTitle>
                <h6 class="text-h6">
                  Создан:
                  <span class="text-body-1">{{ new Date(role.createdAt).toLocaleDateString() }}</span>
                </h6>
              </VListItemTitle>
            </VListItem>

            <VListItem v-if="role.updatedAt">
              <VListItemTitle>
                <h6 class="text-h6">
                  Изменен:
                  <span class="text-body-1">{{ new Date(role.updatedAt).toLocaleDateString() }}</span>
                </h6>
              </VListItemTitle>
            </VListItem>
          </VList>
        </VCardText>

        <VCardText class="d-flex justify-center gap-x-4">
          <VBtn
            variant="elevated"
            @click="saveRole"
            :loading="saving"
          >
            {{ isNew ? 'Создать роль' : 'Сохранить изменения' }}
          </VBtn>

          <VBtn
            variant="tonal"
            color="error"
            @click="cancel"
          >
            Отмена
          </VBtn>
        </VCardText>
      </VCard>
    </VCol>

    <!-- Правая колонка - форма редактирования -->
    <VCol
      cols="12"
      md="7"
      lg="8"
    >
      <VCard elevation="2" class="pa-6">
        <VCardTitle class="d-flex align-center pa-0 mb-6">
          <VBtn
            icon="bx-arrow-back"
            variant="text"
            size="small"
            @click="cancel"
            class="mr-3"
          />
          <div>
            <h1 class="text-h4 mb-1">{{ isNew ? 'Создание роли' : 'Редактирование роли' }}</h1>
            <p class="text-body-2 text-medium-emphasis">Управляйте настройками роли и её разрешениями</p>
          </div>
        </VCardTitle>

        <!-- Основная информация -->
        <VCard variant="outlined" class="mb-6">
          <VCardTitle class="pb-3">
            <div class="d-flex align-center">
              <VIcon icon="bx-user" class="mr-3" color="primary" />
              <span class="text-h6">Основная информация</span>
            </div>
          </VCardTitle>
          <VCardText>
            <VRow>
              <VCol cols="12" md="8">
                <AppTextField
                  v-model="role.name"
                  label="Название роли *"
                  placeholder="Введите название роли"
                  :rules="[(v: string) => !!v || 'Название обязательно']"
                  prepend-inner-icon="bx-tag"
                />
              </VCol>
              <VCol cols="12" md="4" class="d-flex align-center">
                <VSwitch
                  v-model="role.isActive"
                  label="Роль активна"
                  color="success"
                  inset
                />
              </VCol>
              <VCol cols="12">
                <AppTextarea
                  v-model="role.message"
                  label="Описание роли"
                  placeholder="Введите описание роли"
                  rows="3"
                  prepend-inner-icon="bx-message-detail"
                />
              </VCol>
            </VRow>
          </VCardText>
        </VCard>

        <!-- Super Admin Toggle -->
        <VCard variant="outlined" class="mb-6">
          <VCardTitle class="pb-3">
            <div class="d-flex align-center">
              <VIcon icon="bx-crown" class="mr-3" color="error" />
              <span class="text-h6">Супер-пользователь</span>
            </div>
          </VCardTitle>
          <VCardText>
            <VSwitch
              v-model="superAdmin"
              label="Полный доступ ко всем разрешениям"
              color="error"
              inset
              class="mb-2"
            />
            <p class="text-body-2 text-medium-emphasis">
              Включение этого режима автоматически предоставит все разрешения (чтение, запись, удаление) для всех категорий.
            </p>
          </VCardText>
        </VCard>

        <!-- Разрешения -->
        <VCard variant="outlined">
          <VCardTitle class="pb-3">
            <div class="d-flex align-center">
              <VIcon icon="bx-shield-check" class="mr-3" color="primary" />
              <span class="text-h6">Разрешения меню</span>
            </div>
          </VCardTitle>
          <VCardSubtitle class="pb-3">
            <VAlert
              type="info"
              variant="tonal"
              density="compact"
              class="mb-2"
            >
              Изменения сохраняются автоматически при переключении
            </VAlert>
            <VAlert
              type="info"
              variant="outlined"
              density="compact"
              class="mb-0"
            >
              <div class="text-caption">
                <strong>Уровни доступа (модель Linux):</strong>
                <span class="ml-1">первая цифра — владелец, вторая — группа, третья — остальные.</span>
                <span class="ml-1">7=rwx, 6=rw-, 5=r-x, 4=r--, 0=---.</span>
                <span class="ml-1">Кликните по числу рядом с чекбоксом, чтобы изменить уровень.</span>
              </div>
            </VAlert>
          </VCardSubtitle>
          <VCardText>
            <div v-if="loading" class="d-flex justify-center py-8">
              <VProgressCircular indeterminate color="primary" size="64" />
            </div>
            <div v-else>
              <VExpansionPanels v-model="expandedPanels" multiple variant="accordion">
                <VExpansionPanel
                  v-for="category in menuConfig"
                  :key="category.category"
                  :value="category.category"
                  class="menu-permission-panel"
                >
                  <VExpansionPanelTitle class="py-2">
                    <div class="d-flex align-center w-100">
                      <VIcon
                        :icon="getCategoryIcon(category.category)"
                        class="mr-3"
                        color="grey"
                        size="22"
                      />
                      <span class="text-subtitle-1 font-weight-medium">{{ category.label }}</span>

                      <div class="ml-auto d-flex gap-6">
                        <div class="d-flex align-center permission-check">
                          <span class="text-caption mr-2 permission-label">Чтение</span>
                          <VCheckbox
                            :model-value="getParentState(category, 'read').value"
                            :indeterminate="getParentState(category, 'read').indeterminate"
                            density="compact"
                            hide-details
                            color="primary"
                            @update:model-value="(val) => toggleCategory(category, 'read', !!val)"
                            @click.stop
                          />
                        </div>
                        <div class="d-flex align-center permission-check">
                          <span class="text-caption mr-2 permission-label">Запись</span>
                          <VCheckbox
                            :model-value="getParentState(category, 'write').value"
                            :indeterminate="getParentState(category, 'write').indeterminate"
                            density="compact"
                            hide-details
                            color="primary"
                            @update:model-value="(val) => toggleCategory(category, 'write', !!val)"
                            @click.stop
                          />
                        </div>
                        <div class="d-flex align-center permission-check">
                          <span class="text-caption mr-2 permission-label">Удаление</span>
                          <VCheckbox
                            :model-value="getParentState(category, 'delete').value"
                            :indeterminate="getParentState(category, 'delete').indeterminate"
                            density="compact"
                            hide-details
                            color="primary"
                            @update:model-value="(val) => toggleCategory(category, 'delete', !!val)"
                            @click.stop
                          />
                        </div>
                      </div>
                    </div>
                  </VExpansionPanelTitle>

                  <VExpansionPanelText class="pl-9">
                    <VList density="comfortable" class="bg-transparent">
                      <VListItem
                        v-for="child in category.children"
                        :key="child.id"
                        class="px-0 menu-child-item"
                      >
                        <div class="d-flex align-center w-100">
                          <VIcon
                            icon="bx-dot"
                            size="16"
                            class="mr-2"
                            color="grey"
                          />
                          <span class="text-body-2">{{ child.label }}</span>
                          <div class="ml-auto d-flex gap-6 align-center">
                            <div
                              v-for="t in (['read','write','delete'] as const)"
                              :key="t"
                              class="d-flex align-center permission-cell"
                            >
                              <VCheckbox
                                v-if="child.code"
                                :model-value="getChildPermission(child.code!, t)"
                                density="compact"
                                hide-details
                                color="primary"
                                @update:model-value="(val) => setChildPermission(child.code!, t, !!val)"
                                @click.stop
                              />
                              <VMenu
                                v-if="child.code"
                                :close-on-content-click="true"
                                location="bottom end"
                              >
                                <template #activator="{ props: menuProps }">
                                  <VChip
                                    v-bind="menuProps"
                                    size="x-small"
                                    variant="tonal"
                                    :color="getPermissionLevel(child.code!, t) === 0 ? 'grey' : 'primary'"
                                    class="permission-level-chip ml-1"
                                    @click.stop
                                  >
                                    {{ getPermissionLevel(child.code!, t) }}
                                  </VChip>
                                </template>
                                <VList density="compact">
                                  <VListItem
                                    v-for="opt in accessLevels"
                                    :key="opt.level"
                                    :value="opt.level"
                                    :active="getPermissionLevel(child.code!, t) === opt.level"
                                    @click="updatePermissionLevel(child.code!, t, opt.level)"
                                  >
                                    <VListItemTitle class="d-flex align-center">
                                      <VChip
                                        size="x-small"
                                        :color="opt.level === 0 ? 'grey' : 'primary'"
                                        variant="tonal"
                                        class="mr-2"
                                      >
                                        {{ opt.level }}
                                      </VChip>
                                      <span class="text-caption">{{ opt.description }}</span>
                                    </VListItemTitle>
                                  </VListItem>
                                </VList>
                              </VMenu>
                            </div>
                          </div>
                        </div>
                      </VListItem>
                    </VList>
                  </VExpansionPanelText>
                </VExpansionPanel>
              </VExpansionPanels>
            </div>
          </VCardText>
        </VCard>

        <!-- Действия -->
        <div class="d-flex justify-end gap-3 mt-6">
          <VBtn
            variant="outlined"
            size="large"
            @click="cancel"
          >
            <VIcon icon="bx-x" class="mr-2" />
            Отмена
          </VBtn>
        </div>
      </VCard>
    </VCol>
  </VRow>

  <!-- Уведомления -->
  <VSnackbar
    v-model="isToastVisible"
    :color="toastColor"
    timeout="3000"
  >
    {{ toastMessage }}
  </VSnackbar>
</template>

<style lang="scss" scoped>
.gap-6 {
  gap: 1.5rem;
}

.permission-cell {
  min-width: 80px;
  justify-content: flex-end;
}

.permission-level-chip {
  cursor: pointer;
  font-variant-numeric: tabular-nums;
  min-width: 36px;
  justify-content: center;
}

.permission-check {
  min-width: 85px;

  .permission-label {
    font-size: 0.75rem;
    font-weight: 500;
    color: rgba(0, 0, 0, 0.6);
    letter-spacing: 0.03333em;
  }
}

.menu-permission-panel {
  :deep(.v-expansion-panel-title) {
    font-size: 0.9375rem;
    font-weight: 500;
    letter-spacing: 0.02em;
  }

  :deep(.v-list-item) {
    min-height: 36px;
    font-size: 0.875rem;
  }
}

.menu-child-item {
  :deep(.v-list-item-content) {
    padding: 4px 0;
  }

  .text-body-2 {
    font-size: 0.875rem;
    font-weight: 400;
    line-height: 1.5;
    letter-spacing: 0.00937em;
  }
}

:deep(.v-checkbox) {
  .v-selection-control {
    min-height: 32px;
  }

  .v-checkbox .v-selection-control--density-comfortable {
    --v-selection-control-size: 36px;
  }
}

:deep(.v-theme--dark) {
  .permission-label {
    color: rgba(255, 255, 255, 0.7);
  }
}
</style>
