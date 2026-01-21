import type { Event, NewEvent } from './types'

export const useCalendarStore = defineStore('calendar', {
  // arrow function recommended for full type inference
  state: () => ({
    availableCalendars: [] as any[],
    selectedCalendars: [] as string[],
  }),
  actions: {
    async fetchCalendars() {
      const { data, error } = await useApi<any>(createUrl('/api/calendars'))

      if (error.value)
        return error.value

      const calendars = data.value.calendars || []
      const activeCalendars = calendars.filter((cal: any) => cal.isActive)
      this.availableCalendars = activeCalendars.map((cal: any) => ({
        color: cal.color || 'primary',
        label: cal.name,
        id: cal.id,
      }))
      this.selectedCalendars = this.availableCalendars.map((cal: any) => cal.id)

      return data.value
    },
    async fetchEvents(startDate?: string, endDate?: string) {
      const query: any = {
        calendarId: this.selectedCalendars,
      }

      if (startDate) query.startDate = startDate
      if (endDate) query.endDate = endDate

      const { data, error } = await useApi<any>(createUrl('/api/calendarEvents', {
        query,
      }))

      if (error.value)
        return error.value

      const events = data.value.events || []
      // Фильтруем события только для активных календарей
      const filteredEvents = events.filter((e: any) =>
        this.availableCalendars.some((cal: any) => cal.id === e.calendarId)
      )

      return filteredEvents.map((e: any) => {
        const cal = this.availableCalendars.find((c: any) => c.id === e.calendarId)
        return {
          ...e,
          end: e.eventEnd, // map eventEnd to end
          extendedProps: {
            calendar: cal ? cal.label : 'Unknown',
            location: '',
            description: e.description || '',
            guests: [],
          },
        }
      })
    },
    async addEvent(event: NewEvent) {
      const cal = this.availableCalendars.find((c: any) => c.label === event.extendedProps.calendar)
      const body = {
        calendarId: cal ? cal.id : 1,
        title: event.title,
        start: event.start,
        eventEnd: event.end,
        allDay: event.allDay,
        description: event.extendedProps.description,
      }
      await $api('/api/calendarEvents', {
        method: 'POST',
        body,
      })
    },
    async updateEvent(event: Event) {
      const cal = this.availableCalendars.find((c: any) => c.label === event.extendedProps.calendar)
      const body = {
        calendarId: cal ? cal.id : 1,
        title: event.title,
        start: event.start,
        eventEnd: event.end,
        allDay: event.allDay,
        description: event.extendedProps.description,
      }
      return await $api(`/api/calendarEvents/${event.id}`, {
        method: 'PUT',
        body,
      })
    },
    async removeEvent(eventId: string) {
      return await $api(`/api/calendarEvents/${eventId}`, {
        method: 'DELETE',
      })
    },

  },
})
