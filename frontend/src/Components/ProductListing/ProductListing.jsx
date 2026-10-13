import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import "./ProductListing.css";
import Item, { ItemSkeleton } from "../Item/Item";
import useProducts from "../../hooks/useProducts";
import { SIZES } from "../../utils";

const PAGE_SIZE = 12;

const PRICE_RANGES = [
  { value: "", label: "Any price" },
  { value: "0-60", label: "Under ₹60" },
  { value: "60-100", label: "₹60 – ₹100" },
  { value: "100-", label: "Above ₹100" },
];

const SORTS = [
  { value: "featured", label: "Featured" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "rating", label: "Top rated" },
  { value: "discount", label: "Biggest discount" },
];

// Product grid with search, filters, sort and pagination.
// Filters live in the URL (?q=&price=&size=&sort=&page=) so results can be shared.
const ProductListing = ({ category, showSearch = true }) => {
  const [params, setParams] = useSearchParams();
  const q = params.get("q") || "";
  const price = params.get("price") || "";
  const size = params.get("size") || "";
  const sort = params.get("sort") || "featured";
  const page = Math.max(1, Number(params.get("page")) || 1);
  const [searchText, setSearchText] = useState(q);

  useEffect(() => setSearchText(q), [q]);

  const query = new URLSearchParams({ limit: PAGE_SIZE, page, sort });
  if (category) query.set("category", category);
  if (q) query.set("search", q);
  if (size) query.set("size", size);
  if (price) {
    const [min, max] = price.split("-");
    if (min) query.set("minPrice", min);
    if (max) query.set("maxPrice", max);
  }
  const { products, total, pages, loading, error } = useProducts(`/products?${query}`);

  const update = (changes) => {
    const next = new URLSearchParams(params);
    Object.entries(changes).forEach(([key, value]) => {
      if (value) next.set(key, value);
      else next.delete(key);
    });
    if (!("page" in changes)) next.delete("page");
    setParams(next);
  };

  const goToPage = (p) => {
    update({ page: p > 1 ? String(p) : "" });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const hasFilters = q || price || size || sort !== "featured";

  return (
    <div className="listing">
      <div className="listing-filters">
        {showSearch && (
          <form
            className="listing-search"
            onSubmit={(e) => {
              e.preventDefault();
              update({ q: searchText.trim() });
            }}
          >
            <input
              className="input"
              type="search"
              placeholder="Search products…"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              aria-label="Search products"
            />
          </form>
        )}
        <select value={price} onChange={(e) => update({ price: e.target.value })} aria-label="Price">
          {PRICE_RANGES.map((r) => (
            <option key={r.value} value={r.value}>{r.label}</option>
          ))}
        </select>
        <select value={size} onChange={(e) => update({ size: e.target.value })} aria-label="Size">
          <option value="">Any size</option>
          {SIZES.map((s) => (
            <option key={s} value={s}>Size {s} in stock</option>
          ))}
        </select>
        <select value={sort} onChange={(e) => update({ sort: e.target.value === "featured" ? "" : e.target.value })} aria-label="Sort by">
          {SORTS.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
        {hasFilters && (
          <button className="listing-clear" onClick={() => setParams(new URLSearchParams())}>
            Clear all
          </button>
        )}
      </div>

      <p className="listing-count">
        {loading ? "Loading…" : (
          <>
            <strong>{total}</strong> product{total === 1 ? "" : "s"}
            {q && <> for “{q}”</>}
          </>
        )}
      </p>

      {error ? (
        <p className="section-error">Couldn't load products. {error}</p>
      ) : !loading && products.length === 0 ? (
        <div className="listing-empty">
          <h3>No products found</h3>
          <p>Try a different search or remove some filters.</p>
        </div>
      ) : (
        <div className="product-grid">
          {loading
            ? Array.from({ length: 8 }, (_, i) => <ItemSkeleton key={i} />)
            : products.map((product) => <Item key={product.id} product={product} />)}
        </div>
      )}

      {pages > 1 && !loading && (
        <nav className="pagination" aria-label="Pagination">
          <button disabled={page <= 1} onClick={() => goToPage(page - 1)} aria-label="Previous page">‹</button>
          {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
            <button key={p} className={p === page ? "active" : ""} onClick={() => goToPage(p)}>
              {p}
            </button>
          ))}
          <button disabled={page >= pages} onClick={() => goToPage(page + 1)} aria-label="Next page">›</button>
        </nav>
      )}
    </div>
  );
};

export default ProductListing;
