import React from "react";
import "./NewCollections.css";
import ProductSection from "../ProductSection/ProductSection";
import useProducts from "../../hooks/useProducts";

const NewCollections = () => {
  const { products, loading, error } = useProducts("/products?sort=discount&limit=8");
  return (
    <div className="container">
      <ProductSection
        id="new-collections"
        title="New Collections"
        subtitle="Just landed — with the biggest discounts"
        link="/search"
        products={products}
        loading={loading}
        error={error}
        skeletons={8}
      />
    </div>
  );
};
export default NewCollections;
