import { onMounted } from 'vue'
import * as ticketData from './useTicketData'
import * as ticketForm from './useTicketForm'
import * as ticketWorkflow from './useTicketWorkflow'

export function useTicketCreation() {
  // Инициализация
  onMounted(async () => {
    await Promise.all([
      ticketData.fetchPriorities(),
      ticketData.fetchQueues(),
      ticketData.fetchStates(),
      ticketData.fetchTypes(),
      ticketData.fetchCategories(),
      ticketData.fetchAgents(),
      ticketData.fetchAgentGroups(),
      ticketData.fetchCustomers(),
      ticketData.fetchServices(),
      ticketData.fetchSla(),
      ticketData.fetchCustomerUsers(),
    ])
  })

  return {
    // Справочники
    ...ticketData,

    // Вычисляемые
    filteredServices: ticketForm.filteredServices,
    filteredCategories: ticketForm.filteredCategories,
    filteredCustomerUsers: ticketForm.filteredCustomerUsers,

    // Форма
    ticket: ticketForm.ticket,
    description: ticketForm.description,

    // Состояние
    loading: ticketForm.loading,
    saving: ticketForm.saving,

    // Вложения
    attachments: ticketForm.attachments,
    newAttachments: ticketForm.newAttachments,
    existingAttachments: ticketForm.existingAttachments,

    // Workflow
    currentWorkflow: ticketWorkflow.currentWorkflow,
    availableStatuses: ticketWorkflow.availableStatuses,
    initialStatus: ticketWorkflow.initialStatus,
    loadingWorkflow: ticketWorkflow.loadingWorkflow,

    // Функции
    fetchTypeWorkflow: ticketWorkflow.fetchTypeWorkflow,
    calculateSlaDeadlines: ticketForm.calculateSlaDeadlines,
    assignToMe: ticketForm.assignToMe,
    createTicket: ticketForm.createTicket,
    uploadAttachments: ticketForm.uploadAttachments,
  }
}