import { $api } from '@/utils/api'
import { ref, reactive } from 'vue'
import type { TicketSchedule } from '@/types/ticket'

export function useTicketSchedule(ticketId: Ref<number | null>) {
  const ticketSchedule = ref<TicketSchedule | null>(null)
  const loadingSchedule = ref(false)

  // Форма расписания
  const scheduleForm = reactive({
    scheduleType: 'daily' as 'daily' | 'weekly' | 'monthly',
    scheduleTime: '09:00',
    scheduleDays: [] as number[],
    scheduleDayOfMonth: 1,
    startDate: null as string | null,
    endDate: null as string | null,
    isActive: true,
    titlePrefix: 'Расписание (Р) ',
  })

  // Загрузка расписания для тикета
  const fetchSchedule = async () => {
    if (!ticketId.value) return

    try {
      loadingSchedule.value = true
      const data = await $api(`/ticketSchedules/ticket/${ticketId.value}`)
      ticketSchedule.value = (data as any).schedule || null
    }
    catch (err) {
      console.log('Error fetching schedule:', err)
    }
    finally {
      loadingSchedule.value = false
    }
  }

  // Открыть диалог настройки расписания
  const openScheduleDialog = () => {
    if (ticketSchedule.value) {
      // Редактирование - заполняем форму текущими значениями
      scheduleForm.scheduleType = ticketSchedule.value.scheduleType || 'daily'
      scheduleForm.scheduleTime = ticketSchedule.value.scheduleTime || '09:00'
      scheduleForm.scheduleDays = ticketSchedule.value.scheduleDays || []
      scheduleForm.scheduleDayOfMonth = ticketSchedule.value.scheduleDayOfMonth || 1
      scheduleForm.startDate = ticketSchedule.value.startDate || null
      scheduleForm.endDate = ticketSchedule.value.endDate || null
      scheduleForm.isActive = ticketSchedule.value.isActive !== false
      scheduleForm.titlePrefix = ticketSchedule.value.titlePrefix || 'Расписание (Р) '
    } else {
      // Создание - сбрасываем форму
      scheduleForm.scheduleType = 'daily'
      scheduleForm.scheduleTime = '09:00'
      scheduleForm.scheduleDays = []
      scheduleForm.scheduleDayOfMonth = 1
      scheduleForm.startDate = null
      scheduleForm.endDate = null
      scheduleForm.isActive = true
      scheduleForm.titlePrefix = 'Расписание (Р) '
    }
  }

  // Сохранить расписание
  const saveSchedule = async () => {
    if (!ticketId.value) return

    try {
      const scheduleData = {
        ticketId: ticketId.value,
        copyFromTicket: true,
        ...scheduleForm,
      }

      if (ticketSchedule.value?.id) {
        // Обновляем
        await $api(`/ticketSchedules/${ticketSchedule.value.id}`, {
          method: 'PUT',
          body: scheduleData
        })
      } else {
        // Создаём
        await $api('/ticketSchedules', {
          method: 'POST',
          body: scheduleData,
        })
      }
    }
    catch (err: any) {
      console.error('Error saving schedule:', err)
      throw err
    }
  }

  // Удалить расписание
  const deleteSchedule = async () => {
    if (!ticketSchedule.value?.id) return

    try {
      await $api(`/ticketSchedules/${ticketSchedule.value.id}`, {
        method: 'DELETE'
      })
      ticketSchedule.value = null
    }
    catch (err) {
      console.error('Error deleting schedule:', err)
      throw err
    }
  }

  // Запустить расписание вручную (создать тикет)
  const runScheduleNow = async () => {
    if (!ticketSchedule.value?.id) return

    try {
      const data = await $api(`/ticketSchedules/${ticketSchedule.value.id}/run`, {
        method: 'POST',
      })
      return (data as any).message || 'Тикет создан'
    }
    catch (err: any) {
      console.error('Error running schedule:', err)
      throw err
    }
  }

  return {
    ticketSchedule,
    loadingSchedule,
    scheduleForm,
    fetchSchedule,
    openScheduleDialog,
    saveSchedule,
    deleteSchedule,
    runScheduleNow,
  }
}