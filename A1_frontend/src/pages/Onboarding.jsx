import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { saveOnboarding, skipOnboarding, getAllOrganizers } from "../services/participantService";

const INTEREST_OPTIONS = [
  "Technology", "Sports", "Music", "Art", "Literature",
  "Science", "Business", "Gaming", "Photography", "Dance",
];

export default function Onboarding() {
  const [interests, setInterests] = useState([]);
  const [organizers, setOrganizers] = useState([]);
  const [selectedOrganizers, setSelectedOrganizers] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => { fetchOrganizers(); }, []);

  const fetchOrganizers = async () => {
    try {
      const data = await getAllOrganizers();
      setOrganizers(data);
    } catch (err) {
      console.error("Failed to fetch organizers");
    } finally {
      setLoading(false);
    }
  };

  const toggleInterest = (interest) => {
    setInterests((prev) =>
      prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest]
    );
  };

  const toggleOrganizer = (organizerId) => {
    setSelectedOrganizers((prev) =>
      prev.includes(organizerId) ? prev.filter((id) => id !== organizerId) : [...prev, organizerId]
    );
  };

  const handleSave = async () => {
    try {
      await saveOnboarding({ interests, followedOrganizers: selectedOrganizers });
      alert("Preferences saved!");
      navigate("/participant");
    } catch (err) {
      alert("Failed to save preferences");
    }
  };

  const handleSkip = async () => {
    try {
      await skipOnboarding();
      navigate("/participant");
    } catch (err) {
      alert("Failed to skip onboarding");
    }
  };

  if (loading) return <div className="onboarding-page"><p>Loading...</p></div>;

  return (
    <div className="onboarding-page">
      <div className="onboarding-card">
        <h2 style={{ textAlign: "center", marginBottom: 4 }}>Welcome to Felicity!</h2>
        <p style={{ textAlign: "center", color: "var(--text-secondary)", marginBottom: 28 }}>
          Set your preferences to get personalized event recommendations.
        </p>

        <h3 className="mb-sm">1. Select Your Interests</h3>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 24 }}>
          {INTEREST_OPTIONS.map((interest) => (
            <span
              key={interest}
              className={`chip ${interests.includes(interest) ? "selected" : ""}`}
              onClick={() => toggleInterest(interest)}
            >
              {interest}
            </span>
          ))}
        </div>

        <hr />

        <h3 className="mb-sm" style={{ marginTop: 20 }}>2. Follow Clubs / Organizers</h3>
        {organizers.length === 0 ? (
          <p style={{ color: "var(--text-muted)" }}>No organizers available yet.</p>
        ) : (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 24 }}>
            {organizers.map((org) => (
              <span
                key={org._id}
                className={`chip ${selectedOrganizers.includes(org._id) ? "selected" : ""}`}
                onClick={() => toggleOrganizer(org._id)}
              >
                {org.organizerName} ({org.category})
              </span>
            ))}
          </div>
        )}

        <hr />

        <div className="flex gap mt" style={{ justifyContent: "center" }}>
          <button onClick={handleSave} className="btn-success">Save Preferences</button>
          <button onClick={handleSkip} className="btn-secondary">Skip for Now</button>
        </div>
      </div>
    </div>
  );
}