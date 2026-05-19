<template>
  <VRow>
    <VCol cols="12" md="6" lg="6">
      <RoleInfoCard 
        :role="role" 
        @save="saveRole" 
        @cancel="cancel" 
      />
      
      <RoleExtendedPermissions
        :super-admin="superAdmin"
        :departments="selectedDepartments"
        :companies="selectedCompanies"
        :only-own-tickets="onlyOwnTickets"
        :can-reply="canReply"
        :can-internal-notes="canInternalNotes"
        :departments-list="departmentsList"
        :companies-list="companiesList"
        @update:super-admin="superAdmin = $event"
        @update:departments="selectedDepartments = $event"
        @update:companies="selectedCompanies = $event"
        @update:only-own-tickets="onlyOwnTickets = $event"
        @update:can-reply="canReply = $event"
        @update:can-internal-notes="canInternalNotes = $event"
      />
    </VCol>

    <VCol cols="12" md="6" lg="6">
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
                <VSwitch v-model="role.isActive" label="Роль активна" color="success" inset />
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

        <VCard variant="outlined">
          <VCardTitle class="pb-3">
            <div class="d-flex align-center">
              <VIcon icon="bx-shield-check" class="mr-3" color="primary" />
              <span class="text-h6">Разрешения меню</span>
            </div>
          </VCardTitle>
          <VCardText class="pa-0">
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
                  <VExpansionPanelTitle class="py-3">
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
                            @update:model-value="(val) => toggleCategory(menuConfig, category, 'read', !!val)"
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
                            @update:model-value="(val) => toggleCategory(menuConfig, category, 'write', !!val)"
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
                            @update:model-value="(val) => toggleCategory(menuConfig, category, 'delete', !!val)"
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
                                :model-value="getChildPermission(child.code, t)"
                                density="compact"
                                hide-details
                                color="primary"
                                @update:model-value="(val) => setChildPermission(child.code, t, !!val)"
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
                                    :color="getPermissionLevel(child.code, t) === 0 ? 'grey' : 'primary'"
                                    class="permission-level-chip ml-1"
                                    @click.stop
                                  >
                                    {{ getPermissionLevel(child.code, t) }}
                                  </VChip>
                                </template>
                                <VList density="compact">
                                  <VListItem
                                    v-for="opt in accessLevels"
                                    :key="opt.level"
                                    :value="opt.level"
                                    :active="getPermissionLevel(child.code, t) === opt.level"
                                    @click="updatePermissionLevel(child.code, t, opt.level)"
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
      </VCard>
    </VCol>
  </VRow>

  <VSnackbar v-model="isToastVisible" :color="toastColor" timeout="3000">
    {{ toastMessage }}
  </VSnackbar>
</template>

<script setup lang="ts">
definePage({ meta: { navActiveLink: 'apps-roles' } })

import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { menuConfig, categoryIcons } from '@/constants/roleMenuConfig'
import { useRoleForm } from '@/composables/useRoleForm'
import { useRolePermissions } from '@/composables/useRolePermissions'
import RoleInfoCard from './components/RoleInfoCard.vue'
import RoleExtendedPermissions from './components/RoleExtendedPermissions.vue'

const route = useRoute()
const roleId = ref<number>(route.query.id ? parseInt(String(route.query.id), 10) : 0)
const isNew = computed(() => !roleId.value)

const { role, fetchRole, saveRole, cancel } = useRoleForm()
const { 
  getChildPermission, 
  setChildPermission, 
  toggleCategory, 
  getParentState, 
  getPermissionLevel, 
  updatePermissionLevel, 
  fetchPermissions 
} = useRolePermissions(roleId, isNew)

const expandedPanels = ref(menuConfig.map(c => c.category))
const loading = ref(false)
const isToastVisible = ref(false)
const toastMessage = ref('')
const toastColor = ref('success')

const getCategoryIcon = (category: string): string => {
  return categoryIcons[category] || 'bx-menu'
}

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

// Расширенные права
const superAdmin = ref(false)
const selectedDepartments = ref<number[]>([])
const selectedCompanies = ref<number[]>([])
const onlyOwnTickets = ref(false)
const canReply = ref(true)
const canInternalNotes = ref(false)

// Заглушки для списков (позже заменишь на API)
const departmentsList = ref([
  { id: 1, name: 'Отдел продаж' },
  { id: 2, name: 'Отдел поддержки' },
  { id: 3, name: 'IT отдел' },
  { id: 4, name: 'Отдел разработки' },
  { id: 5, name: 'Бухгалтерия' }
])

const companiesList = ref([
  { id: 1, name: 'ООО "Ромашка"' },
  { id: 2, name: 'АО "ТехноСервис"' },
  { id: 3, name: 'ООО "Интеграл"' },
  { id: 4, name: 'ЗАО "Альянс"' }
])

onMounted(async () => {
  if (roleId.value) {
    await Promise.all([fetchRole(roleId.value), fetchPermissions(menuConfig)])
  } else {
    await fetchPermissions(menuConfig)
  }
})
</script>

<style scoped>
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
}

.permission-label {
  font-size: 0.75rem;
  font-weight: 500;
  color: rgba(0, 0, 0, 0.6);
  letter-spacing: 0.03333em;
}

.menu-permission-panel {
  :deep(.v-expansion-panel-title) {
    font-size: 0.9375rem;
    font-weight: 500;
    letter-spacing: 0.02em;
    min-height: 56px;
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
