const CALENDAR_DATE = /[-:]/g;

function calendarStamp(value: string | Date): string {
  return new Date(value)
    .toISOString()
    .replace(/\.\d{3}Z$/, "Z")
    .replace(CALENDAR_DATE, "");
}

function icsText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\r?\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

export function googleCalendarUrl(opts: {
  startsAt: string;
  endsAt: string;
  talentName: string | null;
  dashboardUrl: string;
  meetingUrl?: string | null;
}): string {
  const title = `Somahorse.ai interview${opts.talentName ? ` — ${opts.talentName}` : ""}`;
  const details = [
    "Somahorse.ai talent certification interview.",
    opts.meetingUrl ? `Meeting link: ${opts.meetingUrl}` : null,
    `Interview workspace: ${opts.dashboardUrl}`,
  ]
    .filter(Boolean)
    .join("\n\n");

  const query = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    dates: `${calendarStamp(opts.startsAt)}/${calendarStamp(opts.endsAt)}`,
    details,
    location: opts.meetingUrl ?? "Online",
  });
  return `https://calendar.google.com/calendar/render?${query.toString()}`;
}

export function interviewIcs(opts: {
  uid: string;
  startsAt: string;
  endsAt: string;
  talentName: string | null;
  dashboardUrl: string;
  meetingUrl?: string | null;
}): string {
  const title = `Somahorse.ai interview${opts.talentName ? ` — ${opts.talentName}` : ""}`;
  const description = [
    "Somahorse.ai talent certification interview.",
    opts.meetingUrl ? `Meeting link: ${opts.meetingUrl}` : null,
    `Interview workspace: ${opts.dashboardUrl}`,
  ]
    .filter(Boolean)
    .join("\n\n");

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Somahorse.ai//Talent Interviews//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${icsText(opts.uid)}@somahorse.ai`,
    `DTSTAMP:${calendarStamp(new Date())}`,
    `DTSTART:${calendarStamp(opts.startsAt)}`,
    `DTEND:${calendarStamp(opts.endsAt)}`,
    `SUMMARY:${icsText(title)}`,
    `DESCRIPTION:${icsText(description)}`,
    `LOCATION:${icsText(opts.meetingUrl ?? "Online")}`,
    "STATUS:CONFIRMED",
    "END:VEVENT",
    "END:VCALENDAR",
    "",
  ].join("\r\n");
}

