import React from "react";
import "./CSS/ShopCategory.css";
import ProductListing from "../Components/ProductListing/ProductListing";

const ShopCategory = (props) => {
  return (
    <div className="container shop-category">
      <img className="shopcategory-banner" src={props.banner} alt={`${props.title} collection`} />
      <div className="shopcategory-heading">
        <h1>{props.title}</h1>
      </div>
      <ProductListing category={props.category} />
    </div>
  );
};
export default ShopCategory;
