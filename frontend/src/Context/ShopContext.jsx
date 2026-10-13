import React, { createContext, useCallback, useEffect, useRef, useState } from "react";
import { apiFetch, getToken, handleInfo } from "../utils";

export const ShopContext = createContext(null);

// Cart entries are keyed by product id + size (e.g. "12_M"), so the same
// product can be in the cart in several sizes, each with its own quantity.
const makeKey = (itemId, size) => `${itemId}_${size}`;

// Guests keep their cart/wishlist in the browser; it is merged into their
// account (saved in the database) when they log in.
const GUEST_KEY = "guestShop";
const RECENT_KEY = "recentlyViewed";
const readJson = (key, fallback) => {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
};

const cartToList = (cart) =>
  Object.entries(cart).map(([key, quantity]) => {
    const [productId, size] = key.split("_");
    return { productId: Number(productId), size, quantity };
  });

const mergeCarts = (a, b) => {
  const merged = { ...a };
  for (const [key, qty] of Object.entries(b)) merged[key] = (merged[key] || 0) + qty;
  return merged;
};

const getStoredUser = () =>
  getToken() ? { name: localStorage.getItem("loggedInUser") || "" } : null;

const ShopContextProvider = (props) => {
  const [user, setUser] = useState(getStoredUser);
  const [cartItems, setCartItems] = useState(() => (getStoredUser() ? {} : readJson(GUEST_KEY, {}).cart || {}));
  const [wishlist, setWishlist] = useState(() => (getStoredUser() ? [] : readJson(GUEST_KEY, {}).wishlist || []));
  const [addresses, setAddresses] = useState([]);
  const [recentlyViewed, setRecentlyViewed] = useState(() => readJson(RECENT_KEY, []));
  // True once the logged-in user's saved data has been loaded from the server.
  const [synced, setSynced] = useState(false);
  const syncTimer = useRef(null);

  // ---------- Product cache (products come from the API) ----------
  const [products, setProducts] = useState({});
  const requested = useRef(new Set());

  const cacheProducts = useCallback((list) => {
    if (!list?.length) return;
    setProducts((prev) => {
      const next = { ...prev };
      list.forEach((p) => {
        next[p.id] = p;
      });
      return next;
    });
  }, []);

  const loadProducts = useCallback(
    async (ids) => {
      const missing = [...new Set(ids)].filter((id) => !requested.current.has(id));
      if (!missing.length) return;
      missing.forEach((id) => requested.current.add(id));
      try {
        const data = await apiFetch(`/products/by-ids?ids=${missing.join(",")}`);
        cacheProducts(data.products);
      } catch {
        missing.forEach((id) => requested.current.delete(id));
      }
    },
    [cacheProducts]
  );

  // Make sure everything in the cart, wishlist and recently viewed has product data.
  useEffect(() => {
    const ids = [
      ...cartToList(cartItems).map((i) => i.productId),
      ...wishlist,
      ...recentlyViewed,
    ];
    loadProducts(ids);
  }, [cartItems, wishlist, recentlyViewed, loadProducts]);

  const logout = useCallback((message) => {
    localStorage.removeItem("token");
    localStorage.removeItem("loggedInUser");
    localStorage.removeItem(GUEST_KEY);
    setUser(null);
    setCartItems({});
    setWishlist([]);
    setAddresses([]);
    setSynced(false);
    if (message) handleInfo(message);
  }, []);

  const login = (token, name) => {
    localStorage.setItem("token", token);
    localStorage.setItem("loggedInUser", name);
    setSynced(false);
    setUser({ name });
  };

  // After login (or on page load while logged in): load the saved cart,
  // wishlist and addresses, and merge in anything added as a guest.
  useEffect(() => {
    if (!user || synced) return;
    let cancelled = false;
    apiFetch("/user/data")
      .then((data) => {
        if (cancelled) return;
        const savedCart = {};
        data.cart.forEach((item) => {
          savedCart[makeKey(item.productId, item.size)] = item.quantity;
        });
        setCartItems((local) => mergeCarts(savedCart, local));
        setWishlist((local) => [...new Set([...data.wishlist, ...local])]);
        setAddresses(data.addresses || []);
        setUser({ name: data.name, email: data.email });
        localStorage.removeItem(GUEST_KEY);
        setSynced(true);
      })
      .catch((err) => {
        if (!cancelled && err.status === 401) logout("Your session has expired. Please log in again.");
      });
    return () => {
      cancelled = true;
    };
  }, [user, synced, logout]);

  // Save changes: to the user's account when logged in, else to the browser.
  useEffect(() => {
    if (!user) {
      localStorage.setItem(GUEST_KEY, JSON.stringify({ cart: cartItems, wishlist }));
      return;
    }
    if (!synced) return;
    clearTimeout(syncTimer.current);
    syncTimer.current = setTimeout(() => {
      Promise.all([
        apiFetch("/user/cart", { method: "PUT", body: { cart: cartToList(cartItems) } }),
        apiFetch("/user/wishlist", { method: "PUT", body: { wishlist } }),
      ]).catch((err) => {
        if (err.status === 401) logout("Your session has expired. Please log in again.");
      });
    }, 400);
    return () => clearTimeout(syncTimer.current);
  }, [cartItems, wishlist, user, synced, logout]);

  useEffect(() => {
    localStorage.setItem(RECENT_KEY, JSON.stringify(recentlyViewed));
  }, [recentlyViewed]);

  const addRecentlyViewed = useCallback((itemId) => {
    setRecentlyViewed((prev) => [itemId, ...prev.filter((id) => id !== itemId)].slice(0, 8));
  }, []);

  const addToCart = (itemId, size) => {
    const key = makeKey(itemId, size);
    setCartItems((prev) => ({ ...prev, [key]: (prev[key] || 0) + 1 }));
  };

  const removeFromCart = (itemId, size) => {
    const key = makeKey(itemId, size);
    setCartItems((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev, [key]: prev[key] - 1 };
      if (next[key] === 0) delete next[key];
      return next;
    });
  };

  const clearFromCart = (itemId, size) => {
    const key = makeKey(itemId, size);
    setCartItems((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  // Removes only the given lines (used after a successful payment).
  const removeLines = (lines) => {
    setCartItems((prev) => {
      const next = { ...prev };
      lines.forEach((l) => delete next[makeKey(l.productId, l.size)]);
      return next;
    });
  };

  const getQuantity = (itemId, size) => cartItems[makeKey(itemId, size)] || 0;

  // Returns true if the product was added, false if it was removed.
  const toggleWishlist = (itemId) => {
    const adding = !wishlist.includes(itemId);
    setWishlist((prev) => (adding ? [...prev, itemId] : prev.filter((id) => id !== itemId)));
    return adding;
  };

  const isInWishlist = (itemId) => wishlist.includes(itemId);

  // Cart as a list of { product, size, quantity }, in the order items were added.
  // Lines whose product data hasn't loaded yet are skipped.
  const getCartLines = () =>
    cartToList(cartItems)
      .map(({ productId, size, quantity }) => ({ product: products[productId], size, quantity }))
      .filter((line) => line.product);

  const getCartList = () => cartToList(cartItems);

  const getTotalCartAmount = () =>
    getCartLines().reduce((total, line) => total + line.product.new_price * line.quantity, 0);

  const getTotalCartItems = () =>
    Object.values(cartItems).reduce((total, qty) => total + qty, 0);

  const contextValue = {
    user,
    synced,
    login,
    logout,
    products,
    cacheProducts,
    getTotalCartItems,
    getTotalCartAmount,
    getCartLines,
    getCartList,
    getQuantity,
    cartItems,
    addToCart,
    removeFromCart,
    clearFromCart,
    removeLines,
    wishlist,
    toggleWishlist,
    isInWishlist,
    addresses,
    setAddresses,
    recentlyViewed,
    addRecentlyViewed,
  };

  return (
    <ShopContext.Provider value={contextValue}>
      {props.children}
    </ShopContext.Provider>
  );
};
export default ShopContextProvider;
