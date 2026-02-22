<script setup lang="ts">
import { $fetch } from 'ofetch'
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

definePage({
  meta: {
    navActiveLink: 'apps-tickets',
  },
})

// API base URL
const API_BASE = import.meta.env.VITE_API_BASE_URL

const router = useRouter()
const route = useRoute()

const ticketId = computed(() => {
  const id = route.query.id
  
  return id ? Number(id) : null
})

// Данные
const loading = ref(false)
const saving = ref(false)

// Справочники
const priorities = ref<any[]>([])
const queues = ref<any[]>([])
const states = ref<any[]>([])
const types = ref<any[]>([])
const agents = ref<any[]>([])
const customers = ref<any[]>([])
const slaList = ref<any[]>([])

// Workflow данные
const currentWorkflow = ref<any>(null)
const availableStatuses = ref<any[]>([])
const loadingWorkflow = ref(false)

// Загрузка справочников
const fetchPriorities = async () => {
  try {
    const data = await $fetch(`${API_BASE}/priorities`)
    priorities.value = (data as any).priorities || []
  }
  catch (err) { console.log('Error fetching priorities:', err) }
}

const fetchQueues = async () => {
  try {
    const data = await $fetch(`${API_BASE}/queues`)
    queues.value = (data as any).queues || []
  }
  catch (err) { console.log('Error fetching queues:', err) }
}

const fetchStates = async () => {
  try {
    const data = await $fetch(`${API_BASE}/states`)
    states.value = (data as any).states || []
  }
  catch (err) { console.log('Error fetching states:', err) }
}

const fetchTypes = async () => {
  try {
    const data = await $fetch(`${API_BASE}/types`)
    types.value = (data as any).types || []
  }
  catch (err) { console.log('Error fetching types:', err) }
}

const fetchAgents = async () => {
  try {
    const data = await $fetch(`${API_BASE}/agents`)
    agents.value = (data as any).agents || []
  }
  catch (err) { console.log('Error fetching agents:', err) }
}

const fetchCustomers = async () => {
  try {
    const data = await $fetch(`${API_BASE}/customers`)
    customers.value = (data as any).customers || []
  }
  catch (err) { console.log('Error fetching customers:', err) }
}

const fetchSla = async () => {
  try {
    const data = await $fetch(`${API_BASE}/sla`)
    slaList.value = (data as any).sla || []
  }
  catch (err) { console.log('Error fetching sla:', err) }
}

// Загрузка workflow и доступных статусов по типу
const fetchTypeWorkflow = async (typeId: number, currentStatusId?: number | null) => {
  try {
    loadingWorkflow.value = true
    
    // Формируем URL с параметром currentStatusId если он передан
    let url = `${API_BASE}/types/${typeId}/workflow`
    if (currentStatusId) {
      url += `?currentStatusId=${currentStatusId}`
    }
    
    const data = await $fetch(url)
    
    currentWorkflow.value = (data as any).workflow
    
    // Если передан текущий статус и есть workflow, используем переходы из текущего статуса
    if (currentStatusId && currentWorkflow.value && (data as any).currentStatusTransitions) {
      availableStatuses.value = (data as any).currentStatusTransitions
    }
    else {
      // Для нового тикета используем начальные статусы
      availableStatuses.value = (data as any).availableStatuses || []
    }
  }
  catch (err) {
    console.error('Error fetching type workflow:', err)
    currentWorkflow.value = null
    availableStatuses.value = []
  }
  finally {
    loadingWorkflow.value = false
  }
}

// Форма
const description = ref('')

const ticket = ref({
  id: -1,
  ticketNumber: '',
  title: '',
  typeId: undefined as number | undefined,
  priorityId: undefined as number | undefined,
  queueId: undefined as number | undefined,
  stateId: undefined as number | undefined,
  ownerId: undefined as number | undefined,
  companyId: undefined as number | undefined,
  slaId: undefined as number | undefined,
  isActive: true,
})

// Watcher для изменения типа
watch(() => ticket.value.typeId, async (newTypeId, oldTypeId) => {
  // Пропускаем начальную загрузку (обрабатывается в fetchTicket)
  if (oldTypeId === undefined && ticket.value.stateId) return
  
  if (newTypeId) {
    await fetchTypeWorkflow(newTypeId, ticket.value.stateId)
  }
  else {
    currentWorkflow.value = null
    availableStatuses.value = []
  }
})

