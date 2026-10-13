import React from "react";
import "./RelatedProducts.css";
import ProductSection from "../ProductSection/ProductSection";
import useProducts from "../../hooks/useProducts";

const RelatedProducts = ({ productId }) => {
  const { products, loading, error } = useProducts(`/products/${productId}/related`);
  return (
    <div className="relatedproducts">
      <ProductSection
        title="Related Products"
        subtitle="More from this category"
        products={products}
        loading={loading}
        error={error}
      />
    </div>
  );
};
export default RelatedProducts;
