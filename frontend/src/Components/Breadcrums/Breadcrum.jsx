import React from "react";
import { Link } from "react-router-dom";
import "./Breadcrum.css";

const categoryPaths = { men: "/mens", women: "/womens", kid: "/kids" };

const Breadcrum = (props) => {
  const { product } = props;
  return (
    <nav className="breadcrum">
      <Link to="/">Home</Link>
      <span>/</span>
      <Link to={categoryPaths[product.category] || "/"}>{product.category}</Link>
      <span>/</span>
      <span className="breadcrum-current">{product.name}</span>
    </nav>
  );
};
export default Breadcrum;
