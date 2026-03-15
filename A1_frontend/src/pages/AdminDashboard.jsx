import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";

export default function AdminDashboard() {
  const navigate = useNavigate();

  return (
    <Layout>
      <div style={{ maxWidth: 860, margin: "0 auto" }}>

        {/* Page Header */}
        <div className="page-header">
          <div>
            <h2 className="page-title">Admin Dashboard</h2>
            <p style={{ color: "var(--text-secondary)", marginTop: 4 }}>
              System administration panel for Felicity Event Management
            </p>
          </div>
          <span className="badge badge-primary" style={{ fontSize: "0.8rem", padding: "6px 14px" }}>
            Admin
          </span>
        </div>

        {/* Quick Action Cards */}
        <div className="grid-2 mt">
          <div
            className="card card-hover"
            onClick={() => navigate("/admin/organizers")}
            style={{ borderLeft: "4px solid var(--primary)", cursor: "pointer" }}
          >
            <h3 style={{ marginBottom: 8, color: "var(--gray-900)" }}>Manage Organizers</h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", marginBottom: 16 }}>
              Add new clubs or organizer accounts, view all existing organizers, disable or permanently delete accounts.
            </p>
            <span className="badge badge-primary">Go to Organizers</span>
          </div>

          <div
            className="card card-hover"
            onClick={() => navigate("/admin/organizers?tab=resets")}
            style={{ borderLeft: "4px solid var(--warning)", cursor: "pointer" }}
          >
            <h3 style={{ marginBottom: 8, color: "var(--gray-900)" }}>Password Reset Requests</h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", marginBottom: 16 }}>
              Review and process password reset requests submitted by organizers. Approve or reject with optional comments.
            </p>
            <span className="badge badge-warning">View Requests</span>
          </div>
        </div>

      </div>
    </Layout>
  );
}