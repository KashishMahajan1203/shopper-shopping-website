import React, { useContext, useEffect, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import "./CSS/Checkout.css";
import { ShopContext } from "../Context/ShopContext";
import AddressForm from "../Components/AddressForm/AddressForm";
import {
  apiFetch,
  formatPrice,
  getErrorMessage,
  handleError,
  handleInfo,
  handleSuccess,
  loadRazorpay,
  productImage,
} from "../utils";

const Checkout = () => {
  const {
    user,
    synced,
    logout,
    addresses,
    setAddresses,
    getCartLines,
    getCartList,
    getTotalCartAmount,
    getTotalCartItems,
    removeLines,
  } = useContext(ShopContext);
  const navigate = useNavigate();

  const [selectedId, setSelectedId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);
  const [couponInput, setCouponInput] = useState("");
  const [coupon, setCoupon] = useState(null);
  const [offers, setOffers] = useState([]);
  const [paying, setPaying] = useState(false);

  const lines = getCartLines();
  const subtotal = getTotalCartAmount();
  const discount = coupon?.discount || 0;
  const total = subtotal - discount;

  // Pick the default address once addresses are loaded.
  useEffect(() => {
    if (!addresses.length) {
      setSelectedId(null);
      setShowForm(true);
      return;
    }
    setShowForm(false);
    setSelectedId((current) =>
      addresses.some((a) => a._id === current)
        ? current
        : (addresses.find((a) => a.isDefault) || addresses[0])._id
    );
  }, [addresses]);

  useEffect(() => {
    apiFetch("/coupons")
      .then((data) => setOffers(data.coupons))
      .catch(() => {});
  }, []);

  if (!user) return <Navigate to="/login" state={{ from: "/checkout" }} replace />;
  // Wait until the saved cart/addresses have loaded before deciding anything.
  if (!synced || lines.length < getCartList().length) {
    return (
      <div className="container checkout">
        <div className="skeleton" style={{ height: 360 }} />
      </div>
    );
  }
  if (getTotalCartItems() === 0) return <Navigate to="/cart" replace />;

  const handleAuthError = (err) => {
    if (err.status === 401) {
      logout("Your session has expired. Please log in again.");
      navigate("/login", { state: { from: "/checkout" } });
      return true;
    }
    return false;
  };

  const saveAddress = async (values) => {
    setSavingAddress(true);
    try {
      const data = await apiFetch("/user/addresses", { method: "POST", body: values });
      setAddresses(data.addresses);
      setSelectedId(data.address._id);
      setShowForm(false);
      handleSuccess("Address saved");
    } catch (err) {
      if (!handleAuthError(err)) handleError(getErrorMessage(err));
    } finally {
      setSavingAddress(false);
    }
  };

  const deleteAddress = async (id) => {
    if (!window.confirm("Remove this address?")) return;
    try {
      const data = await apiFetch(`/user/addresses/${id}`, { method: "DELETE" });
      setAddresses(data.addresses);
      handleInfo("Address removed");
    } catch (err) {
      if (!handleAuthError(err)) handleError(getErrorMessage(err));
    }
  };

  const applyCoupon = async (code) => {
    if (!code.trim()) return;
    try {
      const data = await apiFetch("/payment/apply-coupon", {
        method: "POST",
        body: { code, cart: getCartList() },
      });
      setCoupon(data);
      setCouponInput(data.code);
      handleSuccess(`${data.code} applied — you save ${formatPrice(data.discount)}`);
    } catch (err) {
      if (!handleAuthError(err)) {
        setCoupon(null);
        handleError(getErrorMessage(err));
      }
    }
  };

  const handlePay = async () => {
    if (!selectedId) {
      handleError("Please add a delivery address");
      return;
    }
    setPaying(true);
    try {
      if (!(await loadRazorpay())) {
        throw new Error("Could not load the payment window. Check your internet connection.");
      }
      const cartList = getCartList();
      // The backend checks stock, address and coupon, and calculates the amount.
      const order = await apiFetch("/payment/create-order", {
        method: "POST",
        body: { cart: cartList, addressId: selectedId, couponCode: coupon?.code },
      });
      const address = addresses.find((a) => a._id === selectedId);

      const razorpay = new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        order_id: order.orderId,
        name: "Shopper",
        description: `${getTotalCartItems()} item(s)`,
        prefill: { name: user.name, email: user.email, contact: address?.phone },
        theme: { color: "#18181b" },
        handler: async (response) => {
          try {
            await apiFetch("/payment/verify", { method: "POST", body: response });
            // Navigate first so the empty-cart redirect on this page doesn't kick in.
            navigate(`/orders/${order.dbOrderId}`, { replace: true });
            removeLines(cartList);
            handleSuccess("Payment successful! Your order has been placed.");
          } catch (err) {
            handleError(getErrorMessage(err));
          } finally {
            setPaying(false);
          }
        },
        modal: {
          ondismiss: () => {
            setPaying(false);
            handleInfo("Payment cancelled");
          },
        },
      });
      razorpay.on("payment.failed", (response) => {
        handleError(response.error?.description || "Payment failed. Please try again.");
      });
      razorpay.open();
    } catch (err) {
      setPaying(false);
      if (!handleAuthError(err)) handleError(getErrorMessage(err));
    }
  };

  return (
    <div className="container checkout">
      <h1>Checkout</h1>
      <div className="checkout-layout">
        <div className="checkout-main">
          {/* 1. Address */}
          <section className="checkout-card">
            <div className="checkout-card-head">
              <h2><span>1</span> Delivery address</h2>
              {addresses.length > 0 && !showForm && (
                <button className="checkout-link" onClick={() => setShowForm(true)}>
                  + Add new address
                </button>
              )}
            </div>
            {addresses.length > 0 && (
              <div className="address-list">
                {addresses.map((a) => (
                  <label key={a._id} className={`address-option ${selectedId === a._id ? "selected" : ""}`}>
                    <input
                      type="radio"
                      name="address"
                      checked={selectedId === a._id}
                      onChange={() => setSelectedId(a._id)}
                    />
                    <div>
                      <p className="address-name">
                        {a.fullName} {a.isDefault && <span className="badge badge-muted">Default</span>}
                      </p>
                      <p>
                        {a.line1}
                        {a.line2 && `, ${a.line2}`}, {a.city}, {a.state} - {a.pincode}
                      </p>
                      <p>Phone: {a.phone}</p>
                    </div>
                    <button type="button" className="address-remove" onClick={() => deleteAddress(a._id)}>
                      Remove
                    </button>
                  </label>
                ))}
              </div>
            )}
            {showForm && (
              <AddressForm
                onSubmit={saveAddress}
                saving={savingAddress}
                onCancel={addresses.length ? () => setShowForm(false) : undefined}
              />
            )}
          </section>

          {/* 2. Coupon */}
          <section className="checkout-card">
            <div className="checkout-card-head">
              <h2><span>2</span> Apply coupon</h2>
            </div>
            {coupon ? (
              <div className="coupon-applied">
                <div>
                  <strong>{coupon.code}</strong> applied — you save {formatPrice(coupon.discount)}
                  <p>{coupon.description}</p>
                </div>
                <button className="checkout-link" onClick={() => { setCoupon(null); setCouponInput(""); }}>
                  Remove
                </button>
              </div>
            ) : (
              <>
                <form
                  className="coupon-form"
                  onSubmit={(e) => {
                    e.preventDefault();
                    applyCoupon(couponInput);
                  }}
                >
                  <input
                    className="input"
                    placeholder="Enter coupon code"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                  />
                  <button className="btn btn-outline" type="submit">Apply</button>
                </form>
                {offers.length > 0 && (
                  <div className="coupon-offers">
                    {offers.map((o) => (
                      <button key={o.code} className="coupon-offer" onClick={() => applyCoupon(o.code)}>
                        <strong>{o.code}</strong>
                        <span>{o.description}</span>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </section>
        </div>

        {/* 3. Summary */}
        <aside className="checkout-card checkout-summary">
          <h2>Order summary</h2>
          <ul className="checkout-items">
            {lines.map(({ product, size, quantity }) => (
              <li key={`${product.id}_${size}`}>
                <img src={productImage(product.image)} alt="" />
                <div>
                  <p className="checkout-item-name">{product.name}</p>
                  <p className="checkout-item-meta">Size {size} · Qty {quantity}</p>
                </div>
                <span>{formatPrice(product.new_price * quantity)}</span>
              </li>
            ))}
          </ul>
          <div className="checkout-row"><span>Subtotal</span><span>{formatPrice(subtotal)}</span></div>
          {discount > 0 && (
            <div className="checkout-row checkout-discount">
              <span>Discount ({coupon.code})</span><span>−{formatPrice(discount)}</span>
            </div>
          )}
          <div className="checkout-row"><span>Shipping</span><span className="cartitems-free">Free</span></div>
          <div className="checkout-row checkout-total"><span>Total</span><span>{formatPrice(total)}</span></div>
          <button className="btn btn-primary btn-block" onClick={handlePay} disabled={paying || !selectedId}>
            {paying ? "Processing…" : `Pay ${formatPrice(total)}`}
          </button>
          <p className="checkout-secure">🔒 Secure payment via Razorpay</p>
          <Link to="/cart" className="checkout-back">← Back to cart</Link>
        </aside>
      </div>
    </div>
  );
};

export default Checkout;
