export const ORDER_STEPS = [
  { key: "placed", label: "Order placed" },
  { key: "shipped", label: "Shipped" },
  { key: "out_for_delivery", label: "Out for delivery" },
  { key: "delivered", label: "Delivered" },
];

export const STATUS_LABELS = {
  placed: { label: "Placed", tone: "badge-success" },
  shipped: { label: "Shipped", tone: "badge-warning" },
  out_for_delivery: { label: "Out for delivery", tone: "badge-warning" },
  delivered: { label: "Delivered", tone: "badge-success" },
  cancelled: { label: "Cancelled", tone: "badge-danger" },
};

export const formatDate = (date, withTime = false) =>
  new Date(date).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    ...(withTime ? { hour: "numeric", minute: "2-digit" } : {}),
  });
