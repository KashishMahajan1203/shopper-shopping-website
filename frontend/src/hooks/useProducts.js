import { useContext, useEffect, useState } from "react";
import { ShopContext } from "../Context/ShopContext";
import { apiFetch, getErrorMessage } from "../utils";

// Fetches a product list from the API (e.g. "/products?category=men&page=2").
// Pass null to skip fetching.
const useProducts = (path) => {
  const { cacheProducts } = useContext(ShopContext);
  const [state, setState] = useState({ products: [], total: 0, pages: 1, loading: true, error: null });

  useEffect(() => {
    if (!path) return;
    let cancelled = false;
    setState((s) => ({ ...s, loading: true, error: null }));
    apiFetch(path)
      .then((data) => {
        if (cancelled) return;
        cacheProducts(data.products);
        setState({
          products: data.products,
          total: data.total ?? data.products.length,
          pages: data.pages ?? 1,
          loading: false,
          error: null,
        });
      })
      .catch((err) => {
        if (!cancelled) setState((s) => ({ ...s, loading: false, error: getErrorMessage(err) }));
      });
    return () => {
      cancelled = true;
    };
  }, [path, cacheProducts]);

  return state;
};

export default useProducts;
