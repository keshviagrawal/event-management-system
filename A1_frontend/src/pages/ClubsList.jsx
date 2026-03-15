import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import api from "../services/api";

const ClubsList = () => {
    const [organizers, setOrganizers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => { fetchOrganizers(); }, []);

    const fetchOrganizers = async () => {
        try {
            const res = await api.get("/participants/organizers");
            setOrganizers(res.data);
        } catch (err) {
            console.error("Failed to fetch organizers:", err);
            setError("Failed to load organizers");
        } finally {
            setLoading(false);
        }
    };

    const handleFollow = async (id) => {
        try {
            await api.post(`/participants/follow/${id}`);
            fetchOrganizers();
        } catch (err) {
            alert("Failed to follow organizer");
        }
    };

    const handleUnfollow = async (id) => {
        try {
            await api.delete(`/participants/follow/${id}`);
            fetchOrganizers();
        } catch (err) {
            alert("Failed to unfollow organizer");
        }
    };

    if (loading) return <Layout><p>Loading...</p></Layout>;
    if (error) return <Layout><p className="error-text">{error}</p></Layout>;

    return (
        <Layout>
            <div className="page-header">
                <h2 className="page-title">🏛️ Clubs / Organizers</h2>
            </div>

            {organizers.length === 0 ? (
                <p style={{ color: "var(--text-muted)", textAlign: "center", padding: 30 }}>No organizers found.</p>
            ) : (
                <div className="grid-3">
                    {organizers.map((org) => (
                        <div key={org._id} className="card">
                            <h3
                                onClick={() => navigate(`/organizer/${org._id}`)}
                                style={{ cursor: "pointer", color: "var(--primary)", margin: "0 0 8px" }}
                            >
                                {org.organizerName}
                            </h3>
                            {org.category && <span className="badge badge-gray">{org.category}</span>}
                            <p style={{ fontSize: "0.9rem", marginTop: 10, color: "var(--text-secondary)" }}>
                                {org.description || "No description available."}
                            </p>
                            {org.isFollowed ? (
                                <button onClick={() => handleUnfollow(org._id)} className="btn-secondary btn-sm mt">
                                    Unfollow
                                </button>
                            ) : (
                                <button onClick={() => handleFollow(org._id)} className="btn-primary btn-sm mt">
                                    Follow
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </Layout>
    );
};

export default ClubsList;