import React, { useContext } from "react";
import { Link } from "react-router-dom";
import { ShopContext } from "../Context/ShopContext";
import Item, { ItemSkeleton } from "../Components/Item/Item";
import "./CSS/Account.css";

const Wishlist = () => {
  const { wishlist, products, user } = useContext(ShopContext);
  const items = wishlist.map((id) => products[id]).filter(Boolean);
  const loading = items.length < wishlist.length;

  return (
    <div className="container account-page">
      <h1>My Wishlist</h1>
      <p className="account-subtitle">
        {wishlist.length} saved item{wishlist.length === 1 ? "" : "s"}
        {!user && wishlist.length > 0 && (
          <>
            {" · "}
            <Link to="/login">Log in</Link> to keep them saved to your account
          </>
        )}
      </p>

      {wishlist.length === 0 ? (
        <div className="account-empty">
          <h2>Your wishlist is empty</h2>
          <p>Tap the ♡ on any product to save it here.</p>
          <Link to="/" className="btn btn-primary">
            Explore products
          </Link>
        </div>
      ) : (
        <div className="product-grid">
          {items.map((product) => (
            <Item key={product.id} product={product} />
          ))}
          {loading &&
            Array.from({ length: wishlist.length - items.length }, (_, i) => <ItemSkeleton key={`s${i}`} />)}
        </div>
      )}
    </div>
  );
};
export default Wishlist;
