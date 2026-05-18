<template>
  <VRow>
    <VCol cols="12" md="5" lg="4">
      <RoleInfoCard :role="role" @save="saveRole" @cancel="cancel" />
    </VCol>

    <VCol cols="12" md="7" lg="8">
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
          <VCardText>
            <div class="d-flex">
              <div class="flex-1">

          <VCardText>
            <div v-if="loading" class="d-flex justify-center py-8">
              <VProgressCircular indeterminate color="primary" size="64" />
            </div>
            <div v-else>
              <div class="d-flex">
                <div class="left-column" style="min-width: 300px; max-width: 360px; margin-right: 24px;">
                  <!-- left column reserved space -->
                </div>
                <div class="flex-1">
                  <div>
                    <PermissionTreeNode
                      v-for="category in menuConfig"
                      :key="category.category"
                      :category="category"
                      :child-permission="getChildPermission"
                      :on-set-child-permission="setChildPermission"
                      :parent-state="getParentState"
                      :on-toggle-category="(type, value) => toggleCategory(menuConfig, category, type, value)"
                      :permission-level="getPermissionLevel"
                      :on-update-permission-level="updatePermissionLevel"
                      :access-levels="accessLevels"
                    />
                  </div>
                </div>
              </div>
            </div>
          </VCardText>
        </VCard>
      </VCard>
    </VCol>
  </VRow>

  <VSnackbar v-model="isToastVisible" :color="toastColor" timeout="3000">{{ toastMessage }}</VSnackbar>
</template>

<style scoped>
.left-column {
  display: block;
}
</style>

<script setup lang="ts">
definePage({ meta: { navActiveLink: 'apps-roles' } })

import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { menuConfig } from '@/constants/roleMenuConfig'
import { useRoleForm } from '@/composables/useRoleForm'
import { useRolePermissions } from '@/composables/useRolePermissions'
import PermissionTreeNode from './components/PermissionTreeNode.vue'
import RoleInfoCard from './components/RoleInfoCard.vue'

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

onMounted(async () => {
  if (roleId.value) {
    await Promise.all([fetchRole(roleId.value), fetchPermissions(menuConfig)])
  } else {
    await fetchPermissions(menuConfig)
  }
})
</script>
