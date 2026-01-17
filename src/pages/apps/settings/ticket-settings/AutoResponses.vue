<script setup lang="ts">
import { computed, ref, watch } from 'vue'

// Типы данных для автоответа
interface AutoResponse {
  id: number
  name: string
  trigger: string
  response: string
  delay: number
  createdAt: string
  updatedAt: string
  status: number // 1 - активен, 2 - не активен
  isActive: boolean
}

// Данные автоответов (демо данные)
const autoResponses = ref<AutoResponse[]>([
  {
    id: 1,
    name: 'Ответ на новое обращение',
    trigger: 'Новое обращение создано',
    response: 'Спасибо за ваше обращение! Мы получили вашу заявку и рассмотрим её в ближайшее время.',
    delay: 5,
    createdAt: '2023-01-01 10:00:00',
    updatedAt: '2023-01-01 10:00:00',
    status: 1,
    isActive: true,
  },
  {
    id: 2,
    name: 'Ответ на закрытие',
    trigger: 'Обращение закрыто',
    response: 'Ваше обращение было успешно закрыто. Если у вас возникнут дополнительные вопросы, пожалуйста, создайте новое обращение.',
    delay: 0,
    createdAt: '2023-01-02 11:00:00',
    updatedAt: '2023-01-02 11:00:00',
    status: 1,
    isActive: true,
  },
  {
    id: 3,
    name: 'Ответ на ожидание',
    trigger: 'Обращение переведено в ожидание',
    response: 'Ваше обращение находится на рассмотрении. Мы свяжемся с вами при получении дополнительной информации.',
    delay: 10,
    createdAt: '2023-01-03 12:00:00',
    updatedAt: '2023-01-03 12:00:00',
    status: 1,
    isActive: true,
  },
  {
    id: 4,
    name: 'Ответ на VIP обращение',
    trigger: 'VIP обращение создано',
    response: 'Уважаемый клиент! Ваше VIP обращение получено и будет обработано в приоритетном порядке.',
    delay: 2,
    createdAt: '2023-01-04 13:00:00',
    updatedAt: '2023-01-04 13:00:00',
    status: 1,
    isActive: true,
  },
  {
    id: 5,
    name: 'Ответ на эскалацию',
    trigger: 'Обращение эскалировано',
    response: 'Ваше обращение было эскалировано руководству. Мы свяжемся с вами в ближайшее время.',
    delay: 15,
    createdAt: '2023-01-05 14:00:00',
    updatedAt: '2023-01-05 14:00:00',
    status: 2,
    isActive: false,
  },
  {
    id: 6,
    name: 'Ответ на повторное обращение',
    trigger: 'Повторное обращение от клиента',
    response: 'Мы заметили, что вы уже обращались к нам ранее. Пожалуйста, укажите номер предыдущего обращения для быстрого решения.',
    delay: 3,
    createdAt: '2023-01-06 15:00:00',
    updatedAt: '2023-01-06 15:00:00',
    status: 1,
    isActive: true,
  },
])

const headers = [
  { title: 'ID', key: 'id', sortable: true },
  { title: 'Название', key: 'name', sortable: true },
  { title: 'Условие', key: 'trigger', sortable: false },
  { title: 'Ответ', key: 'response', sortable: false },
  { title: 'Задержка (мин)', key: 'delay', sortable: true },
  { title: 'Создано', key: 'createdAt', sortable: true },
  { title: 'Изменено', key: 'updatedAt', sortable: true },
  { title: 'Статус', key: 'status', sortable: false },
  { title: 'Активен', key: 'isActive', sortable: false },
  { title: 'Действия', key: 'actions', sortable: false },
]

// Фильтрация
const filteredAutoResponses = computed(() => {
  let filtered = autoResponses.value

  if (statusFilter.value !== null) {
    filtered = filtered.filter(ar => ar.status === statusFilter.value)
  }

  return filtered
})

// Сброс фильтров
const clearFilters = () => {
  statusFilter.value = null
}

