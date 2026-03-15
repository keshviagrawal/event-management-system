import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DiscussionForum from "../components/DiscussionForum";
import Layout from "../components/Layout";
import {
    getEventAnalytics, updateEvent, markAttendance, exportParticipantsCSV,
    publishEvent, getMerchOrders, approveMerchOrder, rejectMerchOrder, manualOverrideAttendance,
} from "../services/organizerService";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5001";

// ─── Utility ─────────────────────────────────────────────────────────────────
const toInputDate = (iso) => iso ? iso.slice(0, 10) : "";

// ─── Form Builder helpers ─────────────────────────────────────────────────────
const FIELD_TYPES = ["text", "number", "dropdown", "checkbox", "file"];
const newField = () => ({ id: crypto.randomUUID(), type: "text", label: "", required: false, options: [] });

export default function OrganizerEventDetails() {
    const { eventId } = useParams();
    const navigate = useNavigate();

    // ── Core state ──────────────────────────────────────────────────────────
    const [event, setEvent] = useState(null);
    const [participants, setParticipants] = useState([]);
    const [analytics, setAnalytics] = useState({ totalRegistrations: 0, totalRevenue: 0 });
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("participants");

    // ── Participants / Attendance ────────────────────────────────────────────
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [ticketIdInput, setTicketIdInput] = useState("");
    const [overrideModal, setOverrideModal] = useState(null);
    const [overrideReason, setOverrideReason] = useState("");

    // ── Merchandise orders ───────────────────────────────────────────────────
    const [orders, setOrders] = useState([]);
    const [orderStatusFilter, setOrderStatusFilter] = useState("ALL");
    const [ordersLoading, setOrdersLoading] = useState(false);
    const [previewImage, setPreviewImage] = useState(null);

    // ── Edit tab ─────────────────────────────────────────────────────────────
    const [editForm, setEditForm] = useState(null);      // populated when event loads
    const [editSaving, setEditSaving] = useState(false);

    // ── Form builder tab ─────────────────────────────────────────────────────
    const [formFields, setFormFields] = useState([]);
    const [formSaving, setFormSaving] = useState(false);
    const [formLocked, setFormLocked] = useState(false); // true once registrations exist

    // ── Fetch ────────────────────────────────────────────────────────────────
    useEffect(() => { fetchDetails(); }, [eventId]);
    useEffect(() => {
        if (event?.eventType === "MERCHANDISE" && activeTab === "payments") fetchOrders();
    }, [activeTab, orderStatusFilter]);

    const fetchDetails = async () => {
        try {
            const data = await getEventAnalytics(eventId);
            const ev = data.event;
            setEvent(ev);
            setParticipants(data.participants || []);
            setAnalytics({ totalRegistrations: data.totalRegistrations, totalRevenue: data.totalRevenue });

            // Seed edit form
            setEditForm({
                eventName: ev.eventName || "",
                description: ev.description || "",
                registrationDeadline: toInputDate(ev.registrationDeadline),
                eventStartDate: toInputDate(ev.eventStartDate),
                eventEndDate: toInputDate(ev.eventEndDate),
                registrationLimit: ev.registrationLimit ?? 0,
                registrationFee: ev.registrationFee ?? 0,
                eligibility: ev.eligibility || "ALL",
                tags: (ev.tags || []).join(", "),
            });

            // Seed form builder
            setFormFields(ev.customForm ? ev.customForm.map(f => ({ ...f })) : []);
            setFormLocked((data.totalRegistrations || 0) > 0);
        } catch (err) { console.error("Failed to fetch event details"); }
        finally { setLoading(false); }
    };

    const fetchOrders = async () => {
        setOrdersLoading(true);
        try {
            const data = await getMerchOrders(eventId, orderStatusFilter === "ALL" ? "" : orderStatusFilter);
            setOrders(data);
        } catch (err) { console.error("Failed to fetch orders:", err); }
        finally { setOrdersLoading(false); }
    };

    // ── Status change ────────────────────────────────────────────────────────
    const handleStatusChange = async (newStatus) => {
        if (!window.confirm(`Change status to ${newStatus}?`)) return;
        try {
            if (newStatus === "PUBLISHED" && event.status === "DRAFT") await publishEvent(eventId);
            else await updateEvent(eventId, { status: newStatus });
            alert(`Event status updated to ${newStatus}`);
            fetchDetails();
        } catch (err) { alert("Failed to update status: " + (err.response?.data?.message || err.message)); }
    };

    // ── Save edits ───────────────────────────────────────────────────────────
    const handleSaveEdit = async () => {
        setEditSaving(true);
        try {
            const payload = { ...editForm };
            // Convert tags string → array
            payload.tags = editForm.tags.split(",").map(t => t.trim()).filter(Boolean);
            // Convert dates
            if (editForm.registrationDeadline) payload.registrationDeadline = new Date(editForm.registrationDeadline).toISOString();
            if (editForm.eventStartDate) payload.eventStartDate = new Date(editForm.eventStartDate).toISOString();
            if (editForm.eventEndDate) payload.eventEndDate = new Date(editForm.eventEndDate).toISOString();
            payload.registrationLimit = Number(editForm.registrationLimit);
            payload.registrationFee = Number(editForm.registrationFee);

            await updateEvent(eventId, payload);
            alert("Event updated successfully!");
            fetchDetails();
        } catch (err) { alert("Failed to save: " + (err.response?.data?.message || err.message)); }
        finally { setEditSaving(false); }
    };

    // ── Form builder actions ─────────────────────────────────────────────────
    const addField = () => setFormFields(prev => [...prev, newField()]);

    const removeField = (id) => setFormFields(prev => prev.filter(f => f.id !== id));

    const updateField = (id, changes) =>
        setFormFields(prev => prev.map(f => f.id === id ? { ...f, ...changes } : f));

    const moveField = (idx, dir) => {
        const arr = [...formFields];
        const swap = idx + dir;
        if (swap < 0 || swap >= arr.length) return;
        [arr[idx], arr[swap]] = [arr[swap], arr[idx]];
        setFormFields(arr);
    };

    const handleSaveForm = async () => {
        setFormSaving(true);
        try {
            await updateEvent(eventId, { customForm: formFields });
            alert("Form saved successfully!");
            fetchDetails();
        } catch (err) { alert("Failed to save form: " + (err.response?.data?.message || err.message)); }
        finally { setFormSaving(false); }
    };

    // ── Attendance ───────────────────────────────────────────────────────────
    const handleMarkAttendance = async () => {
        if (!ticketIdInput) return;
        try { await markAttendance(ticketIdInput); alert("Attendance Marked!"); setTicketIdInput(""); fetchDetails(); }
        catch (err) { alert(err.response?.data?.message || "Failed"); }
    };

    const handleManualOverride = async () => {
        if (!overrideModal || !overrideReason.trim()) { alert("Reason is required"); return; }
        try {
            await manualOverrideAttendance(eventId, overrideModal.registrationId, overrideModal.action, overrideReason.trim());
            setOverrideModal(null); setOverrideReason(""); fetchDetails();
        } catch (err) { alert("Override failed: " + (err.response?.data?.message || err.message)); }
    };

    // ── CSV ──────────────────────────────────────────────────────────────────
    const handleDownloadCSV = async () => {
        try {
            const response = await exportParticipantsCSV(eventId);
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", `participants-${eventId}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) { alert("Failed to download CSV"); }
    };

    // ── Merch order handlers ─────────────────────────────────────────────────
    const handleApprove = async (orderId) => {
        if (!window.confirm("Approve this payment? This will generate a ticket and decrement stock.")) return;
        try { await approveMerchOrder(eventId, orderId); fetchOrders(); fetchDetails(); }
        catch (err) { alert("Failed to approve: " + (err.response?.data?.message || err.message)); }
    };

    const handleReject = async (orderId) => {
        if (!window.confirm("Reject this payment?")) return;
        try { await rejectMerchOrder(eventId, orderId); fetchOrders(); }
        catch (err) { alert("Failed to reject: " + (err.response?.data?.message || err.message)); }
    };

    // ── Filters ──────────────────────────────────────────────────────────────
    const filteredParticipants = participants.filter(p => {
        const name = `${p.participantId?.firstName || ""} ${p.participantId?.lastName || ""}`.toLowerCase();
        const email = (p.participantId?.email || p.participantId?.userId?.email || "").toLowerCase();
        const ticket = (p.ticketId || "").toLowerCase();
        const q = search.toLowerCase();
        return (name.includes(q) || email.includes(q) || ticket.includes(q)) &&
            (statusFilter === "ALL" || p.status === statusFilter);
    });

    // ── Guards ───────────────────────────────────────────────────────────────
    if (loading) return <Layout><p>Loading...</p></Layout>;
    if (!event) return <Layout><p>Event not found</p></Layout>;

    const isMerchEvent = event.eventType === "MERCHANDISE";
    const isDraft = event.status === "DRAFT";
    const isPublished = event.status === "PUBLISHED";
    const isOngoing = event.status === "ONGOING";
    const isCompleted = event.status === "COMPLETED" || event.status === "CLOSED";
    const canEdit = isDraft || isPublished; // no editing for ONGOING/COMPLETED/CLOSED

    const attendedCount = participants.filter(p => p.attended).length;
    const totalCount = participants.length;
    const attendancePercent = totalCount > 0 ? Math.round((attendedCount / totalCount) * 100) : 0;

    const getStatusBadge = (status) => {
        const map = { DRAFT: "badge badge-gray", PUBLISHED: "badge badge-info", ONGOING: "badge badge-success", COMPLETED: "badge badge-purple", CLOSED: "badge badge-danger" };
        return map[status] || "badge badge-gray";
    };

    const getPaymentBadge = (status) => {
        const map = { PENDING: "badge badge-warning", APPROVED: "badge badge-success", REJECTED: "badge badge-danger" };
        return map[status] || "badge badge-gray";
    };

    return (
        <Layout>
            {/* ── Header ──────────────────────────────────────────────────── */}
            <div className="page-header">
                <div>
                    <h2 className="page-title">{event.eventName}</h2>
                    <span className={getStatusBadge(event.status)}>{event.status}</span>
                </div>
                <div className="flex gap-sm">
                    {isDraft && <button onClick={() => handleStatusChange("PUBLISHED")} className="btn btn-primary btn-sm">Publish</button>}
                    {isPublished && <button onClick={() => handleStatusChange("ONGOING")} className="btn btn-success btn-sm">Start Event</button>}
                    {isPublished && <button onClick={() => handleStatusChange("CLOSED")} className="btn btn-danger btn-sm">Close Registrations</button>}
                    {isOngoing && <button onClick={() => handleStatusChange("COMPLETED")} className="btn btn-primary btn-sm">Mark Completed</button>}
                </div>
            </div>

            {/* ── Stats ───────────────────────────────────────────────────── */}
            <div className="stats-row">
                <div className="stat-card"><h4>Registrations</h4><p className="stat-number">{analytics.totalRegistrations}</p></div>
                <div className="stat-card"><h4>Revenue</h4><p className="stat-number">₹{analytics.totalRevenue}</p></div>
                <div className="stat-card"><h4>Attendance</h4><p className="stat-number">{attendedCount}/{totalCount}</p></div>
            </div>

            {/* ── Tabs ────────────────────────────────────────────────────── */}
            <div className="tabs">
                <button onClick={() => setActiveTab("participants")} className={`tab ${activeTab === "participants" ? "active" : ""}`}>Participants</button>
                <button onClick={() => setActiveTab("attendance")} className={`tab ${activeTab === "attendance" ? "active" : ""}`}>📊 Attendance</button>
                {isMerchEvent && (
                    <button onClick={() => setActiveTab("payments")} className={`tab ${activeTab === "payments" ? "active" : ""}`}>
                        Payments {orders.filter(o => o.paymentStatus === "PENDING").length > 0 && (
                            <span className="badge badge-danger" style={{ marginLeft: 6 }}>{orders.filter(o => o.paymentStatus === "PENDING").length}</span>
                        )}
                    </button>
                )}
                {canEdit && (
                    <button onClick={() => setActiveTab("edit")} className={`tab ${activeTab === "edit" ? "active" : ""}`}>✏️ Edit Event</button>
                )}
                {canEdit && (
                    <button onClick={() => setActiveTab("formbuilder")} className={`tab ${activeTab === "formbuilder" ? "active" : ""}`}>
                        📋 Form Builder {formLocked && <span className="badge badge-warning" style={{ marginLeft: 6 }}>Locked</span>}
                    </button>
                )}
                <button onClick={() => setActiveTab("discussion")} className={`tab ${activeTab === "discussion" ? "active" : ""}`}>💬 Discussion</button>
            </div>

            {/* ====== PARTICIPANTS TAB ====== */}
            {activeTab === "participants" && (
                <>
                    <div className="flex justify-between items-center flex-wrap gap mb-sm">
                        <h3>Participants</h3>
                        <div className="flex gap-sm">
                            <button onClick={handleDownloadCSV} className="btn btn-success btn-sm">📥 CSV</button>
                            <button onClick={() => navigate(`/organizer/event/${eventId}/scanner`)} className="btn btn-primary btn-sm">🔍 QR Scanner</button>
                        </div>
                    </div>
                    <div className="filters-bar mb">
                        <input placeholder="Search participants..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ flex: 1, minWidth: 200 }} />
                        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                            <option value="ALL">All Status</option>
                            <option value="REGISTERED">Registered</option>
                            <option value="ATTENDED">Attended</option>
                            <option value="CANCELLED">Cancelled</option>
                        </select>
                    </div>
                    <div className="table-container">
                        <table>
                            <thead><tr><th>Name</th><th>Email</th><th>Ticket ID</th><th style={{ minWidth: "200px" }}>Form Responses</th><th>Status</th><th>Attended</th></tr></thead>
                            <tbody>
                                {filteredParticipants.map(p => (
                                    <tr key={p._id}>
                                        <td>{p.participantId?.firstName} {p.participantId?.lastName}</td>
                                        <td style={{ fontSize: "0.85rem" }}>{p.participantId?.email || p.participantId?.userId?.email}</td>
                                        <td style={{ fontSize: "0.82rem" }}>{p.ticketId || "—"}</td>
                                        <td style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                                            {p.customResponses && Object.keys(p.customResponses).length > 0 ? (
                                                <ul style={{ margin: 0, paddingLeft: "15px" }}>
                                                    {Object.entries(p.customResponses).map(([q, a]) => (
                                                        <li key={q}><strong>{q}:</strong> {a}</li>
                                                    ))}
                                                </ul>
                                            ) : (
                                                <span style={{ color: "var(--text-muted)" }}>None</span>
                                            )}
                                        </td>
                                        <td><span className={p.status === "CANCELLED" ? "badge badge-danger" : "badge badge-primary"}>{p.status}</span></td>
                                        <td>{p.attended ? "✅" : "—"}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}

            {/* ====== ATTENDANCE TAB ====== */}
            {activeTab === "attendance" && (
                <>
                    <div className="flex justify-between items-center mb">
                        <h3>Live Attendance Dashboard</h3>
                        <button onClick={() => navigate(`/organizer/event/${eventId}/scanner`)} className="btn btn-primary btn-sm">🔍 Open QR Scanner</button>
                    </div>
                    <div className="progress-bar-track">
                        <div className="progress-bar-fill" style={{
                            width: `${attendancePercent}%`,
                            background: attendancePercent > 75 ? "var(--success)" : attendancePercent > 40 ? "var(--warning)" : "var(--danger)",
                            minWidth: attendancePercent > 0 ? 40 : 0,
                        }}>{attendancePercent}%</div>
                    </div>
                    <div className="stats-row">
                        <div className="stat-card" style={{ borderLeft: "4px solid var(--success)" }}><h4>Scanned</h4><p className="stat-number">{attendedCount}</p></div>
                        <div className="stat-card" style={{ borderLeft: "4px solid var(--danger)" }}><h4>Not Scanned</h4><p className="stat-number">{totalCount - attendedCount}</p></div>
                        <div className="stat-card" style={{ borderLeft: "4px solid var(--primary)" }}><h4>Total</h4><p className="stat-number">{totalCount}</p></div>
                    </div>
                    <div className="scanner-box mb">
                        <h4 style={{ margin: "0 0 10px" }}>Manual Ticket Entry</h4>
                        <div className="flex gap-sm">
                            <input placeholder="Enter Ticket ID" value={ticketIdInput} onChange={(e) => setTicketIdInput(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleMarkAttendance()} style={{ flex: 1 }} />
                            <button onClick={handleMarkAttendance} className="btn btn-primary btn-sm">Mark Present</button>
                        </div>
                    </div>
                    <h4 className="mb-sm">Participant Attendance</h4>
                    <div className="table-container">
                        <table>
                            <thead><tr><th>Name</th><th>Ticket ID</th><th>Status</th><th>Attended At</th><th>Override</th></tr></thead>
                            <tbody>
                                {participants.map(p => (
                                    <tr key={p._id} style={{ background: p.attended ? "var(--success-bg)" : "transparent" }}>
                                        <td>{p.participantId?.firstName} {p.participantId?.lastName}</td>
                                        <td style={{ fontSize: "0.82rem" }}>{p.ticketId || "—"}</td>
                                        <td>{p.attended ? <span className="badge badge-success">Attended</span> : <span style={{ color: "var(--text-muted)" }}>Not scanned</span>}</td>
                                        <td style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>{p.attendedAt ? new Date(p.attendedAt).toLocaleString() : "—"}</td>
                                        <td>
                                            {p.attended ? (
                                                <button onClick={() => setOverrideModal({ registrationId: p._id, name: `${p.participantId?.firstName} ${p.participantId?.lastName}`, action: "UNMARK" })} className="btn btn-danger btn-sm">Unmark</button>
                                            ) : (
                                                <button onClick={() => setOverrideModal({ registrationId: p._id, name: `${p.participantId?.firstName} ${p.participantId?.lastName}`, action: "MARK" })} className="btn btn-success btn-sm">Force Mark</button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}

            {/* ====== PAYMENT APPROVALS TAB ====== */}
            {activeTab === "payments" && isMerchEvent && (
                <>
                    <div className="flex justify-between items-center mb">
                        <h3>Merchandise Orders</h3>
                        <select value={orderStatusFilter} onChange={(e) => setOrderStatusFilter(e.target.value)} style={{ width: "auto" }}>
                            <option value="ALL">All Status</option>
                            <option value="PENDING">Pending</option>
                            <option value="APPROVED">Approved</option>
                            <option value="REJECTED">Rejected</option>
                        </select>
                    </div>
                    {ordersLoading ? <p>Loading orders...</p> : orders.length === 0 ? (
                        <p style={{ color: "var(--text-muted)" }}>No orders found</p>
                    ) : (
                        <div className="table-container">
                            <table>
                                <thead><tr><th>Participant</th><th>Variant</th><th>Qty</th><th>Amount</th><th>Proof</th><th>Status</th><th>Actions</th></tr></thead>
                                <tbody>
                                    {orders.map(order => (
                                        <tr key={order._id}>
                                            <td>
                                                {order.participantId?.firstName} {order.participantId?.lastName}
                                                <br /><span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>{order.participantId?.userId?.email}</span>
                                            </td>
                                            <td>{order.merchandisePurchase?.size} / {order.merchandisePurchase?.color}</td>
                                            <td>{order.merchandisePurchase?.quantity}</td>
                                            <td>₹{order.merchandisePurchase?.totalAmount}</td>
                                            <td>
                                                {order.paymentProof ? (
                                                    <img src={`${API_BASE}${order.paymentProof}`} alt="Proof"
                                                        style={{ width: 50, height: 50, objectFit: "cover", borderRadius: 4, cursor: "pointer", border: "1px solid var(--border)" }}
                                                        onClick={() => setPreviewImage(`${API_BASE}${order.paymentProof}`)} />
                                                ) : "N/A"}
                                            </td>
                                            <td><span className={getPaymentBadge(order.paymentStatus)}>{order.paymentStatus}</span></td>
                                            <td>
                                                {order.paymentStatus === "PENDING" && (
                                                    <div className="flex gap-sm">
                                                        <button onClick={() => handleApprove(order._id)} className="btn btn-success btn-sm">✓</button>
                                                        <button onClick={() => handleReject(order._id)} className="btn btn-danger btn-sm">✗</button>
                                                    </div>
                                                )}
                                                {order.paymentStatus === "APPROVED" && order.ticketId && (
                                                    <span style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>Ticket: {order.ticketId.slice(0, 8)}...</span>
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

            {/* ====== EDIT EVENT TAB ====== */}
            {activeTab === "edit" && editForm && (
                <>
                    {isDraft && (
                        <div className="card mb" style={{ background: "var(--success-bg)", border: "1px solid var(--success)", padding: "10px 16px" }}>
                            <strong>Draft mode</strong> — all fields are editable.
                        </div>
                    )}
                    {isPublished && (
                        <div className="card mb" style={{ background: "var(--warning-bg, #fff8e1)", border: "1px solid var(--warning)", padding: "10px 16px" }}>
                            <strong>Published mode</strong> — you can update the description, extend the deadline, and increase the registration limit. Other fields are locked.
                        </div>
                    )}

                    <div className="card" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                        {/* Event Name */}
                        <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                            <label>Event Name</label>
                            <input value={editForm.eventName} disabled={!isDraft}
                                onChange={e => setEditForm({ ...editForm, eventName: e.target.value })} />
                        </div>

                        {/* Description — editable for DRAFT + PUBLISHED */}
                        <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                            <label>Description</label>
                            <textarea rows={4} value={editForm.description}
                                onChange={e => setEditForm({ ...editForm, description: e.target.value })} />
                        </div>

                        {/* Eligibility */}
                        <div className="form-group">
                            <label>Eligibility</label>
                            <select value={editForm.eligibility} disabled={!isDraft}
                                onChange={e => setEditForm({ ...editForm, eligibility: e.target.value })}>
                                <option value="ALL">All</option>
                                <option value="IIIT">IIIT Only</option>
                                <option value="NON-IIIT">Non-IIIT Only</option>
                            </select>
                        </div>

                        {/* Registration Fee */}
                        <div className="form-group">
                            <label>Registration Fee (₹)</label>
                            <input type="number" value={editForm.registrationFee} disabled={!isDraft}
                                onChange={e => setEditForm({ ...editForm, registrationFee: e.target.value })} />
                        </div>

                        {/* Registration Deadline — extendable in PUBLISHED */}
                        <div className="form-group">
                            <label>Registration Deadline</label>
                            <input type="date" value={editForm.registrationDeadline}
                                onChange={e => setEditForm({ ...editForm, registrationDeadline: e.target.value })} />
                        </div>

                        {/* Registration Limit — can only increase in PUBLISHED */}
                        <div className="form-group">
                            <label>Registration Limit {isPublished && <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>(can only increase)</span>}</label>
                            <input type="number" value={editForm.registrationLimit}
                                min={isPublished ? event.registrationLimit : 0}
                                onChange={e => setEditForm({ ...editForm, registrationLimit: e.target.value })} />
                        </div>

                        {/* Event Start Date */}
                        <div className="form-group">
                            <label>Event Start Date</label>
                            <input type="date" value={editForm.eventStartDate} disabled={!isDraft}
                                onChange={e => setEditForm({ ...editForm, eventStartDate: e.target.value })} />
                        </div>

                        {/* Event End Date */}
                        <div className="form-group">
                            <label>Event End Date</label>
                            <input type="date" value={editForm.eventEndDate} disabled={!isDraft}
                                onChange={e => setEditForm({ ...editForm, eventEndDate: e.target.value })} />
                        </div>

                        {/* Tags */}
                        <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                            <label>Tags <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>(comma-separated)</span></label>
                            <input value={editForm.tags} disabled={!isDraft}
                                placeholder="e.g. tech, workshop, AI"
                                onChange={e => setEditForm({ ...editForm, tags: e.target.value })} />
                        </div>
                    </div>

                    <div className="flex gap-sm mt" style={{ justifyContent: "flex-end" }}>
                        <button onClick={fetchDetails} className="btn btn-secondary">Discard Changes</button>
                        <button onClick={handleSaveEdit} className="btn btn-primary" disabled={editSaving}>
                            {editSaving ? "Saving..." : "Save Changes"}
                        </button>
                    </div>
                </>
            )}

            {/* ====== FORM BUILDER TAB ====== */}
            {activeTab === "formbuilder" && (
                <>
                    <div className="flex justify-between items-center mb">
                        <div>
                            <h3 style={{ margin: 0 }}>Custom Registration Form</h3>
                            <p style={{ margin: "4px 0 0", color: "var(--text-muted)", fontSize: "0.875rem" }}>
                                {formLocked
                                    ? "⚠️ Form is locked — registrations have already been received."
                                    : "Add fields participants must fill in when registering. Reorder using arrows."}
                            </p>
                        </div>
                        {!formLocked && (
                            <button onClick={addField} className="btn btn-primary btn-sm">+ Add Field</button>
                        )}
                    </div>

                    {formFields.length === 0 ? (
                        <div className="card text-center" style={{ padding: "32px 20px", color: "var(--text-muted)" }}>
                            {formLocked
                                ? "No custom form was defined for this event."
                                : "No fields yet. Click \"+ Add Field\" to build your registration form."}
                        </div>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                            {formFields.map((field, idx) => (
                                <div key={field.id} className="card" style={{ padding: "14px 16px" }}>
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 160px auto auto auto", gap: 10, alignItems: "center" }}>
                                        {/* Label */}
                                        <input
                                            placeholder="Field label (e.g. T-Shirt Size)"
                                            value={field.label}
                                            disabled={formLocked}
                                            onChange={e => updateField(field.id, { label: e.target.value })}
                                        />

                                        {/* Type */}
                                        <select value={field.type} disabled={formLocked}
                                            onChange={e => updateField(field.id, { type: e.target.value })}>
                                            {FIELD_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                        </select>

                                        {/* Required toggle */}
                                        <label style={{ display: "flex", alignItems: "center", gap: 4, fontSize: "0.85rem", whiteSpace: "nowrap", cursor: formLocked ? "default" : "pointer" }}>
                                            <input type="checkbox" checked={field.required} disabled={formLocked}
                                                onChange={e => updateField(field.id, { required: e.target.checked })} />
                                            Required
                                        </label>

                                        {/* Reorder */}
                                        {!formLocked && (
                                            <div className="flex" style={{ flexDirection: "column", gap: 2 }}>
                                                <button onClick={() => moveField(idx, -1)} disabled={idx === 0}
                                                    className="btn btn-secondary btn-sm" style={{ padding: "2px 8px", fontSize: "0.75rem" }}>▲</button>
                                                <button onClick={() => moveField(idx, 1)} disabled={idx === formFields.length - 1}
                                                    className="btn btn-secondary btn-sm" style={{ padding: "2px 8px", fontSize: "0.75rem" }}>▼</button>
                                            </div>
                                        )}

                                        {/* Remove */}
                                        {!formLocked && (
                                            <button onClick={() => removeField(field.id)} className="btn btn-danger btn-sm">✕</button>
                                        )}
                                    </div>

                                    {/* Options for dropdown */}
                                    {field.type === "dropdown" && !formLocked && (
                                        <div style={{ marginTop: 10 }}>
                                            <label style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>
                                                Dropdown options <span style={{ fontWeight: 400 }}>(comma-separated)</span>
                                            </label>
                                            <input
                                                placeholder="e.g. S, M, L, XL"
                                                value={(field.options || []).join(", ")}
                                                onChange={e => updateField(field.id, {
                                                    options: e.target.value.split(",").map(o => o.trim()).filter(Boolean)
                                                })}
                                                style={{ marginTop: 4 }}
                                            />
                                        </div>
                                    )}
                                    {field.type === "dropdown" && formLocked && (field.options || []).length > 0 && (
                                        <div style={{ marginTop: 6, fontSize: "0.82rem", color: "var(--text-secondary)" }}>
                                            Options: {field.options.join(", ")}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {!formLocked && (
                        <div className="flex gap-sm mt" style={{ justifyContent: "flex-end" }}>
                            <button onClick={fetchDetails} className="btn btn-secondary">Discard</button>
                            <button onClick={handleSaveForm} className="btn btn-primary" disabled={formSaving}>
                                {formSaving ? "Saving..." : "Save Form"}
                            </button>
                        </div>
                    )}
                </>
            )}

            {/* ── Image Preview Modal ─────────────────────────────────────── */}
            {previewImage && (
                <div className="image-preview-overlay" onClick={() => setPreviewImage(null)}>
                    <img src={previewImage} alt="Payment Proof" />
                </div>
            )}

            {/* ── Manual Override Modal ───────────────────────────────────── */}
            {overrideModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3 style={{ margin: "0 0 12px" }}>{overrideModal.action === "MARK" ? "Force Mark" : "Unmark"} Attendance</h3>
                        <p style={{ margin: "0 0 12px", color: "var(--text-secondary)" }}>Participant: <strong>{overrideModal.name}</strong></p>
                        <div className="form-group">
                            <textarea placeholder="Reason for override (required)..." value={overrideReason} onChange={(e) => setOverrideReason(e.target.value)} />
                        </div>
                        <div className="flex gap-sm">
                            <button onClick={handleManualOverride} className={overrideModal.action === "MARK" ? "btn btn-success" : "btn btn-danger"}>
                                Confirm {overrideModal.action === "MARK" ? "Mark" : "Unmark"}
                            </button>
                            <button onClick={() => { setOverrideModal(null); setOverrideReason(""); }} className="btn btn-secondary">Cancel</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ====== DISCUSSION TAB ====== */}
            {activeTab === "discussion" && <DiscussionForum eventId={eventId} isOrganizer={true} />}
        </Layout>
    );
}
