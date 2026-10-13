import React, { useContext, useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { ShopContext } from "../Context/ShopContext";
import { apiFetch, formatPrice, getErrorMessage, productImage } from "../utils";
import { STATUS_LABELS, formatDate } from "./orderStatus";
import "./CSS/Account.css";

const Orders = () => {
  const { user } = useContext(ShopContext);
  const [orders, setOrders] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) return;
    apiFetch("/user/orders")
      .then((data) => setOrders(data.orders))
      .catch((err) => setError(getErrorMessage(err)));
  }, [user]);

  if (!user) {
    return <Navigate to="/login" state={{ from: "/orders" }} replace />;
  }

  return (
    <div className="container account-page">
      <h1>My Orders</h1>
      <p className="account-subtitle">Track, review or cancel your orders</p>

      {error && <p className="account-error">{error}</p>}
      {!error && orders === null && <div className="skeleton" style={{ height: 160 }} />}

      {orders && orders.length === 0 && (
        <div className="account-empty">
          <h2>No orders yet</h2>
          <p>When you place an order, it will show up here.</p>
          <Link to="/" className="btn btn-primary">
            Start shopping
          </Link>
        </div>
      )}

      {orders && orders.length > 0 && (
        <div className="orders-list">
          {orders.map((order) => {
            const status = STATUS_LABELS[order.status] || { label: order.status, tone: "badge-muted" };
            return (
              <Link to={`/orders/${order._id}`} className="order-card" key={order._id}>
                <div className="order-head">
                  <div>
                    <p className="order-label">Order placed</p>
                    <p>{formatDate(order.paidAt || order.createdAt)}</p>
                  </div>
                  <div>
                    <p className="order-label">Total</p>
                    <p>{formatPrice(order.amount)}</p>
                  </div>
                  <div className="order-id">
                    <p className="order-label">Order ID</p>
                    <p>#{order._id.slice(-8).toUpperCase()}</p>
                  </div>
                  <span className={`badge ${status.tone} order-status`}>{status.label}</span>
                </div>
                <div className="order-items">
                  {order.items.map((item) => (
                    <div className="order-item" key={`${item.productId}_${item.size}`}>
                      {item.image && <img src={productImage(item.image)} alt="" />}
                      <div>
                        <p className="order-item-name">{item.name}</p>
                        <p className="order-item-meta">
                          Size {item.size} · Qty {item.quantity} · {formatPrice(item.price)} each
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="order-view">View details →</p>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};
export default Orders;
