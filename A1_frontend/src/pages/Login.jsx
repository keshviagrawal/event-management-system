import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { loginUser } from "../services/authService";
import { setAuth, getToken, getRole } from "../utils/auth";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const token = getToken();
    const role = getRole();
    if (token && role) navigate(`/${role}`);
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    if (!email) return setError("Email is required");
    if (!password) return setError("Password is required");

    try {
      const data = await loginUser(email, password);
      setAuth(data.token, data.role);

      if (data.role === "participant" && !data.onboardingCompleted) {
        navigate("/onboarding");
      } else {
        navigate(`/${data.role}`);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Invalid email or password");
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2>Welcome Back</h2>
        <p className="auth-subtitle">Sign in to your Felicity account</p>

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button type="submit" className="btn-primary w-full">Login</button>
        </form>

        {error && <p className="error-text mt-sm">{error}</p>}

        <p className="auth-footer">
          New participant? <Link to="/signup">Create an account</Link>
        </p>
      </div>
    </div>
  );
}