// Watcher для изменения статуса - обновляем доступные переходы
watch(() => ticket.value.stateId, async (newStateId, oldStateId) => {
  // Пропускаем начальную загрузку (обрабатывается в fetchTicket)
  if (oldStateId === undefined) return
  
  // Если есть тип и workflow, обновляем доступные переходы
  if (ticket.value.typeId && currentWorkflow.value) {
    await fetchTypeWorkflow(ticket.value.typeId, newStateId)
  }
})

// Вложения
const existingAttachments = ref<any[]>([])
const newAttachments = ref<File[]>([])

// Комментарии
const comments = ref<any[]>([])
const newComment = ref('')
const isInternalComment = ref(false)
const savingComment = ref(false)
const editingCommentId = ref<number | null>(null)
const editingCommentContent = ref('')
const deletingCommentId = ref<number | null>(null)
const showDeleteDialog = ref(false)

// Вкладки в блоке комментариев
const activeTab = ref('comments')

// История изменений
const historyChanges = ref<any[]>([])
const loadingHistory = ref(false)

// История согласования
const approvalHistory = ref<any[]>([])
const loadingApproval = ref(false)

// История переходов статусов
const statusHistory = ref<any[]>([])
const loadingStatusHistory = ref(false)

// Агенты для выбора
const agentOptions = computed(() => {
  return agents.value.map((a: any) => ({
    title: `${a.firstName || ''} ${a.lastName || ''} (${a.login})`.trim(),
    value: a.id,
  }))
})

// Вычисляемый список статусов для выбора
const statusOptions = computed(() => {
  // Если есть workflow и доступные статусы
  if (availableStatuses.value.length > 0) {
    // Находим текущий статус в общем списке
    const currentStatus = states.value.find((s: any) => s.id === ticket.value.stateId)
    
    // Создаём список с текущим статусом (если он есть и не в availableStatuses)
    const options = availableStatuses.value.map(s => ({
      title: s.name,
      value: s.id,
      color: s.color,
    }))
    
    // Добавляем текущий статус если его нет в списке
    if (currentStatus && !options.find(o => o.value === currentStatus.id)) {
      options.unshift({
        title: currentStatus.name,
        value: currentStatus.id,
        color: currentStatus.color,
      })
    }
    
    return options
  }
  
  // Если нет workflow - возвращаем все статусы
  return states.value.map((s: any) => ({
    title: s.name,
    value: s.id,
    color: s.color,
  }))
})

// Загрузка тикета
const fetchTicket = async () => {
  if (!ticketId.value) return

  try {
    loading.value = true
    const data = await $fetch(`${API_BASE}/tickets/${ticketId.value}`)
    const t = data as any
    ticket.value = {
      id: t.id,
      ticketNumber: t.ticketNumber || '',
      title: t.title || '',
      typeId: t.typeId || undefined,
      priorityId: t.priorityId || undefined,
      queueId: t.queueId || undefined,
      stateId: t.stateId || undefined,
      ownerId: t.ownerId || undefined,
      companyId: t.companyId || undefined,
      slaId: t.slaId || undefined,
      isActive: t.isActive !== undefined ? t.isActive : true,
    }
    description.value = t.description || ''
    
    // Загружаем вложения
    if (t.attachments) {
      existingAttachments.value = t.attachments
    }
    
    // Загружаем workflow если есть тип
    if (t.typeId) {
      await fetchTypeWorkflow(t.typeId, t.stateId)
    }
  }
  catch (err) {
    console.error('Error fetching ticket:', err)
    showToast('Ошибка загрузки тикета', 'error')
  }
  finally {
    loading.value = false
  }
}

// Загрузка комментариев
const fetchComments = async () => {
  if (!ticketId.value) return

  try {
    const data = await $fetch(`${API_BASE}/ticketComments?ticketId=${ticketId.value}`)
    comments.value = (data as any).comments || []
  }
  catch (err) {
    console.error('Error fetching comments:', err)
  }
}

// Загрузка вложений тикета
const fetchAttachments = async () => {
  if (!ticketId.value) return

  try {
    const data = await $fetch(`${API_BASE}/ticketAttachments?ticketId=${ticketId.value}`)
    existingAttachments.value = (data as any).attachments || []
  }
  catch (err) {
    console.error('Error fetching attachments:', err)
  }
}

// Загрузка истории изменений
const fetchHistory = async () => {
  if (!ticketId.value) return

  try {
    loadingHistory.value = true
    const data = await $fetch(`${API_BASE}/ticketHistory?ticketId=${ticketId.value}`)
    historyChanges.value = (data as any).history || []
  }
  catch (err) {
    console.error('Error fetching history:', err)
  }
  finally {
    loadingHistory.value = false
  }
}

