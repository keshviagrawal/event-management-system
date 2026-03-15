import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Layout from "../components/Layout";
import api from "../services/api";

export default function TicketView() {
  const { ticketId } = useParams();
  const [ticket, setTicket] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchTicket(); }, []);

  const fetchTicket = async () => {
    try {
      const res = await api.get(`/events/tickets/${ticketId}`);
      setTicket(res.data);
    } catch (err) {
      console.error("Failed to fetch ticket");
      setError(err.response?.data?.message || "Failed to load ticket");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "numeric", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit"
    });
  };

  if (loading) return <Layout><p>Loading ticket...</p></Layout>;
  if (error) return <Layout><p className="error-text">{error}</p></Layout>;
  if (!ticket) return <Layout><p>Ticket not found</p></Layout>;

  return (
    <Layout>
      <div className="ticket-card">
        <div className="ticket-header">
          <h2 style={{ margin: 0, fontSize: "1.25rem" }}>🎫 {ticket.eventId?.eventName}</h2>
        </div>
        <div className="ticket-body">
          <p><strong>Ticket ID:</strong> <code style={{ fontSize: "0.85rem", background: "var(--gray-100)", padding: "2px 6px", borderRadius: 4 }}>{ticket.ticketId}</code></p>
          <p><strong>Status:</strong>{" "}
            <span className={ticket.status === "CANCELLED" ? "badge badge-danger" : "badge badge-success"}>
              {ticket.status}
            </span>
          </p>
          <p><strong>Event Date:</strong> {formatDate(ticket.eventId?.eventStartDate)}</p>
        </div>
        {ticket.qrCode && (
          <div className="ticket-qr">
            <img src={ticket.qrCode} alt="QR Code" style={{ width: 180 }} />
            <p style={{ color: "var(--text-muted)", fontSize: "0.82rem", marginTop: 8 }}>Show this QR code at the venue</p>
          </div>
        )}
      </div>
    </Layout>
  );
}