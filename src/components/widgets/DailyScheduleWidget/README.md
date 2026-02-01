# Daily Schedule Widget

Shows your upcoming meetings from an iCalendar (`.ics`) URL.

## Settings

- **ICS URL**: URL to a `.ics` file (publicly accessible).
- **Days ahead**: number of days into the future to include (including today).
- **Refresh interval**: how often to re-fetch the file.
- **Show location/description**: display additional event details if present.

## Display

- Groups events by day (date header at top).
- Lists meetings in chronological order.
- Visually distinguishes:
  - **Past** meetings (muted)
  - **Ongoing** meetings (highlighted)
  - **Upcoming** meetings

## Notes

- The widget fetches the ICS file through a CORS proxy (same approach as RSS widget).
- Basic `.ics` parsing is implemented in-browser (VEVENT + DTSTART/DTEND). Timezones with `TZID=` are treated as local time.
