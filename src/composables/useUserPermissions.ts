import { computed, ref } from 'vue'
import { $api } from '@/utils/api'

interface Permission {
  code: string
  read: boolean
  write: boolean
  delete: boolean
}

interface AbilityRule {
  action: string
  subject: string
}

const PERMISSION_CACHE_TTL = 5 * 60 * 1000

// module-level singleton state shared across all composable instances
let globalLoaded = false
let globalLoading = false
let globalError: string | null = null
let globalPermissionCacheTimestamp = 0
let globalPermissionLoadingPromise: Promise<void> | null = null

function getStoredRules(): AbilityRule[] {
  if (typeof sessionStorage === 'undefined')
    return []

  try {
    const data = sessionStorage.getItem('userAbilityRules')
    if (!data) {
      console.log('No userAbilityRules in sessionStorage')

      return []
    }

    const parsed = JSON.parse(data)
    if (!Array.isArray(parsed)) {
      console.warn('userAbilityRules is not an array')

      return []
    }

    return parsed.filter(rule =>
      rule
      && typeof rule.action === 'string'
      && typeof rule.subject === 'string',
    )
  }
  catch (err) {
    console.error('Failed to parse userAbilityRules from sessionStorage:', err)

    return []
  }
}

function loadPermissionsFromRules(permissionsMap: Map<string, Permission>, rules: AbilityRule[]) {
  permissionsMap.clear()

  console.log('Processing rules:', rules.length)
  console.log('Sample rules (first 3):', JSON.stringify(rules.slice(0, 3), null, 2))

  rules.forEach(rule => {
    const subject = rule.subject
    const action = rule.action

    // Определяем тип права и базовый subject (без суффикса)
    let type: 'read' | 'write' | 'delete' | null = null
    let base = subject

    const m = subject.match(/^(.*)_(read|write|delete)$/)
    if (m) {
      base = m[1]
      type = m[2] as 'read' | 'write' | 'delete'
    }
    else if (action === 'read' || action === 'write' || action === 'delete') {
      type = action as 'read' | 'write' | 'delete'
    }

    // helper to set permission entry if not exists
    const setPerm = (key: string, t: 'read' | 'write' | 'delete' | null) => {
      if (!permissionsMap.has(key)) {
        permissionsMap.set(key, {
          code: key,
          read: false,
          write: false,
          delete: false,
        })
      }
      if (t) {
        const p = permissionsMap.get(key)!

        p[t] = true
      }
    }

    // We need to support both variants: with and without 'menu_' prefix
    const variants = new Set<string>()

    variants.add(base)
    if (!base.startsWith('menu_'))
      variants.add(`menu_${base}`)

    // If subject already included suffix, also include suffixed variants
    if (type) {
      for (const v of Array.from(variants))
        setPerm(`${v}_${type}`, type)
    }

    // Also ensure the raw subject is set (backwards compatibility)
    setPerm(subject, type)
  })

  // Дополнительно обрабатываем правила с action/subject для создания записей с суффиксами
  rules.forEach(rule => {
    if (rule.action && rule.subject && !rule.subject.endsWith(`_${rule.action}`)) {
      const suffixedSubject = `${rule.subject}_${rule.action}`
      if (!permissionsMap.has(suffixedSubject)) {
        permissionsMap.set(suffixedSubject, {
          code: suffixedSubject,
          read: rule.action === 'read',
          write: rule.action === 'write',
          delete: rule.action === 'delete',
        })
      }
      else {
        const perm = permissionsMap.get(suffixedSubject)!
        if (rule.action === 'read')
          perm.read = true
        if (rule.action === 'write')
          perm.write = true
        if (rule.action === 'delete')
          perm.delete = true
      }

      // Also set menu_ variant for suffixed
      const m = suffixedSubject.match(/^(.*)_(read|write|delete)$/)
      if (m) {
        const base = m[1]
        const action = m[2]

        // Avoid creating duplicate menu_menu_... keys when base already starts with 'menu_'
        const menuKey = base.startsWith('menu_') ? `${base}_${action}` : `menu_${base}_${action}`
        if (!permissionsMap.has(menuKey)) {
          permissionsMap.set(menuKey, {
            code: menuKey,
            read: action === 'read',
            write: action === 'write',
            delete: action === 'delete',
          })
        }
      }
    }
  })

  console.log('Final permissions map:', Array.from(permissionsMap.keys()))
}

