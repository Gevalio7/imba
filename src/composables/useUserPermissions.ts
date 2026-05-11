import { ref, computed } from 'vue'
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

let permissionCacheTimestamp = 0
let permissionLoadingPromise: Promise<void> | null = null

function getStoredRules(): AbilityRule[] {
  if (typeof sessionStorage === 'undefined') return []
  
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
    
    const validRules = parsed.filter(rule => 
      rule && 
      typeof rule.action === 'string' && 
      typeof rule.subject === 'string'
    )
    
    return validRules
  } catch (err) {
    console.error('Failed to parse userAbilityRules from sessionStorage:', err)
    return []
  }
}

function loadPermissionsFromRules(permissionsMap: Map<string, Permission>, rules: AbilityRule[]) {
  permissionsMap.clear()
  
  console.log('Processing rules:', rules.length)
  
  rules.forEach(rule => {
    const subject = rule.subject
    const action = rule.action
    
    // Определяем тип права
    let type: 'read' | 'write' | 'delete' | null = null
    
    if (subject.endsWith('_read')) {
      type = 'read'
    } else if (subject.endsWith('_write')) {
      type = 'write'
    } else if (subject.endsWith('_delete')) {
      type = 'delete'
    } else if (action === 'read') {
      type = 'read'
    } else if (action === 'write') {
      type = 'write'
    } else if (action === 'delete') {
      type = 'delete'
    }
    
    // Добавляем право в Map с ключом subject
    if (!permissionsMap.has(subject)) {
      permissionsMap.set(subject, {
        code: subject,
        read: false,
        write: false,
        delete: false
      })
    }
    
    const perm = permissionsMap.get(subject)!
    if (type) {
      perm[type] = true
    }
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
          delete: rule.action === 'delete'
        })
      } else {
        const perm = permissionsMap.get(suffixedSubject)!
        if (rule.action === 'read') perm.read = true
        if (rule.action === 'write') perm.write = true
        if (rule.action === 'delete') perm.delete = true
      }
    }
  })
  
  console.log('Final permissions map:', Array.from(permissionsMap.keys()))
}

export function useUserPermissions() {
  const permissionsMap = ref<Map<string, Permission>>(new Map())
  const loaded = ref(false)
  const loading = ref(false)
  const error = ref<string | null>(null)
  let lastLoaded = 0

  const ensureLoaded = async () => {
    if (!loaded.value && !loading.value) {
      await loadPermissions()
    } else if (loading.value && permissionLoadingPromise) {
      // Если уже идет загрузка, ждем ее завершения
      await permissionLoadingPromise
    }
  }

  const loadPermissions = async () => {
    const now = Date.now()
    
    // Если права еще актуальны, используем кэш
    if (now - permissionCacheTimestamp < PERMISSION_CACHE_TTL && loaded.value) {
      console.log('Using cached permissions')
      return
    }
    
    // Если уже идет загрузка, возвращаем существующий промис
    if (permissionLoadingPromise) {
      console.log('Permissions loading already in progress, waiting...')
      return permissionLoadingPromise
    }
    
    // Начинаем новую загрузку
    loading.value = true
    error.value = null
    
    try {
      permissionLoadingPromise = (async () => {
        const rules = getStoredRules()
        console.log('Loaded rules count:', rules.length)

        if (rules.length > 0) {
          loadPermissionsFromRules(permissionsMap.value, rules)
        } else {
          console.warn('No rules found in sessionStorage')
        }
        
        console.log('Permissions loaded, total count:', permissionsMap.value.size)
        
        loaded.value = true
        permissionCacheTimestamp = now
      })()
      
      await permissionLoadingPromise
    } catch (err) {
      error.value = 'Failed to load permissions'
      console.error('Failed to load permissions:', err)
    } finally {
      loading.value = false
      permissionLoadingPromise = null
    }
  }

  const canRead = (code: string): boolean => {
    // 1. Проверяем точное совпадение
    if (permissionsMap.value.has(code)) {
      const perm = permissionsMap.value.get(code)!
      if (perm.read === true) return true
    }
    
    // 2. Проверяем с суффиксом _read
    const permWithSuffix = permissionsMap.value.get(`${code}_read`)
    if (permWithSuffix?.read === true) return true
    
    // 3. Проверяем дочерние разрешения
    const hasChildPermission = Array.from(permissionsMap.value.keys()).some(key => 
      key !== code && key.startsWith(`${code}_`)
    )
    
    return hasChildPermission
  }

  const canWrite = (code: string): boolean => {
    if (permissionsMap.value.has(code)) {
      const perm = permissionsMap.value.get(code)!
      return perm.write === true
    }
    
    const permWithSuffix = permissionsMap.value.get(`${code}_write`)
    if (permWithSuffix?.write === true) return true
    
    return false
  }

  const canDelete = (code: string): boolean => {
    if (permissionsMap.value.has(code)) {
      const perm = permissionsMap.value.get(code)!
      return perm.delete === true
    }
    
    const permWithSuffix = permissionsMap.value.get(`${code}_delete`)
    if (permWithSuffix?.delete === true) return true
    
    return false
  }

  const can = (action: string, code: string): boolean => {
    if (action === 'read') return canRead(code)
    if (action === 'write') return canWrite(code)
    if (action === 'delete') return canDelete(code)
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
    hasAnyPermission
  }
}
