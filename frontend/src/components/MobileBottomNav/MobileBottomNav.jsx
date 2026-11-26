import React, { useContext } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { StoreContext } from "../../context/StoreContext";
import "./MobileBottomNav.css";

const MobileBottomNav = ({ setShowLogin }) => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { token, cartItems } = useContext(StoreContext);

  // Cart ထဲက စုစုပေါင်း ပစ္စည်းအရေအတွက် တွက်ခြင်း
  const totalCartCount = Object.values(cartItems || {}).reduce(
    (sum, qty) => sum + (qty > 0 ? qty : 0),
    0
  );

  const handleProtectedNav = (path) => {
    if (!token) {
      setShowLogin(true);
      return;
    }
    navigate(path);
  };

  return (
    <nav className="mobile-bottom-nav">
      <button
        type="button"
        onClick={() => navigate("/")}
        className={`mob-nav-item ${pathname === "/" ? "active" : ""}`}
      >
        <span className="mob-nav-icon">🏠</span>
        <span className="mob-nav-label">Home</span>
      </button>

      <button
        type="button"
        onClick={() => navigate("/feed")}
        className={`mob-nav-item ${pathname === "/feed" ? "active" : ""}`}
      >
        <span className="mob-nav-icon">📰</span>
        <span className="mob-nav-label">Feed</span>
      </button>

      <button
        type="button"
        onClick={() => handleProtectedNav("/chat")}
        className={`mob-nav-item ${pathname === "/chat" ? "active" : ""}`}
      >
        <span className="mob-nav-icon">💬</span>
        <span className="mob-nav-label">Chat</span>
      </button>

      <button
        type="button"
        onClick={() => navigate("/cart")}
        className={`mob-nav-item ${pathname === "/cart" ? "active" : ""}`}
      >
        <div className="mob-icon-wrap">
          <span className="mob-nav-icon">🛒</span>
          {totalCartCount > 0 && (
            <span className="mob-cart-badge">{totalCartCount}</span>
          )}
        </div>
        <span className="mob-nav-label">Cart</span>
      </button>

      <button
        type="button"
        onClick={() => handleProtectedNav("/profile")}
        className={`mob-nav-item ${pathname === "/profile" ? "active" : ""}`}
      >
        <span className="mob-nav-icon">👤</span>
        <span className="mob-nav-label">{token ? "Profile" : "Sign In"}</span>
      </button>
      <button
  type="button"
  onClick={() => navigate("/softwares")}
  className={`mob-nav-item ${pathname === "/softwares" ? "active" : ""}`}
>
  <span className="mob-nav-icon">💿</span>
  <span className="mob-nav-label">Apps</span>
</button>

    </nav>
  );
};

export default MobileBottomNav;