// Массовые действия
const bulkDelete = () => {
  console.log('🗑️ Массовое удаление - вызвано')
  console.log('📋 Выбранные элементы:', selectedItems.value)
  console.log('📊 Количество выбранных элементов:', selectedItems.value.length)
  isBulkDeleteDialogOpen.value = true
}

const bulkChangeStatus = () => {
  console.log('🔄 Массовое изменение статуса - вызвано')
  console.log('📋 Выбранные элементы:', selectedItems.value)
  console.log('📊 Количество выбранных элементов:', selectedItems.value.length)
  isBulkStatusDialogOpen.value = true
}

const confirmBulkDelete = () => {
  const count = selectedItems.value.length
  selectedItems.value.forEach(item => {
    const index = autoResponses.value.findIndex(ar => ar.id === item.id)
    if (index !== -1) {
      autoResponses.value.splice(index, 1)
    }
  })
  selectedItems.value = []
  showToast(`Удалено ${count} автоответов`)
  isBulkDeleteDialogOpen.value = false
}

const confirmBulkStatusChange = () => {
  const count = selectedItems.value.length
  selectedItems.value.forEach(item => {
    const index = autoResponses.value.findIndex(ar => ar.id === item.id)
    if (index !== -1) {
      autoResponses.value[index].status = bulkStatusValue.value
      autoResponses.value[index].isActive = bulkStatusValue.value === 1
    }
  })
  selectedItems.value = []
  showToast(`Статус изменен для ${count} автоответов`)
  isBulkStatusDialogOpen.value = false
}

const resolveStatusVariant = (status: number) => {
  if (status === 1)
    return { color: 'primary', text: 'Активен' }
  else
    return { color: 'error', text: 'Не активен' }
}

// Пагинация
const currentPage = ref(1)
const itemsPerPage = ref(10)

// Фильтры
const statusFilter = ref<number | null>(null)
const isFilterDialogOpen = ref(false)

// Массовые действия
const selectedItems = ref<any[]>([])
const isBulkActionsMenuOpen = ref(false)
const isBulkDeleteDialogOpen = ref(false)
const isBulkStatusDialogOpen = ref(false)
const bulkStatusValue = ref<number>(1)

// Отслеживание изменений выбранных элементов
watch(selectedItems, (newValue) => {
  console.log('✅ Изменение выбранных элементов')
  console.log('📋 Новое значение selectedItems:', newValue)
  console.log('📊 Количество выбранных:', newValue.length)
  console.log('🔍 Детали выбранных элементов:', JSON.stringify(newValue, null, 2))
}, { deep: true })

// Диалоги
const editDialog = ref(false)
const deleteDialog = ref(false)

const defaultItem = ref<AutoResponse>({
  id: -1,
  name: '',
  trigger: '',
  response: '',
  delay: 5,
  createdAt: '',
  updatedAt: '',
  status: 1,
  isActive: true,
})

const editedItem = ref<AutoResponse>({ ...defaultItem.value })
const editedIndex = ref(-1)

// Опции статуса
const statusOptions = [
  { text: 'Активен', value: 1 },
  { text: 'Не активен', value: 2 },
]

// Методы
const editItem = (item: AutoResponse) => {
  editedIndex.value = autoResponses.value.indexOf(item)
  editedItem.value = { ...item }
  editDialog.value = true
}

const deleteItem = (item: AutoResponse) => {
  editedIndex.value = autoResponses.value.indexOf(item)
  editedItem.value = { ...item }
  deleteDialog.value = true
}

const close = () => {
  editDialog.value = false
  editedIndex.value = -1
  editedItem.value = { ...defaultItem.value }
}

const closeDelete = () => {
  deleteDialog.value = false
  editedIndex.value = -1
  editedItem.value = { ...defaultItem.value }
}

