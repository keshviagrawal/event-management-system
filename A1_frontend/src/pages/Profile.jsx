/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect } from "react";
import Layout from "../components/Layout";
import { getAllOrganizers, updateProfile, getProfile } from "../services/participantService";
import api from "../services/api";

const INTEREST_OPTIONS = [
  "Technology", "Sports", "Music", "Art", "Literature",
  "Science", "Business", "Gaming", "Photography", "Dance",
];

export default function Profile() {
  const [loading, setLoading] = useState(true);
  const [allOrganizers, setAllOrganizers] = useState([]);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [saveMsg, setSaveMsg] = useState(null);
  const [pwMsg, setPwMsg] = useState(null);
  const [contactError, setContactError] = useState("");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [collegeOrOrgName, setCollegeOrOrgName] = useState("");
  const [interests, setInterests] = useState([]);
  const [followedOrganizers, setFollowedOrganizers] = useState([]);
  const [email, setEmail] = useState("");
  const [participantType, setParticipantType] = useState("");

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [profile, organizers] = await Promise.all([getProfile(), getAllOrganizers()]);
      setFirstName(profile.firstName || "");
      setLastName(profile.lastName || "");
      setContactNumber(profile.contactNumber || "");
      setCollegeOrOrgName(profile.collegeOrOrgName || "");
      setInterests(profile.interests || []);
      setFollowedOrganizers(profile.followedOrganizers || []);
      setEmail(profile.email || "");
      setParticipantType(profile.participantType || "");
      setAllOrganizers(organizers);
    } catch (err) {
      alert("Failed to load profile data");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaveMsg(null);
    setContactError("");
    if (contactNumber && !/^\d{10}$/.test(contactNumber)) {
      setContactError("Contact number must be exactly 10 digits");
      return;
    }
    try {
      await updateProfile({ firstName, lastName, contactNumber, collegeOrOrgName, interests, followedOrganizers });
      setSaveMsg({ type: "success", text: "Profile updated successfully!" });
    } catch (err) {
      setSaveMsg({ type: "error", text: "Failed to update profile" });
    }
  };

  const toggleInterest = (interest) => {
    setInterests(prev => prev.includes(interest) ? prev.filter(i => i !== interest) : [...prev, interest]);
  };

  const toggleOrganizer = (orgId) => {
    setFollowedOrganizers(prev => prev.includes(orgId) ? prev.filter(id => id !== orgId) : [...prev, orgId]);
  };

  const handleChangePassword = async () => {
    setPwMsg(null);
    if (!currentPassword || !newPassword) { setPwMsg({ type: "error", text: "Both fields are required" }); return; }
    if (newPassword.length < 6) { setPwMsg({ type: "error", text: "New password must be at least 6 characters" }); return; }
    try {
      await api.put("/participants/change-password", { currentPassword, newPassword });
      setPwMsg({ type: "success", text: "Password updated successfully!" });
      setCurrentPassword(""); setNewPassword("");
    } catch (error) {
      setPwMsg({ type: "error", text: error.response?.data?.message || "Failed to update password" });
    }
  };

  if (loading) return <Layout><p>Loading...</p></Layout>;

  return (
    <Layout>
      <div style={{ maxWidth: 640, margin: "0 auto" }}>
        <h2 className="page-title">My Profile</h2>

        {/* Non-editable info */}
        <div className="info-box mb">
          <p><strong>Email:</strong> {email}</p>
          <p><strong>Participant Type:</strong> {participantType}</p>
        </div>

        {/* Editable fields */}
        <div className="card mb-lg">
          <h3 style={{ marginBottom: 16 }}>Personal Information</h3>
          <div className="form-row">
            <div className="form-group">
              <label>First Name</label>
              <input value={firstName} onChange={e => setFirstName(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Last Name</label>
              <input value={lastName} onChange={e => setLastName(e.target.value)} />
            </div>
          </div>
          <div className="form-group">
            <label>Contact Number</label>
            <input value={contactNumber} onChange={e => { setContactNumber(e.target.value); setContactError(""); }}
              placeholder="10-digit phone number" maxLength={10} />
            {contactError && <p className="error-text">{contactError}</p>}
          </div>
          <div className="form-group">
            <label>College / Organization</label>
            <input value={collegeOrOrgName} onChange={e => setCollegeOrOrgName(e.target.value)} />
          </div>

          <hr />

          <h4 className="mb-sm">Interests</h4>
          <div className="flex flex-wrap gap-sm mb">
            {INTEREST_OPTIONS.map(interest => (
              <span key={interest}
                className={`chip ${interests.includes(interest) ? "selected" : ""}`}
                onClick={() => toggleInterest(interest)}
              >
                {interest}
              </span>
            ))}
          </div>

          <h4 className="mb-sm">Clubs</h4>
          <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: 10 }}>Click a club to follow or unfollow it. Highlighted clubs are ones you follow.</p>
          <div className="flex flex-wrap gap-sm mb">
            {allOrganizers.length === 0 ? (
              <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>No clubs available.</p>
            ) : allOrganizers.map(org => (
              <span key={org._id}
                className={`chip ${followedOrganizers.includes(org._id) ? "selected" : ""}`}
                onClick={() => toggleOrganizer(org._id)}
                title={followedOrganizers.includes(org._id) ? "Click to unfollow" : "Click to follow"}
              >
                {org.organizerName}
              </span>
            ))}
          </div>

          <button onClick={handleSave} className="btn-success mt-sm">Save Changes</button>
          {saveMsg && <p className={saveMsg.type === "success" ? "success-text mt-sm" : "error-text mt-sm"}>{saveMsg.text}</p>}
        </div>

        {/* Password change */}
        <div className="card">
          <h3 style={{ marginBottom: 16 }}>Change Password</h3>
          <div className="form-group">
            <label>Current Password</label>
            <input type="password" placeholder="Enter current password"
              value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
          </div>
          <div className="form-group">
            <label>New Password</label>
            <input type="password" placeholder="Min 6 characters"
              value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          </div>
          <button onClick={handleChangePassword} className="btn-primary">Update Password</button>
          {pwMsg && <p className={pwMsg.type === "success" ? "success-text mt-sm" : "error-text mt-sm"}>{pwMsg.text}</p>}
        </div>
      </div>
    </Layout>
  );
}
