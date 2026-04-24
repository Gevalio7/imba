import { ref } from 'vue'
import type { TicketForm } from '@/types/ticket'

export function useTicketEscalation(ticket: TicketForm) {
  const ESCALATION_STATUS_TYPE = 'Эскалирована'

  const performEscalation = () => {
    console.log('🚀 Выполняем эскалацию...')

    // a) Добавляем старых исполнителей в наблюдатели
    const previousExecutorAgentIds = ticket.initialExecutorAgentIds || ticket.executorAgentIds
    const previousExecutorGroupIds = ticket.initialExecutorGroupIds || ticket.executorGroupIds

    ticket.observerAgentIds = [...ticket.observerAgentIds, ...previousExecutorAgentIds.filter((id: number) => !ticket.observerAgentIds.includes(id))]
    ticket.observerGroupIds = [...ticket.observerGroupIds, ...previousExecutorGroupIds.filter((id: number) => !ticket.observerGroupIds.includes(id))]

    console.log('🚀 Добавлены наблюдатели:', {
      addedAgents: previousExecutorAgentIds,
      addedGroups: previousExecutorGroupIds,
    })

    // b) Увеличиваем счётчик эскалаций
    ticket.escalationCount += 1

    // c) Устанавливаем флаг эскалирования
    ticket.isEscalated = true

    console.log('🚀 Установлены флаги эскалации:', {
      escalationCount: ticket.escalationCount,
      isEscalated: ticket.isEscalated,
    })
  }

  return {
    performEscalation,
    ESCALATION_STATUS_TYPE,
  }
}