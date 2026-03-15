import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import { getOrganizerDashboard } from "../services/organizerService";

export default function OrganizerDashboard() {
  const [events, setEvents] = useState([]);
  const [stats, setStats] = useState({ totalEvents: 0, totalRegistrations: 0, totalRevenue: 0 });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => { fetchDashboard(); }, []);

  const fetchDashboard = async () => {
    try {
      const data = await getOrganizerDashboard();
      if (data.events && Array.isArray(data.events)) {
        setEvents(data.events);
        setStats(data.summary || { totalEvents: 0, totalRegistrations: 0, totalRevenue: 0 });
      } else if (Array.isArray(data)) {
        setEvents(data);
      } else {
        setEvents([]);
      }
    } catch (err) {
      console.error("Failed to fetch dashboard");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const map = {
      DRAFT: "badge badge-gray",
      PUBLISHED: "badge badge-info",
      ONGOING: "badge badge-success",
      COMPLETED: "badge badge-purple",
      CLOSED: "badge badge-danger",
    };
    return map[status] || "badge badge-gray";
  };

  if (loading) return <Layout><p>Loading...</p></Layout>;

  return (
    <Layout>
      <div className="page-header">
        <h2 className="page-title">Organizer Dashboard</h2>
        <button onClick={() => navigate("/organizer/create")} className="btn-primary">+ Create New Event</button>
      </div>

      {/* Stats */}
      <div className="stats-row">
        <div className="stat-card">
          <h4>Total Events</h4>
          <p className="stat-number">{stats.totalEvents}</p>
        </div>
        <div className="stat-card">
          <h4>Registrations</h4>
          <p className="stat-number">{stats.totalRegistrations}</p>
        </div>
        <div className="stat-card">
          <h4>Total Revenue</h4>
          <p className="stat-number">₹{stats.totalRevenue}</p>
        </div>
      </div>

      {/* Events carousel */}
      <h3 className="mb-sm">My Events</h3>

      {events.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: 30 }}>
          <p style={{ color: "var(--text-muted)" }}>No events created yet. Get started by creating one!</p>
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
                  Status: <span className={getStatusBadge(event.status)}>{event.status}</span>
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