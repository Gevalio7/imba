import type { Ref } from 'vue'
import { ref, triggerRef } from 'vue'
import { $api } from '@/utils/api'
import type { MenuCategory } from '@/pages/apps/roles/types'

interface Permission {
  code: string
  name: string
  category: string
  level: number
  defaultLevel?: number
  read: boolean
  write: boolean
  delete: boolean
}

export function useRolePermissions(roleId: Ref<number>, isNew: Ref<boolean>) {
  const permissionsMap = ref<Map<string, Permission>>(new Map())

  const getChildPermission = (childCode: string, type: 'read' | 'write' | 'delete') => {
    if (!permissionsMap.value)
      return false
    const permission = permissionsMap.value.get(`${childCode}_${type}`)

    return permission ? permission[type] : false
  }

  const setChildPermission = async (childCode: string, type: 'read' | 'write' | 'delete', value: boolean) => {
    if (!childCode)
      return

    if (!roleId.value || roleId.value === 0)
      return

    const key = `${childCode}_${type}`
    const permission = permissionsMap.value.get(key)
    if (permission) {
      const oldRead = permission.read
      const oldWrite = permission.write
      const oldDelete = permission.delete

      try {
        const permissionsToUpdate: Record<string, boolean> = { [key]: value }

        if (type === 'write' && value) {
          permissionsToUpdate[`${childCode}_read`] = true
        }
        else if (type === 'delete' && value) {
          permissionsToUpdate[`${childCode}_read`] = true
          permissionsToUpdate[`${childCode}_write`] = true
        }
        else if (type === 'read' && !value) {
          permissionsToUpdate[`${childCode}_write`] = false
          permissionsToUpdate[`${childCode}_delete`] = false
        }
        else if (type === 'write' && !value) {
          permissionsToUpdate[`${childCode}_delete`] = false
        }

        Object.entries(permissionsToUpdate).forEach(([permKey, permValue]) => {
          const p = permissionsMap.value.get(permKey)
          if (p) {
            const permType = permKey.endsWith('_read') ? 'read' : permKey.endsWith('_write') ? 'write' : 'delete'

            ;(p as any)[permType] = permValue
          }
        })
        triggerRef(permissionsMap)

        await $api(`/roles/${roleId.value}/permissions`, {
          method: 'PUT',
          body: { permissions: permissionsToUpdate },
        })
      }
      catch (err) {
        permission.read = oldRead
        permission.write = oldWrite
        permission.delete = oldDelete
        triggerRef(permissionsMap)
      }
    }
  }

  const updateParentState = (menuConfig: MenuCategory[], childCode: string) => {
    const category = menuConfig.find(cat =>
      cat.children.some(child => child.code === childCode),
    )

    if (!category)
      return

    const types = ['read', 'write', 'delete'] as const

    types.forEach(type => {
      const allChecked = category.children.every(child =>
        getChildPermission(child.code!, type),
      )

      const someChecked = category.children.some(child =>
        getChildPermission(child.code!, type),
      )

      const parentKey = `${category.category}_${type}`
      if (!permissionsMap.value.get(parentKey)) {
        permissionsMap.value.set(parentKey, {
          code: parentKey,
          name: category.label,
          category: category.category,
          level: 0,
          read: false,
          write: false,
          delete: false,
        })
      }

      const parentPerm = permissionsMap.value.get(parentKey)!

      parentPerm[type] = allChecked
      ;(parentPerm as any)[`${type}_indeterminate`] = someChecked && !allChecked
    })

    triggerRef(permissionsMap)
  }

  const toggleCategory = async (menuConfig: MenuCategory[], category: MenuCategory, type: 'read' | 'write' | 'delete', value: boolean) => {
    if (!roleId.value || roleId.value === 0)
      return

    try {
      const permissionsToUpdate: Record<string, boolean> = {}

      category.children.forEach(child => {
        if (child.code) {
          const key = `${child.code}_${type}`

          permissionsToUpdate[key] = value

          if (type === 'write' && value) {
            permissionsToUpdate[`${child.code}_read`] = true
          }
          else if (type === 'delete' && value) {
            permissionsToUpdate[`${child.code}_read`] = true
            permissionsToUpdate[`${child.code}_write`] = true
          }
          else if (type === 'read' && !value) {
            permissionsToUpdate[`${child.code}_write`] = false
            permissionsToUpdate[`${child.code}_delete`] = false
          }
          else if (type === 'write' && !value) {
            permissionsToUpdate[`${child.code}_delete`] = false
          }
        }
      })

      Object.entries(permissionsToUpdate).forEach(([permKey, permValue]) => {
        const permission = permissionsMap.value.get(permKey)
        if (permission) {
          const permType = permKey.endsWith('_read') ? 'read' : permKey.endsWith('_write') ? 'write' : 'delete'

          ;(permission as any)[permType] = permValue
        }
      })
      triggerRef(permissionsMap)
      updateParentState(menuConfig, category.children[0]?.code || '')

      await $api(`/roles/${roleId.value}/permissions`, {
        method: 'PUT',
        body: { permissions: permissionsToUpdate },
      })
    }
    catch (err) {
      await fetchPermissions(menuConfig)
    }
  }

  const getParentState = (category: MenuCategory, type: 'read' | 'write' | 'delete') => {
    const key = `${category.category}_${type}`
    const perm = permissionsMap.value.get(key)
    if (!perm) {
      const allChecked = category.children.every(child =>
        getChildPermission(child.code!, type),
      )

      const someChecked = category.children.some(child =>
        getChildPermission(child.code!, type),
      )

      return {
        value: allChecked,
        indeterminate: someChecked && !allChecked,
      }
    }

    return {
      value: perm[type],
      indeterminate: (perm as any)[`${type}_indeterminate`] || false,
    }
  }

  const getPermissionLevel = (childCode: string, type: 'read' | 'write' | 'delete') => {
    const key = `${childCode}_${type}`
    const p = permissionsMap.value.get(key)

    return p?.level ?? 0
  }

  const updatePermissionLevel = async (childCode: string, type: 'read' | 'write' | 'delete', newLevel: number) => {
    if (!roleId.value || roleId.value === 0)
      return
    const key = `${childCode}_${type}`
    const permission = permissionsMap.value.get(key)
    if (!permission)
      return

    const oldLevel = permission.level

    permission.level = newLevel

    try {
      await $api(`/roles/${roleId.value}/permissions-level`, {
        method: 'PUT',
        body: { permission: key, level: newLevel },
      })
    }
    catch (err) {
      permission.level = oldLevel
    }
  }

  const fetchPermissions = async (menuConfig: MenuCategory[]) => {
    try {
      const data = await $api<{ permissions: any[]; levelDescriptions?: Record<number, string> }>(
        '/roles/permissions-with-levels',
      )

      if (data.levelDescriptions) {
        // ignore here; levels handled elsewhere
      }

      data.permissions.forEach(perm => {
        let type: 'read' | 'write' | 'delete' | null = null
        if (perm.code.endsWith('_read'))
          type = 'read'
        else if (perm.code.endsWith('_write'))
          type = 'write'
        else if (perm.code.endsWith('_delete'))
          type = 'delete'

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
            delete: type === 'delete' ? perm.is_granted === true : false,
          })
        }
        else {
          permissionsMap.value.set(perm.code, {
            code: perm.code,
            name: perm.name,
            category: perm.category,
            level,
            defaultLevel,
            read: perm.is_granted === true,
            write: false,
            delete: false,
          })
        }
      })

      menuConfig.forEach(category => {
        category.children.forEach(child => {
          if (!child.code)
            return

          const variants: Array<{ code: string; default: number }> = [
            { code: `${child.code}_read`, default: 444 },
            { code: `${child.code}_write`, default: 644 },
            { code: `${child.code}_delete`, default: 744 },
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
                delete: false,
              })
            }
          })
        })
      })

      if (!isNew.value && roleId.value) {
        const rolePermissions = await $api<{ permissions: any[] }>(
          `/roles/${roleId.value}/permissions`,
        )

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
                delete: false,
              })
            }
            const p = permissionsMap.value.get(perm.code)!

            p.level = level
            p.defaultLevel = defaultLevel

            if (perm.code.endsWith('_read'))
              p.read = perm.is_granted === true
            else if (perm.code.endsWith('_write'))
              p.write = perm.is_granted === true
            else if (perm.code.endsWith('_delete'))
              p.delete = perm.is_granted === true
            else p.read = perm.is_granted === true
          })
        }

        triggerRef(permissionsMap)

        menuConfig.forEach(category => {
          category.children.forEach(child => {
            if (child.code)
              updateParentState(menuConfig, child.code!)
          })
        })
      }
    }
    catch (err) {
      // noop
    }
  }

  return {
    permissionsMap,
    getChildPermission,
    setChildPermission,
    updateParentState,
    toggleCategory,
    getParentState,
    getPermissionLevel,
    updatePermissionLevel,
    fetchPermissions,
  }
}
