import React, { useContext, useEffect, useState } from "react";
import { ShopContext } from "../Context/ShopContext";
import { Link, useLocation, useParams } from "react-router-dom";
import Breadcrum from "../Components/Breadcrums/Breadcrum";
import ProductDisplay from "../Components/ProductDisplay/ProductDisplay";
import DescriptionBox from "../Components/DescriptionBox/DescriptionBox";
import RelatedProducts from "../Components/RelatedProducts/RelatedProducts";
import RecentlyViewed from "../Components/RecentlyViewed/RecentlyViewed";
import { apiFetch, getErrorMessage } from "../utils";

const Product = () => {
  const { products, cacheProducts, addRecentlyViewed } = useContext(ShopContext);
  const { productId } = useParams();
  const id = Number(productId);
  const [status, setStatus] = useState({ loading: true, error: null, notFound: false });
  const product = products[id];
  const { hash } = useLocation();

  // Always refetch so stock and rating are fresh.
  useEffect(() => {
    let cancelled = false;
    setStatus({ loading: true, error: null, notFound: false });
    apiFetch(`/products/${id}`)
      .then((data) => {
        if (cancelled) return;
        cacheProducts([data.product]);
        addRecentlyViewed(id);
        setStatus({ loading: false, error: null, notFound: false });
      })
      .catch((err) => {
        if (cancelled) return;
        setStatus({ loading: false, error: getErrorMessage(err), notFound: err.status === 404 });
      });
    return () => {
      cancelled = true;
    };
  }, [id, cacheProducts, addRecentlyViewed]);

  // Links like /product/3#reviews scroll to the reviews once the page has loaded.
  useEffect(() => {
    if (hash === "#reviews" && !status.loading) {
      document.getElementById("reviews")?.scrollIntoView({ behavior: "smooth" });
    }
  }, [hash, status.loading]);

  const refreshProduct = (changes) => cacheProducts([{ ...product, ...changes }]);

  if (status.notFound || (!product && status.error)) {
    return (
      <div className="container section" style={{ textAlign: "center" }}>
        <h2>{status.notFound ? "Product not found" : "Couldn't load this product"}</h2>
        <p style={{ color: "var(--text-muted)", margin: "8px 0 20px" }}>
          {status.notFound ? "The product you're looking for doesn't exist." : status.error}
        </p>
        <Link to="/" className="btn btn-primary">
          Back to shop
        </Link>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container" style={{ padding: "64px 24px" }}>
        <div className="skeleton" style={{ height: 480 }} />
      </div>
    );
  }

  return (
    <div className="container">
      <Breadcrum product={product} />
      {/* key resets the selected size when moving to another product */}
      <ProductDisplay key={product.id} product={product} />
      <DescriptionBox product={product} onReviewed={refreshProduct} />
      <RelatedProducts productId={product.id} />
      <RecentlyViewed excludeId={product.id} />
    </div>
  );
};
export default Product;
