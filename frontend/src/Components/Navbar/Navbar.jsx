import React, { useContext, useEffect, useState } from "react";
import "./Navbar.css";
import logo from "../Assets/logo.png";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { ShopContext } from "../../Context/ShopContext";
import { useTheme } from "../../Context/ThemeContext";
import { handleSuccess } from "../../utils";

const links = [
  { to: "/", label: "Shop" },
  { to: "/mens", label: "Men" },
  { to: "/womens", label: "Women" },
  { to: "/kids", label: "Kids" },
];

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState("");
  const { getTotalCartItems, wishlist, user, logout } = useContext(ShopContext);
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const cartCount = getTotalCartItems();

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    handleSuccess("You have been logged out.");
    navigate("/login");
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const q = query.trim();
    navigate(q ? `/search?q=${encodeURIComponent(q)}` : "/search");
    setQuery("");
  };

  return (
    <header className="navbar">
      <div className="container navbar-inner">
        <Link to="/" className="nav-logo">
          <img src={logo} alt="Shopper logo" />
          <span>SHOPPER</span>
        </Link>

        <nav className={`nav-menu ${menuOpen ? "nav-menu-open" : ""}`}>
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end
              className={({ isActive }) => (isActive ? "active" : "")}
            >
              {link.label}
            </NavLink>
          ))}
          {user && (
            <NavLink to="/orders" className={({ isActive }) => (isActive ? "active" : "")}>
              My Orders
            </NavLink>
          )}
          {user ? (
            <button className="nav-mobile-only nav-mobile-auth" onClick={handleLogout}>
              Logout ({user.name})
            </button>
          ) : (
            <NavLink to="/login" className="nav-mobile-only">
              Login / Sign up
            </NavLink>
          )}
          <form className="nav-search nav-search-mobile" onSubmit={handleSearch} role="search">
            <input
              className="input"
              type="search"
              placeholder="Search products…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search products"
            />
          </form>
        </nav>

        <div className="nav-actions">
          <form className="nav-search nav-search-desktop" onSubmit={handleSearch} role="search">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="11" cy="11" r="7" />
              <path d="M20 20l-3.5-3.5" />
            </svg>
            <input
              type="search"
              placeholder="Search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search products"
            />
          </form>

          {user ? (
            <>
              <span className="nav-user">Hi, {user.name}</span>
              <button className="btn btn-outline nav-auth-btn" onClick={handleLogout}>
                Logout
              </button>
            </>
          ) : (
            <Link to="/login" className="btn btn-outline nav-auth-btn">
              Login
            </Link>
          )}

          <button
            className="nav-cart"
            onClick={toggleTheme}
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            title={theme === "dark" ? "Light mode" : "Dark mode"}
          >
            {theme === "dark" ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
              </svg>
            )}
          </button>

          <Link to="/wishlist" className="nav-cart" aria-label="Wishlist">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 20s-7-4.4-9.2-8.6C1.3 8.4 3 5 6.3 5c2 0 3.2 1.1 3.9 2.2.7-1.1 1.9-2.2 3.9-2.2C17.4 5 19 8.4 17.6 11.4 15.4 15.6 12 20 12 20z" transform="translate(1 0)" />
            </svg>
            {wishlist.length > 0 && <span className="nav-cart-count">{wishlist.length}</span>}
          </Link>

          <Link to="/cart" className="nav-cart" aria-label="Cart">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 7h12l-1 13H7L6 7z" />
              <path d="M9 7V5a3 3 0 0 1 6 0v2" />
            </svg>
            {cartCount > 0 && <span className="nav-cart-count">{cartCount}</span>}
          </Link>

          <button
            className="nav-toggle"
            aria-label="Toggle menu"
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </div>
    </header>
  );
};
export default Navbar;
