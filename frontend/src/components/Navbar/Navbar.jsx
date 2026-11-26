import React, { useContext, useState, useEffect, memo } from "react";
import "./Navbar.css";
import { assets } from "../../assets/frontend_assets/assets";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { StoreContext } from "../../context/StoreContext";
import axios from "axios";

const Navbar = memo(({ setShowLogin }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [unreadChatCount, setUnreadChatCount] = useState(0);

  const {
    cartItems,
    token,
    setToken,
    role,
    setRole,
    userName,
    url,
    searchTerm,
    setSearchTerm,
    food_list,
    software_list,
  } = useContext(StoreContext);

  const navigate = useNavigate();
  const { pathname } = useLocation();

  const totalCartCount = Object.values(cartItems || {}).reduce(
    (sum, qty) => sum + (qty > 0 ? qty : 0),
    0
  );

  // Instant Live Search Dropdown အတွက် Products & Softwares စစ်ထုတ်ခြင်း
  const quickSearchResults =
    searchTerm && searchTerm.trim().length > 0
      ? [
          ...(food_list || [])
            .filter(
              (item) =>
                item.name?.toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
                item.category?.toLowerCase().includes(searchTerm.toLowerCase().trim())
            )
            .slice(0, 4)
            .map((item) => ({ ...item, itemType: "product" })),
          ...(software_list || [])
            .filter(
              (soft) =>
                soft.name?.toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
                soft.platform?.toLowerCase().includes(searchTerm.toLowerCase().trim())
            )
            .slice(0, 2)
            .map((soft) => ({ ...soft, itemType: "software" })),
        ]
      : [];
  useEffect(() => {
    if (!token || !url) {
      setUnreadChatCount(0);
      return;
    }

    const checkUnread = async () => {
      try {
        const res = await axios.get(`${url}/api/chat/users`, {
          headers: { token },
        });
        if (res.data.success) {
          const friends = res.data.myFriends || [];
          const savedReads = JSON.parse(
            localStorage.getItem("chat_read_counts") || "{}"
          );
          let totalNew = 0;

          await Promise.all(
            friends.slice(0, 10).map(async (fId) => {
              try {
                const msgRes = await axios.post(
                  `${url}/api/chat/messages`,
                  { otherUserId: fId },
                  { headers: { token } }
                );
                if (msgRes.data.success) {
                  const incoming = (msgRes.data.data || []).filter(
                    (m) => m.senderId === fId
                  ).length;
                  const diff = incoming - (savedReads[fId] || 0);
                  if (diff > 0) totalNew += diff;
                }
              } catch {}
            })
          );
          setUnreadChatCount(totalNew);
        }
      } catch {}
    };

    checkUnread();
    const interval = setInterval(checkUnread, 15000);
    return () => clearInterval(interval);
  }, [token, url, pathname]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("userName");
    setToken("");
    if (setRole) setRole("");
    setMobileMenuOpen(false);
    navigate("/");
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (pathname === "/softwares") return;
    if (pathname !== "/") {
      navigate("/");
    }
    setTimeout(() => {
      const target = document.getElementById("food-display");
      if (target) target.scrollIntoView({ behavior: "smooth" });
    }, 120);
  };

  const handleSectionJump = (sectionId) => {
    setMobileMenuOpen(false);
    if (pathname !== "/") {
      navigate("/");
      setTimeout(() => {
        document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth" });
      }, 150);
    } else {
      document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth" });
    }
  };
  return (
    <header className="tech-navbar">
      {/* Top Info Strip */}
      <div className="tech-top-strip">
        <span>IBRIDGE HARDWARE & CHIP-LEVEL LAB — MANDALAY</span>
        <span className="strip-phone">09-757779228</span>
      </div>

      {/* Main Top Tier */}
      <div className="tech-nav-main">
        <div className="tech-nav-left">
          <button
            type="button"
            className="tech-hamburger-btn"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open Menu"
          >
            ☰
          </button>

          <Link to="/" className="tech-brand-logo">
            <img src={assets.logo} alt="IBRIDGE" />
            <div className="tech-brand-text">
              <span className="brand-main">IBRIDGE</span>
              <span className="brand-sub">PC & HARDWARE</span>
            </div>
          </Link>
        </div>

        {/* Center Hardware Search Bar + Live Dropdown */}
        <div style={{ position: "relative", flex: 1, maxWidth: "540px" }} className="tech-search-wrapper">
          <form onSubmit={handleSearchSubmit} className="tech-search-form" style={{ maxWidth: "100%" }}>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search Laptop, RAM, SSD, Softwares..."
              className="tech-search-input"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="tech-search-clear"
              >
                ✕
              </button>
            )}
            <button type="submit" className="tech-search-submit">
              🔍
            </button>
          </form>

          {quickSearchResults.length > 0 && (
            <div
              style={{
                position: "absolute",
                top: "115%",
                left: 0,
                right: 0,
                background: "#111115",
                border: "1px solid rgba(255, 255, 255, 0.15)",
                borderRadius: "14px",
                padding: "8px",
                boxShadow: "0 20px 45px rgba(0, 0, 0, 0.92)",
                zIndex: 2000,
                display: "flex",
                flexDirection: "column",
                gap: "6px",
              }}
            >
              {quickSearchResults.map((resItem) => (
                <div
                  key={resItem._id}
                  onClick={() => {
                    const targetRoute =
                      resItem.itemType === "product"
                        ? `/product/${resItem._id}`
                        : "/softwares";
                    setSearchTerm("");
                    navigate(targetRoute);
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "8px 10px",
                    borderRadius: "10px",
                    cursor: "pointer",
                    background: "rgba(255,255,255,0.03)",
                  }}
                >
                  <img
                    src={`${url}/images/${resItem.image}`}
                    alt={resItem.name}
                    style={{ width: "40px", height: "40px", borderRadius: "8px", objectFit: "cover" }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: "13.5px", fontWeight: "600", color: "#ffffff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {resItem.name}
                    </p>
                    <small style={{ color: "#a1a1aa", fontSize: "11.5px" }}>
                      {resItem.itemType === "product"
                        ? `${Number(resItem.price).toLocaleString()} Kyats`
                        : `${resItem.platform} • Software`}
                    </small>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        {/* Right Actions: Cart & Account */}
        <div className="tech-nav-right">
          <Link to="/cart" className="tech-icon-btn" title="Shopping Cart">
            <span>🛒</span>
            {totalCartCount > 0 && (
              <span className="tech-badge-count">{totalCartCount}</span>
            )}
          </Link>

          {!token ? (
            <button
              type="button"
              onClick={() => setShowLogin(true)}
              className="tech-signin-btn"
            >
              Sign In
            </button>
          ) : (
            <div className="tech-profile-menu">
              <button
                type="button"
                onClick={() => navigate("/profile")}
                className="tech-profile-pill"
              >
                <span className="profile-dot"></span>
                <span className="profile-name-label">
                  {userName || "Account"}
                </span>
              </button>
              <div className="tech-profile-dropdown">
                <button type="button" onClick={() => navigate("/profile")}>
                  👤 My Profile & Sell
                </button>
                <button type="button" onClick={() => navigate("/myorders")}>
                  📦 My Orders
                </button>
                {role === "admin" && (
                  <button type="button" onClick={() => navigate("/admin")} style={{ color: "#34d399" }}>
                    🛡️ Admin Dashboard
                  </button>
                )}
                <button type="button" onClick={handleLogout} className="logout-item">
                  🚪 Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Tier: Category & Navigation Links Bar */}
      <nav className="tech-nav-bottom">

        

        <Link
          to="/"
          className={`tech-nav-link ${pathname === "/" ? "active" : ""}`}
        >
          HOME
        </Link>
        <button
          type="button"
          onClick={() => handleSectionJump("explore-menu")}
          className="tech-nav-link"
        >
          HARDWARE & PARTS
        </button>
        <Link
          to="/softwares"
          className={`tech-nav-link ${pathname === "/softwares" ? "active" : ""}`}
        >
          SOFTWARES & APPS
        </Link>
        <Link
          to="/service"
          className={`tech-nav-link ${pathname === "/service" ? "active" : ""}`}
        >
          REPAIR SERVICE
        </Link>
        <Link
          to="/feed"
          className={`tech-nav-link ${pathname === "/feed" ? "active" : ""}`}
        >
          NEWSFEED
        </Link>
        <Link
          to="/chat"
          className={`tech-nav-link ${pathname === "/chat" ? "active" : ""}`}
        >
          LIVE CHAT & VC
          {unreadChatCount > 0 && (
            <span className="chat-unread-pill">{unreadChatCount}</span>
          )}
        </Link>
        {token && (
          <Link
            to="/myorders"
            className={`tech-nav-link ${pathname === "/myorders" ? "active" : ""}`}
          >
            MY ORDERS
          </Link>
        )}
        {role === "admin" && (
          <Link
            to="/admin"
            className={`tech-nav-link ${pathname === "/admin" ? "active" : ""}`}
            style={{ color: "#34d399", fontWeight: "700" }}
          >
            🛡️ ADMIN PANEL
          </Link>
        )}
      </nav>
      {/* Mobile Slide-Out Drawer Menu */}
      {mobileMenuOpen && (
        <div
          className="tech-drawer-backdrop"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div
            className="tech-drawer-panel"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="tech-drawer-header">
              <span>IBRIDGE MENU</span>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="tech-drawer-close"
              >
                ✕
              </button>
            </div>

            <div className="tech-drawer-links">
              <Link to="/" onClick={() => setMobileMenuOpen(false)}>
                🏠 Home Store
              </Link>
              <button type="button" onClick={() => handleSectionJump("explore-menu")}>
                💻 Computer Accessories
              </button>
              <Link to="/softwares" onClick={() => setMobileMenuOpen(false)}>
                💿 Softwares & Drivers
              </Link>
              <Link to="/service" onClick={() => setMobileMenuOpen(false)}>
                🔧 Repair & Maintenance Service
              </Link>
              <Link to="/feed" onClick={() => setMobileMenuOpen(false)}>
                📰 Community Newsfeed
              </Link>
              <Link to="/chat" onClick={() => setMobileMenuOpen(false)}>
                💬 Live Chat & Video Call{" "}
                {unreadChatCount > 0 && `(${unreadChatCount})`}
              </Link>
              {token && (
                <>
                  <Link to="/profile" onClick={() => setMobileMenuOpen(false)}>
                    👤 My Profile & Sell Item
                  </Link>
                  <Link to="/myorders" onClick={() => setMobileMenuOpen(false)}>
                    📦 My Orders
                  </Link>
                  {role === "admin" && (
                    <Link
                      to="/admin"
                      onClick={() => setMobileMenuOpen(false)}
                      style={{ color: "#34d399", borderColor: "rgba(52, 211, 153, 0.4)" }}
                    >
                      🛡️ Admin Control Panel
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="drawer-logout-btn"
                  >
                    🚪 Logout
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
});

export default Navbar;
