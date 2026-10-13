import React, { useContext } from "react";
import "./Item.css";
import { Link } from "react-router-dom";
import { ShopContext } from "../../Context/ShopContext";
import {
  formatPrice,
  handleInfo,
  handleSuccess,
  isOutOfStock,
  productImage,
} from "../../utils";

export const HeartIcon = ({ filled }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 20s-7-4.4-9.2-8.6C1.3 8.4 3 5 6.3 5c2 0 3.2 1.1 3.9 2.2.7-1.1 1.9-2.2 3.9-2.2C17.4 5 19 8.4 17.6 11.4 15.4 15.6 12 20 12 20z" transform="translate(1 0)" />
  </svg>
);

const Item = ({ product }) => {
  const { toggleWishlist, isInWishlist } = useContext(ShopContext);
  const discount = Math.round((1 - product.new_price / product.old_price) * 100);
  const saved = isInWishlist(product.id);
  const soldOut = isOutOfStock(product);

  const handleWishlist = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (toggleWishlist(product.id)) {
      handleSuccess("Added to wishlist");
    } else {
      handleInfo("Removed from wishlist");
    }
  };

  return (
    <Link to={`/product/${product.id}`} className={`item ${soldOut ? "item-soldout" : ""}`}>
      <div className="item-image">
        <img src={productImage(product.image)} alt={product.name} loading="lazy" />
        {soldOut ? (
          <span className="item-badge item-badge-muted">Sold out</span>
        ) : (
          discount > 0 && <span className="item-badge">-{discount}%</span>
        )}
        <button
          className={`item-wishlist ${saved ? "saved" : ""}`}
          onClick={handleWishlist}
          aria-label={saved ? "Remove from wishlist" : "Add to wishlist"}
        >
          <HeartIcon filled={saved} />
        </button>
      </div>
      <p className="item-name">{product.name}</p>
      {product.numReviews > 0 && (
        <p className="item-rating">
          ★ {product.rating.toFixed(1)} <span>({product.numReviews})</span>
        </p>
      )}
      <div className="item-prices">
        <span className="item-price-new">{formatPrice(product.new_price)}</span>
        <span className="item-price-old">{formatPrice(product.old_price)}</span>
      </div>
    </Link>
  );
};

export const ItemSkeleton = () => (
  <div className="item">
    <div className="item-image skeleton" />
    <div className="skeleton" style={{ height: 14, marginTop: 10, width: "85%" }} />
    <div className="skeleton" style={{ height: 14, width: "40%" }} />
  </div>
);

export default Item;