// Загрузка истории согласования
const fetchApprovalHistory = async () => {
  if (!ticketId.value) return

  try {
    loadingApproval.value = true
    const data = await $fetch(`${API_BASE}/ticketHistory/approval/${ticketId.value}`)
    approvalHistory.value = (data as any).approvals || []
  }
  catch (err) {
    console.error('Error fetching approval history:', err)
  }
  finally {
    loadingApproval.value = false
  }
}

// Загрузка истории переходов статусов
const fetchStatusHistory = async () => {
  if (!ticketId.value) return

  try {
    loadingStatusHistory.value = true
    const data = await $fetch(`${API_BASE}/ticketStatusHistory/${ticketId.value}`)
    statusHistory.value = (data as any).history || []
  }
  catch (err) {
    console.error('Error fetching status history:', err)
  }
  finally {
    loadingStatusHistory.value = false
  }
}

// Форматирование интервала времени
const formatTimeInStatus = (interval: string | Record<string, number> | null) => {
  if (!interval) return '-'
  
  let days = 0
  let hours = 0
  let minutes = 0
  let seconds = 0
  
  // PostgreSQL pg driver возвращает interval как объект
  if (typeof interval === 'object') {
    days = interval.days || 0
    hours = interval.hours || 0
    minutes = interval.minutes || 0
    seconds = interval.seconds || 0
  }
  else if (typeof interval === 'string') {
    // Парсим PostgreSQL interval формат строки
    const match = interval.match(/(?:(\d+)\s*days?\s*)?(?:(\d+):(\d+):(\d+))?/)
    if (match) {
      days = parseInt(match[1] || '0')
      hours = parseInt(match[2] || '0')
      minutes = parseInt(match[3] || '0')
      seconds = parseInt(match[4] || '0')
    }
    else {
      return interval
    }
  }
  else {
    return '-'
  }
  
  const parts: string[] = []
  if (days > 0) parts.push(`${days} дн.`)
  if (hours > 0) parts.push(`${hours} ч.`)
  if (minutes > 0) parts.push(`${minutes} мин.`)
  if (seconds > 0 && parts.length === 0) parts.push(`${seconds} сек.`)
  
  return parts.length > 0 ? parts.join(' ') : 'менее 1 мин.'
}

// Сохранение
const save = async () => {
  if (!ticket.value.title?.trim()) {
    showToast('Заголовок обязателен для заполнения', 'error')
    
    return
  }

  try {
    saving.value = true
    await $fetch(`${API_BASE}/tickets/${ticketId.value}`, {
      method: 'PUT',
      body: {
        ...ticket.value,
        description: description.value,
      },
    })
    
    // Загружаем новые вложения
    if (newAttachments.value.length > 0) {
      await uploadNewAttachments()
    }
    
    showToast('Тикет успешно обновлён')
    await fetchTicket()
    await fetchAttachments()
    await fetchHistory() // Обновляем историю изменений
    await fetchStatusHistory() // Обновляем историю переходов
    newAttachments.value = []
  }
  catch (err) {
    showToast('Ошибка сохранения тикета', 'error')
  }
  finally {
    saving.value = false
  }
}

// Добавление комментария
const addComment = async () => {
  if (!newComment.value.trim() || !ticketId.value) return

  try {
    savingComment.value = true
    await $fetch(`${API_BASE}/ticketComments`, {
      method: 'POST',
      body: {
        ticketId: ticketId.value,
        content: newComment.value,
        isInternal: isInternalComment.value,
      },
    })
    newComment.value = ''
    await fetchComments()
    showToast('Комментарий добавлен')
  }
  catch (err) {
    console.error('Error adding comment:', err)
    showToast('Ошибка добавления комментария', 'error')
  }
  finally {
    savingComment.value = false
  }
}

// Редактирование комментария
const startEditComment = (comment: any) => {
  editingCommentId.value = comment.id
  editingCommentContent.value = comment.content
}

const cancelEditComment = () => {
  editingCommentId.value = null
  editingCommentContent.value = ''
}

const saveEditComment = async (commentId: number) => {
  if (!editingCommentContent.value.trim()) return

  try {
    await $fetch(`${API_BASE}/ticketComments/${commentId}`, {
      method: 'PUT',
      body: {
        content: editingCommentContent.value,
      },
    })
    editingCommentId.value = null
    editingCommentContent.value = ''
    await fetchComments()
    showToast('Комментарий обновлён')
  }
  catch (err) {
    console.error('Error updating comment:', err)
    showToast('Ошибка обновления комментария', 'error')
  }
}