const save = () => {
  if (!editedItem.value.name.trim()) {
    showToast('Название обязательно для заполнения', 'error')
    return
  }

  if (editedIndex.value > -1) {
    editedItem.value.updatedAt = new Date().toISOString().slice(0, 19).replace('T', ' ')
    Object.assign(autoResponses.value[editedIndex.value], editedItem.value)
    showToast('Автоответ успешно сохранен')
  } else {
    // Добавление нового
    const newId = Math.max(...autoResponses.value.map(ar => ar.id)) + 1
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ')
    editedItem.value.id = newId
    editedItem.value.createdAt = now
    editedItem.value.updatedAt = now
    autoResponses.value.push({ ...editedItem.value })
    showToast('Автоответ успешно добавлен')
  }
  close()
}

const deleteItemConfirm = () => {
  autoResponses.value.splice(editedIndex.value, 1)
  showToast('Автоответ успешно удален')
  closeDelete()
}

// Переключение статуса
const toggleStatus = (item: AutoResponse, newValue: number) => {
  console.log('🔄 toggleStatus вызван')
  console.log('📝 Элемент:', item)
  console.log('🔢 Новое значение статуса:', newValue)
  
  const index = autoResponses.value.findIndex((ar: AutoResponse) => ar.id === item.id)
  console.log('🔍 Найденный индекс:', index)
  
  if (index !== -1) {
    console.log('✅ Элемент найден, обновляем статус')
    autoResponses.value[index].status = newValue
    autoResponses.value[index].isActive = newValue === 1
    console.log('✅ Обновленный элемент:', autoResponses.value[index])
    showToast('Статус автоответа изменен')
  } else {
    console.error('❌ Элемент не найден в массиве autoResponses')
  }
}

// Уведомления
const isToastVisible = ref(false)
const toastMessage = ref('')
const toastColor = ref('success')

const showToast = (message: string, color: string = 'success') => {
  toastMessage.value = message
  toastColor.value = color
  isToastVisible.value = true
}

// Добавление нового автоответа
const addNewAutoResponse = () => {
  editedItem.value = { ...defaultItem.value }
  editedIndex.value = -1
  editDialog.value = true
}
</script>

