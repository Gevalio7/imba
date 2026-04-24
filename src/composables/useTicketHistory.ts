import { $api } from '@/utils/api'
import { ref } from 'vue'

export function useTicketHistory(ticketId: Ref<number | null>) {
  // История изменений
  const historyChanges = ref<any[]>([])
  const loadingHistory = ref(false)

  // История согласования
  const approvalHistory = ref<any[]>([])
  const loadingApproval = ref(false)

  // История переходов статусов
  const statusHistory = ref<any[]>([])
  const loadingStatusHistory = ref(false)

  // Загрузка истории изменений
  const fetchHistory = async () => {
    if (!ticketId.value) return

    try {
      loadingHistory.value = true
      const data = await $api(`/ticketHistory?ticketId=${ticketId.value}`)
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
      const data = await $api(`/ticketHistory/approval/${ticketId.value}`)
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
      const data = await $api(`/ticketStatusHistory/${ticketId.value}`)
      statusHistory.value = (data as any).history || []
    }
    catch (err) {
      console.error('Error fetching status history:', err)
    }
    finally {
      loadingStatusHistory.value = false
    }
  }

  // Загрузка всей истории сразу
  const fetchAllHistory = async () => {
    if (!ticketId.value) return

    await Promise.all([
      fetchHistory(),
      fetchApprovalHistory(),
      fetchStatusHistory(),
    ])
  }

  return {
    historyChanges,
    loadingHistory,
    approvalHistory,
    loadingApproval,
    statusHistory,
    loadingStatusHistory,
    fetchHistory,
    fetchApprovalHistory,
    fetchStatusHistory,
    fetchAllHistory,
  }
}