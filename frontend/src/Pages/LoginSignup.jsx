import React, { useContext, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { API_URL, getErrorMessage, handleError, handleSuccess } from "../utils";
import { ShopContext } from "../Context/ShopContext";
import PasswordInput from "../Components/PasswordInput/PasswordInput";
import "./CSS/LoginSignup.css";

function LoginSignup() {
  const [signupInfo, setSignupInfo] = useState({
    name: "",
    email: "",
    password: "",
  });

  const navigate = useNavigate();
  const { login } = useContext(ShopContext);
  const location = useLocation();
  const from = location.state?.from || "/";
  const handleChange = (e) => {
    const { name, value } = e.target;
    const copySignupInfo = { ...signupInfo };
    copySignupInfo[name] = value;
    setSignupInfo(copySignupInfo);
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    const { name, email, password } = signupInfo;
    if (!name || !email || !password) {
      return handleError("Name, email and password are required");
    }
    try {
      const url = `${API_URL}/auth/signup`;
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(signupInfo),
      });
      const result = await response.json();
      if (!response.ok) {
        handleError(result.message || "Signup failed");
        return;
      }

      if (result.success) {
        // Signup also logs the user in, so they go straight back to shopping.
        login(result.jwtToken, result.name);
        handleSuccess(`Welcome, ${result.name}! Your account has been created.`);
        navigate(from, { replace: true });
      } else {
        handleError(result.message || "Signup failed");
      }
    } catch (err) {
      handleError(getErrorMessage(err));
    }
  };

  return (
    <div className="loginsignup">
      <div className="loginsignup-container">
        <h1>Create an account</h1>
        <p className="loginsignup-subtitle">
          {from === "/cart"
            ? "Create an account to continue to checkout."
            : "Sign up to start shopping."}
        </p>
        <form className="loginsignup-fields" onSubmit={handleSignup}>
          <label>
            Name
            <input
              className="input"
              onChange={handleChange}
              type="text"
              name="name"
              placeholder="Your full name"
              value={signupInfo.name}
            />
          </label>
          <label>
            Email
            <input
              className="input"
              onChange={handleChange}
              type="email"
              name="email"
              placeholder="you@example.com"
              value={signupInfo.email}
            />
          </label>
          <label>
            Password
            <PasswordInput
              onChange={handleChange}
              name="password"
              placeholder="Create a password"
              value={signupInfo.password}
            />
          </label>
          <label className="loginsignup-agree">
            <input type="checkbox" required />
            <span>I agree to the terms of use &amp; privacy policy.</span>
          </label>
          <button type="submit" className="btn btn-primary btn-block">
            Create account
          </button>
        </form>

        <p className="loginsignup-switch">
          Already have an account?{" "}
          <Link to="/login" state={{ from }}>
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default LoginSignup;
