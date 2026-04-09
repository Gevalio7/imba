<script setup lang="ts">
import { $fetch } from 'ofetch';
import { computed, onMounted, ref, watch } from 'vue';

// Пропсы
interface Props {
  roleId: number
}

const props = defineProps<Props>()

// Эмиты
const emit = defineEmits<{
  (e: 'update:permissions', permissions: Record<string, boolean>): void
  (e: 'saved'): void
}>()

// API base URL
const API_BASE = import.meta.env.VITE_API_BASE_URL

// Типы данных
interface Permission {
  code: string
  name: string
  category: string
  is_granted: boolean
}

// Состояние
const permissions = ref<Permission[]>([])
const loading = ref(false)
const saving = ref(false)
const error = ref<string | null>(null)

// Категории
const categories = [
  { key: 'admin', name: 'Администратор', icon: 'bx-shield' },
  { key: 'tickets', name: 'Тикеты', icon: 'bx-ticket' },
  { key: 'knowledge_base', name: 'База знаний', icon: 'bx-book' },
  { key: 'reports', name: 'Отчёты', icon: 'bx-chart' },
  { key: 'settings', name: 'Настройки', icon: 'bx-cog' },
]

// Загрузка разрешений
const fetchPermissions = async () => {
  if (!props.roleId) return
  
  try {
    loading.value = true
    error.value = null
    
    const data = await $fetch<{ permissions: Permission[] }>(
      `${API_BASE}/roles/${props.roleId}/permissions`
    )
    permissions.value = data.permissions
  } catch (err) {
    error.value = 'Ошибка загрузки разрешений'
    console.error('Error fetching permissions:', err)
  } finally {
    loading.value = false
  }
}

// Сохранение разрешений
const savePermissions = async () => {
  if (!props.roleId) return
  
  try {
    saving.value = true
    error.value = null
    
    // Преобразуем в объект
    const permissionsObj: Record<string, boolean> = {}
    permissions.value.forEach(p => {
      permissionsObj[p.code] = p.is_granted
    })
    
    await $fetch(`${API_BASE}/roles/${props.roleId}/permissions`, {
      method: 'PUT',
      body: { permissions: permissionsObj }
    })
    
    emit('saved')
    emit('update:permissions', permissionsObj)
  } catch (err) {
    error.value = 'Ошибка сохранения разрешений'
    console.error('Error saving permissions:', err)
  } finally {
    saving.value = false
  }
}

// Переключение разрешения
const togglePermission = (code: string) => {
  const perm = permissions.value.find(p => p.code === code)
  if (perm) {
    perm.is_granted = !perm.is_granted
  }
}

// Получить разрешения по категории
const getPermissionsByCategory = (category: string) => {
  return computed(() => permissions.value.filter(p => p.category === category))
}

// Сгруппированные разрешения
const groupedPermissions = computed(() => {
  const groups: Record<string, Permission[]> = {}
  categories.forEach(cat => {
    groups[cat.key] = permissions.value.filter(p => p.category === cat.key)
  })
  return groups
})

// Загрузка при изменении roleId
watch(() => props.roleId, (newId) => {
  if (newId) {
    fetchPermissions()
  }
}, { immediate: true })

// Инициализация
onMounted(() => {
  if (props.roleId) {
    fetchPermissions()
  }
})
</script>

<template>
  <div>
    <!-- Индикатор загрузки -->
    <div v-if="loading" class="d-flex justify-center pa-6">
      <VProgressCircular indeterminate color="primary" />
    </div>

    <!-- Сообщение об ошибке -->
    <VAlert v-else-if="error" type="error" class="ma-4">
      {{ error }}
    </VAlert>

    <!-- Список разрешений -->
    <template v-else>
      <VRow>
        <VCol
          v-for="category in categories"
          :key="category.key"
          cols="12"
          md="6"
        >
          <VCard>
            <VCardTitle class="d-flex align-center gap-2">
              <VIcon :icon="category.icon" />
              {{ category.name }}
            </VCardTitle>
            <VDivider />
            <VCardText>
              <div v-if="groupedPermissions[category.key]?.length === 0" class="text-medium-emphasis">
                Нет доступных разрешений
              </div>
              <div
                v-for="perm in groupedPermissions[category.key]"
                :key="perm.code"
                class="d-flex align-center justify-space-between py-2"
              >
                <span>{{ perm.name }}</span>
                <VSwitch
                  :model-value="perm.is_granted"
                  @update:model-value="togglePermission(perm.code)"
                  color="primary"
                  hide-details
                  density="compact"
                />
              </div>
            </VCardText>
          </VCard>
        </VCol>
      </VRow>

      <!-- Кнопка сохранения -->
      <div class="d-flex justify-end mt-4">
        <VBtn
          color="primary"
          :loading="saving"
          @click="savePermissions"
        >
          Сохранить разрешения
        </VBtn>
      </div>
    </template>
  </div>
</template>

<style lang="scss" scoped>
.v-card {
  margin-block-end: 1rem;
}
</style>
