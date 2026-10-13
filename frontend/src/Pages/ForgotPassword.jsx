import React, { useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch, getErrorMessage, handleError } from "../utils";
import "./CSS/LoginSignup.css";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
      await apiFetch("/auth/forgot-password", { method: "POST", body: { email } });
      setSent(true);
    } catch (err) {
      handleError(getErrorMessage(err));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="loginsignup">
      <div className="loginsignup-container">
        <h1>Forgot password?</h1>
        {sent ? (
          <>
            <p className="loginsignup-subtitle">
              If an account exists for <strong>{email}</strong>, we've sent a link to reset your
              password. The link is valid for 15 minutes.
            </p>
            <Link to="/login" className="btn btn-primary btn-block loginsignup-gap">
              Back to login
            </Link>
          </>
        ) : (
          <>
            <p className="loginsignup-subtitle">
              Enter your email and we'll send you a link to reset your password.
            </p>
            <form className="loginsignup-fields" onSubmit={handleSubmit}>
              <label>
                Email
                <input
                  className="input"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </label>
              <button type="submit" className="btn btn-primary btn-block" disabled={sending}>
                {sending ? "Sending…" : "Send reset link"}
              </button>
            </form>
            <p className="loginsignup-switch">
              Remembered it? <Link to="/login">Log in</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
