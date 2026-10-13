import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import ShopContextProvider from "./Context/ShopContext";
import { ThemeProvider } from "./Context/ThemeContext";
import App from "./App";

// ---------- Fake backend ----------
const product = (id, extra = {}) => ({
  id,
  name: `Product ${id}`,
  category: id <= 4 ? "women" : "men",
  image: `product_${id}.png`,
  new_price: 50 + id,
  old_price: 100 + id,
  description: `Description ${id}`,
  stock: { S: 5, M: 5, L: 0, XL: 2, XXL: 5 },
  rating: 0,
  numReviews: 0,
  ...extra,
});
const PRODUCTS = Array.from({ length: 8 }, (_, i) => product(i + 1));

let server;
let calls;
const ok = (body) => Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({ success: true, ...body }) });
const fail = (status, message) => Promise.resolve({ ok: false, status, json: () => Promise.resolve({ success: false, message }) });

beforeEach(() => {
  localStorage.clear();
  window.scrollTo = () => {};
  window.confirm = () => true;
  calls = [];
  server = { cart: [], wishlist: [], addresses: [], orders: [] };
  global.fetch = jest.fn((url, opts = {}) => {
    const { pathname, searchParams } = new URL(url);
    const method = opts.method || "GET";
    const body = opts.body ? JSON.parse(opts.body) : undefined;
    calls.push({ path: pathname, query: searchParams.toString(), method, body });

    if (pathname === "/products") {
      let list = PRODUCTS.filter((p) => !searchParams.get("category") || p.category === searchParams.get("category"));
      if (searchParams.get("search")) list = list.filter((p) => p.name.includes(searchParams.get("search")));
      return ok({ products: list.slice(0, Number(searchParams.get("limit")) || 12), total: list.length, page: 1, pages: 1 });
    }
    if (pathname === "/products/by-ids") {
      const ids = searchParams.get("ids").split(",").map(Number);
      return ok({ products: PRODUCTS.filter((p) => ids.includes(p.id)) });
    }
    const productMatch = pathname.match(/^\/products\/(\d+)(\/\w+)?$/);
    if (productMatch) {
      const p = PRODUCTS.find((x) => x.id === Number(productMatch[1]));
      if (productMatch[2] === "/related") return ok({ products: PRODUCTS.slice(0, 4) });
      if (productMatch[2] === "/reviews") return ok({ reviews: [] });
      return p ? ok({ product: p }) : fail(404, "Product not found");
    }
    if (pathname === "/coupons") return ok({ coupons: [{ code: "WELCOME10", description: "10% off" }] });
    if (pathname === "/auth/login") return ok({ jwtToken: "tok", name: "Riya" });
    if (pathname === "/user/data") return ok({ name: "Riya", email: "riya@x.com", ...server });
    if (pathname === "/user/cart") { server.cart = body.cart; return ok({ cart: body.cart }); }
    if (pathname === "/user/wishlist") { server.wishlist = body.wishlist; return ok({ wishlist: body.wishlist }); }
    if (pathname === "/user/addresses") {
      const address = { _id: "a1", ...body, isDefault: true };
      server.addresses = [address];
      return ok({ address, addresses: server.addresses });
    }
    if (pathname === "/payment/apply-coupon") return ok({ code: "WELCOME10", discount: 11, description: "10% off", subtotal: 110, total: 99 });
    if (pathname === "/payment/create-order") return ok({ orderId: "order_1", dbOrderId: "0123456789abcdef01234567", amount: 9900, currency: "INR", keyId: "rzp_test" });
    if (pathname === "/payment/verify") return ok({});
    if (pathname.startsWith("/user/orders/")) {
      return ok({ order: {
        _id: "0123456789abcdef01234567", status: "placed", amount: 99, subtotal: 110, discount: 11, couponCode: "WELCOME10",
        razorpayPaymentId: "pay_1", createdAt: "2026-10-13", statusHistory: [{ status: "placed", at: "2026-10-13" }],
        items: [{ productId: 5, name: "Product 5", image: "product_5.png", size: "M", quantity: 2, price: 55 }],
        shippingAddress: server.addresses[0] || {},
      } });
    }
    throw new Error(`Unexpected request ${method} ${pathname}`);
  });
  // Fake Razorpay checkout that "pays" straight away.
  window.Razorpay = function (options) {
    this.on = () => {};
    this.open = () => options.handler({ razorpay_order_id: "order_1", razorpay_payment_id: "pay_1", razorpay_signature: "sig" });
  };
});

