import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Layout from "../components/Layout";
import api from "../services/api";

const OrganizerDetail = () => {
    const { id } = useParams();
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => { fetchDetails(); }, []);

    const fetchDetails = async () => {
        try {
            const res = await api.get(`/events/organizers/${id}`);
            setData(res.data);
        } catch (err) {
            console.error("Failed to fetch organizer details:", err);
            setError(err.response?.data?.message || "Failed to load organizer details");
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return "";
        return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
    };

    if (loading) return <Layout><p>Loading...</p></Layout>;
    if (error) return <Layout><p className="error-text">{error}</p></Layout>;
    if (!data) return <Layout><p>No data found</p></Layout>;

    return (
        <Layout>
            <div style={{ maxWidth: 740, margin: "0 auto" }}>
                <h2 className="page-title">{data.Organizer.organizerName}</h2>
                <span className="badge badge-gray mb-sm">{data.Organizer.category}</span>
                <p style={{ color: "var(--text-secondary)", marginTop: 10, lineHeight: 1.6 }}>{data.Organizer.description}</p>
                {data.Organizer.contactEmail && (
                    <p style={{ marginTop: 6, color: "var(--text)" }}><strong>Email:</strong> {data.Organizer.contactEmail}</p>
                )}

                <hr />

                <h3 className="mb-sm">📅 Upcoming Events</h3>
                {data.Upcoming.length === 0 ? (
                    <p style={{ color: "var(--text-muted)" }}>No upcoming events</p>
                ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
                        {data.Upcoming.map((event) => (
                            <div key={event._id} className="card" style={{ borderLeft: "4px solid var(--primary)" }}>
                                <h4 style={{ margin: 0 }}>{event.eventName}</h4>
                                <p style={{ margin: "4px 0", fontSize: "0.9rem", color: "var(--text-secondary)" }}>
                                    {formatDate(event.eventStartDate)} • <span className="badge badge-info">{event.eventType}</span>
                                </p>
                            </div>
                        ))}
                    </div>
                )}

                <h3 className="mb-sm">📜 Past Events</h3>
                {data.Past.length === 0 ? (
                    <p style={{ color: "var(--text-muted)" }}>No past events</p>
                ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {data.Past.map((event) => (
                            <div key={event._id} className="card" style={{ opacity: 0.7 }}>
                                <h4 style={{ margin: 0 }}>{event.eventName}</h4>
                                <p style={{ margin: "4px 0", fontSize: "0.9rem", color: "var(--text-secondary)" }}>
                                    {formatDate(event.eventStartDate)} • <span className="badge badge-gray">{event.eventType}</span>
                                </p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default OrganizerDetail;