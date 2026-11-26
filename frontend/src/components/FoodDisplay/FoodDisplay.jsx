import React, { useContext, useState, useMemo, useEffect } from "react";
import "./FoodDisplay.css";
import { StoreContext } from "../../context/StoreContext";
import FoodItem from "../FoodItem/FoodItem";

const FoodDisplay = ({ category }) => {
  const { food_list, searchTerm, setSearchTerm } = useContext(StoreContext);
  const [visibleCount, setVisibleCount] = useState(12);
  const [showSavedOnly, setShowSavedOnly] = useState(false);
  const [sortBy, setSortBy] = useState("newest");

  useEffect(() => {
    setVisibleCount(12);
  }, [category, showSavedOnly, sortBy, searchTerm]);

  // Search Term + Category + Saved Wishlist + Sort စစ်ထုတ်ခြင်း
  const filteredItems = useMemo(() => {
    if (!Array.isArray(food_list)) return [];
    let list = [...food_list];

    // 1. Search Box စာသားဖြင့် စစ်ထုတ်ခြင်း
    if (searchTerm && searchTerm.trim() !== "") {
      const keyword = searchTerm.toLowerCase().trim();
      list = list.filter(
        (item) =>
          (item.name && item.name.toLowerCase().includes(keyword)) ||
          (item.category && item.category.toLowerCase().includes(keyword)) ||
          (item.description && item.description.toLowerCase().includes(keyword)) ||
          (item.sellerName && item.sellerName.toLowerCase().includes(keyword))
      );
    }

    // 2. Saved Wishlist သို့မဟုတ် Category ဖြင့် စစ်ထုတ်ခြင်း
    if (showSavedOnly) {
      const savedIds = JSON.parse(localStorage.getItem("ibridge_wishlist") || "[]");
      list = list.filter((item) => savedIds.includes(item._id));
    } else if (category !== "All") {
      list = list.filter((item) => item.category === category);
    }

    // 3. ဈေးနှုန်း အစဉ်လိုက် စီခြင်း
    if (sortBy === "price_low") {
      list.sort((a, b) => Number(a.price) - Number(b.price));
    } else if (sortBy === "price_high") {
      list.sort((a, b) => Number(b.price) - Number(a.price));
    }

    return list;
  }, [food_list, category, showSavedOnly, sortBy, searchTerm]);

  const isSearching = searchTerm && searchTerm.trim() !== "";
  const displayedItems = isSearching ? filteredItems : filteredItems.slice(0, visibleCount);

  return (
    <div className="food-display" id="food-display">
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "12px", marginBottom: "18px" }}>
        <h2 style={{ margin: 0 }}>Laptop,Computer second And Accessories</h2>

        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <button
            type="button"
            onClick={() => setShowSavedOnly((prev) => !prev)}
            style={{
              padding: "7px 13px",
              borderRadius: "10px",
              border: showSavedOnly ? "1px solid #f43f5e" : "1px solid rgba(56, 189, 248, 0.35)",
              background: showSavedOnly ? "rgba(244, 63, 94, 0.2)" : "#0f172a",
              color: showSavedOnly ? "#fb7185" : "#cbd5e1",
              fontSize: "12px",
              fontWeight: "700",
              cursor: "pointer",
            }}
          >
            {showSavedOnly ? "❤️ Showing Saved" : "🤍 Saved Items"}
          </button>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{
              padding: "7px 12px",
              borderRadius: "10px",
              border: "1px solid rgba(56, 189, 248, 0.35)",
              background: "#0f172a",
              color: "#38bdf8",
              fontSize: "12px",
              fontWeight: "700",
              outline: "none",
              cursor: "pointer",
            }}
          >
            <option value="newest">နောက်ဆုံးတင်ထားသော</option>
            <option value="price_low">ဈေးအနည်းဆုံး ➔ အများဆုံး</option>
            <option value="price_high">ဈေးအများဆုံး ➔ အနည်းဆုံး</option>
          </select>
        </div>
      </div>

      {/* Search ရလဒ် အရေအတွက် ပြသခြင်း */}
      {isSearching && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(56, 189, 248, 0.1)", border: "1px solid rgba(56, 189, 248, 0.3)", padding: "10px 14px", borderRadius: "10px", marginBottom: "16px" }}>
          <span style={{ fontSize: "13.5px", color: "#38bdf8", fontWeight: "600" }}>
            🔍 "{searchTerm}" နှင့် ကိုက်ညီသော ပစ္စည်း ({filteredItems.length}) ခု တွေ့ရှိပါသည်
          </span>
          <button
            type="button"
            onClick={() => setSearchTerm("")}
            style={{ background: "none", border: "none", color: "#f43f5e", fontWeight: "700", fontSize: "12px", cursor: "pointer" }}
          >
            ✕ Clear Search
          </button>
        </div>
      )}

      {displayedItems.length === 0 ? (
        <p style={{ textAlign: "center", color: "#64748b", padding: "30px" }}>
          {isSearching
            ? `"${searchTerm}" နှင့် ကိုက်ညီသော ပစ္စည်း မတွေ့ပါ။`
            : showSavedOnly
            ? "Saved လုပ်ထားသော ပစ္စည်း မရှိသေးပါ။"
            : "ပစ္စည်း မရှိသေးပါ။"}
        </p>
      ) : (
        <div className="food-display-list">
          {displayedItems.map((item) => (
            <FoodItem
              key={item._id}
              id={item._id}
              name={item.name}
              description={item.description}
              price={item.price}
              image={item.image}
              sellerName={item.sellerName}
            />
          ))}
        </div>
      )}

      {!isSearching && visibleCount < filteredItems.length && (
        <div style={{ textAlign: "center", marginTop: "26px" }}>
          <button
            type="button"
            onClick={() => setVisibleCount((prev) => prev + 12)}
            style={{
              padding: "10px 24px",
              borderRadius: "12px",
              border: "1px solid #38bdf8",
              background: "#0f172a",
              color: "#38bdf8",
              fontWeight: "800",
              fontSize: "13px",
              cursor: "pointer",
            }}
          >
            ပစ္စည်းများ ထပ်ကြည့်ရန် ({filteredItems.length - visibleCount} ခု ကျန်သေးသည်) ↓
          </button>
        </div>
      )}
    </div>
  );
};

export default FoodDisplay;
