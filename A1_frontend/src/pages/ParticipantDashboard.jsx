import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Layout from "../components/Layout";
import { getMyRegistrations, cancelRegistration } from "../services/eventService";

export default function ParticipantDashboard() {
  const [registrations, setRegistrations] = useState([]);
  const [activeTab, setActiveTab] = useState("NORMAL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => { fetchRegistrations(); }, []);

  const fetchRegistrations = async () => {
    try {
      const data = await getMyRegistrations();
      setRegistrations(data);
    } catch (err) {
      console.error("Failed to fetch registrations");
      setError("Failed to load registrations");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (eventId) => {
    try {
      await cancelRegistration(eventId);
      alert("Registration cancelled!");
      fetchRegistrations();
    } catch (err) {
      alert("Failed to cancel registration");
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "numeric", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit"
    });
  };

  const upcomingEvents = registrations.filter(
    (reg) =>
      (reg.status === "REGISTERED" || reg.status === "PURCHASED") &&
      new Date(reg.eventId?.eventStartDate) > new Date()
  );

  const filteredRegistrations = registrations.filter((reg) => {
    if (activeTab === "NORMAL") return reg.eventId?.eventType === "NORMAL";
    if (activeTab === "MERCHANDISE") return reg.eventId?.eventType === "MERCHANDISE";
    if (activeTab === "COMPLETED") return reg.status === "COMPLETED" || reg.status === "ATTENDED";
    if (activeTab === "CANCELLED") return reg.status === "CANCELLED";
    return true;
  });

  if (loading) return <Layout><p>Loading...</p></Layout>;
  if (error) return <Layout><p className="error-text">{error}</p></Layout>;

  return (
    <Layout>
      <div className="page-header">
        <h2 className="page-title">Dashboard</h2>
      </div>

      {/* ===== Upcoming Events ===== */}
      <h3 className="mb">📅 Upcoming Events</h3>

      {upcomingEvents.length === 0 ? (
        <div className="card mb-lg" style={{ textAlign: "center", padding: 30 }}>
          <p style={{ color: "var(--text-muted)" }}>No upcoming events. <Link to="/browse">Browse events</Link> to register!</p>
        </div>
      ) : (
        <div className="grid-2 mb-lg">
          {upcomingEvents.map((reg) => (
            <div className="card" key={reg._id} style={{ borderLeft: "4px solid var(--primary)" }}>
              <h4 style={{ margin: "0 0 10px" }}>{reg.eventId?.eventName}</h4>
              <p style={{ margin: "4px 0", color: "var(--text)" }}><strong>Organizer:</strong> {reg.eventId?.organizerId?.organizerName || "N/A"}</p>
              <p style={{ margin: "4px 0", color: "var(--text)" }}><strong>Date:</strong> {formatDate(reg.eventId?.eventStartDate)}</p>
              <p style={{ margin: "4px 0" }}>
                <strong>Type:</strong>{" "}
                <span className={reg.eventId?.eventType === "MERCHANDISE" ? "badge badge-warning" : "badge badge-info"}>
                  {reg.eventId?.eventType}
                </span>
              </p>
              <p style={{ margin: "4px 0", color: "var(--text)" }}>
                <strong>Ticket:</strong>{" "}
                <Link to={`/ticket/${reg.ticketId}`}>{reg.ticketId}</Link>
              </p>
            </div>
          ))}
        </div>
      )}

      <hr />

      {/* ===== Participation History ===== */}
      <h3 className="mb">📋 Participation History</h3>

      <div className="tabs">
        {["NORMAL", "MERCHANDISE", "COMPLETED", "CANCELLED"].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`tab ${activeTab === tab ? "active" : ""}`}
          >
            {tab.charAt(0) + tab.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {filteredRegistrations.length === 0 ? (
        <p style={{ color: "var(--text-muted)", textAlign: "center", padding: 30 }}>No records found</p>
      ) : (
        <div className="grid-2">
          {filteredRegistrations.map((reg) => (
            <div className="card" key={reg._id}>
              <h4 style={{ margin: "0 0 10px" }}>{reg.eventId?.eventName}</h4>
              <p style={{ margin: "4px 0" }}>
                <strong>Type:</strong>{" "}
                <span className={reg.eventId?.eventType === "MERCHANDISE" ? "badge badge-warning" : "badge badge-info"}>
                  {reg.eventId?.eventType}
                </span>
              </p>
              <p style={{ margin: "4px 0", color: "var(--text)" }}><strong>Organizer:</strong> {reg.eventId?.organizerId?.organizerName || "N/A"}</p>
              <p style={{ margin: "4px 0", color: "var(--text)" }}><strong>Date:</strong> {formatDate(reg.eventId?.eventStartDate)}</p>
              <p style={{ margin: "4px 0" }}>
                <strong>Status:</strong>{" "}
                <span className={
                  reg.status === "CANCELLED" ? "badge badge-danger" :
                    reg.status === "ATTENDED" || reg.status === "COMPLETED" ? "badge badge-success" :
                      "badge badge-primary"
                }>
                  {reg.status}
                </span>
              </p>

              {reg.merchandisePurchase && reg.merchandisePurchase.size && (
                <div className="info-box mt-sm">
                  <p style={{ margin: 2 }}>Size: {reg.merchandisePurchase.size} | Color: {reg.merchandisePurchase.color}</p>
                  <p style={{ margin: 2 }}>Qty: {reg.merchandisePurchase.quantity} | Total: ₹{reg.merchandisePurchase.totalAmount}</p>
                </div>
              )}

              <p style={{ margin: "4px 0", color: "var(--text)" }}>
                <strong>Ticket:</strong>{" "}
                <Link to={`/ticket/${reg.ticketId}`}>{reg.ticketId}</Link>
              </p>

              {reg.status !== "CANCELLED" &&
                reg.status !== "COMPLETED" &&
                reg.status !== "ATTENDED" &&
                reg.eventId?.eventType !== "MERCHANDISE" && (
                  <button onClick={() => handleCancel(reg.eventId?._id)} className="btn-danger btn-sm mt-sm">
                    Cancel Registration
                  </button>
                )}
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
}