// Удаление комментария
const confirmDeleteComment = (commentId: number) => {
  deletingCommentId.value = commentId
  showDeleteDialog.value = true
}

const deleteComment = async () => {
  if (!deletingCommentId.value) return

  try {
    await $fetch(`${API_BASE}/ticketComments/${deletingCommentId.value}`, {
      method: 'DELETE',
    })
    showDeleteDialog.value = false
    deletingCommentId.value = null
    await fetchComments()
    showToast('Комментарий удалён')
  }
  catch (err) {
    console.error('Error deleting comment:', err)
    showToast('Ошибка удаления комментария', 'error')
  }
}

// Обработка файлов
const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files) {
    newAttachments.value = [...newAttachments.value, ...Array.from(target.files)]
  }
}

const removeNewAttachment = (index: number) => {
  newAttachments.value.splice(index, 1)
}

const deleteExistingAttachment = async (attachmentId: number) => {
  try {
    await $fetch(`${API_BASE}/ticketAttachments/${attachmentId}`, {
      method: 'DELETE',
    })
    await fetchAttachments()
    showToast('Вложение удалено')
  }
  catch (err) {
    console.error('Error deleting attachment:', err)
    showToast('Ошибка удаления вложения', 'error')
  }
}

const uploadNewAttachments = async () => {
  for (const file of newAttachments.value) {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('ticketId', ticketId.value!.toString())
    
    await $fetch(`${API_BASE}/ticketAttachments`, {
      method: 'POST',
      body: formData,
    })
  }
}

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return ''
  
  return new Date(dateStr).toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// Отмена
const cancel = () => {
  router.push('/apps/tickets')
}

// Инициализация
onMounted(async () => {
  await Promise.all([
    fetchPriorities(),
    fetchQueues(),
    fetchStates(),
    fetchTypes(),
    fetchAgents(),
    fetchCustomers(),
    fetchSla(),
  ])
  await fetchTicket()
  await fetchComments()
  await fetchAttachments()
  await fetchHistory()
  await fetchApprovalHistory()
  await fetchStatusHistory()
})

// Уведомления
const isToastVisible = ref(false)
const toastMessage = ref('')
const toastColor = ref('success')

const showToast = (message: string, color: string = 'success') => {
  toastMessage.value = message
  toastColor.value = color
  isToastVisible.value = true
}
</script>

