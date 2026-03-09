<script setup lang="ts">
import girlUsingLaptop from '@images/pages/girl-using-laptop.png'

// Тип для роли из API
interface Role {
  id: number
  name: string
  message: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

// Пропсы
interface Props {
  roles: Role[]
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  roles: () => [],
  loading: false,
})

// Эмиты
const emit = defineEmits<{
  (e: 'edit', role: Role): void
  (e: 'delete', role: Role): void
  (e: 'toggle-status', role: Role, newValue: boolean): void
  (e: 'add'): void
}>()

const isRoleDialogVisible = ref(false)
const isAddRoleDialogVisible = ref(false)

const editRole = (role: Role) => {
  emit('edit', role)
}

const deleteRole = (role: Role) => {
  emit('delete', role)
}

const toggleStatus = (role: Role, newValue: boolean) => {
  emit('toggle-status', role, newValue)
}

const addNewRole = () => {
  emit('add')
}

// Функция для получения статуса
const resolveStatusVariant = (isActive: boolean) => {
  if (isActive)
    return { color: 'primary', text: 'Активен' }
  else
    return { color: 'error', text: 'Не активен' }
}
</script>

<template>
  <VRow>
    <!-- Отладка: показываем количество ролей -->
    <VCol v-if="props.roles.length === 0" cols="12" class="pa-6">
      <VAlert type="info">
        Ролей не найдено. Всего ролей: {{ props.roles.length }}, Загрузка: {{ props.loading }}
      </VAlert>
    </VCol>

    <!-- Индикатор загрузки -->
    <VCol v-if="loading" cols="12" class="d-flex justify-center pa-6">
      <VProgressCircular indeterminate color="primary" />
    </VCol>

    <!-- 👉 Роли -->
    <template v-else>
      <VCol
        v-for="role in props.roles"
        :key="role.id"
        cols="12"
        sm="6"
        lg="4"
      >
        <VCard>
          <VCardText class="d-flex align-center pb-4">
            <VChip
              v-bind="resolveStatusVariant(role.isActive)"
              density="compact"
              label
              size="small"
            />

            <VSpacer />

            <!-- Переключатель статуса -->
            <VSwitch
              :model-value="role.isActive"
              @update:model-value="(val) => toggleStatus(role, !!val)"
              color="primary"
              hide-details
              density="compact"
            />
          </VCardText>

          <VCardText>
            <div class="d-flex justify-space-between align-center">
              <div>
                <h5 class="text-h5 mb-1">
                  {{ role.name }}
                </h5>
                <div class="d-flex align-center text-body-2 text-medium-emphasis">
                  <span v-if="role.message">{{ role.message }}</span>
                  <span v-else class="text-disabled">Нет описания</span>
                </div>
                <div class="d-flex align-center mt-2">
                  <a
                    href="javascript:void(0)"
                    class="text-primary"
                    @click="editRole(role)"
                  >
                    Редактировать
                  </a>
                </div>
              </div>
              <div class="d-flex flex-column gap-1">
                <IconBtn @click="editRole(role)">
                  <VIcon icon="bx-edit" />
                </IconBtn>
                <IconBtn @click="deleteRole(role)">
                  <VIcon icon="bx-trash" />
                </IconBtn>
              </div>
            </div>
          </VCardText>
        </VCard>
      </VCol>
    </template>

    <!-- 👉 Добавить новую роль -->
    <VCol
      cols="12"
      sm="6"
      lg="4"
    >
      <VCard
        class="h-100"
        :ripple="false"
      >
        <VRow
          no-gutters
          class="h-100"
        >
          <VCol
            cols="6"
            class="d-flex flex-column justify-end align-center mt-5"
          >
            <img
              width="105"
              :src="girlUsingLaptop"
            >
          </VCol>

          <VCol cols="6">
            <VCardText class="d-flex flex-column align-end justify-end gap-4">
              <VBtn
                size="small"
                color="primary"
                @click="addNewRole"
              >
                Добавить роль
              </VBtn>
              <div class="text-end text-body-2">
                Добавьте новую роль,<br> если её не существует.
              </div>
            </VCardText>
          </VCol>
        </VRow>
      </VCard>
    </VCol>
  </VRow>
</template>
