import { ref } from 'vue'
import type { TicketForm } from '@/types/ticket'

export function useTicketEscalation(ticket: TicketForm) {
  const ESCALATION_STATUS_TYPE = 'Эскалирована'

  const performEscalation = () => {
    console.log('🚀 Выполняем эскалацию...')

    // a) Запоминаем текущих исполнителей
    const previousExecutorAgentIds = [...(ticket.initialExecutorAgentIds || ticket.executorAgentIds || [])]
    const previousExecutorGroupIds = [...(ticket.initialExecutorGroupIds || ticket.executorGroupIds || [])]

    // b) Перемещаем их в наблюдатели (без дублей)
    ticket.observerAgentIds = [
      ...ticket.observerAgentIds,
      ...previousExecutorAgentIds.filter((id: number) => !ticket.observerAgentIds.includes(id))
    ]
    ticket.observerGroupIds = [
      ...ticket.observerGroupIds,
      ...previousExecutorGroupIds.filter((id: number) => !ticket.observerGroupIds.includes(id))
    ]

    console.log('🚀 Добавлены в наблюдатели:', {
      agents: previousExecutorAgentIds,
      groups: previousExecutorGroupIds,
    })

    // c) Очищаем исполнителей (как и ожидается при эскалации)
    ticket.executorAgentIds = []
    ticket.executorGroupIds = []

    console.log('🚀 Очищены исполнители')

    // d) Увеличиваем счётчик
    ticket.escalationCount = (ticket.escalationCount || 0) + 1

    // e) Ставим флаг
    ticket.isEscalated = true

    console.log('🚀 Эскалация выполнена:', {
      escalationCount: ticket.escalationCount,
      isEscalated: ticket.isEscalated,
    })
  }

  return {
    performEscalation,
    ESCALATION_STATUS_TYPE,
  }
}