<template>
  <div>
    <!-- Header -->
    <div class="d-flex flex-wrap justify-start justify-sm-space-between gap-y-4 gap-x-6 mb-6">
      <div class="d-flex flex-column justify-center">
        <h4 class="text-h4 mb-1">
          Редактирование тикета
        </h4>
        <div
          v-if="ticket.ticketNumber"
          class="text-body-1"
        >
          #{{ ticket.ticketNumber }}
        </div>
      </div>

      <div class="d-flex gap-4 align-center flex-wrap">
        <VBtn
          variant="tonal"
          color="secondary"
          @click="cancel"
        >
          Отмена
        </VBtn>
        <VBtn
          :loading="saving"
          @click="save"
        >
          Сохранить
        </VBtn>
      </div>
    </div>

    <VRow>
      <!-- Левая колонка - Основная информация -->
      <VCol
        cols="12"
        md="8"
      >
        <!-- Основная информация -->
        <VCard class="mb-6">
          <VCardTitle class="d-flex align-center px-6 py-4">
            <h5 class="text-h5">
              Основная информация
            </h5>
          </VCardTitle>
          
          <div
            v-if="loading"
            class="d-flex justify-center pa-6"
          >
            <VProgressCircular
              indeterminate
              color="primary"
            />
          </div>

          <VCardText v-else>
            <VRow>
              <VCol cols="12">
                <AppTextField
                  v-model="ticket.title"
                  label="Заголовок *"
                  placeholder="Введите заголовок тикета"
                />
              </VCol>

              <VCol cols="12">
                <label class="v-label text-body-1 d-block mb-2">Описание</label>
                <TiptapEditor
                  v-model="description"
                  placeholder="Введите подробное описание проблемы"
                  class="border rounded"
                />
              </VCol>
            </VRow>
          </VCardText>
        </VCard>

        <!-- Вложения -->
        <VCard class="mb-6">
          <VCardTitle class="d-flex align-center px-6 py-4">
            <h5 class="text-h5">
              Вложения
            </h5>
          </VCardTitle>
          <VCardText>
            <!-- Существующие вложения -->
            <VList
              v-if="existingAttachments.length > 0"
              class="border rounded mb-4"
            >
              <VListItem
                v-for="attachment in existingAttachments"
                :key="attachment.id"
                class="py-3"
              >
                <template #prepend>
                  <VIcon
                    icon="bx-file"
                    class="me-3"
                  />
                </template>

                <VListItemTitle>{{ attachment.filename }}</VListItemTitle>
                <VListItemSubtitle>{{ formatFileSize(attachment.filesize || 0) }}</VListItemSubtitle>

                <template #append>
                  <VBtn
                    icon
                    variant="text"
                    color="primary"
                    size="small"
                    class="me-2"
                    :href="`${API_BASE}/uploads/${attachment.filename}`"
                    target="_blank"
                  >
                    <VIcon icon="bx-download" />
                  </VBtn>
                  <VBtn
                    icon
                    variant="text"
                    color="error"
                    size="small"
                    @click="deleteExistingAttachment(attachment.id)"
                  >
                    <VIcon icon="bx-x" />
                  </VBtn>
                </template>
              </VListItem>
            </VList>

            <!-- Новые файлы для загрузки -->
            <VList
              v-if="newAttachments.length > 0"
              class="border rounded mb-4"
            >
              <VListItem
                v-for="(file, index) in newAttachments"
                :key="index"
                class="py-3"
              >
                <template #prepend>
                  <VIcon
                    icon="bx-file"
                    class="me-3"
                  />
                </template>

                <VListItemTitle>{{ file.name }}</VListItemTitle>
                <VListItemSubtitle>{{ formatFileSize(file.size) }}</VListItemSubtitle>

                <template #append>
                  <VBtn
                    icon
                    variant="text"
                    color="error"
                    size="small"
                    @click="removeNewAttachment(index)"
                  >
                    <VIcon icon="bx-x" />
                  </VBtn>
                </template>
              </VListItem>
            </VList>

            <!-- Drop Zone -->
            <div class="drop-zone pa-6 text-center">
              <VIcon
                icon="bx-cloud-upload"
                size="36"
                color="primary"
                class="mb-2"
              />
              <p class="text-body-2 mb-2">
                Перетащите файлы сюда или
              </p>
              <VBtn
                variant="tonal"
                color="primary"
                size="small"
                tag="label"
                class="cursor-pointer"
              >
                <input
                  type="file"
                  multiple
                  hidden
                  @change="handleFileSelect"
                >
                Выберите файлы
              </VBtn>
            </div>
          </VCardText>
        </VCard>

        <!-- Комментарии и история -->
        <VCard class="mb-6">
          <VTabs v-model="activeTab">
            <VTab value="comments">
              Комментарии
              <VChip
                v-if="comments.length > 0"
                size="x-small"
                color="primary"
                class="ms-2"
              >
                {{ comments.length }}
              </VChip>
            </VTab>
            <VTab value="history">
              История изменений
              <VChip
                v-if="historyChanges.length > 0"
                size="x-small"
                color="secondary"
                class="ms-2"
              >
                {{ historyChanges.length }}
              </VChip>
            </VTab>
            <VTab value="approval">
              История согласования
              <VChip
                v-if="approvalHistory.length > 0"
                size="x-small"
                color="success"
                class="ms-2"
              >
                {{ approvalHistory.length }}
              </VChip>
            </VTab>
            <VTab value="statusHistory">
              История переходов
              <VChip
                v-if="statusHistory.length > 0"
                size="x-small"
                color="info"
                class="ms-2"
              >
                {{ statusHistory.length }}
              </VChip>
            </VTab>
          </VTabs>

          <VCardText>
            <!-- Вкладка Комментарии -->
            <VWindow v-model="activeTab">
              <VWindowItem value="comments">
                <!-- Список комментариев -->
                <div
                  v-if="comments.length > 0"
                  class="comments-list mb-6"
                >
                  <div
                    v-for="comment in comments"
                    :key="comment.id"
                    class="comment-item pa-4 mb-3 rounded"
                    :class="comment.isInternal ? 'internal-comment' : 'external-comment'"
                  >
                    <div class="d-flex justify-space-between align-start mb-2">
                      <div class="d-flex align-center">
                        <VAvatar
                          size="32"
                          color="primary"
                          class="me-2"
                        >
                          <span class="text-caption">{{ (comment.authorName || comment.author || 'U').charAt(0).toUpperCase() }}</span>
                        </VAvatar>
                        <div>
                          <div class="text-body-1 font-weight-medium">
                            {{ comment.authorName || comment.author || 'Пользователь' }}
                          </div>
                          <div class="text-caption text-medium-emphasis">
                            {{ formatDate(comment.createdAt) }}
                          </div>
                        </div>
                      </div>
                      <div class="d-flex align-center gap-1">
                        <VChip
                          v-if="comment.isInternal"
                          size="x-small"
                          color="warning"
                          variant="flat"
                          class="me-2"
                        >
                          Внутренний
                        </VChip>
                        <VBtn
                          icon
                          variant="text"
                          size="small"
                          @click="startEditComment(comment)"
                        >
                          <VIcon icon="bx-edit" size="18" />
                        </VBtn>
                        <VBtn
                          icon
                          variant="text"
                          color="error"
                          size="small"
                          @click="confirmDeleteComment(comment.id)"
                        >
                          <VIcon icon="bx-trash" size="18" />
                        </VBtn>
                      </div>
                    </div>
                    
                    <!-- Режим редактирования -->
                    <div v-if="editingCommentId === comment.id">
                      <AppTextarea
                        v-model="editingCommentContent"
                        rows="3"
                        auto-grow
                        class="mb-2"
                      />
                      <div class="d-flex gap-2 justify-end">
                        <VBtn
                          variant="tonal"
                          size="small"
                          @click="cancelEditComment"
                        >
                          Отмена
                        </VBtn>
                        <VBtn
                          size="small"
                          @click="saveEditComment(comment.id)"
                        >
                          Сохранить
                        </VBtn>
                      </div>
                    </div>
                    
                    <!-- Обычный режим -->
                    <div
                      v-else
                      class="text-body-2 comment-content"
                      v-html="comment.content"
                    />
                  </div>
                </div>

                <!-- Форма добавления комментария -->
                <div class="comment-form">
                  <AppTextarea
                    v-model="newComment"
                    placeholder="Напишите комментарий..."
                    rows="3"
                    auto-grow
                    class="mb-3"
                  />
                  <div class="d-flex justify-space-between align-center">
                    <VCheckbox
                      v-model="isInternalComment"
                      label="Внутренний комментарий (только для агентов)"
                      density="compact"
                      hide-details
                      color="warning"
                    />
                    <VBtn
                      :loading="savingComment"
                      :disabled="!newComment.trim()"
                      @click="addComment"
                    >
                      <VIcon
                        icon="bx-send"
                        class="me-2"
                      />
                      Отправить
                    </VBtn>
                  </div>
                </div>
              </VWindowItem>

              <!-- Вкладка История изменений -->
              <VWindowItem value="history">
                <div
                  v-if="loadingHistory"
                  class="d-flex justify-center pa-6"
                >
                  <VProgressCircular
                    indeterminate
                    color="primary"
                  />
                </div>
                <div
                  v-else-if="historyChanges.length === 0"
                  class="text-center text-medium-emphasis pa-6"
                >
                  История изменений пуста
                </div>
                <div
                  v-else
                  class="history-list"
                >
                  <div
                    v-for="item in historyChanges"
                    :key="item.id"
                    class="history-item pa-3 mb-2 rounded border"
                  >
                    <div class="d-flex justify-space-between align-start">
                      <div>
                        <div class="text-body-1 font-weight-medium">
                          {{ item.fieldDisplayName }}
                        </div>
                        <div class="text-caption text-medium-emphasis">
                          {{ item.changedByName }} • {{ formatDate(item.createdAt) }}
                        </div>
                      </div>
                      <div class="text-body-2">
                        <span
                          v-if="item.oldValue"
                          class="text-error"
                        >
                          {{ item.oldValue }}
                        </span>
                        <VIcon
                          icon="bx-arrow-right"
                          size="16"
                          class="mx-1"
                        />
                        <span
                          v-if="item.newValue"
                          class="text-success"
                        >
                          {{ item.newValue }}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </VWindowItem>

              <!-- Вкладка История согласования -->
              <VWindowItem value="approval">
                <div
                  v-if="loadingApproval"
                  class="d-flex justify-center pa-6"
                >
                  <VProgressCircular
                    indeterminate
                    color="primary"
                  />
                </div>
                <div
                  v-else-if="approvalHistory.length === 0"
                  class="text-center text-medium-emphasis pa-6"
                >
                  История согласования пуста
                </div>
                <div
                  v-else
                  class="approval-list"
                >
                  <div
                    v-for="item in approvalHistory"
                    :key="item.id"
                    class="approval-item pa-3 mb-2 rounded border"
                  >
                    <div class="d-flex justify-space-between align-start">
                      <div>
                        <div class="text-body-1 font-weight-medium">
                          {{ item.action || 'Согласование' }}
                        </div>
                        <div class="text-caption text-medium-emphasis">
                          {{ item.approverName || 'Система' }} • {{ formatDate(item.createdAt) }}
                        </div>
                      </div>
                      <VChip
                        :color="item.status === 'approved' ? 'success' : item.status === 'rejected' ? 'error' : 'warning'"
                        size="small"
                      >
                        {{ item.status === 'approved' ? 'Согласовано' : item.status === 'rejected' ? 'Отклонено' : 'Ожидает' }}
                      </VChip>
                    </div>
                    <div
                      v-if="item.comment"
                      class="text-body-2 mt-2"
                    >
                      {{ item.comment }}
                    </div>
                  </div>
                </div>
              </VWindowItem>

              <!-- Вкладка История переходов -->
              <VWindowItem value="statusHistory">
                <div
                  v-if="loadingStatusHistory"
                  class="d-flex justify-center pa-6"
                >
                  <VProgressCircular
                    indeterminate
                    color="primary"
                  />
                </div>
                <div
                  v-else-if="statusHistory.length === 0"
                  class="text-center text-medium-emphasis pa-6"
                >
                  История переходов пуста
                </div>
                <div
                  v-else
                  class="status-history-list"
                >
                  <div
                    v-for="item in statusHistory"
                    :key="item.id"
                    class="status-history-item pa-3 mb-2 rounded border"
                  >
                    <div class="d-flex justify-space-between align-start">
                      <div class="flex-grow-1">
                        <div class="d-flex align-center gap-2 mb-1">
                          <!-- Из статуса -->
                          <VChip
                            v-if="item.fromStatusName"
                            :color="item.fromStatusColor || 'default'"
                            size="small"
                            density="compact"
                          >
                            {{ item.fromStatusName }}
                          </VChip>
                          <span v-else class="text-caption text-medium-emphasis">Новый</span>
                          
                          <!-- Стрелка -->
                          <VIcon
                            icon="bx-arrow-right"
                            size="16"
                            color="primary"
                          />
                          
                          <!-- В статус -->
                          <VChip
                            :color="item.toStatusColor || 'primary'"
                            size="small"
                            density="compact"
                          >
                            {{ item.toStatusName }}
                          </VChip>
                        </div>
                        
                        <div class="text-caption text-medium-emphasis">
                          {{ item.changedByName || 'Система' }} • {{ formatDate(item.transitionTime || item.createdAt) }}
                        </div>
                        
                        <!-- Метка действия -->
                        <div
                          v-if="item.actionLabel"
                          class="text-body-2 mt-1"
                        >
                          <VIcon icon="bx-label" size="14" class="me-1" />
                          {{ item.actionLabel }}
                        </div>
                      </div>
                      
                      <!-- Время в статусе -->
                      <div class="text-right">
                        <div class="text-caption text-medium-emphasis">
                          Время в статусе:
                        </div>
                        <div class="text-body-2 font-weight-medium">
                          {{ formatTimeInStatus(item.timeInPreviousStatus) }}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </VWindowItem>
            </VWindow>
          </VCardText>
        </VCard>
      </VCol>

      <!-- Правая колонка - Свойства тикета -->
      <VCol
        cols="12"
        md="4"
      >
        <!-- Свойства -->
        <VCard class="mb-6">
          <VCardTitle class="d-flex align-center px-6 py-4">
            <h5 class="text-h5">
              Свойства
            </h5>
          </VCardTitle>
          <VCardText>
            <div class="d-flex flex-column gap-y-4">
              <AppTextField
                :model-value="ticket.ticketNumber"
                label="Номер тикета"
                disabled
              />

              <AppSelect
                v-model="ticket.typeId"
                :items="types"
                item-title="name"
                item-value="id"
                label="Тип"
                placeholder="Выберите тип"
                clearable
              />

              <!-- Информация о workflow -->
              <VAlert
                v-if="currentWorkflow"
                type="info"
                variant="tonal"
                density="compact"
                class="mb-2"
              >
                <div class="text-body-2">
                  <strong>Workflow:</strong> {{ currentWorkflow.name }}
                </div>
              </VAlert>

              <VProgressLinear
                v-if="loadingWorkflow"
                indeterminate
                color="primary"
                class="mb-2"
              />

              <AppSelect
                v-model="ticket.priorityId"
                :items="priorities"
                item-title="name"
                item-value="id"
                label="Приоритет"
                placeholder="Выберите приоритет"
                clearable
              />

              <AppSelect
                v-model="ticket.queueId"
                :items="queues"
                item-title="name"
                item-value="id"
                label="Очередь"
                placeholder="Выберите очередь"
                clearable
              />

              <!-- Статус - ограничен доступными из workflow или все если тип не выбран -->
              <AppSelect
                v-model="ticket.stateId"
                :items="statusOptions"
                item-title="title"
                item-value="value"
                label="Статус"
                :placeholder="availableStatuses.length > 0 ? 'Выберите статус из доступных' : 'Выберите статус'"
                :hint="availableStatuses.length > 0 ? 'Доступные статусы из workflow' : ''"
                :persistent-hint="availableStatuses.length > 0"
                clearable
              >
                <template #selection="{ item }">
                  <VChip
                    v-if="item.raw.color"
                    :color="item.raw.color"
                    density="compact"
                    label
                    size="small"
                  >
                    {{ item.title }}
                  </VChip>
                  <span v-else>{{ item.title }}</span>
                </template>
                <template #item="{ props, item }">
                  <VListItem v-bind="props">
                    <template #prepend>
                      <VChip
                        v-if="item.raw.color"
                        :color="item.raw.color"
                        density="compact"
                        label
                        size="small"
                        class="mr-2"
                      >
                        &nbsp;
                      </VChip>
                    </template>
                  </VListItem>
                </template>
              </AppSelect>

              <AppSelect
                v-model="ticket.ownerId"
                :items="agentOptions"
                label="Владелец"
                placeholder="Выберите владельца"
                clearable
              />

              <AppSelect
                v-model="ticket.companyId"
                :items="customers"
                item-title="name"
                item-value="id"
                label="Компания"
                placeholder="Выберите компанию"
                clearable
              />

              <AppSelect
                v-model="ticket.slaId"
                :items="slaList"
                item-title="name"
                item-value="id"
                label="SLA"
                placeholder="Выберите SLA"
                clearable
              />

              <VDivider class="my-2" />

              <div class="d-flex align-center justify-space-between">
                <span>Активен</span>
                <VSwitch
                  v-model="ticket.isActive"
                  color="primary"
                  density="compact"
                  hide-details
                />
              </div>
            </div>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <!-- Snackbar -->
    <VSnackbar
      v-model="isToastVisible"
      :color="toastColor"
      timeout="3000"
    >
      {{ toastMessage }}
    </VSnackbar>

    <!-- Диалог подтверждения удаления комментария -->
    <VDialog
      v-model="showDeleteDialog"
      max-width="400"
    >
      <VCard>
        <VCardTitle>Удаление комментария</VCardTitle>
        <VCardText>
          Вы уверены, что хотите удалить этот комментарий? Это действие нельзя отменить.
        </VCardText>
        <VCardActions>
          <VSpacer />
          <VBtn
            variant="tonal"
            @click="showDeleteDialog = false"
          >
            Отмена
          </VBtn>
          <VBtn
            color="error"
            @click="deleteComment"
          >
            Удалить
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>
  </div>
