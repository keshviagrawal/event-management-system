import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { registerUser, initiateIIITSignup, verifyOTP, resendOTP, completeIIITSignup } from "../services/authService";

export default function Signup() {
  const navigate = useNavigate();

  // Form fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [participantType, setParticipantType] = useState("NON-IIIT");
  const [collegeOrOrgName, setCollegeOrOrgName] = useState("");
  const [contactNumber, setContactNumber] = useState("");

  // OTP flow state
  const [step, setStep] = useState(1); // 1: form, 2: OTP, 3: set password
  const [otp, setOtp] = useState("");

  // UI state
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Start resend cooldown timer
  const startResendCooldown = () => {
    setResendCooldown(30);
    const timer = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Step 1: Handle initial form submission
  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!email || !firstName || !lastName || !collegeOrOrgName || !contactNumber) {
      setLoading(false);
      return setError("All fields are required");
    }
    if (!/^\d{10}$/.test(contactNumber)) {
      setLoading(false);
      return setError("Contact number must be 10 digits");
    }

    const iiitDomains = ["@iiit.ac.in", "@students.iiit.ac.in", "@research.iiit.ac.in"];
    if (participantType === "IIIT") {
      const isValidIIIT = iiitDomains.some(domain => email.endsWith(domain));
      if (!isValidIIIT) {
        setLoading(false);
        return setError("IIIT participants must use @iiit.ac.in, @students.iiit.ac.in, or @research.iiit.ac.in email");
      }
    }

    if (participantType === "NON-IIIT" && collegeOrOrgName.trim().toLowerCase() === "iiit hyderabad") {
      setLoading(false);
      return setError("You have selected Non-IIIT but entered IIIT Hyderabad as your college. Please select IIIT Student if you are an IIIT student.");
    }

    try {
      // For IIIT users: send OTP
      if (participantType === "IIIT") {
        await initiateIIITSignup({
          email,
          firstName,
          lastName,
          participantType,
          collegeOrOrgName,
          contactNumber
        });
        setStep(2); // Move to OTP step
        startResendCooldown();
        setLoading(false);
        return;
      }

      // For Non-IIIT users: direct registration with password
      if (!password || !confirmPassword) {
        setLoading(false);
        return setError("Password is required");
      }
      if (password.length < 6) {
        setLoading(false);
        return setError("Password must be at least 6 characters");
      }
      if (password !== confirmPassword) {
        setLoading(false);
        return setError("Passwords do not match");
      }

      await registerUser({ email, password, firstName, lastName, participantType, collegeOrOrgName, contactNumber });
      alert("Registration successful. Please login.");
      navigate("/login");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!otp || otp.length !== 6) {
      setLoading(false);
      return setError("Please enter a valid 6-digit OTP");
    }

    try {
      await verifyOTP(email, otp);
      setStep(3); // Move to password step
    } catch (err) {
      setError(err.response?.data?.message || "OTP verification failed");
    } finally {
      setLoading(false);
    }
  };

  // Handle resend OTP
  const handleResendOTP = async () => {
    setError("");
    setLoading(true);

    try {
      await resendOTP(email);
      startResendCooldown();
      alert("New OTP sent to your email!");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to resend OTP");
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Set password and complete registration
  const handleSetPassword = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!password || !confirmPassword) {
      setLoading(false);
      return setError("Please enter and confirm your password");
    }
    if (password.length < 6) {
      setLoading(false);
      return setError("Password must be at least 6 characters");
    }
    if (password !== confirmPassword) {
      setLoading(false);
      return setError("Passwords do not match");
    }

    try {
      await completeIIITSignup(email, password);
      alert("Registration completed successfully! Please login.");
      navigate("/login");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to complete registration");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: OTP verification screen
  if (step === 2) {
    return (
      <div className="auth-page">
        <div className="auth-card" style={{ maxWidth: 450, textAlign: "center" }}>
          <div style={{ fontSize: "48px", marginBottom: "10px" }}>📧</div>
          <h2>Verify Your Email</h2>
          <p style={{ color: "#6b7280", marginBottom: "20px" }}>
            We've sent a 6-digit OTP to <strong>{email}</strong>
          </p>

          <form onSubmit={handleVerifyOTP}>
            <div className="form-group">
              <label>Enter OTP</label>
              <input
                type="text"
                placeholder="Enter 6-digit OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength={6}
                style={{
                  textAlign: "center",
                  fontSize: "24px",
                  letterSpacing: "8px",
                  fontWeight: "bold"
                }}
              />
            </div>

            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? "Verifying..." : "Verify OTP"}
            </button>
          </form>

          {error && <p className="error-text mt-sm">{error}</p>}

          <div style={{ marginTop: "20px" }}>
            <p style={{ color: "#6b7280", fontSize: "14px" }}>
              Didn't receive the OTP?{" "}
              {resendCooldown > 0 ? (
                <span>Resend in {resendCooldown}s</span>
              ) : (
                <button
                  onClick={handleResendOTP}
                  disabled={loading}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#2563eb",
                    cursor: "pointer",
                    textDecoration: "underline"
                  }}
                >
                  Resend OTP
                </button>
              )}
            </p>
          </div>

          <div style={{
            background: "#fef3c7",
            border: "1px solid #f59e0b",
            borderRadius: "8px",
            padding: "12px",
            marginTop: "20px"
          }}>
            <p style={{ color: "#92400e", margin: 0, fontSize: "14px" }}>
              ⚠️ OTP expires in 10 minutes
            </p>
          </div>

          <button
            onClick={() => { setStep(1); setOtp(""); setError(""); }}
            style={{
              marginTop: "20px",
              background: "none",
              border: "none",
              color: "#6b7280",
              cursor: "pointer",
              textDecoration: "underline"
            }}
          >
            ← Back to signup form
          </button>
        </div>
      </div>
    );
  }

  // Step 3: Set password screen
  if (step === 3) {
    return (
      <div className="auth-page">
        <div className="auth-card" style={{ maxWidth: 450 }}>
          <div style={{ textAlign: "center", marginBottom: "20px" }}>
            <div style={{ fontSize: "48px", marginBottom: "10px" }}>✅</div>
            <h2>Email Verified!</h2>
            <p style={{ color: "#6b7280" }}>
              Welcome, <strong>{firstName}</strong>! Set your password to complete registration.
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

  // Step 1: Initial signup form
  return (
    <div className="auth-page">
      <div className="auth-card" style={{ maxWidth: 520 }}>
        <h2>Create Account</h2>
        <p className="auth-subtitle">Join Felicity and explore events</p>

        <form onSubmit={handleSignup}>
          <div className="form-row">
            <div className="form-group">
              <label>First Name</label>
              <input placeholder="John" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Last Name</label>
              <input placeholder="Doe" value={lastName} onChange={(e) => setLastName(e.target.value)} />
            </div>
          </div>

          <div className="form-group">
            <label>Email</label>
            <input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>

          <div className="form-group">
            <label>Contact Number</label>
            <input placeholder="10 digit number" value={contactNumber} onChange={(e) => setContactNumber(e.target.value)} maxLength={10} />
          </div>

          <div className="form-group">
            <label>Participant Type</label>
            <select
              value={participantType}
              onChange={(e) => {
                setParticipantType(e.target.value);
                if (e.target.value === "IIIT") setCollegeOrOrgName("IIIT Hyderabad");
                else setCollegeOrOrgName("");
              }}
            >
              <option value="NON-IIIT">Non-IIIT</option>
              <option value="IIIT">IIIT Student</option>
            </select>
          </div>

          <div className="form-group">
            <label>College / Organization</label>
            <input
              placeholder="Your college or organization"
              value={collegeOrOrgName}
              onChange={(e) => setCollegeOrOrgName(e.target.value)}
            />
          </div>

          {/* Only show password fields for Non-IIIT users */}
          {participantType === "NON-IIIT" && (
            <div className="form-row">
              <div className="form-group">
                <label>Password</label>
                <input type="password" placeholder="Min 6 characters" value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Confirm Password</label>
                <input type="password" placeholder="Re-enter password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
              </div>
            </div>
          )}

          {/* Info message for IIIT users */}
          {participantType === "IIIT" && (
            <div style={{
              background: "#dbeafe",
              border: "1px solid #3b82f6",
              borderRadius: "8px",
              padding: "12px",
              marginBottom: "16px"
            }}>
              <p style={{ color: "#1e40af", margin: 0, fontSize: "14px" }}>
                ℹ️ An OTP will be sent to your IIIT email for verification. You'll set your password after verifying.
              </p>
            </div>
          )}

          <button type="submit" className="btn-primary w-full" disabled={loading} style={{ marginTop: 16 }}>
            {loading ? "Please wait..." : (participantType === "IIIT" ? "Send OTP" : "Create Account")}
          </button>
        </form>

        {error && <p className="error-text mt-sm">{error}</p>}

        <p className="auth-footer">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
}