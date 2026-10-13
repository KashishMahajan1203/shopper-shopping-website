import React from "react";
import { Link } from "react-router-dom";
import "./Hero.css";
import hero_image from "../Assets/hero_image.png";

const Hero = () => {
  return (
    <section className="hero">
      <div className="container hero-inner">
        <div className="hero-left">
          <span className="hero-eyebrow">New arrivals</span>
          <h1>Fresh styles for every season</h1>
          <p>
            Discover the latest collection for men, women and kids. Quality
            pieces at prices you'll love.
          </p>
          <div className="hero-actions">
            <a href="#new-collections" className="btn btn-primary">
              Shop new collection
            </a>
            <Link to="/womens" className="btn btn-outline">
              Browse women
            </Link>
          </div>
          <ul className="hero-stats">
            <li>
              <strong>36+</strong>
              <span>Products</span>
            </li>
            <li>
              <strong>Free</strong>
              <span>Shipping</span>
            </li>
            <li>
              <strong>50%</strong>
              <span>Off best sellers</span>
            </li>
          </ul>
        </div>
        <div className="hero-right">
          <img src={hero_image} alt="Model wearing the new collection" />
        </div>
      </div>
    </section>
  );
};
export default Hero;
