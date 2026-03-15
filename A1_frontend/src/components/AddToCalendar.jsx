/**
 * AddToCalendar – export event to .ics / Google Calendar / Outlook
 */
export default function AddToCalendar({ event }) {
    if (!event || !event.eventStartDate) return null;

    const pad = (n) => String(n).padStart(2, "0");
    const toICS = (dateStr) => {
        const d = new Date(dateStr);
        return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;
    };
    const toGCal = (dateStr) => toICS(dateStr);

    const startDate = toICS(event.eventStartDate);
    const endDt = event.eventEndDate || new Date(new Date(event.eventStartDate).getTime() + 2 * 60 * 60 * 1000);
    const endDate = toICS(endDt);
    const title = event.eventName || "Event";
    const description = (event.description || "").replace(/\n/g, "\\n").slice(0, 500);
    const location = event.venue || "";

    const handleDownloadICS = () => {
        const icsContent = [
            "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Felicity//Event//EN",
            "CALSCALE:GREGORIAN", "METHOD:PUBLISH", "BEGIN:VEVENT",
            `DTSTART:${startDate}`, `DTEND:${endDate}`, `SUMMARY:${title}`,
            `DESCRIPTION:${description}`, location ? `LOCATION:${location}` : "",
            "STATUS:CONFIRMED", "END:VEVENT", "END:VCALENDAR",
        ].filter(Boolean).join("\r\n");

        const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${title.replace(/[^a-zA-Z0-9]/g, "_")}.ics`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const googleCalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${toGCal(event.eventStartDate)}/${toGCal(endDt)}&details=${encodeURIComponent(event.description || "")}&location=${encodeURIComponent(location)}`;
    const outlookUrl = `https://outlook.live.com/calendar/0/action/compose?subject=${encodeURIComponent(title)}&startdt=${new Date(event.eventStartDate).toISOString()}&enddt=${(event.eventEndDate ? new Date(event.eventEndDate) : new Date(new Date(event.eventStartDate).getTime() + 2 * 60 * 60 * 1000)).toISOString()}&body=${encodeURIComponent(event.description || "")}&location=${encodeURIComponent(location)}`;

    return (
        <div className="calendar-bar">
            <span style={{ fontWeight: 600, fontSize: "0.9rem", marginRight: 6 }}>🗓️ Add to Calendar:</span>
            <button onClick={handleDownloadICS} className="btn-secondary btn-sm">📥 .ics File</button>
            <a href={googleCalUrl} target="_blank" rel="noopener noreferrer" className="btn-primary btn-sm" style={{ textDecoration: "none" }}>
                Google
            </a>
            <a href={outlookUrl} target="_blank" rel="noopener noreferrer" className="btn-sm" style={{ textDecoration: "none", background: "#0078d4", color: "#fff", padding: "4px 12px", borderRadius: 6, fontWeight: 600, fontSize: "0.85rem" }}>
                📧 Outlook
            </a>
        </div>
    );
}