</template>

<style lang="scss" scoped>
.drop-zone {
  border: 2px dashed rgba(var(--v-theme-on-surface), 0.12);
  border-radius: 6px;
  transition: border-color 0.2s;

  &:hover {
    border-color: rgba(var(--v-theme-primary), 0.5);
  }
}

.comments-list {
  max-block-size: 400px;
  overflow-y: auto;
}

.comment-item {
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
}

.internal-comment {
  background-color: rgba(var(--v-theme-warning), 0.05);
  border-inline-start: 3px solid rgb(var(--v-theme-warning));
}

.external-comment {
  background-color: rgba(var(--v-theme-primary), 0.02);
  border-inline-start: 3px solid rgb(var(--v-theme-primary));
}

.comment-content {
  word-break: break-word;
}

.history-list,
.approval-list,
.status-history-list {
  max-block-size: 400px;
  overflow-y: auto;
}

.history-item,
.approval-item,
.status-history-item {
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  transition: background-color 0.2s;

  &:hover {
    background-color: rgba(var(--v-theme-on-surface), 0.02);
  }
}
</style>

<style lang="scss">
.ProseMirror {
  p {
    margin-block-end: 0;
  }

  padding: 0.5rem;
  min-block-size: 150px;
  outline: none;

  p.is-editor-empty:first-child::before {
    block-size: 0;
    color: #adb5bd;
    content: attr(data-placeholder);
    float: inline-start;
    pointer-events: none;
  }
}
</style>
