import { useEffect } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import Navbar from "./Components/Navbar/Navbar";
import Footer from "./Components/Footer/Footer";
import Shop from "./Pages/Shop";
import ShopCategory from "./Pages/ShopCategory";
import Product from "./Pages/Product";
import Cart from "./Pages/Cart";
import LoginSignup from "./Pages/LoginSignup";
import Login from "./Pages/Login";
import Wishlist from "./Pages/Wishlist";
import Orders from "./Pages/Orders";
import OrderDetail from "./Pages/OrderDetail";
import Checkout from "./Pages/Checkout";
import Search from "./Pages/Search";
import ForgotPassword from "./Pages/ForgotPassword";
import ResetPassword from "./Pages/ResetPassword";
import { useTheme } from "./Context/ThemeContext";
import men_banner from "./Components/Assets/banner_mens.png";
import women_banner from "./Components/Assets/banner_women.png";
import kid_banner from "./Components/Assets/banner_kids.png";

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

// Use the "homepage" sub-path (GitHub Pages) only when the URL actually has it,
// so the app also works when opened at the server root.
const basename = window.location.pathname.startsWith(process.env.PUBLIC_URL)
  ? process.env.PUBLIC_URL
  : "";

function App() {
  const { theme } = useTheme();
  return (
    <BrowserRouter basename={basename}>
      <ScrollToTop />
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<Shop />} />
          <Route path="/mens" element={<ShopCategory banner={men_banner} category="men" title="Men" />} />
          <Route path="/womens" element={<ShopCategory banner={women_banner} category="women" title="Women" />} />
          <Route path="/kids" element={<ShopCategory banner={kid_banner} category="kid" title="Kids" />} />
          <Route path="/product" element={<Product />}>
            <Route path=":productId" element={<Product />} />
          </Route>
          <Route path="/cart" element={<Cart />} />
          <Route path="/signup" element={<LoginSignup />} />
          <Route path="/login" element={<Login />} />
          <Route path="/wishlist" element={<Wishlist />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/orders/:orderId" element={<OrderDetail />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/search" element={<Search />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
        </Routes>
      </main>
      <Footer />
      <ToastContainer
        position="bottom-right"
        autoClose={2500}
        closeOnClick
        pauseOnHover
        theme={theme === "dark" ? "dark" : "light"}
      />
    </BrowserRouter>
  );
}

export default App;
