<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { $api } from '@/utils/api'
import { useGlobalPermissions } from '@/composables/useGlobalPermissions'

const router = useRouter()
const { ensureLoaded } = useGlobalPermissions()

definePage({
  meta: {
    navActiveLink: 'apps-post-master-mail-accounts',
    action: 'read',
    subject: 'menu_post_master_mail_accounts'
  }
})

interface PostMasterMailAccount {
  id: number
  name: string
  type: 'IMAP' | 'IMAPS' | 'IMAPTLS' | 'MSGraph' | 'POP3' | 'POP3S' | 'POP3TLS'
  authenticationType: 'oauth2_token' | 'password'
  login: string
  password?: string
  host: string
  port?: number
  imapFolder?: string
  trusted: boolean
  dispatchingBy: 'Queue' | 'From'
  queueId?: number
  comment?: string
  oauth2TokenConfigID?: number
  isActive: boolean
  createdAt: string
  updatedAt: string
  smtpHost?: string
  smtpPort?: number
  smtpSecure?: boolean
  smtpUser?: string
  smtpPassword?: string
  smtpAuthType?: string
  smtpFromEmail?: string
  smtpFromName?: string
  useForOutgoing?: boolean
}

interface Queue {
  id: number
  name: string
  description: string
  maxTickets: number
  priority: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

const postMasterMailAccounts = ref<PostMasterMailAccount[]>([])
const total = ref(0)
const loading = ref(false)
const error = ref<string | null>(null)
const queues = ref<Queue[]>([])
const queuesLoading = ref(false)
const queuesError = ref<string | null>(null)

const typeOptions = [
  { title: 'IMAP', value: 'IMAP' },
  { title: 'IMAPS', value: 'IMAPS' },
  { title: 'IMAPTLS', value: 'IMAPTLS' },
  { title: 'MSGraph', value: 'MSGraph' },
  { title: 'POP3', value: 'POP3' },
  { title: 'POP3S', value: 'POP3S' },
  { title: 'POP3TLS', value: 'POP3TLS' },
]

const authenticationTypeOptions = [
  { title: 'OAuth2 Token', value: 'oauth2_token' },
  { title: 'Password', value: 'password' },
]

const smtpSecureOptions = [
  { title: 'None', value: 'none' },
  { title: 'STARTTLS', value: 'starttls' },
  { title: 'SSL/TLS', value: 'ssl' },
]

const dispatchingByOptions = [
  { title: 'Queue', value: 'Queue' },
  { title: 'From', value: 'From' },
]

const fetchPostMasterMailAccounts = async () => {
  try {
    loading.value = true
    error.value = null
    const data = await $api<{ postMasterMailAccounts: PostMasterMailAccount[]; total: number }>(`/postMasterMailAccounts`)
    postMasterMailAccounts.value = data.postMasterMailAccounts
    total.value = data.total
  }
  catch (err) {
    error.value = 'Ошибка загрузки почтовых аккаунтов'
    console.error('Error fetching postMasterMailAccounts:', err)
  }
  finally {
    loading.value = false
  }
}

const fetchQueues = async () => {
  try {
    queuesLoading.value = true
    queuesError.value = null
    const data = await $api<{ queues: Queue[]; total: number }>(`/queues`)
    queues.value = data.queues
  }
  catch (err) {
    queuesError.value = 'Ошибка загрузки очередей'
    console.error('Error fetching queues:', err)
  }
  finally {
    queuesLoading.value = false
  }
}

const createPostMasterMailAccount = async (item: Omit<PostMasterMailAccount, 'id' | 'createdAt' | 'updatedAt'>) => {
  try {
    const data = await $api<PostMasterMailAccount>(`/postMasterMailAccounts`, {
      method: 'POST',
      body: item,
    })
    postMasterMailAccounts.value.push(data)
    return data
  }
  catch (err) {
    console.error('Error creating postMasterMailAccount:', err)
    throw err
  }
}

const updatePostMasterMailAccount = async (id: number, item: Omit<PostMasterMailAccount, 'id' | 'createdAt' | 'updatedAt'>) => {
  try {
    const data = await $api<PostMasterMailAccount>(`/postMasterMailAccounts/${id}`, {
      method: 'PUT',
      body: item,
    })
    const index = postMasterMailAccounts.value.findIndex(p => p.id === id)
    if (index !== -1)
      postMasterMailAccounts.value[index] = data
    return data
  }
  catch (err) {
    console.error('Error updating postMasterMailAccount:', err)
    throw err
  }
}

const deletePostMasterMailAccount = async (id: number) => {
  try {
    await $api(`/postMasterMailAccounts/${id}`, {
      method: 'DELETE',
    })
    const index = postMasterMailAccounts.value.findIndex(p => p.id === id)
    if (index !== -1)
      postMasterMailAccounts.value.splice(index, 1)
  }
  catch (err) {
    console.error('Error deleting postMasterMailAccount:', err)
    throw err
  }
}

onMounted(async () => {
  await ensureLoaded()
  await Promise.all([fetchPostMasterMailAccounts(), fetchQueues()])
})

const headers = [
  { title: 'ID', key: 'id', sortable: true },
  { title: 'Название', key: 'name', sortable: true },
  { title: 'Тип', key: 'type', sortable: true },
  { title: 'Хост', key: 'host', sortable: true },
  { title: 'Логин', key: 'login', sortable: true },
  { title: 'Аутентификация', key: 'authenticationType', sortable: true },
  { title: 'Маршрутизация', key: 'dispatchingBy', sortable: true },
  { title: 'Очередь', key: 'queueId', sortable: true },
  { title: 'Создано', key: 'createdAt', sortable: true },
  { title: 'Изменено', key: 'updatedAt', sortable: true },
  { title: 'Активен', key: 'isActive', sortable: false },
  { title: 'Действия', key: 'actions', sortable: false },
]

const filteredPostMasterMailAccounts = computed(() => {
  let filtered = postMasterMailAccounts.value
  if (statusFilter.value !== null)
    filtered = filtered.filter(p => p.isActive === (statusFilter.value === 1))
  return filtered
})

const getQueueName = (queueId: number | undefined) => {
  if (!queueId)
    return '-'
  const queue = queues.value.find(q => q.id === queueId)
  return queue ? queue.name : '-'
}

const getAuthTypeName = (authType: string) => {
  const option = authenticationTypeOptions.find(o => o.value === authType)
  return option ? option.title : authType
}

const clearFilters = () => {
  statusFilter.value = null
}

const resolveStatusVariant = (isActive: boolean) => {
  if (isActive)
    return { color: 'primary', text: 'Активен' }
  else
    return { color: 'error', text: 'Не активен' }
}

const currentPage = ref(1)
const itemsPerPage = ref(10)

const statusFilter = ref<number | null>(null)

const selectedItems = ref<any[]>([])
const isBulkActionsMenuOpen = ref(false)
const isBulkDeleteDialogOpen = ref(false)
const isBulkStatusDialogOpen = ref(false)
const bulkStatusValue = ref<number>(1)

watch(selectedItems, newValue => {
  console.log('Selected items:', newValue.length)
}, { deep: true })

const deleteDialog = ref(false)
const deleteItemPayload = ref<PostMasterMailAccount | null>(null)

const statusOptions = [
  { text: 'Активен', value: 1 },
  { text: 'Не активен', value: 2 },
]

const deleteItem = (item: PostMasterMailAccount) => {
  deleteItemPayload.value = item
  deleteDialog.value = true
}

const closeDelete = () => {
  deleteDialog.value = false
  deleteItemPayload.value = null
}

const deleteItemConfirm = async () => {
  try {
    if (deleteItemPayload.value) {
      await deletePostMasterMailAccount(deleteItemPayload.value.id)
      showToast('Почтовый аккаунт успешно удален')
    }
    closeDelete()
  }
  catch (err) {
    showToast('Ошибка удаления почтового аккаунта', 'error')
  }
}

const navigateToCreate = () => {
  router.push('/apps/PostMasterMailAccounts/add')
}

const navigateToEdit = (id: number) => {
  router.push(`/apps/PostMasterMailAccounts/edit/${id}`)
}

const confirmBulkDelete = async () => {
  try {
    const count = selectedItems.value.length
    for (const item of selectedItems.value)
      await deletePostMasterMailAccount(item.id)
    selectedItems.value = []
    showToast(`Удалено ${count} почтовых аккаунтов`)
    isBulkDeleteDialogOpen.value = false
  }
  catch (err) {
    showToast('Ошибка массового удаления', 'error')
  }
}

const confirmBulkStatusChange = async () => {
  try {
    const count = selectedItems.value.length
    for (const item of selectedItems.value) {
      await updatePostMasterMailAccount(item.id, {
        ...item,
        isActive: bulkStatusValue.value === 1,
      })
    }
    selectedItems.value = []
    showToast(`Статус изменен для ${count} почтовых аккаунтов`)
    isBulkStatusDialogOpen.value = false
  }
  catch (err) {
    showToast('Ошибка массового изменения статуса', 'error')
  }
}

const testingRowId = ref<number | null>(null)
const testingSmtpRowId = ref<number | null>(null)

const testConnectionForItem = async (item: any) => {
  try {
    testingRowId.value = item.id
    const res = await $api(`/postMasterMailAccounts/${item.id}/test`, {
      method: 'POST',
    })
    if (res && res.success) {
      showToast('Подключение успешно: сервер ответил, логин и пароль верны', 'success')
    }
    else {
      const msg = getApiErrorMessage(res)
      showToast(`Ошибка подключения: ${msg}`, 'error')
    }
  }
  catch (err: any) {
    console.error('Error testing connection for item:', err)
    const msg = getApiErrorMessage(err)
    showToast(`Ошибка подключения: ${msg}`, 'error')
  }
  finally {
    testingRowId.value = null
  }
}

const testSmtpConnection = async (account: any) => {
  try {
    testingSmtpRowId.value = account.id
    const res = await $api(`/postMasterMailAccounts/${account.id}/test-smtp`, {
      method: 'POST',
    })
    if (res && res.success) {
      showToast('SMTP подключение успешно', 'success')
    }
    else {
      const msg = getApiErrorMessage(res)
      showToast(`Ошибка SMTP: ${msg}`, 'error')
    }
  }
  catch (err: any) {
    console.error('Error testing SMTP connection:', err)
    const msg = getApiErrorMessage(err)
    showToast(`Ошибка SMTP: ${msg}`, 'error')
  }
  finally {
    testingSmtpRowId.value = null
  }
}

const isToastVisible = ref(false)
const toastMessage = ref('')
const toastColor = ref('success')

const showToast = (message: string, color: string = 'success') => {
  toastMessage.value = message
  toastColor.value = color
  isToastVisible.value = true
}

const getApiErrorMessage = (errOrRes: any): string => {
  if (!errOrRes)
    return 'Неизвестная ошибка'
  const data = errOrRes?.data ?? errOrRes?.response?._data ?? errOrRes?.data?.data ?? errOrRes
  if (data?.message)
    return data.message
  if (typeof data === 'string')
    return data
  if (data?.error)
    return data.error
  if (errOrRes?.message)
    return errOrRes.message
  if (errOrRes?.response?.statusText)
    return errOrRes.response.statusText
  return 'Неизвестная ошибка'
}

const toggleStatus = async (item: PostMasterMailAccount, val: boolean) => {
  try {
    await updatePostMasterMailAccount(item.id, { ...item, isActive: val })
    showToast('Статус изменен')
  }
  catch (err) {
    showToast('Ошибка изменения статуса', 'error')
  }
}
</script>

<template>
  <div>
     <VCard class="mb-4" color="info" variant="tonal">
      <VCardTitle>Отладка прав</VCardTitle>
      <VCardText>
        <div>Read: {{ $can('read', 'menu_post_master_mail_accounts') ? '✅' : '❌' }}</div>
        <div>Write: {{ $can('write', 'menu_post_master_mail_accounts') ? '✅' : '❌' }}</div>
        <div>Delete: {{ $can('delete', 'menu_post_master_mail_accounts') ? '✅' : '❌' }}</div>
      </VCardText>
    </VCard>
    <VCard title="Почтовые аккаунты PostMaster">
      <div
        v-if="loading"
        class="d-flex justify-center pa-6"
      >
        <VProgressCircular
          indeterminate
          color="primary"
        />
      </div>

