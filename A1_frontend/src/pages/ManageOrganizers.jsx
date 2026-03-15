import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import Layout from "../components/Layout";
import api from "../services/api";

export default function ManageOrganizers() {
    const [searchParams] = useSearchParams();
    const [organizers, setOrganizers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [activeTab, setActiveTab] = useState(searchParams.get("tab") === "resets" ? "resets" : "organizers");
    const [newOrg, setNewOrg] = useState({ organizerName: "", email: "", category: "", description: "", contactEmail: "" });
    const [createdCredentials, setCreatedCredentials] = useState(null);
    const [isCreating, setIsCreating] = useState(false);
    const [resetRequests, setResetRequests] = useState([]);
    const [resetFilter, setResetFilter] = useState("ALL");
    const [rejectModal, setRejectModal] = useState(null);
    const [rejectComment, setRejectComment] = useState("");

    useEffect(() => { fetchOrganizers(); fetchResetRequests(); }, []);
    useEffect(() => { setActiveTab(searchParams.get("tab") === "resets" ? "resets" : "organizers"); }, [searchParams]);
    useEffect(() => { if (activeTab === "resets") fetchResetRequests(); }, [activeTab, resetFilter]);

    const fetchOrganizers = async () => {
        try { const response = await api.get("/admin/organizers"); setOrganizers(response.data); }
        catch (err) { alert("Failed to fetch organizers"); }
        finally { setLoading(false); }
    };

    const fetchResetRequests = async () => {
        try {
            const params = resetFilter !== "ALL" ? `?status=${resetFilter}` : "";
            const response = await api.get(`/admin/reset-requests${params}`);
            setResetRequests(response.data);
        } catch (err) { console.error("Failed to fetch reset requests"); }
    };

    const handleCreate = async () => {
        if (isCreating) return;
        setIsCreating(true);
        try {
            const response = await api.post("/admin/organizers", newOrg);
            setCreatedCredentials(response.data); setShowModal(false); fetchOrganizers();
        } catch (err) { alert("Failed to create organizer: " + (err.response?.data?.message || err.message)); }
        finally { setIsCreating(false); }
    };

    const handleDisable = async (id, currentStatus) => {
        if (!window.confirm(`Are you sure you want to ${currentStatus ? 'enable' : 'disable'} this organizer?`)) return;
        try {
            const endpoint = currentStatus ? `/admin/organizers/${id}/enable` : `/admin/organizers/${id}/disable`;
            await api.patch(endpoint);
            fetchOrganizers();
        } catch (err) { alert("Action failed"); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure? This will delete the account and profile PERMANENTLY.")) return;
        try {
            await api.delete(`/admin/organizers/${id}`);
            alert("Organizer deleted successfully");
            setOrganizers(organizers.filter(o => o._id !== id));
        }
        catch (err) { alert("Delete failed"); }
    };

    const handleResetPassword = async (id) => {
        if (!window.confirm("This will generate a NEW password and email it to the Contact Email.")) return;
        try { await api.patch(`/admin/reset-password/${id}`); alert("Password reset successfully! New credentials sent to organizer's email."); }
        catch (err) { alert("Failed to reset password: " + (err.response?.data?.message || err.message)); }
    };

    const handleApproveReset = async (requestId) => {
        if (!window.confirm("Approve this reset? A new password will be generated and emailed to the organizer.")) return;
        try { const res = await api.patch(`/admin/reset-requests/${requestId}/approve`); alert(`Approved! New password: ${res.data.newPassword}`); fetchResetRequests(); }
        catch (err) { alert("Failed to approve: " + (err.response?.data?.message || err.message)); }
    };

    const handleRejectReset = async () => {
        if (!rejectModal) return;
        try {
            await api.patch(`/admin/reset-requests/${rejectModal.requestId}/reject`, { comment: rejectComment });
            setRejectModal(null); setRejectComment(""); fetchResetRequests();
        } catch (err) { alert("Failed to reject: " + (err.response?.data?.message || err.message)); }
    };

    const getStatusBadge = (status) => {
        const map = { PENDING: "badge badge-warning", APPROVED: "badge badge-success", REJECTED: "badge badge-danger" };
        return map[status] || "badge badge-gray";
    };

    const pendingCount = resetRequests.filter(r => r.status === "PENDING").length;

    return (
        <Layout>
            <div style={{ maxWidth: 1000, margin: "0 auto" }}>

                {/* Page Header */}
                <div className="page-header">
                    <h2 className="page-title">Manage Organizers</h2>
                    <button onClick={() => setShowModal(true)} className="btn btn-primary">+ Add New Organizer</button>
                </div>

                {/* Credentials banner after creation */}
                {createdCredentials && (
                    <div className="card mb" style={{ background: "var(--success-bg)", border: "1px solid var(--success)" }}>
                        <h4 style={{ marginBottom: 8 }}>Organizer Created Successfully</h4>
                        <p style={{ marginBottom: 4 }}>Share these login credentials with the organizer:</p>
                        <p style={{ marginBottom: 2 }}><strong>Email:</strong> {createdCredentials.email}</p>
                        <p style={{ marginBottom: 12 }}><strong>Password:</strong> {createdCredentials.password}</p>
                        <button onClick={() => setCreatedCredentials(null)} className="btn btn-secondary btn-sm">Dismiss</button>
                    </div>
                )}

                {/* Tabs */}
                <div className="tabs">
                    <button
                        onClick={() => setActiveTab("organizers")}
                        className={`tab ${activeTab === "organizers" ? "active" : ""}`}
                    >
                        Organizers ({organizers.length})
                    </button>
                    <button
                        onClick={() => setActiveTab("resets")}
                        className={`tab ${activeTab === "resets" ? "active" : ""}`}
                    >
                        Password Reset Requests
                        {pendingCount > 0 && (
                            <span className="badge badge-danger" style={{ marginLeft: 8 }}>{pendingCount}</span>
                        )}
                    </button>
                </div>

                {/* ===== ORGANIZERS TAB ===== */}
                {activeTab === "organizers" && (
                    loading ? <p style={{ color: "var(--text-muted)" }}>Loading organizers...</p> : (
                        organizers.length === 0 ? (
                            <div className="card text-center" style={{ padding: "40px 20px" }}>
                                <p style={{ color: "var(--text-muted)", marginBottom: 16 }}>No organizers found. Add the first one.</p>
                                <button onClick={() => setShowModal(true)} className="btn btn-primary">+ Add Organizer</button>
                            </div>
                        ) : (
                            <div className="table-container">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Name</th>
                                            <th>Login Email</th>
                                            <th>Category</th>
                                            <th>Contact Email</th>
                                            <th>Status</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {organizers.map(org => (
                                            <tr key={org._id}>
                                                <td><strong>{org.organizerName}</strong></td>
                                                <td style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>{org.email}</td>
                                                <td><span className="badge badge-gray">{org.category}</span></td>
                                                <td style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>{org.contactEmail}</td>
                                                <td>
                                                    {org.isDisabled
                                                        ? <span className="badge badge-danger">Disabled</span>
                                                        : <span className="badge badge-success">Active</span>}
                                                </td>
                                                <td>
                                                    <div className="flex gap-sm" style={{ flexWrap: "nowrap" }}>
                                                        <button onClick={() => handleResetPassword(org._id)} className="btn btn-secondary btn-sm">Reset Password</button>
                                                        <button
                                                            onClick={() => handleDisable(org._id, org.isDisabled)}
                                                            className={`btn btn-sm ${org.isDisabled ? "btn-success" : "btn-warning"}`}
                                                        >
                                                            {org.isDisabled ? "Enable" : "Disable"}
                                                        </button>
                                                        <button onClick={() => handleDelete(org._id)} className="btn btn-danger btn-sm">Delete</button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )
                    )
                )}

                {/* ===== RESET REQUESTS TAB ===== */}
                {activeTab === "resets" && (
                    <>
                        <div className="flex justify-between items-center mb">
                            <h3>Password Reset Requests</h3>
                            <select value={resetFilter} onChange={(e) => setResetFilter(e.target.value)} style={{ width: "auto" }}>
                                <option value="ALL">All Status</option>
                                <option value="PENDING">Pending</option>
                                <option value="APPROVED">Approved</option>
                                <option value="REJECTED">Rejected</option>
                            </select>
                        </div>

                        {resetRequests.length === 0 ? (
                            <div className="card text-center" style={{ padding: "40px 20px" }}>
                                <p style={{ color: "var(--text-muted)" }}>
                                    {resetFilter === "ALL" ? "No reset requests found." : `No ${resetFilter.toLowerCase()} requests.`}
                                </p>
                            </div>
                        ) : (
                            <div className="table-container">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Club / Organizer</th>
                                            <th>Date Submitted</th>
                                            <th>Reason</th>
                                            <th>Status</th>
                                            <th>Actions / Comment</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {resetRequests.map(req => (
                                            <tr key={req._id}>
                                                <td><strong>{req.organizerName}</strong></td>
                                                <td style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>
                                                    {new Date(req.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                                                </td>
                                                <td style={{ maxWidth: 200, fontSize: "0.875rem" }}>{req.reason}</td>
                                                <td><span className={getStatusBadge(req.status)}>{req.status}</span></td>
                                                <td>
                                                    {req.status === "PENDING" ? (
                                                        <div className="flex gap-sm">
                                                            <button onClick={() => handleApproveReset(req._id)} className="btn btn-success btn-sm">Approve</button>
                                                            <button onClick={() => setRejectModal({ requestId: req._id })} className="btn btn-danger btn-sm">Reject</button>
                                                        </div>
                                                    ) : (
                                                        <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontStyle: "italic" }}>
                                                            {req.adminComment ? `"${req.adminComment}"` : "—"}
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </>
                )}

                {/* Add Organizer Modal */}
                {showModal && (
                    <div className="modal-overlay">
                        <div className="modal-content">
                            <h3 style={{ marginBottom: 4 }}>Add New Organizer</h3>
                            <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginBottom: 20 }}>
                                Login credentials will be auto-generated. Share them with the organizer after creation.
                            </p>
                            <div className="form-group"><label>Organizer / Club Name</label><input placeholder="e.g. Robotics Club" value={newOrg.organizerName} onChange={e => setNewOrg({ ...newOrg, organizerName: e.target.value })} /></div>
                            <div className="form-group"><label>Login Email</label><input placeholder="Login email address" value={newOrg.email} onChange={e => setNewOrg({ ...newOrg, email: e.target.value })} /></div>
                            <div className="form-row">
                                <div className="form-group"><label>Category</label><input placeholder="e.g. Tech, Music" value={newOrg.category} onChange={e => setNewOrg({ ...newOrg, category: e.target.value })} /></div>
                                <div className="form-group"><label>Contact Email</label><input placeholder="Contact email" value={newOrg.contactEmail} onChange={e => setNewOrg({ ...newOrg, contactEmail: e.target.value })} /></div>
                            </div>
                            <div className="form-group"><label>Description</label><textarea placeholder="Brief description of the club or organizer" value={newOrg.description} onChange={e => setNewOrg({ ...newOrg, description: e.target.value })} /></div>
                            <div className="flex gap-sm justify-end mt">
                                <button onClick={() => setShowModal(false)} className="btn btn-secondary">Cancel</button>
                                <button onClick={handleCreate} disabled={isCreating} className="btn btn-primary">{isCreating ? "Creating..." : "Create Organizer"}</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Reject Modal */}
                {rejectModal && (
                    <div className="modal-overlay">
                        <div className="modal-content">
                            <h3 style={{ marginBottom: 4 }}>Reject Reset Request</h3>
                            <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginBottom: 16 }}>
                                Optionally provide a reason. This will be shown to the organizer.
                            </p>
                            <div className="form-group">
                                <label>Comment (optional)</label>
                                <textarea placeholder="Reason for rejection..." value={rejectComment} onChange={(e) => setRejectComment(e.target.value)} />
                            </div>
                            <div className="flex gap-sm justify-end mt">
                                <button onClick={() => { setRejectModal(null); setRejectComment(""); }} className="btn btn-secondary">Cancel</button>
                                <button onClick={handleRejectReset} className="btn btn-danger">Confirm Reject</button>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </Layout>
    );
}
