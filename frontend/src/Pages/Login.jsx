import React, { useContext, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { API_URL, getErrorMessage, handleError, handleSuccess } from "../utils";
import { ShopContext } from "../Context/ShopContext";
import PasswordInput from "../Components/PasswordInput/PasswordInput";
import "./CSS/LoginSignup.css";

function Login() {
  const [loginInfo, setLoginInfo] = useState({
    email: "",
    password: "",
  });

  const navigate = useNavigate();
  const { login } = useContext(ShopContext);
  const location = useLocation();
  // Page to return to after login (e.g. the cart when checking out).
  const from = location.state?.from || "/";

  const handleChange = (e) => {
    const { name, value } = e.target;
    const copyLoginInfo = { ...loginInfo };
    copyLoginInfo[name] = value;
    setLoginInfo(copyLoginInfo);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    const { email, password } = loginInfo;
    if (!email || !password) {
      return handleError("Email and password are required");
    }
    try {
      const url = `${API_URL}/auth/login`;
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(loginInfo),
      });
      const result = await response.json();
      const { success, message, jwtToken, name, error } = result;
      if (success) {
        login(jwtToken, name);
        handleSuccess(`Welcome back, ${name}! You are now logged in.`);
        navigate(from, { replace: true });
      } else {
        handleError(message || error?.details?.[0]?.message || "Login failed");
      }
    } catch (err) {
      handleError(getErrorMessage(err));
    }
  };

  return (
    <div className="loginsignup">
      <div className="loginsignup-container">
        <h1>Welcome back</h1>
        <p className="loginsignup-subtitle">
          {from === "/cart"
            ? "Please log in to continue to checkout."
            : "Log in to continue shopping."}
        </p>
        <form className="loginsignup-fields" onSubmit={handleLogin}>
          <label>
            Email
            <input
              className="input"
              onChange={handleChange}
              type="email"
              name="email"
              placeholder="you@example.com"
              required
              value={loginInfo.email}
            />
          </label>
          <label>
            Password
            <PasswordInput
              onChange={handleChange}
              name="password"
              placeholder="Enter your password"
              required
              value={loginInfo.password}
            />
          </label>
          <Link to="/forgot-password" className="loginsignup-forgot">
            Forgot password?
          </Link>
          <button type="submit" className="btn btn-primary btn-block">
            Log in
          </button>
        </form>

        <p className="loginsignup-switch">
          Don't have an account?{" "}
          <Link to="/signup" state={{ from }}>
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
