import React from "react";
import "./Footer.css";
import { assets } from "../../assets/frontend_assets/assets";
import { Link } from "react-router-dom";

const Footer = () => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="footer" id="footer">
      <div className="footer-content">
        {/* ဘယ်ဘက်အခြမ်း */}
        <div className="footer-content-left">
          <Link to="/" onClick={scrollToTop}>
            <img src={assets.logo} alt="IBRIDGE Logo" />
          </Link>
          <p>
            IBRIDGE COMPUTER SALE & SERVICE — Chip-Level Motherboard, Laptop Repair & Software Solutions.
          </p>
          <div className="footer-social-icons">
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img src={assets.facebook_icon} alt="Facebook" />
            </a>
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img src={assets.twitter_icon} alt="Twitter" />
            </a>
            <a
              href="https://linkedin.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img src={assets.linkedin_icon} alt="LinkedIn" />
            </a>
          </div>
        </div>

        {/* အလယ်အခြမ်း */}
        <div className="footer-content-center">
          <h2>IBRIDGE COMPANY</h2>
          <ul>
            <li>
              <Link to="/" onClick={scrollToTop}>
                Home
              </Link>
            </li>
            <li>
              <Link to="/feed" onClick={scrollToTop}>
                Newsfeed
              </Link>
            </li>
            <li>
              <Link to="/chat" onClick={scrollToTop}>
                Live Chat & VC
              </Link>
            </li>
            <li>
              <Link to="/myorders" onClick={scrollToTop}>
                My Orders
              </Link>
            </li>
          </ul>
        </div>

        {/* ညာဘက်အခြမ်း */}
        <div className="footer-content-right">
          <h2>Get in touch</h2>
          <ul>
            <li>
              <a href="tel:+959757779228">📞 09-757779228</a>
            </li>
            <li>
              <a href="mailto:contact@IBRIDGE.com">✉️ contact@IBRIDGE.com</a>
            </li>
            <li style={{ color: "#94a3b8", fontSize: "13.5px" }}>
              📍 Mandalay, Myanmar
            </li>
          </ul>
        </div>
      </div>
      <hr />
      <p className="footer-copyright">
        Copyright 2026 @ IBRIDGE.COM - All Rights Reserved.
      </p>
    </div>
  );
};

export default Footer;