const renderAt = (path) => {
  window.history.pushState({}, "", path);
  return render(
    <ThemeProvider>
      <ShopContextProvider>
        <App />
      </ShopContextProvider>
    </ThemeProvider>
  );
};

test("home page loads products from the API", async () => {
  renderAt("/");
  expect(await screen.findAllByText("Product 1")).not.toHaveLength(0);
  expect(calls.some((c) => c.path === "/products" && c.query.includes("category=women"))).toBe(true);
});

test("out-of-stock sizes are disabled and stock limits add-to-cart", async () => {
  renderAt("/product/5");
  expect(await screen.findByRole("heading", { name: "Product 5" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "L" })).toBeDisabled();

  fireEvent.click(screen.getByRole("button", { name: "XL" }));
  expect(screen.getByText("Hurry! Only 2 left in size XL")).toBeInTheDocument();
  const add = screen.getByRole("button", { name: "Add to cart" });
  fireEvent.click(add);
  fireEvent.click(add);
  fireEvent.click(add);
  expect(await screen.findByText("Only 2 available in size XL")).toBeInTheDocument();
  expect(screen.getByLabelText("Cart")).toHaveTextContent("2");
});

test("search box goes to the search page with the query", async () => {
  renderAt("/");
  const search = screen.getAllByRole("searchbox", { name: "Search products" })[0];
  fireEvent.change(search, { target: { value: "Product 7" } });
  fireEvent.submit(search.closest("form"));
  expect(await screen.findByRole("heading", { name: "All Products" })).toBeInTheDocument();
  await waitFor(() => expect(calls.some((c) => c.path === "/products" && c.query.includes("search=Product+7"))).toBe(true));
});

test("wishlist toggle from a product card", async () => {
  renderAt("/");
  const [heart] = await screen.findAllByRole("button", { name: "Add to wishlist" });
  fireEvent.click(heart);
  expect(await screen.findByText("Added to wishlist")).toBeInTheDocument();
  expect(screen.getByLabelText("Wishlist")).toHaveTextContent("1");
});

test("guest checkout -> login -> address -> coupon -> pay -> order page", async () => {
  renderAt("/product/5");
  fireEvent.click(await screen.findByRole("button", { name: "M" }));
  fireEvent.click(screen.getByRole("button", { name: "Add to cart" }));
  fireEvent.click(screen.getByRole("button", { name: "Add to cart" }));

  fireEvent.click(screen.getByLabelText("Cart"));
  fireEvent.click(await screen.findByRole("button", { name: "Login to checkout" }));
  fireEvent.change(await screen.findByPlaceholderText("you@example.com"), { target: { value: "riya@x.com" } });
  fireEvent.change(screen.getByPlaceholderText("Enter your password"), { target: { value: "pass1234" } });
  fireEvent.click(screen.getByRole("button", { name: "Log in" }));

  // Lands on checkout with no saved address -> fill the form
  expect(await screen.findByRole("heading", { name: "Checkout" })).toBeInTheDocument();
  const form = (await screen.findByRole("button", { name: "Save address" })).closest("form");
  const fill = (label, value) => fireEvent.change(within(form).getByLabelText(label), { target: { value } });
  fill("Full name", "Riya Sharma");
  fill("Mobile number", "9876543210");
  fill("Pincode", "411001");
  fill("House no., building, street", "12 MG Road");
  fill("City", "Pune");
  fill("State", "Maharashtra");
  fireEvent.click(within(form).getByRole("button", { name: "Save address" }));
  expect(await screen.findByText("Phone: 9876543210")).toBeInTheDocument();

  fireEvent.click(await screen.findByRole("button", { name: /WELCOME10/ }));
  expect(await screen.findByText("Discount (WELCOME10)")).toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: "Pay ₹99" }));
  expect(await screen.findByText("Payment successful! Your order has been placed.")).toBeInTheDocument();
  expect(await screen.findByRole("heading", { name: "Order #01234567" })).toBeInTheDocument();
  expect(screen.getByText("Order placed")).toBeInTheDocument();

  const create = calls.find((c) => c.path === "/payment/create-order");
  expect(create.body).toEqual({ cart: [{ productId: 5, size: "M", quantity: 2 }], addressId: "a1", couponCode: "WELCOME10" });
  expect(screen.getByLabelText("Cart")).not.toHaveTextContent(/\d/);
});
