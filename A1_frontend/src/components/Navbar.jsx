import { useNavigate } from "react-router-dom";
import { logout, getRole } from "../utils/auth";

export default function Navbar() {
  const navigate = useNavigate();
  const role = getRole();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <span className="navbar-brand" onClick={() => navigate("/")}>
          Felicity
        </span>

        <div className="navbar-links">
          {/* Participant Navigation */}
          {role === "participant" && (
            <>
              <button onClick={() => navigate("/participant")} className="nav-btn">Dashboard</button>
              <button onClick={() => navigate("/browse")} className="nav-btn">Browse Events</button>
              <button onClick={() => navigate("/clubs")} className="nav-btn">Clubs</button>
              <button onClick={() => navigate("/profile")} className="nav-btn">My Profile</button>
            </>
          )}

          {/* Organizer Navigation */}
          {role === "organizer" && (
            <>
              <button onClick={() => navigate("/organizer")} className="nav-btn">Dashboard</button>
              <button onClick={() => navigate("/organizer/create")} className="nav-btn">Create Event</button>
              <button onClick={() => navigate("/organizer/ongoing")} className="nav-btn">Ongoing Events</button>
              <button onClick={() => navigate("/organizer/profile")} className="nav-btn">Profile</button>
            </>
          )}

          {/* Admin Navigation */}
          {role === "admin" && (
            <>
              <button onClick={() => navigate("/admin")} className="nav-btn">Dashboard</button>
              <button onClick={() => navigate("/admin/organizers")} className="nav-btn">Manage Organizers</button>
              <button onClick={() => navigate("/admin/organizers?tab=resets")} className="nav-btn">Password Resets</button>
            </>
          )}

          <button onClick={handleLogout} className="nav-btn-logout">Logout</button>
        </div>
      </div>
    </nav>
  );
}
