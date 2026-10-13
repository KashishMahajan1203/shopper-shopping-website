import React from "react";
import "./CSS/ShopCategory.css";
import ProductListing from "../Components/ProductListing/ProductListing";

const Search = () => (
  <div className="container shop-category">
    <div className="shopcategory-heading">
      <h1>All Products</h1>
      <p>Search and filter across men, women and kids.</p>
    </div>
    <ProductListing />
  </div>
);

export default Search;
