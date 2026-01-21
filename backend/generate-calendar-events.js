const Calendars = require('./models/calendars');
const CalendarEvents = require('./models/calendarEvents');

async function generate() {
  const calendars = await Calendars.getAll({ q: '', sortBy: '', orderBy: 'asc', itemsPerPage: 100, page: 1 });
  for (const calendar of calendars.calendars) {
    if (calendar.isActive && calendar.workHoursFrom && calendar.workHoursTo && calendar.dateFrom && calendar.dateTo) {
      const events = generateCalendarEvents(calendar.id, calendar);
      await CalendarEvents.createMultiple(events);
      console.log(`Events generated for calendar ${calendar.id}`);
    }
  }
}

function generateCalendarEvents(calendarId, calendar) {
  const events = [];
  const { workHoursFrom, workHoursTo, workDaysPerWeek, dateFrom, dateTo } = calendar;
  const [hFrom, mFrom] = workHoursFrom.split(':').map(Number);
  const [hTo, mTo] = workHoursTo.split(':').map(Number);
  const startDate = new Date(dateFrom);
  const endDate = new Date(dateTo);

  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const dayOfWeek = d.getDay();
    const isWorkDay = workDaysPerWeek === 7 || (dayOfWeek >= 1 && dayOfWeek <= workDaysPerWeek);
    if (isWorkDay) {
      const start = new Date(d.getFullYear(), d.getMonth(), d.getDate(), hFrom, mFrom);
      const eventEnd = new Date(d.getFullYear(), d.getMonth(), d.getDate(), hTo, mTo);
      events.push({
        calendarId,
        title: 'Рабочие часы',
        start: start.toISOString(),
        eventEnd: eventEnd.toISOString(),
        allDay: false,
        description: ''
      });
    }
  }
  return events;
}

generate();
