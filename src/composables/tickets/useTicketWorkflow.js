import { $fetch } from 'ofetch'
import { ref, watch } from 'vue'
import { ticket, types } from './useTicketForm'

const API_BASE = import.meta.env.VITE_API_BASE_URL

// Workflow данные
const currentWorkflow = ref<any>(null)
const availableStatuses = ref<any[]>([])
const initialStatus = ref<any>(null)
const loadingWorkflow = ref(false)

// Workflow
const fetchTypeWorkflow = async (typeId: number, stateId?: number) => {
  if (!typeId) return

  try {
    loadingWorkflow.value = true
    const data = await $fetch(`${API_BASE}/types/${typeId}/workflow`)
    currentWorkflow.value = (data as any).workflow

    if (currentWorkflow.value) {
      availableStatuses.value = currentWorkflow.value.transitions?.map((t: any) => t.targetStatus) || []

      // Если статус не задан, устанавливаем начальный
      if (!stateId && currentWorkflow.value.initialStatus) {
        initialStatus.value = currentWorkflow.value.initialStatus
        ticket.stateId = currentWorkflow.value.initialStatus.id
      }
    }
  }
  catch (err) {
    console.error('Error fetching workflow:', err)
  }
  finally {
    loadingWorkflow.value = false
  }
}

// Watcher для типа
watch(() => ticket.typeId, async (newTypeId) => {
  if (newTypeId) {
    await fetchTypeWorkflow(newTypeId)
    // Очищаем категорию если она не входит в список разрешённых для нового типа
    const selectedType = types.value.find((t: any) => t.id === newTypeId)
    if (selectedType && selectedType.categoryIds && selectedType.categoryIds.length > 0) {
      if (!selectedType.categoryIds.includes(ticket.categoryId)) {
        ticket.categoryId = undefined
      }
    }
  }
})

export {
  currentWorkflow,
  availableStatuses,
  initialStatus,
  loadingWorkflow,
  fetchTypeWorkflow,
}