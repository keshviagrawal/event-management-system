import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import api from "../services/api";
import { useNavigate } from "react-router-dom";

export default function BrowseEvents() {
  const navigate = useNavigate();

  const [events, setEvents] = useState([]);
  const [trending, setTrending] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [type, setType] = useState("");
  const [eligibility, setEligibility] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [showFollowedOnly, setShowFollowedOnly] = useState(false);
  const [followedIds, setFollowedIds] = useState([]);

  useEffect(() => {
    const fetchFollowed = async () => {
      try {
        const res = await api.get("/participants/profile");
        setFollowedIds((res.data.followedOrganizers || []).map(id => typeof id === 'object' ? id._id : id));
      } catch (err) {
        console.error("Failed to fetch profile for followed clubs");
      }
    };
    fetchFollowed();
  }, []);

  useEffect(() => {
    fetchEvents();
    fetchTrending();
  }, [search, type, eligibility, startDate, endDate]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const res = await api.get("/events", { params: { search, type, eligibility, startDate, endDate } });
      setEvents(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Failed to fetch events");
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchTrending = async () => {
    try {
      const params = {};
      if (type) params.type = type;
      const res = await api.get("/events/trending", { params });
      setTrending(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Failed to fetch trending events");
      setTrending([]);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  };

  const getTypeBadge = (t) => t === "MERCHANDISE" ? "badge badge-warning" : "badge badge-info";

  return (
    <Layout>
      <div className="page-header">
        <h2 className="page-title">Browse Events</h2>
      </div>

      {/* ===== FILTERS ===== */}
      <div className="filters-bar">
        <input
          type="text"
          placeholder="Search events..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: 200 }}
        />
        <select value={type} onChange={(e) => setType(e.target.value)}>
          <option value="">All Types</option>
          <option value="NORMAL">Normal</option>
          <option value="MERCHANDISE">Merchandise</option>
        </select>
        <select value={eligibility} onChange={(e) => setEligibility(e.target.value)}>
          <option value="">All Eligibility</option>
          <option value="ALL">Open to All</option>
          <option value="IIIT">IIIT Only</option>
          <option value="NON-IIIT">Non-IIIT Only</option>
        </select>
        <label>
          From: <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={{ width: "auto" }} />
        </label>
        <label>
          To: <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={{ width: "auto" }} />
        </label>
        <label>
          <input type="checkbox" checked={showFollowedOnly} onChange={(e) => setShowFollowedOnly(e.target.checked)} />
          Followed Only
        </label>
      </div>

      {/* ===== TRENDING ===== */}
      {trending.length > 0 && (
        <>
          <h3 className="mb-sm" style={{ marginTop: 24 }}>Trending</h3>
          <div className="carousel-row mb-lg">
            {trending.map((event) => (
              <div
                key={event._id}
                className="card card-clickable"
                style={{ minWidth: 240, borderTop: "3px solid var(--warning)" }}
                onClick={() => navigate(`/events/${event._id}`)}
              >
                <span className="badge badge-warning mb-sm">TRENDING</span>
                <h4 style={{ margin: "4px 0" }}>{event.eventName}</h4>
                <p style={{ fontSize: "0.85rem", margin: "2px 0" }}>{event.organizerId?.organizerName || "Unknown"}</p>
                <p style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>{formatDate(event.eventStartDate)}</p>
              </div>
            ))}
          </div>
        </>
      )}

      <hr />

      {/* ===== ALL EVENTS ===== */}
      <h3 className="mb">All Events</h3>

      {loading ? (
        <p>Loading events...</p>
      ) : (() => {
        const displayedEvents = showFollowedOnly
          ? events.filter(e => followedIds.includes(e.organizerId?._id))
          : events;
        return displayedEvents.length === 0 ? (
          <p style={{ color: "var(--text-muted)", textAlign: "center", padding: 30 }}>No events found matching your filters.</p>
        ) : (
          <div className="grid-2">
            {displayedEvents.map((event) => (
              <div
                key={event._id}
                className="card card-clickable"
                onClick={() => navigate(`/events/${event._id}`)}
              >
                <div className="flex gap-sm flex-wrap mb-sm">
                  <span className={getTypeBadge(event.eventType)}>{event.eventType}</span>
                  <span className="badge badge-success">{event.eligibility}</span>
                  {event.registrationFee > 0 && <span className="badge badge-purple">₹{event.registrationFee}</span>}
                  {event.registrationFee === 0 && event.eventType === "NORMAL" && <span className="badge badge-success">FREE</span>}
                </div>

                <h4 style={{ margin: "0 0 6px" }}>{event.eventName}</h4>
                <p style={{ fontSize: "0.9rem", margin: "0 0 10px", lineHeight: 1.5 }}>
                  {event.description?.length > 100 ? event.description.slice(0, 100) + "..." : event.description}
                </p>

                <div style={{ marginTop: "auto", paddingTop: 10, borderTop: "1px solid var(--border)" }}>
                  <p style={{ margin: "3px 0", fontSize: "0.85rem", color: "var(--text)" }}>
                    <strong>Organizer:</strong> {event.organizerId?.organizerName || "Unknown"}
                  </p>
                  <p style={{ margin: "3px 0", fontSize: "0.85rem", color: "var(--text)" }}>
                    <strong>Date:</strong> {formatDate(event.eventStartDate)}
                  </p>
                  <p style={{ margin: "3px 0", fontSize: "0.85rem", color: "var(--text)" }}>
                    <strong>Deadline:</strong> {formatDate(event.registrationDeadline)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        );
      })()}
    </Layout>
  );
}
