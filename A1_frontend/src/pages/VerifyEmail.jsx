import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { verifyEmailToken, completeIIITSignup } from "../services/authService";

export default function VerifyEmail() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState("verifying"); // verifying, verified, error
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setError("Invalid verification link. No token provided.");
      return;
    }

    verifyToken();
  }, [token]);

  const verifyToken = async () => {
    try {
      const data = await verifyEmailToken(token);
      setEmail(data.email);
      setFirstName(data.firstName);
      setStatus("verified");
    } catch (err) {
      setStatus("error");
      setError(err.response?.data?.message || "Verification failed. The link may have expired.");
    }
  };

  const handleSetPassword = async (e) => {
    e.preventDefault();
    setError("");

    if (!password || !confirmPassword) {
      return setError("Please enter and confirm your password");
    }
    if (password.length < 6) {
      return setError("Password must be at least 6 characters");
    }
    if (password !== confirmPassword) {
      return setError("Passwords do not match");
    }

    setLoading(true);
    try {
      await completeIIITSignup(token, password);
      alert("Registration completed successfully! Please login.");
      navigate("/login");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to complete registration");
    } finally {
      setLoading(false);
    }
  };

  // Verifying state
  if (status === "verifying") {
    return (
      <div className="auth-page">
        <div className="auth-card" style={{ textAlign: "center" }}>
          <div className="spinner" style={{ 
            width: "40px", 
            height: "40px", 
            border: "4px solid #e5e7eb", 
            borderTop: "4px solid #2563eb", 
            borderRadius: "50%", 
            animation: "spin 1s linear infinite",
            margin: "0 auto 20px"
          }} />
          <h2>Verifying your email...</h2>
          <p style={{ color: "#6b7280" }}>Please wait while we verify your email address.</p>
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </div>
    );
  }

  // Error state
  if (status === "error") {
    return (
      <div className="auth-page">
        <div className="auth-card" style={{ textAlign: "center" }}>
          <div style={{ fontSize: "48px", marginBottom: "20px" }}>❌</div>
          <h2>Verification Failed</h2>
          <p style={{ color: "#ef4444", marginBottom: "20px" }}>{error}</p>
          <Link to="/signup" className="btn-primary" style={{ textDecoration: "none" }}>
            Try Signing Up Again
          </Link>
        </div>
      </div>
    );
  }

  // Verified - show password form
  return (
    <div className="auth-page">
      <div className="auth-card" style={{ maxWidth: 450 }}>
        <div style={{ textAlign: "center", marginBottom: "20px" }}>
          <div style={{ fontSize: "48px", marginBottom: "10px" }}>✅</div>
          <h2>Email Verified!</h2>
          <p style={{ color: "#6b7280" }}>
            Welcome, <strong>{firstName}</strong>! Your email <strong>{email}</strong> has been verified.
          </p>
        </div>

        <div style={{ 
          background: "#f0fdf4", 
          border: "1px solid #22c55e", 
          borderRadius: "8px", 
          padding: "12px", 
          marginBottom: "20px",
          textAlign: "center"
        }}>
          <p style={{ color: "#166534", margin: 0, fontSize: "14px" }}>
            🎉 One last step! Set your password to complete registration.
          </p>
        </div>

        <form onSubmit={handleSetPassword}>
          <div className="form-group">
            <label>Password</label>
            <input 
              type="password" 
              placeholder="Min 6 characters" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
            />
          </div>

          <div className="form-group">
            <label>Confirm Password</label>
            <input 
              type="password" 
              placeholder="Re-enter password" 
              value={confirmPassword} 
              onChange={(e) => setConfirmPassword(e.target.value)} 
            />
          </div>

          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? "Creating Account..." : "Complete Registration"}
          </button>
        </form>

        {error && <p className="error-text mt-sm">{error}</p>}
      </div>
    </div>
  );
}
