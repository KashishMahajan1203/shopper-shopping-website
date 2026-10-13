import React from "react";
import { Link } from "react-router-dom";
import "./Offers.css";
import exclusive_image from "../Assets/exclusive_image.png";

const Offers = () => {
  return (
    <section className="container">
      <div className="offers">
        <div className="offers-left">
          <span className="offers-tag">Limited time</span>
          <h2>Exclusive offers for you</h2>
          <p>Up to 50% off on our best-selling products.</p>
          <Link to="/womens" className="btn btn-primary">
            Check now
          </Link>
        </div>
        <div className="offers-right">
          <img src={exclusive_image} alt="Exclusive offer" />
        </div>
      </div>
    </section>
  );
};
export default Offers;
