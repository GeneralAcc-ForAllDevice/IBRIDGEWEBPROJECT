import React, { useContext, useState, useEffect, memo } from "react";
import "./FoodItem.css";
import { assets } from "../../assets/frontend_assets/assets";
import { StoreContext } from "../../context/StoreContext";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const FoodItem = memo(({ id, name, price, description, image, sellerName }) => {
  const { cartItems, addToCart, removeFromCart, url } = useContext(StoreContext);
  const navigate = useNavigate();

  const serverCount = cartItems?.[id] || 0;
  const [instantCount, setInstantCount] = useState(serverCount);
  const [isWishlisted, setIsWishlisted] = useState(false);

  useEffect(() => {
    setInstantCount(cartItems?.[id] || 0);
  }, [cartItems, id]);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("ibridge_wishlist") || "[]");
      setIsWishlisted(saved.includes(id));
    } catch {
      setIsWishlisted(false);
    }
  }, [id]);

  // Refresh မလိုဘဲ Cart ထဲသို့ ချက်ချင်းထည့်ခြင်း
  const handleAdd = (e) => {
    e.stopPropagation();
    setInstantCount((prev) => prev + 1);
    addToCart(id);
    toast.success(`"${name}" ကို Cart ထဲ ထည့်ပြီးပါပြီ`, {
      toastId: `add_${id}`,
      autoClose: 1000,
    });
  };

  // Refresh မလိုဘဲ Cart ထဲမှ ချက်ချင်းလျှော့ခြင်း
  const handleRemove = (e) => {
    e.stopPropagation();
    setInstantCount((prev) => (prev > 0 ? prev - 1 : 0));
    removeFromCart(id);
  };

  // Wishlist သိမ်းခြင်း / ဖြုတ်ခြင်း
  const handleToggleWishlist = (e) => {
    e.stopPropagation();
    try {
      const saved = JSON.parse(localStorage.getItem("ibridge_wishlist") || "[]");
      let updated;
      if (saved.includes(id)) {
        updated = saved.filter((itemId) => itemId !== id);
        setIsWishlisted(false);
        toast.info("Saved စာရင်းမှ ဖယ်ရှားလိုက်ပါပြီ", { autoClose: 1000 });
      } else {
        updated = [...saved, id];
        setIsWishlisted(true);
        toast.success("❤️ Saved စာရင်းထဲ သိမ်းလိုက်ပါပြီ", { autoClose: 1000 });
      }
      localStorage.setItem("ibridge_wishlist", JSON.stringify(updated));
    } catch (err) {
      console.error(err);
    }
  };

  // Product Link ကို Copy ကူးခြင်း
  const handleShareLink = (e) => {
    e.stopPropagation();
    const productUrl = `${window.location.origin}/product/${id}`;
    navigator.clipboard?.writeText(productUrl);
    toast.success("🔗 Product Link Copy ကူးပြီးပါပြီ!", { autoClose: 1200 });
  };

  return (
    <div className="food-item" onClick={() => navigate(`/product/${id}`)}>
      <div className="food-item-img-container">
        <img
          src={`${url}/images/${image}`}
          alt={name}
          loading="lazy"
          decoding="async"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = "https://placehold.co";
          }}
          className="food-item-image"
        />

        {/* အပေါ်ထောင့်မှ Wishlist နှင့် Share ခလုတ်များ */}
        <div className="food-item-top-actions">
          <button
            type="button"
            onClick={handleToggleWishlist}
            className={`item-action-pill ${isWishlisted ? "wishlisted" : ""}`}
            title="Save Item"
          >
            {isWishlisted ? "❤️" : "🤍"}
          </button>
          <button
            type="button"
            onClick={handleShareLink}
            className="item-action-pill"
            title="Copy Link"
          >
            🔗
          </button>
        </div>

        {/* Refresh မလိုဘဲ ချက်ချင်းပြောင်းမည့် Cart Counter */}
        {instantCount === 0 ? (
          <img
            className="add"
            onClick={handleAdd}
            src={assets.add_icon_white}
            alt="Add to cart"
          />
        ) : (
          <div className="food-item-counter" onClick={(e) => e.stopPropagation()}>
            <img onClick={handleRemove} src={assets.remove_icon_red} alt="Remove" />
            <p>{instantCount}</p>
            <img onClick={handleAdd} src={assets.add_icon_green} alt="Add" />
          </div>
        )}
      </div>

      <div className="food-item-info">
        <div className="food-item-name-rating">
          <p>{name}</p>
          <span className="in-stock-tag">● IN STOCK</span>
        </div>

        {sellerName && (
          <p className="food-item-seller">✦ Seller: {sellerName}</p>
        )}

        <p className="food-item-desc">{description}</p>

        <div className="food-item-bottom-row">
          <p className="food-item-price">{Number(price).toLocaleString()} Kyats</p>
          <button type="button" onClick={handleAdd} className="quick-buy-btn">
            + Cart
          </button>
        </div>
      </div>
    </div>
  );
});

export default FoodItem;
