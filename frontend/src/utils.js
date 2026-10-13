import { toast } from "react-toastify";

// Backend address. Defaults to port 8080 on the same host the site was opened
// from, so it also works from a phone on the same Wi-Fi.
export const API_URL =
  process.env.REACT_APP_API_URL ||
  `${window.location.protocol}//${window.location.hostname}:8080`;

export const handleSuccess = (msg) => {
  toast.success(msg);
};

export const handleError = (msg) => {
  toast.error(msg);
};

export const handleInfo = (msg) => {
  toast.info(msg);
};

export const formatPrice = (amount) => `₹${Number(amount).toLocaleString("en-IN")}`;

// Product images are served by the backend.
export const productImage = (image) => `${API_URL}/images/products/${image}`;

export const SIZES = ["S", "M", "L", "XL", "XXL"];

export const isOutOfStock = (product) =>
  SIZES.every((size) => !(product.stock?.[size] > 0));

export const getToken = () => localStorage.getItem("token");

// fetch() throws a TypeError when the backend can't be reached.
export const getErrorMessage = (err) =>
  err instanceof TypeError
    ? "Unable to connect to the server. Please try again later."
    : err?.message || "Something went wrong";

// JSON request to the backend with the login token attached.
// Throws an Error (with .status) when the response is not OK.
export const apiFetch = async (path, { method = "GET", body } = {}) => {
  const headers = { "Content-Type": "application/json" };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok || result.success === false) {
    const error = new Error(result.message || "Request failed");
    error.status = response.status;
    throw error;
  }
  return result;
};

// Loads Razorpay's checkout script once; resolves to true when it is ready.
export const loadRazorpay = () =>
  new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