      <div
        v-else-if="error"
        class="d-flex justify-center pa-6"
      >
        <VAlert
          type="error"
          class="ma-4"
        >
          {{ error }}
        </VAlert>
      </div>

      <div
        v-else
        class="d-flex flex-wrap gap-4 pa-6"
      >
        <div class="d-flex align-center">
          <AppTextField
            placeholder="Поиск почтового аккаунта"
            style="inline-size: 250px;"
            class="me-3"
          />
        </div>

        <VBtn
          variant="tonal"
          color="secondary"
          prepend-icon="bx-filter"
          @click="statusFilter !== null ? (statusFilter = null) : null"
        >
          Фильтр
        </VBtn>

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
            >
              Действия ({{ selectedItems.length }})
            </VBtn>
          </template>
          <VList>
            <VListItem @click="() => { isBulkDeleteDialogOpen = true; isBulkActionsMenuOpen = false }">
              <VListItemTitle>Удалить</VListItemTitle>
            </VListItem>
            <VListItem @click="() => { confirmBulkStatusChange(); isBulkActionsMenuOpen = false }">
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
  <VBtn
    variant="tonal"
    color="secondary"
    prepend-icon="bx-export"
  >
    Экспорт
  </VBtn>

  <VBtn
    v-if="$can('write', 'menu_post_master_mail_accounts')"
    color="primary"
    prepend-icon="bx-plus"
    @click="navigateToCreate"
  >
    Добавить почтовый аккаунт
  </VBtn>
</div>
      </div>

