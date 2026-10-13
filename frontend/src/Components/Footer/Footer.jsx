import React from "react";
import { Link } from "react-router-dom";
import "./Footer.css";
import footer_logo from "../Assets/logo.png";
import instagram_icon from "../Assets/instagram_icon.png";
import pinterest_icon from "../Assets/pintester_icon.png";
import whatsapp_icon from "../Assets/whatsapp_icon.png";

const Footer = () => {
  return (
    <footer className="footer">
      <div className="container footer-top">
        <div className="footer-brand">
          <Link to="/" className="footer-logo">
            <img src={footer_logo} alt="Shopper logo" />
            <span>SHOPPER</span>
          </Link>
          <p>Everyday fashion for men, women and kids — delivered to your door.</p>
        </div>

        <div className="footer-col">
          <h4>Shop</h4>
          <Link to="/mens">Men</Link>
          <Link to="/womens">Women</Link>
          <Link to="/kids">Kids</Link>
        </div>

        <div className="footer-col">
          <h4>Company</h4>
          <span>About</span>
          <span>Offices</span>
          <span>Contact</span>
        </div>

        <div className="footer-col">
          <h4>Follow us</h4>
          <div className="footer-social">
            <img src={instagram_icon} alt="Instagram" />
            <img src={pinterest_icon} alt="Pinterest" />
            <img src={whatsapp_icon} alt="WhatsApp" />
          </div>
        </div>
      </div>

      <div className="container footer-bottom">
        <p>© {new Date().getFullYear()} Shopper. All rights reserved.</p>
        <p>Made with 💗 by Kashish Mahajan</p>
      </div>
    </footer>
  );
};
export default Footer;
