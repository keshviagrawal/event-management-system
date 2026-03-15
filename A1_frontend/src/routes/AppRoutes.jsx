import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import EventDetails from "../pages/EventDetails";
import BrowseEvents from "../pages/BrowseEvents";
import Signup from "../pages/Signup";
import Login from "../pages/Login";
import Onboarding from "../pages/Onboarding";
import ParticipantDashboard from "../pages/ParticipantDashboard";
import OrganizerDashboard from "../pages/OrganizerDashboard";
import AdminDashboard from "../pages/AdminDashboard";
import Profile from "../pages/Profile";
import TicketView from "../pages/TicketView";
import ClubsList from "../pages/ClubsList";
import OrganizerDetail from "../pages/OrganizerDetail"; // Public detail page
import OrganizerEventDetails from "../pages/OrganizerEventDetails"; // Secure management page
import OrganizerProfile from "../pages/OrganizerProfile"; // Secure profile page
import CreateEvent from "../pages/CreateEvent";
import OngoingEvents from "../pages/OngoingEvents";
import ManageOrganizers from "../pages/ManageOrganizers";
import QRScanner from "../pages/QRScanner";

import { getToken, getRole } from "../utils/auth";

function ProtectedRoute({ children, allowedRoles }) {
  const token = getToken();
  const role = getRole();

  if (!token) return <Navigate to="/login" />;
  if (!allowedRoles.includes(role)) return <Navigate to="/login" />;
  // if no token or wrong role go back to login
  return children;
}

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />

        <Route
          path="/onboarding"
          element={
            <ProtectedRoute allowedRoles={["participant"]}>
              <Onboarding />
            </ProtectedRoute>
          }
        />

        <Route
          path="/participant"
          element={
            <ProtectedRoute allowedRoles={["participant"]}>
              <ParticipantDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/browse"
          element={
            <ProtectedRoute allowedRoles={["participant"]}>
              <BrowseEvents />
            </ProtectedRoute>
          }
        />

        <Route
          path="/events/:id"
          element={
            <ProtectedRoute allowedRoles={["participant"]}>
              <EventDetails />
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <ProtectedRoute allowedRoles={["participant"]}>
              <Profile />
            </ProtectedRoute>
          }
        />

        <Route
          path="/organizer"
          element={
            <ProtectedRoute allowedRoles={["organizer"]}>
              <OrganizerDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/organizer/ongoing"
          element={
            <ProtectedRoute allowedRoles={["organizer"]}>
              <OngoingEvents />
            </ProtectedRoute>
          }
        />

        <Route
          path="/organizer/create"
          element={
            <ProtectedRoute allowedRoles={["organizer"]}>
              <CreateEvent />
            </ProtectedRoute>
          }
        />

        <Route
          path="/organizer/event/:eventId"
          element={
            <ProtectedRoute allowedRoles={["organizer"]}>
              <OrganizerEventDetails />
            </ProtectedRoute>
          }
        />

        <Route
          path="/organizer/event/:eventId/scanner"
          element={
            <ProtectedRoute allowedRoles={["organizer"]}>
              <QRScanner />
            </ProtectedRoute>
          }
        />

        <Route
          path="/organizer/profile"
          element={
            <ProtectedRoute allowedRoles={["organizer"]}>
              <OrganizerProfile />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/organizers"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <ManageOrganizers />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/login" />} />

        <Route
          path="/ticket/:ticketId"
          element={
            <ProtectedRoute allowedRoles={["participant"]}>
              <TicketView />
            </ProtectedRoute>
          }
        />

        <Route path="/clubs" element={<ClubsList />} />
        <Route path="/organizer/:id" element={<OrganizerDetail />} />

      </Routes>
    </BrowserRouter>
  );
}