export function useUserPermissions() {
  const permissionsMap = ref<Map<string, Permission>>(new Map())
  const loaded = computed(() => globalLoaded)
  const loading = computed(() => globalLoading)
  const error = computed(() => globalError)

  const ensureLoaded = async () => {
    if (!globalLoaded && !globalLoading)
      await loadPermissions()
    else if (globalLoading && globalPermissionLoadingPromise)
      await globalPermissionLoadingPromise
  }

  const loadPermissions = async () => {
    const now = Date.now()

    if (now - globalPermissionCacheTimestamp < PERMISSION_CACHE_TTL && globalLoaded) {
      console.log('Using cached permissions')

      return
    }

    if (globalPermissionLoadingPromise) {
      console.log('Permissions loading already in progress, waiting...')

      return globalPermissionLoadingPromise
    }

    globalLoading = true
    globalError = null

    try {
      globalPermissionLoadingPromise = (async () => {
        const rules = getStoredRules()

        console.log('Loaded rules count:', rules.length)

        if (rules.length > 0)
          loadPermissionsFromRules(permissionsMap.value, rules)
        else
          console.warn('No rules found in sessionStorage')

        console.log('Permissions loaded, total count:', permissionsMap.value.size)

        globalLoaded = true
        globalPermissionCacheTimestamp = now
      })()
      await globalPermissionLoadingPromise
    }
    catch (err: any) {
      globalError = err?.message || 'Failed to load permissions'
      console.error('Failed to load permissions:', err)
    }
    finally {
      globalLoading = false
      globalPermissionLoadingPromise = null
    }
  }

  const canRead = (code: string): boolean => {
    // 1. Проверяем точное совпадение
    if (permissionsMap.value.has(code)) {
      const perm = permissionsMap.value.get(code)!
      if (perm.read === true)
        return true
    }

    // 2. Проверяем с суффиксом _read
    const permWithSuffix = permissionsMap.value.get(`${code}_read`)
    if (permWithSuffix?.read === true)
      return true

    // 3. Проверяем дочерние разрешения
    return Array.from(permissionsMap.value.keys()).some(key =>
      key !== code && key.startsWith(`${code}_`),
    )
  }

  const canWrite = (code: string): boolean => {
    if (permissionsMap.value.has(code)) {
      const perm = permissionsMap.value.get(code)!

      return perm.write === true
    }

    const permWithSuffix = permissionsMap.value.get(`${code}_write`)
    if (permWithSuffix?.write === true)
      return true

    return false
  }

  const canDelete = (code: string): boolean => {
    if (permissionsMap.value.has(code)) {
      const perm = permissionsMap.value.get(code)!

      return perm.delete === true
    }

    const permWithSuffix = permissionsMap.value.get(`${code}_delete`)
    if (permWithSuffix?.delete === true)
      return true

    return false
  }

  const can = (action: string, code: string): boolean => {
    if (action === 'read')
      return canRead(code)
    if (action === 'write')
      return canWrite(code)
    if (action === 'delete')
      return canDelete(code)

    return true
  }

  const hasAnyPermission = (codes: string[]): boolean => {
    return codes.some(code => canRead(code))
  }

  return {
    permissionsMap,
    loaded,
    loading,
    error,
    loadPermissions,
    ensureLoaded,
    canRead,
    canWrite,
    canDelete,
    can,
    hasAnyPermission,
  }
}
