import { computed, ref } from 'vue'
import { $api } from '@/utils/api'

export function useTicketWorkflow(typeId: Ref<number | undefined>) {
  const currentWorkflow = ref<any>(null)
  const availableStatuses = ref<any[]>([])
  const loadingWorkflow = ref(false)

  // Загрузка workflow и доступных статусов по типу
  const fetchWorkflow = async (currentStatusId?: number | null) => {
    if (!typeId.value) {
      currentWorkflow.value = null
      availableStatuses.value = []

      return
    }

    try {
      loadingWorkflow.value = true

      // Формируем URL с параметром currentStatusId если он передан
      let url = `/types/${typeId.value}/workflow`
      if (currentStatusId !== undefined && currentStatusId !== null)
        url += `?currentStatusId=${currentStatusId}`

      const data = await $api(url)

      currentWorkflow.value = (data as any).workflow

      // Если передан текущий статус и есть workflow, используем переходы из текущего статуса
      if (currentStatusId !== undefined && currentStatusId !== null && currentWorkflow.value && (data as any).currentStatusTransitions) {
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

  return {
    currentWorkflow,
    availableStatuses,
    loadingWorkflow,
    fetchWorkflow,
  }
}
