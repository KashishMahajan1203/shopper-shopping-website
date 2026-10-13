import React, { useContext, useEffect, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { ShopContext } from "../Context/ShopContext";
import {
  apiFetch,
  formatPrice,
  getErrorMessage,
  handleError,
  handleSuccess,
  productImage,
} from "../utils";
import { ORDER_STEPS, STATUS_LABELS, formatDate } from "./orderStatus";
import "./CSS/Account.css";

const OrderDetail = () => {
  const { user } = useContext(ShopContext);
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (!user) return;
    apiFetch(`/user/orders/${orderId}`)
      .then((data) => setOrder(data.order))
      .catch((err) => setError(err.status === 404 ? "Order not found" : getErrorMessage(err)));
  }, [user, orderId]);

  if (!user) return <Navigate to="/login" state={{ from: `/orders/${orderId}` }} replace />;

  if (error) {
    return (
      <div className="container account-page">
        <div className="account-empty">
          <h2>{error}</h2>
          <p>We couldn't find this order in your account.</p>
          <Link to="/orders" className="btn btn-primary">Back to my orders</Link>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container account-page">
        <div className="skeleton" style={{ height: 320 }} />
      </div>
    );
  }

  const cancelled = order.status === "cancelled";
  const currentStep = ORDER_STEPS.findIndex((s) => s.key === order.status);
  const historyAt = (key) => order.statusHistory?.find((h) => h.status === key)?.at;
  const status = STATUS_LABELS[order.status] || { label: order.status, tone: "badge-muted" };
  const a = order.shippingAddress || {};

  const handleCancel = async () => {
    if (!window.confirm("Cancel this order? The full amount will be refunded.")) return;
    setCancelling(true);
    try {
      const data = await apiFetch(`/user/orders/${order._id}/cancel`, { method: "POST" });
      setOrder(data.order);
      handleSuccess(data.message);
    } catch (err) {
      handleError(getErrorMessage(err));
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="container account-page">
      <Link to="/orders" className="order-back">← My orders</Link>
      <div className="order-detail-head">
        <div>
          <h1>Order #{order._id.slice(-8).toUpperCase()}</h1>
          <p className="account-subtitle">Placed on {formatDate(order.paidAt || order.createdAt, true)}</p>
        </div>
        <span className={`badge ${status.tone}`}>{status.label}</span>
      </div>

      {/* Tracking timeline */}
      <section className="order-section">
        <h2>Tracking</h2>
        {cancelled ? (
          <p className="order-cancelled">
            This order was cancelled on {formatDate(historyAt("cancelled") || order.updatedAt, true)}.
            {order.razorpayRefundId && " Your refund has been initiated and will reach you in 5-7 working days."}
          </p>
        ) : (
          <ol className="timeline">
            {ORDER_STEPS.map((step, i) => {
              const done = i <= currentStep;
              const at = historyAt(step.key);
              return (
                <li key={step.key} className={done ? "done" : ""}>
                  <span className="timeline-dot">{done ? "✓" : i + 1}</span>
                  <div>
                    <p className="timeline-label">{step.label}</p>
                    {done && at && <p className="timeline-date">{formatDate(at, true)}</p>}
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </section>

      <div className="order-detail-grid">
        <section className="order-section">
          <h2>Items</h2>
          <div className="order-items">
            {order.items.map((item) => (
              <div className="order-item" key={`${item.productId}_${item.size}`}>
                {item.image && <img src={productImage(item.image)} alt="" />}
                <div>
                  <Link to={`/product/${item.productId}`} className="order-item-name">{item.name}</Link>
                  <p className="order-item-meta">
                    Size {item.size} · Qty {item.quantity} · {formatPrice(item.price * item.quantity)}
                  </p>
                  {!cancelled && (
                    <Link to={`/product/${item.productId}#reviews`} className="order-review-link">
                      Write a review
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="order-side">
          <section className="order-section">
            <h2>Delivery address</h2>
            <p className="order-address">
              <strong>{a.fullName}</strong><br />
              {a.line1}{a.line2 && `, ${a.line2}`}<br />
              {a.city}, {a.state} - {a.pincode}<br />
              Phone: {a.phone}
            </p>
          </section>

          <section className="order-section">
            <h2>Payment</h2>
            <div className="checkout-row-sm"><span>Subtotal</span><span>{formatPrice(order.subtotal ?? order.amount)}</span></div>
            {order.discount > 0 && (
              <div className="checkout-row-sm order-discount">
                <span>Discount ({order.couponCode})</span><span>−{formatPrice(order.discount)}</span>
              </div>
            )}
            <div className="checkout-row-sm"><span>Shipping</span><span>Free</span></div>
            <div className="checkout-row-sm order-total"><span>Total paid</span><span>{formatPrice(order.amount)}</span></div>
            <p className="order-payment-id">Payment ID: {order.razorpayPaymentId}</p>
          </section>

          {order.status === "placed" && (
            <button className="btn btn-outline btn-block order-cancel" onClick={handleCancel} disabled={cancelling}>
              {cancelling ? "Cancelling…" : "Cancel order"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;
