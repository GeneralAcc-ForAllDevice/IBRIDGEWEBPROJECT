import React, { memo } from "react";
import { useNavigate } from "react-router-dom";
import "./Header.css";

const Header = memo(() => {
  const navigate = useNavigate();

  const handleViewServices = () => {
    const targetSection = document.getElementById("explore-menu");
    if (targetSection) {
      targetSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="header">
      {/* ဘယ်ဘက်ခြမ်း စာသားနှင့် ခလုတ်များ */}
      <div className="header-contents">
        <div className="hud-badge">
          <span className="pulse-dot"></span>
          <span>VALYRIAN HARDWARE & DRAGON LAB</span>
        </div>

        <h2>IBRIDGE Computer Sale & Service</h2>

        <p>
          လူကြီးမင်းတို့ လိုအပ်သော Computer, Laptop, Accessories များနှင့် Software များကို မန္တလေးမြို့တွင် စုံလင်စွာ ဝယ်ယူရရှိနိုင်ပါသည်။
        </p>

        <div className="header-btn-group">
          <button type="button" onClick={handleViewServices} className="header-primary-btn">
            VIEW PRODUCTS AND ACCESSORIES HERE
          </button>
          <button type="button" onClick={() => navigate("/feed")} className="header-secondary-btn">
            📰 COMMUNITY FEED
          </button>
        </div>
      </div>

      {/* ညာဘက်ခြမ်း 3D Hologram Terminal + Laser Scanline */}
      <div className="header-hud-visual">
        <div className="hud-terminal-box">
          {/* Hologram ထဲ အပေါ်အောက် ပြေးနေမည့် Laser အတန်း */}
          <div className="hologram-laser-beam"></div>

          <div className="hud-terminal-top">
            <span>● SCANNING </span>
            <span className="hud-tag">V2.6</span>
          </div>
          <div className="hud-stats-list">
            <div className="hud-stat-row">
              <span>CHIP-LEVEL LAB</span>
              <span className="hud-val-green">ONLINE</span>
            </div>
            <div className="hud-stat-row">
              <span>HARDWARE STOCK</span>
              <span className="hud-val-blue">READY</span>
            </div>
            <div className="hud-stat-row">
              <span>LOCATION</span>
              <span className="hud-val-gold">MANDALAY</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

export default Header;
