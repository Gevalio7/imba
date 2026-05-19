import { Ref, ref } from 'vue'
import { $api } from '@/utils/api'
import type { Role } from '@/pages/apps/roles/types'

export function useRoleForm() {
  const role = ref<Role>({
    id: 0,
    name: '',
    message: '',
    isActive: true,
    createdAt: '',
    updatedAt: ''
  })

  const fetchRole = async (id: number) => {
    if (!id) return
    try {
      const data = await $api<Role>(`/roles/${id}`)
      role.value = data
    } catch (err) {
      // noop
    }
  }

  const saveRole = async (isNew: boolean) => {
    if (!role.value.name.trim()) throw new Error('Название роли обязательно')

    if (isNew) {
    const savedRole = await $api<Role>('/roles', {
      method: 'POST',
      body: {
        name: role.value.name,
        message: role.value.message,
        isActive: role.value.isActive
      }
    })
    role.value = savedRole
    return savedRole
    } else {
      await $api<Role>(`/roles/${role.value.id}`, {
        method: 'PUT',
        body: {
          name: role.value.name,
          message: role.value.message,
          isActive: role.value.isActive
        }
      })
      return role.value
    }
  }

  const cancel = (router: any) => {
    router.push('/apps/Roles')
  }

  return { role, fetchRole, saveRole, cancel }
}