<template>
  <div>
    <VCard title="Автоответы">

      <div class="d-flex flex-wrap gap-4 pa-6">
        <div class="d-flex align-center">
          <!-- Поиск -->
          <AppTextField
            placeholder="Поиск автоответов"
            style="inline-size: 250px;"
            class="me-3"
          />
        </div>

        <!-- Кнопка фильтра -->
        <VBtn
          variant="tonal"
          color="secondary"
          prepend-icon="bx-filter"
          @click="isFilterDialogOpen = true"
        >
          Фильтр
        </VBtn>

        <!-- Кнопка массовых действий -->
        <VMenu
          v-model="isBulkActionsMenuOpen"
          :close-on-content-click="false"
        >
          <template #activator="{ props }">
            <VBtn
              variant="tonal"
              color="secondary"
              prepend-icon="bx-dots-vertical-rounded"
              :disabled="selectedItems.length === 0"
              v-bind="props"
              @click="() => {
                console.log('🖱️ Клик по кнопке Действия')
                console.log('📊 Количество выбранных:', selectedItems.length)
                console.log('🔍 Выбранные элементы:', selectedItems)
                console.log('🚪 Состояние меню до клика:', isBulkActionsMenuOpen)
              }"
            >
              Действия ({{ selectedItems.length }})
            </VBtn>
          </template>
          <VList>
            <VListItem
              @click="() => {
                console.log('🗑️ Клик по пункту Удалить')
                bulkDelete()
                isBulkActionsMenuOpen = false
              }"
            >
              <VListItemTitle>Удалить</VListItemTitle>
            </VListItem>
            <VListItem
              @click="() => {
                console.log('🔄 Клик по пункту Изменить статус')
                bulkChangeStatus()
                isBulkActionsMenuOpen = false
              }"
            >
              <VListItemTitle>Изменить статус</VListItemTitle>
            </VListItem>
          </VList>
        </VMenu>

        <VSpacer />
        <div class="d-flex gap-4 flex-wrap align-center">
          <AppSelect
            v-model="itemsPerPage"
            :items="[5, 10, 20, 25, 50]"
          />
          <!-- Экспорт -->
          <VBtn
            variant="tonal"
            color="secondary"
            prepend-icon="bx-export"
          >
            Экспорт
          </VBtn>

          <VBtn
            color="primary"
            prepend-icon="bx-plus"
            @click="addNewAutoResponse"
          >
            Добавить автоответ
          </VBtn>
        </div>
      </div>


      <!-- Диалог фильтров -->
      <VDialog
        v-model="isFilterDialogOpen"
        max-width="500px"
      >
        <VCard title="Фильтры">
          <VCardText>
            <VRow>
              <VCol cols="12">
                <AppSelect
                  v-model="statusFilter"
                  placeholder="Статус"
                  :items="[
                    { title: 'Активен', value: 1 },
                    { title: 'Не активен', value: 2 },
                  ]"
                  clearable
                  clear-icon="bx-x"
                />
              </VCol>
            </VRow>
          </VCardText>

          <VCardText>
            <div class="d-flex justify-end gap-4">
              <VBtn
                variant="text"
                @click="clearFilters"
              >
                Сбросить
              </VBtn>
              <VBtn
                color="error"
                variant="outlined"
                @click="isFilterDialogOpen = false"
              >
                Отмена
              </VBtn>
              <VBtn
                color="success"
                variant="elevated"
                @click="isFilterDialogOpen = false"
              >
                Применить
              </VBtn>
            </div>
          </VCardText>
        </VCard>
      </VDialog>

      <!-- Диалог массового удаления -->
      <VDialog
        v-model="isBulkDeleteDialogOpen"
        max-width="500px"
      >
        <VCard title="Подтверждение удаления">
          <VCardText>
            Вы уверены, что хотите удалить выбранные автоответы? Это действие нельзя отменить.
          </VCardText>
          <VCardText>
            <div class="d-flex justify-end gap-4">
              <VBtn
                color="error"
                variant="outlined"
                @click="isBulkDeleteDialogOpen = false"
              >
                Отмена
              </VBtn>
              <VBtn
                color="success"
                variant="elevated"
                @click="confirmBulkDelete"
              >
                Удалить
              </VBtn>
            </div>
          </VCardText>
        </VCard>
      </VDialog>

      <!-- Диалог массового изменения статуса -->
      <VDialog
        v-model="isBulkStatusDialogOpen"
        max-width="500px"
      >
        <VCard title="Изменить статус">
          <VCardText>
            <AppSelect
              v-model="bulkStatusValue"
              :items="statusOptions"
              item-title="text"
              item-value="value"
              label="Новый статус"
            />
          </VCardText>
          <VCardText>
            <div class="d-flex justify-end gap-4">
              <VBtn
                color="error"
                variant="outlined"
                @click="isBulkStatusDialogOpen = false"
              >
                Отмена
              </VBtn>
              <VBtn
                color="success"
                variant="elevated"
                @click="confirmBulkStatusChange"
              >
                Применить
              </VBtn>
            </div>
          </VCardText>
        </VCard>
      </VDialog>

      <VDivider />

      <!-- Таблица -->
      <VDataTable
        v-model="selectedItems"
        v-model:items-per-page="itemsPerPage"
        v-model:page="currentPage"
        :headers="headers"
        :items="filteredAutoResponses"
        show-select
        :hide-default-footer="true"
        item-value="id"
        return-object
        @update:model-value="(val) => {
          console.log('📊 VDataTable model-value изменен:', val)
          console.log('📊 Тип данных:', typeof val, Array.isArray(val))
          console.log('📊 Количество выбранных:', val ? val.length : 0)
        }"
      >
        <!-- Условие -->
        <template #item.trigger="{ item }">
          <div style=" overflow: hidden;max-inline-size: 200px; text-overflow: ellipsis; white-space: pre-line;">
            {{ item.trigger }}
          </div>
        </template>

        <!-- Ответ -->
        <template #item.response="{ item }">
          <div style=" overflow: hidden;max-inline-size: 300px; text-overflow: ellipsis; white-space: pre-line;">
            {{ item.response }}
          </div>
        </template>

        <!-- Статус -->
        <template #item.status="{ item }">
          <VChip
            v-bind="resolveStatusVariant(item.status)"
            density="default"
            label
            size="small"
          />
        </template>

        <!-- Активен -->
        <template #item.isActive="{ item }">
          <VSwitch
            :model-value="item.isActive"
            @update:model-value="(val) => {
              console.log('🔘 VSwitch изменен для элемента:', item.name)
              console.log('🔘 Старое значение:', item.isActive)
              console.log('🔘 Новое значение:', val)
              console.log('🔘 Новый статус:', val ? 1 : 2)
              toggleStatus(item, val ? 1 : 2)
            }"
          />
        </template>

        <!-- Действия -->
        <template #item.actions="{ item }">
          <div class="d-flex gap-1">
            <IconBtn @click="editItem(item)">
              <VIcon icon="bx-edit" />
            </IconBtn>
            <IconBtn @click="deleteItem(item)">
              <VIcon icon="bx-trash" />
            </IconBtn>
          </div>
        </template>
      </VDataTable>

      <!-- Пагинация -->
      <div class="d-flex justify-center mt-4 pb-4">
        <VPagination
          v-model="currentPage"
          :length="Math.ceil(filteredAutoResponses.length / itemsPerPage) || 1"
          :total-visible="$vuetify.display.mdAndUp ? 7 : 3"
        />
      </div>
    </VCard>

    <!-- Диалог редактирования -->
    <VDialog
      v-model="editDialog"
      max-width="700px"
    >
      <VCard :title="editedIndex > -1 ? 'Редактировать автоответ' : 'Добавить автоответ'">
        <VCardText>
          <VRow>
            <!-- Название -->
            <VCol
              cols="12"
              sm="6"
            >
              <AppTextField
                v-model="editedItem.name"
                label="Название *"
              />
            </VCol>

            <!-- Условие -->
            <VCol
              cols="12"
              sm="6"
            >
              <AppTextField
                v-model="editedItem.trigger"
                label="Условие срабатывания"
                placeholder="Например: Новое обращение создано"
              />
            </VCol>

            <!-- Ответ -->
            <VCol cols="12">
              <AppTextarea
                v-model="editedItem.response"
                label="Текст ответа"
                rows="4"
                placeholder="Введите текст автоматического ответа..."
              />
            </VCol>

            <!-- Задержка -->
            <VCol
              cols="12"
              sm="6"
            >
              <AppTextField
                v-model="editedItem.delay"
                label="Задержка (минуты)"
                type="number"
                min="0"
              />
            </VCol>

            <!-- Статус -->
            <VCol
              cols="12"
              sm="6"
            >
              <AppSelect
                v-model="editedItem.status"
                :items="statusOptions"
                item-title="text"
                item-value="value"
                label="Статус"
              />
            </VCol>
          </VRow>
        </VCardText>

        <VCardText>
          <div class="self-align-end d-flex gap-4 justify-end">
            <VBtn
              color="error"
              variant="outlined"
              @click="close"
            >
              Отмена
            </VBtn>
            <VBtn
              color="success"
              variant="elevated"
              @click="save"
            >
              Сохранить
            </VBtn>
          </div>
        </VCardText>
      </VCard>
    </VDialog>

    <!-- Диалог удаления -->
    <VDialog
      v-model="deleteDialog"
      max-width="500px"
    >
      <VCard title="Вы уверены, что хотите удалить этот автоответ?">
        <VCardText>
          <div class="d-flex justify-center gap-4">
            <VBtn
              color="error"
              variant="outlined"
              @click="closeDelete"
            >
              Отмена
            </VBtn>
            <VBtn
              color="success"
              variant="elevated"
              @click="deleteItemConfirm"
            >
              Удалить
            </VBtn>
          </div>
        </VCardText>
      </VCard>
    </VDialog>
  </div>

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
.v-card {
  margin-block-end: 1rem;
}
</style>
