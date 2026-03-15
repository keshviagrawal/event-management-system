import { useState, useEffect } from "react";
import Layout from "../components/Layout";
import { getOrganizerProfile, updateOrganizerProfile } from "../services/organizerService";
import api from "../services/api";

export default function OrganizerProfile() {
    const [profile, setProfile] = useState({
        organizerName: "", category: "", description: "",
        contactEmail: "", contactNumber: "", discordWebhook: "",
    });
    const [loading, setLoading] = useState(true);
    const [loginEmail, setLoginEmail] = useState("");
    const [showResetForm, setShowResetForm] = useState(false);
    const [resetReason, setResetReason] = useState("");
    const [resetRequests, setResetRequests] = useState([]);
    const [resetLoading, setResetLoading] = useState(false);

    useEffect(() => { fetchProfile(); fetchResetRequests(); }, []);

    const fetchProfile = async () => {
        try {
            const data = await getOrganizerProfile();
            setProfile({
                organizerName: data.organizerName || "", category: data.category || "",
                description: data.description || "", contactEmail: data.contactEmail || "",
                contactNumber: data.contactNumber || "", discordWebhook: data.discordWebhook || "",
            });
            setLoginEmail(data.userId?.email || "");
        } catch (err) { console.error("Failed to fetch profile", err); }
        finally { setLoading(false); }
    };

    const fetchResetRequests = async () => {
        try { const res = await api.get("/organizer/reset-requests"); setResetRequests(res.data); }
        catch (err) { console.error("Failed to fetch reset requests"); }
    };

    const handleSubmitReset = async () => {
        if (!resetReason.trim()) return alert("Please provide a reason");
        setResetLoading(true);
        try {
            await api.post("/organizer/reset-request", { reason: resetReason.trim() });
            alert("Password reset request submitted successfully!");
            setResetReason(""); setShowResetForm(false); fetchResetRequests();
        } catch (err) { alert(err.response?.data?.message || "Failed to submit request"); }
        finally { setResetLoading(false); }
    };

    const handleChange = (e) => setProfile({ ...profile, [e.target.name]: e.target.value });

    const handleUpdate = async () => {
        try { await updateOrganizerProfile(profile); alert("Profile updated successfully!"); }
        catch (err) { alert("Failed to update profile: " + (err.response?.data?.message || err.message)); }
    };

    const getResetBadge = (status) => {
        const map = { PENDING: "badge badge-warning", APPROVED: "badge badge-success", REJECTED: "badge badge-danger" };
        return map[status] || "badge badge-gray";
    };

    const hasPending = resetRequests.some(r => r.status === "PENDING");
    if (loading) return <Layout><p>Loading...</p></Layout>;

    return (
        <Layout>
            <div style={{ maxWidth: 640, margin: "0 auto" }}>
                <h2 className="page-title">Organizer Profile</h2>

                <div className="info-box mb">
                    <p><strong>Login Email:</strong> {loginEmail}</p>
                </div>

                <div className="card mb-lg">
                    <h3 style={{ marginBottom: 16 }}>Organisation Details</h3>
                    <div className="form-group">
                        <label>Organizer Name</label>
                        <input name="organizerName" value={profile.organizerName} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                        <label>Category</label>
                        <input name="category" placeholder="e.g. Tech Club, Music Society" value={profile.category} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                        <label>Description</label>
                        <textarea name="description" value={profile.description} onChange={handleChange} />
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Contact Email</label>
                            <input name="contactEmail" value={profile.contactEmail} onChange={handleChange} />
                        </div>
                        <div className="form-group">
                            <label>Contact Number</label>
                            <input name="contactNumber" value={profile.contactNumber} onChange={handleChange} />
                        </div>
                    </div>

                    <hr />
                    <h4 className="mb-sm">Integrations</h4>
                    <div className="form-group">
                        <label>Discord Webhook URL</label>
                        <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", margin: "0 0 6px" }}>
                            Auto-post new events to your Discord server when Published.
                        </p>
                        <input name="discordWebhook" placeholder="https://discord.com/api/webhooks/..." value={profile.discordWebhook} onChange={handleChange} />
                    </div>
                    <button onClick={handleUpdate} className="btn-primary mt-sm">Save Changes</button>
                </div>

                {/* Password Reset */}
                <div className="card">
                    <div className="flex justify-between items-center">
                        <h3 style={{ margin: 0 }}>🔒 Password Reset</h3>
                        {!hasPending && (
                            <button onClick={() => setShowResetForm(!showResetForm)}
                                className={showResetForm ? "btn-secondary btn-sm" : "btn-danger btn-sm"}>
                                {showResetForm ? "Cancel" : "Request Reset"}
                            </button>
                        )}
                        {hasPending && <span className="badge badge-warning">Request Pending</span>}
                    </div>

                    {showResetForm && (
                        <div style={{ marginTop: 16 }}>
                            <div className="form-group">
                                <textarea placeholder="Reason for password reset (e.g., forgot password, account compromised)..."
                                    value={resetReason} onChange={(e) => setResetReason(e.target.value)} />
                            </div>
                            <button onClick={handleSubmitReset} disabled={resetLoading} className="btn-danger">
                                {resetLoading ? "Submitting..." : "Submit Request"}
                            </button>
                        </div>
                    )}

                    {resetRequests.length > 0 && (
                        <div style={{ marginTop: 16 }}>
                            <h4 className="mb-sm">Request History</h4>
                            <div className="table-container">
                                <table>
                                    <thead><tr><th>Date</th><th>Reason</th><th>Status</th><th>Admin Comment</th></tr></thead>
                                    <tbody>
                                        {resetRequests.map(req => (
                                            <tr key={req._id}>
                                                <td>{new Date(req.createdAt).toLocaleDateString()}</td>
                                                <td>{req.reason}</td>
                                                <td><span className={getResetBadge(req.status)}>{req.status}</span></td>
                                                <td>{req.adminComment || "—"}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
}
