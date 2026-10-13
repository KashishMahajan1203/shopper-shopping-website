import React from "react";
import { Link } from "react-router-dom";
import Item, { ItemSkeleton } from "../Item/Item";
import "./ProductSection.css";

// A titled row/grid of product cards with loading and error states.
const ProductSection = ({ id, title, subtitle, products, loading, error, link, skeletons = 4 }) => (
  <section className="section" id={id}>
    <div className="section-head">
      <div>
        <h2>{title}</h2>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {link && (
        <Link to={link} className="section-link">
          View all →
        </Link>
      )}
    </div>
    {error ? (
      <p className="section-error">Couldn't load products. {error}</p>
    ) : (
      <div className="product-grid">
        {loading
          ? Array.from({ length: skeletons }, (_, i) => <ItemSkeleton key={i} />)
          : products.map((product) => <Item key={product.id} product={product} />)}
      </div>
    )}
  </section>
);

export default ProductSection;
