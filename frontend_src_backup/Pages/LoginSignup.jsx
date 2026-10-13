import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import { handleError, handleSuccess } from "../utils";
import './CSS/LoginSignup.css';

function LoginSignup() {
  const [signupInfo, setSignupInfo] = useState({
    name: "",
    email: "",
    password: "",
  });

  const navigate = useNavigate();
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
      return handleError("name, email and password are required");
    }
    try {
      const url = `http://localhost:8080/auth/signup`;
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(signupInfo),
      });
      const result = await response.json();
      if (!response.ok) {
        handleError(result.message || 'Signup failed');
        return;
      }
      
      if (result.success) {
        handleSuccess(result.message);
        setTimeout(() => {
          navigate("/login");
        }, 1000);
      } else {
        handleError(result.message || 'Signup failed');
      }
    } catch (err) {
      handleError(err);
    }
  };

  return (
    <div className="loginsignup">
      <div className="loginsignup-container">
        <h1>Sign Up</h1>
        <form className="loginsignup-fields" onSubmit={handleSignup}>
          <label htmlFor="name">
            Name
            <input
              onChange={handleChange}
              type="text"
              name="name"
              placeholder="Enter Your Name"
            />
          </label>
          <label htmlFor="email">
            Email
            <input
              onChange={handleChange}
              type="email"
              name="email"
              placeholder="Enter Email Address"
            />
          </label>
          <label htmlFor="password">
            Password
            <input
              onChange={handleChange}
              type="password"
              name="password"
              placeholder="Enter Your Password"
            />
          </label>
          <button type="submit">Continue</button>
        </form>

        <p className="loginsignup-login">
          Already have an account?
          <Link to="/login" style={{ textDecoration: "none" }}>
            <span>Login here</span>
          </Link>
        </p>
        <ToastContainer />

        <div className="loginsignup-agree">
          <input type="checkbox" name="" id="" />
          <p>By continuing, I agree to the terms of use &amp; privacy policy.</p>
        </div>
      </div>
    </div>
  );
}

export default LoginSignup;
