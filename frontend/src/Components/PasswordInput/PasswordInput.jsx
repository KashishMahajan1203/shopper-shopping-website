import React, { useState } from "react";
import "./PasswordInput.css";

// Password field with a show/hide toggle. Other props go to the <input>.
const PasswordInput = (props) => {
  const [visible, setVisible] = useState(false);
  return (
    <div className="password-input">
      <input {...props} className="input" type={visible ? "text" : "password"} />
      <button
        type="button"
        className="password-toggle"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Hide password" : "Show password"}
        title={visible ? "Hide password" : "Show password"}
      >
        {visible ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 3l18 18" />
            <path d="M10.6 5.1A10.6 10.6 0 0 1 12 5c6 0 9.5 7 9.5 7a17 17 0 0 1-3.2 4.1M6.6 6.6C3.9 8.3 2.5 12 2.5 12s3.5 7 9.5 7c1.8 0 3.3-.5 4.6-1.2" />
            <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2.5 12S6 5 12 5s9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        )}
      </button>
    </div>
  );
};
export default PasswordInput;
