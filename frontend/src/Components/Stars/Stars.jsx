import React from "react";
import "./Stars.css";

// Read-only star rating (supports fractions, e.g. 4.3).
const Stars = ({ rating = 0, size = 16 }) => (
  <span
    className="stars"
    style={{ fontSize: size }}
    role="img"
    aria-label={`Rated ${rating.toFixed(1)} out of 5`}
  >
    <span className="stars-empty">★★★★★</span>
    <span className="stars-fill" style={{ width: `${(rating / 5) * 100}%` }}>
      ★★★★★
    </span>
  </span>
);

export default Stars;
