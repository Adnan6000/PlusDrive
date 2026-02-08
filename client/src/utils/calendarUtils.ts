export const generateGoogleCalendarUrl = (event: any) => {
  const start = new Date(event.date);
  const [h, m] = event.startTime.split(':').map(Number);
  start.setHours(h, m, 0);

  // Default end time is 1 hour later if not specified
  const end = new Date(start);
  if (event.endTime) {
    const [endH, endM] = event.endTime.split(':').map(Number);
    end.setHours(endH, endM, 0);
  } else {
    end.setHours(start.getHours() + 1);
  }

  const formatTime = (d: Date) => d.toISOString().replace(/-|:|\.\d+/g, "");

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${formatTime(start)}/${formatTime(end)}`,
    details: event.description || '',
    location: event.location || 'Driving School',
    sf: 'true',
    output: 'xml',
  });

  return `https://www.google.com/calendar/render?${params.toString()}`;
};

export const downloadIcsFile = (event: any) => {
  const start = new Date(event.date);
  const [h, m] = event.startTime.split(':').map(Number);
  start.setHours(h, m, 0);

  const end = new Date(start);
  if (event.endTime) {
    const [endH, endM] = event.endTime.split(':').map(Number);
    end.setHours(endH, endM, 0);
  } else {
    end.setHours(start.getHours() + 1);
  }

  const formatTime = (d: Date) => d.toISOString().replace(/-|:|\.\d+/g, "");

  const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//PlusDrive//Driving School//EN
BEGIN:VEVENT
UID:${Date.now()}@plusdrive.com
DTSTAMP:${formatTime(new Date())}
DTSTART:${formatTime(start)}
DTEND:${formatTime(end)}
SUMMARY:${event.title}
DESCRIPTION:${event.description || ''}
LOCATION:${event.location || 'Driving School'}
END:VEVENT
END:VCALENDAR`;

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const link = document.createElement('a');
  link.href = window.URL.createObjectURL(blob);
  link.setAttribute('download', 'lesson.ics');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};