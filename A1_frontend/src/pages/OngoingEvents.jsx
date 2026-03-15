import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import { getOrganizerDashboard } from "../services/organizerService";

export default function OngoingEvents() {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => { fetchOngoingEvents(); }, []);

    const fetchOngoingEvents = async () => {
        try {
            const data = await getOrganizerDashboard();
            let allEvents = [];
            if (data.events && Array.isArray(data.events)) {
                allEvents = data.events;
            } else if (Array.isArray(data)) {
                allEvents = data;
            }
            setEvents(allEvents.filter((e) => e.status === "ONGOING"));
        } catch (err) {
            console.error("Failed to fetch ongoing events");
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <Layout><p>Loading...</p></Layout>;

    return (
        <Layout>
            <div className="page-header">
                <h2 className="page-title">Ongoing Events</h2>
            </div>

            {events.length === 0 ? (
                <div className="card" style={{ textAlign: "center", padding: 30 }}>
                    <p style={{ color: "var(--text-muted)" }}>No ongoing events at the moment.</p>
                </div>
            ) : (
                <div className="carousel-row">
                    {events.map((event) => (
                        <div className="card" key={event.eventId} style={{ minWidth: 280, maxWidth: 280, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                            <div>
                                <h4 style={{ marginTop: 0, marginBottom: 8 }}>{event.eventName}</h4>
                                <p style={{ margin: "4px 0", color: "var(--text)" }}>
                                    Type: <span className={event.eventType === "MERCHANDISE" ? "badge badge-warning" : "badge badge-info"}>{event.eventType}</span>
                                </p>
                                <p style={{ margin: "4px 0", color: "var(--text)" }}>
                                    Status: <span className="badge badge-success">{event.status}</span>
                                </p>
                                <p style={{ margin: "4px 0", color: "var(--text)" }}>Registrations: <strong>{event.registrationCount}</strong></p>
                                <p style={{ margin: "4px 0", color: "var(--text)" }}>Revenue: <strong>₹{event.revenue}</strong></p>
                            </div>
                            <button onClick={() => navigate(`/organizer/event/${event.eventId}`)} className="btn-primary btn-sm mt" style={{ width: "100%" }}>
                                Manage Event
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </Layout>
    );
}
