import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import { handleError, handleSuccess } from "../utils";
import "./CSS/LoginSignup.css";

function Login() {
  const [loginInfo, setLoginInfo] = useState({
    email: "",
    password: "",
  });

  const navigate = useNavigate();

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
      const url = `http://localhost:8080/auth/login`;
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
        handleSuccess(message);
        localStorage.setItem("token", jwtToken);
        localStorage.setItem("loggedInUser", name);
        setTimeout(() => {
          navigate("/");
        }, 1000);
      } else if (error) {
        const details = error?.details[0].message;
        handleError(details);
      } else {
        handleError(message);
      }
    } catch (err) {
      handleError(err);
    }
  };

  return (
    <div className="loginsignup">
      <div className="loginsignup-container">
        <h1>Login</h1>
        <form className="loginsignup-fields" onSubmit={handleLogin}>
          <label htmlFor="email">
            Email
            <input
              onChange={handleChange}
              type="email"
              name="email"
              placeholder="Enter Email Address"
              required
              value={loginInfo.email}
            />
          </label>
          <label htmlFor="password">
            Password
            <input
              onChange={handleChange}
              type="password"
              name="password"
              placeholder="Enter Your Password"
              required
              value={loginInfo.password}
            />
          </label>
          <button type="submit">Continue</button>
        </form>

        <p className="loginsignup-login">
          Don't have an account?
          <Link to="/signup" style={{ textDecoration: "none" }}>
            <span>Sign up</span>
          </Link>
        </p>
        <ToastContainer />
        <div className="loginsignup-agree">
          <input type="checkbox" name="terms" id="terms" />
          <p>By continuing, I agree to the terms of use & privacy policy.</p>
        </div>
      </div>
    </div>
  );
}

export default Login;