      <VDialog
        v-model="isBulkDeleteDialogOpen"
        max-width="500px"
      >
        <VCard title="Подтверждение удаления">
          <VCardText>
            Вы уверены, что хотите удалить выбранные почтовые аккаунты? Это действие нельзя отменить.
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

      <VDataTable
        v-model="selectedItems"
        v-model:items-per-page="itemsPerPage"
        v-model:page="currentPage"
        :headers="headers"
        :items="filteredPostMasterMailAccounts"
        show-select
        :hide-default-footer="true"
        item-value="id"
        return-object
        no-data-text="Нет данных"
      >
        <template #item.isActive="{ item }">
          <div class="d-flex align-center gap-2">
            <VSwitch
              :model-value="item.isActive"
              color="primary"
              hide-details
              @update:model-value="(val) => val !== null && toggleStatus(item, val)"
            />
            <VChip
              v-bind="resolveStatusVariant(item.isActive)"
              density="compact"
              label
              size="small"
            />
          </div>
        </template>

        <template #item.type="{ item }">
          <VChip
            color="info"
            density="compact"
            label
            size="small"
          >
            {{ item.type }}
          </VChip>
        </template>

        <template #item.authenticationType="{ item }">
          {{ getAuthTypeName(item.authenticationType) }}
        </template>

