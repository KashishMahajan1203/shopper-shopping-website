import React, { useContext, useState } from "react";
import "./ProductDisplay.css";
import { ShopContext } from "../../Context/ShopContext";
import {
  SIZES,
  formatPrice,
  handleError,
  handleInfo,
  handleSuccess,
  isOutOfStock,
  productImage,
} from "../../utils";
import { HeartIcon } from "../Item/Item";
import Stars from "../Stars/Stars";

const LOW_STOCK = 3;

const ProductDisplay = ({ product }) => {
  const { addToCart, getQuantity, toggleWishlist, isInWishlist } = useContext(ShopContext);
  const saved = isInWishlist(product.id);
  const [size, setSize] = useState(null);
  const discount = Math.round((1 - product.new_price / product.old_price) * 100);
  const stockOf = (s) => product.stock?.[s] || 0;
  const soldOut = isOutOfStock(product);
  const image = productImage(product.image);

  const inCart = SIZES
    .map((s) => ({ size: s, qty: getQuantity(product.id, s) }))
    .filter((entry) => entry.qty > 0);

  const handleAdd = () => {
    if (!size) {
      handleError("Please select a size first");
      return;
    }
    if (getQuantity(product.id, size) >= stockOf(size)) {
      handleError(`Only ${stockOf(size)} available in size ${size}`);
      return;
    }
    addToCart(product.id, size);
    handleSuccess(`${product.name} (Size ${size}) added to cart`);
  };

  const handleWishlist = () => {
    if (toggleWishlist(product.id)) {
      handleSuccess("Added to wishlist");
    } else {
      handleInfo("Removed from wishlist");
    }
  };

  const selectedStock = size ? stockOf(size) : null;

  return (
    <div className="productdisplay">
      <div className="productdisplay-left">
        <div className="productdisplay-img-list">
          {[0, 1, 2, 3].map((i) => (
            <img key={i} src={image} alt="" />
          ))}
        </div>
        <div className="productdisplay-img">
          <img src={image} alt={product.name} />
        </div>
      </div>

      <div className="productdisplay-right">
        <h1>{product.name}</h1>
        <a href="#reviews" className="productdisplay-stars">
          <Stars rating={product.rating} />
          <span className="productdisplay-review-count">
            {product.numReviews > 0
              ? `${product.rating.toFixed(1)} (${product.numReviews} review${product.numReviews === 1 ? "" : "s"})`
              : "No reviews yet"}
          </span>
        </a>

        <div className="productdisplay-prices">
          <span className="productdisplay-price-new">{formatPrice(product.new_price)}</span>
          <span className="productdisplay-price-old">{formatPrice(product.old_price)}</span>
          {discount > 0 && <span className="productdisplay-discount">Save {discount}%</span>}
        </div>

        <p className="productdisplay-description">{product.description}</p>

        <div className="productdisplay-size">
          <h3>Select size</h3>
          <div className="productdisplay-sizes">
            {SIZES.map((s) => (
              <button
                key={s}
                className={s === size ? "selected" : ""}
                onClick={() => setSize(s)}
                disabled={stockOf(s) === 0}
                title={stockOf(s) === 0 ? "Out of stock" : undefined}
              >
                {s}
              </button>
            ))}
          </div>
          {soldOut ? (
            <p className="productdisplay-stock out">This product is sold out</p>
          ) : (
            selectedStock !== null &&
            selectedStock <= LOW_STOCK && (
              <p className="productdisplay-stock low">Hurry! Only {selectedStock} left in size {size}</p>
            )
          )}
        </div>

        <div className="productdisplay-actions">
          <button className="btn btn-primary productdisplay-add" onClick={handleAdd} disabled={soldOut}>
            {soldOut ? "Sold out" : "Add to cart"}
          </button>
          <button
            className={`btn btn-outline productdisplay-wishlist ${saved ? "saved" : ""}`}
            onClick={handleWishlist}
          >
            <HeartIcon filled={saved} />
            {saved ? "Wishlisted" : "Wishlist"}
          </button>
        </div>
        {inCart.length > 0 && (
          <p className="productdisplay-incart">
            In your cart:{" "}
            {inCart.map((entry) => `${entry.size} × ${entry.qty}`).join(", ")}
          </p>
        )}

        <div className="productdisplay-meta">
          <p>
            <span>Category:</span> {{ men: "Men", women: "Women", kid: "Kids" }[product.category]}
          </p>
          <p>
            <span>Delivery:</span> Free delivery · Easy cancellation before shipping
          </p>
        </div>
      </div>
    </div>
  );
};
export default ProductDisplay;
