import React from "react";
import ProductSection from "../ProductSection/ProductSection";
import useProducts from "../../hooks/useProducts";

const Popular = () => {
  const { products, loading, error } = useProducts("/products?category=women&sort=rating&limit=4");
  return (
    <div className="container">
      <ProductSection
        title="Popular in Women"
        subtitle="Our most loved pieces this week"
        link="/womens"
        products={products}
        loading={loading}
        error={error}
      />
    </div>
  );
};
export default Popular;
