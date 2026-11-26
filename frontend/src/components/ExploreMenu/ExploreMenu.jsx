import React, { memo } from "react";
import "./ExploreMenu.css";
import { menu_list } from "../../assets/frontend_assets/assets";

const ExploreMenu = memo(({ category, setCategory }) => {
  return (
    <div className="explore-menu dragon-explore-section" id="explore-menu">
      <div className="explore-header-row">
        <div>
          <div className="dragon-sub-tag">🐉 VALYRIAN HARDWARE ARMORY</div>
          <h1>COMPUTER ACCESSORIES & COMPONENTS</h1>
          <p className="explore-menu-text">
            စက်စွမ်းဆောင်ရည် မြှင့်တင်ရန် လိုအပ်သော RAM, SSD, HDD, Display, Speaker, Battery နှင့် Laptop အစိတ်အပိုင်းများကို ရွေးချယ်ဝယ်ယူနိုင်ပါပြီ။
          </p>
        </div>
        <span className="explore-status-pill">● DRAGON_CORE_ACTIVE</span>
      </div>

      <div className="explore-menu-list">
        {/* ALL ITEMS DRAGON CARD */}
        <div
          onClick={() => setCategory("All")}
          className={`explore-card dragon-card ${category === "All" ? "active" : ""}`}
          style={{ animationDelay: "0s" }}
        >
          <span className="dragon-claw-tl"></span>
          <span className="dragon-claw-br"></span>
          <div className="explore-card-img-box all-box">
            <span>ALL</span>
          </div>
          <p>All Hardware</p>
        </div>

        {/* CATEGORY DRAGON CARDS */}
        {menu_list.map((item, idx) => {
          const isSelected = category === item.menu_name;
          return (
            <div
              key={item.menu_name}
              onClick={() =>
                setCategory((prev) => (prev === item.menu_name ? "All" : item.menu_name))
              }
              className={`explore-card dragon-card ${isSelected ? "active" : ""}`}
              style={{ animationDelay: `${((idx + 1) % 6) * 0.35}s` }}
            >
              <span className="dragon-claw-tl"></span>
              <span className="dragon-claw-br"></span>
              <div className="explore-card-img-box">
                <img
                  src={item.menu_image}
                  alt={item.menu_name}
                  loading="lazy"
                  decoding="async"
                />
              </div>
              <p>{item.menu_name}</p>
            </div>
          );
        })}
      </div>

      <hr />
    </div>
  );
});

export default ExploreMenu;