        <template #item.queueId="{ item }">
          {{ getQueueName(item.queueId) }}
        </template>

        <template #item.trusted="{ item }">
          <VCheckbox
            :model-value="item.trusted"
            disabled
            hide-details
          />
        </template>

        <template #item.actions="{ item }">
          <div class="d-flex gap-1">
            <IconBtn
              v-if="$can('write', 'menu_post_master_mail_accounts')"
              @click="navigateToEdit(item.id)"
            >
              <VIcon icon="bx-edit" />
            </IconBtn>
            <IconBtn
              v-if="$can('delete', 'menu_post_master_mail_accounts')"
              @click="deleteItem(item)"
            >
              <VIcon icon="bx-trash" />
            </IconBtn>

            <VBtn
              variant="text"
              :disabled="testingRowId === item.id"
              class="d-flex align-center"
              @click="testConnectionForItem(item)"
            >
              <VProgressCircular
                v-if="testingRowId === item.id"
                indeterminate
                size="18"
                width="2"
                color="primary"
              />
              <span
                v-else
                class="d-flex align-center"
              ><VIcon
                icon="bx-search"
                class="me-1"
              />Тест</span>
            </VBtn>
          </div>
        </template>
      </VDataTable>

      <div class="d-flex justify-center mt-4 pb-4">
        <VPagination
          v-model="currentPage"
          :length="Math.ceil(filteredPostMasterMailAccounts.length / itemsPerPage) || 1"
          :total-visible="$vuetify.display.mdAndUp ? 7 : 3"
        />
      </div>
    </VCard>

    <VDialog
      v-model="deleteDialog"
      max-width="500px"
    >
      <VCard title="Вы уверены, что хотите удалить этот почтовый аккаунт?">
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

    <VSnackbar
      v-model="isToastVisible"
      :color="toastColor"
      timeout="3000"
    >
      {{ toastMessage }}
    </VSnackbar>
  </div>
</template>
