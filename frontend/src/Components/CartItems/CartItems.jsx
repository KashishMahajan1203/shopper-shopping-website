import React, { useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./CartItems.css";
import { ShopContext } from "../../Context/ShopContext";
import { formatPrice, handleError, handleInfo, productImage } from "../../utils";

const CartItems = () => {
  const {
    user,
    getTotalCartAmount,
    getTotalCartItems,
    getCartLines,
    cartItems,
    addToCart,
    removeFromCart,
    clearFromCart,
  } = useContext(ShopContext);

  const navigate = useNavigate();
  const lines = getCartLines();
  const total = getTotalCartAmount();
  const loading = lines.length < Object.keys(cartItems).length;
  const stockProblem = lines.some(({ product, size, quantity }) => quantity > (product.stock?.[size] || 0));

  const handleCheckout = () => {
    if (stockProblem) {
      handleError("Some items are not available in the quantity you selected");
      return;
    }
    if (!user) {
      handleInfo("Please log in or sign up to proceed to checkout");
      navigate("/login", { state: { from: "/checkout" } });
      return;
    }
    navigate("/checkout");
  };

  const handleIncrease = (product, size, quantity) => {
    if (quantity >= (product.stock?.[size] || 0)) {
      handleError(`Only ${product.stock?.[size] || 0} available in size ${size}`);
      return;
    }
    addToCart(product.id, size);
  };

  const handleRemove = (product, size) => {
    clearFromCart(product.id, size);
    handleInfo(`${product.name} (Size ${size}) removed from cart`);
  };

  if (Object.keys(cartItems).length === 0) {
    return (
      <div className="container cart-empty">
        <h1>Your cart is empty</h1>
        <p>Looks like you haven't added anything yet.</p>
        <Link to="/" className="btn btn-primary">
          Continue shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="container cartitems">
      <h1>Shopping Cart</h1>
      <p className="cartitems-count">{getTotalCartItems()} items</p>

      <div className="cartitems-layout">
        <div className="cartitems-list">
          {loading && <div className="skeleton" style={{ height: 120, margin: "20px 0" }} />}
          {lines.map(({ product: e, size, quantity }) => {
            const available = e.stock?.[size] || 0;
            return (
              <div className="cartitem" key={`${e.id}_${size}`}>
                <Link to={`/product/${e.id}`}>
                  <img src={productImage(e.image)} alt={e.name} className="cartitem-image" />
                </Link>
                <div className="cartitem-info">
                  <Link to={`/product/${e.id}`} className="cartitem-name">
                    {e.name}
                  </Link>
                  <p className="cartitem-price">
                    Size: <strong>{size}</strong> · {formatPrice(e.new_price)}
                  </p>
                  <div className="cartitem-qty">
                    <button onClick={() => removeFromCart(e.id, size)} aria-label="Decrease quantity">
                      −
                    </button>
                    <span>{quantity}</span>
                    <button
                      onClick={() => handleIncrease(e, size, quantity)}
                      aria-label="Increase quantity"
                      disabled={quantity >= available}
                    >
                      +
                    </button>
                  </div>
                  {available === 0 ? (
                    <p className="cartitem-warning">Out of stock — please remove this item</p>
                  ) : quantity > available ? (
                    <p className="cartitem-warning">Only {available} left — please reduce the quantity</p>
                  ) : (
                    available <= 3 && <p className="cartitem-low">Only {available} left in stock</p>
                  )}
                </div>
                <div className="cartitem-right">
                  <p className="cartitem-total">{formatPrice(e.new_price * quantity)}</p>
                  <button className="cartitem-remove" onClick={() => handleRemove(e, size)}>
                    Remove
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <aside className="cartitems-summary">
          <h2>Order Summary</h2>
          <div className="cartitems-summary-row">
            <span>Subtotal</span>
            <span>{formatPrice(total)}</span>
          </div>
          <div className="cartitems-summary-row">
            <span>Shipping</span>
            <span className="cartitems-free">Free</span>
          </div>
          <div className="cartitems-summary-row cartitems-summary-total">
            <span>Total</span>
            <span>{formatPrice(total)}</span>
          </div>
          <button className="btn btn-primary btn-block" onClick={handleCheckout} disabled={loading}>
            {user ? "Proceed to checkout" : "Login to checkout"}
          </button>
          <p className="cartitems-secure">Have a coupon? Apply it at checkout.</p>
        </aside>
      </div>
    </div>
  );
};
export default CartItems;
