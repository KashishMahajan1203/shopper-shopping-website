import React, { useContext, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ShopContext } from "../Context/ShopContext";
import PasswordInput from "../Components/PasswordInput/PasswordInput";
import { apiFetch, getErrorMessage, handleError, handleSuccess } from "../utils";
import "./CSS/LoginSignup.css";

const ResetPassword = () => {
  const { token } = useParams();
  const { login } = useContext(ShopContext);
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirm) return handleError("Passwords don't match");
    setSaving(true);
    try {
      const data = await apiFetch("/auth/reset-password", {
        method: "POST",
        body: { token, password },
      });
      login(data.jwtToken, data.name);
      handleSuccess("Password updated. You are now logged in.");
      navigate("/", { replace: true });
    } catch (err) {
      handleError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="loginsignup">
      <div className="loginsignup-container">
        <h1>Set a new password</h1>
        <p className="loginsignup-subtitle">Choose a new password for your account.</p>
        <form className="loginsignup-fields" onSubmit={handleSubmit}>
          <label>
            New password
            <PasswordInput
              placeholder="At least 4 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={4}
              required
            />
          </label>
          <label>
            Confirm password
            <PasswordInput
              placeholder="Type it again"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              minLength={4}
              required
            />
          </label>
          <button type="submit" className="btn btn-primary btn-block" disabled={saving}>
            {saving ? "Saving…" : "Update password"}
          </button>
        </form>
        <p className="loginsignup-switch">
          Link expired? <Link to="/forgot-password">Request a new one</Link>
        </p>
      </div>
    </div>
  );
};

export default ResetPassword;
