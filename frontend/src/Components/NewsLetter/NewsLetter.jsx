import React, { useState } from "react";
import "./NewsLetter.css";

const NewsLetter = () => {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubscribed(true);
    setEmail("");
  };

  return (
    <section className="container section">
      <div className="newsletter">
        <h2>Get exclusive offers in your inbox</h2>
        <p>Subscribe to our newsletter and stay updated on new arrivals.</p>
        {subscribed ? (
          <p className="newsletter-success">Thanks for subscribing!</p>
        ) : (
          <form className="newsletter-form" onSubmit={handleSubmit}>
            <input
              className="input"
              type="email"
              placeholder="Your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <button type="submit" className="btn btn-primary">
              Subscribe
            </button>
          </form>
        )}
      </div>
    </section>
  );
};
export default NewsLetter;
