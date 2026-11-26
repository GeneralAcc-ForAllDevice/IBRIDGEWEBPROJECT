import React, { useContext, useEffect, useState, useRef } from "react";
import "./ProductDetail.css";
import { useParams, useNavigate } from "react-router-dom";
import { StoreContext } from "../../context/StoreContext";
import axios from "axios";
import { toast } from "react-toastify";

const QUICK_INQUIRIES = [
  "ပစ္စည်းအခြေအနေ ကောင်းပါသလားခင်ဗျာ?",
  "နောက်ဆုံးဈေး ဘယ်လောက်လဲဗျ?",
  "Delivery ဘယ်လိုပို့ပေးလဲခင်ဗျာ?",
  "Warranty ဘယ်လောက်ပါလဲ?",
];

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    food_list,
    fetchFoodList,
    addToCart,
    url,
    token,
  } = useContext(StoreContext) || {};

  const safeFoodList = Array.isArray(food_list) ? food_list : [];
  const product = safeFoodList.find((item) => item?._id === id);

  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [friendStatus, setFriendStatus] = useState("none"); // "none" | "sent" | "friend"
  const [myId, setMyId] = useState("");
  const [isAddingFriend, setIsAddingFriend] = useState(false);

  // Quick Direct Message States
  const [isMessageOpen, setIsMessageOpen] = useState(false);
  const [directMessage, setDirectMessage] = useState("");
  const [isSendingMsg, setIsSendingMsg] = useState(false);

  // ကိုယ့် post ဖြစ်နေလျှင်ပင် Seller box UI ကို စမ်းသပ်ကြည့်နိုင်ရန် toggle
  const [previewOwnSellerBox, setPreviewOwnSellerBox] = useState(false);

  const navTimerRef = useRef(null);

  // Page ဖွင့်တိုင်း / Focus ဖြစ်တိုင်း Product list ကို refresh လုပ်စရာမလိုဘဲ sync လုပ်ခြင်း
  useEffect(() => {
    if (typeof fetchFoodList === "function") {
      fetchFoodList();
    }

    const handleFocus = () => {
      if (typeof fetchFoodList === "function") {
        fetchFoodList();
      }
    };

    const handleVisibilityChange = () => {
      if (
        document.visibilityState === "visible" &&
        typeof fetchFoodList === "function"
      ) {
        fetchFoodList();
      }
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (navTimerRef.current) {
        clearTimeout(navTimerRef.current);
      }
    };
  }, [fetchFoodList]);

  useEffect(() => {
    if (product) {
      setComments(Array.isArray(product.comments) ? product.comments : []);
      setDirectMessage(
        `မင်္ဂလာပါ၊ "${product.name}" (${Number(
          product.price || 0
        ).toLocaleString()} Kyats) နဲ့ ပတ်သက်ပြီး သိချင်လို့ပါ။`
      );
    } else {
      setComments([]);
    }
  }, [product]);

  // ရောင်းချသူနှင့် သူငယ်ချင်း ဖြစ်/မဖြစ် စစ်ဆေးခြင်း
  useEffect(() => {
    const checkFriendStatus = async () => {
      if (!token || !url || !product || !product.userId) return;
      try {
        const res = await axios.get(`${url}/api/chat/users`, {
          headers: { token },
        });
        if (res.data?.success) {
          const currentUserId = res.data.myId || "";
          setMyId(currentUserId);
          const friends = Array.isArray(res.data.myFriends)
            ? res.data.myFriends
            : [];
          const allUsers = Array.isArray(res.data.allUsers)
            ? res.data.allUsers
            : [];
          const sellerUser = allUsers.find((u) => u?._id === product.userId);
          const sellerRequests = Array.isArray(sellerUser?.friendRequests)
            ? sellerUser.friendRequests
            : [];

          if (friends.includes(product.userId)) {
            setFriendStatus("friend");
          } else if (currentUserId && sellerRequests.includes(currentUserId)) {
            setFriendStatus("sent");
          } else {
            setFriendStatus("none");
          }
        }
      } catch (error) {
        console.log(error);
      }
    };
    checkFriendStatus();
  }, [token, url, product]);

  // Seller ကို Add Friend လုပ်ခြင်း
  const handleAddFriend = async () => {
    if (!token) {
      toast.error("Add Friend လုပ်ရန် Login အရင်ဝင်ပါ");
      return;
    }
    if (!product?.userId || product.userId === "admin") {
      toast.info("IBRIDGE Official Listing ဖြစ်ပါသည်");
      return;
    }
    if (product.userId === myId) {
      toast.info("ကိုယ်တိုင်တင်ထားသော Product ဖြစ်ပါသည်");
      return;
    }
    if (friendStatus === "friend") {
      toast.info("Seller နှင့် သူငယ်ချင်း ဖြစ်ပြီးသား ဖြစ်ပါသည်");
      return;
    }
    if (friendStatus === "sent") {
      toast.info("Friend Request ပို့ပြီးသား ဖြစ်ပါသည်");
      return;
    }

    setIsAddingFriend(true);
    try {
      const res = await axios.post(
        `${url}/api/chat/add-friend`,
        { targetUserId: product.userId },
        { headers: { token } }
      );
      if (res.data?.success) {
        toast.success("Friend Request ပို့ပြီးပါပြီ!");
        setFriendStatus("sent");
      } else {
        toast.info(res.data?.message || "Request status update ဖြစ်ပါပြီ");
        setFriendStatus("sent");
      }
    } catch (error) {
      toast.error("Friend Request ပို့ရာတွင် အမှားရှိနေပါသည်");
    } finally {
      setIsAddingFriend(false);
    }
  };

  // Seller ဆီ Message တိုက်ရိုက် ပို့ခြင်း
  const handleSendDirectMessage = async (e) => {
    e.preventDefault();
    if (!token) {
      toast.error("Message ပို့ရန် Login အရင်ဝင်ပါ");
      return;
    }
    if (!directMessage.trim() || !product) return;

    const targetId = product.userId || "admin";
    setIsSendingMsg(true);

    try {
      const payload = {
        receiverId: targetId,
        targetUserId: targetId,
        message: directMessage.trim(),
        text: directMessage.trim(),
        productId: product._id,
      };

      let res;
      try {
        res = await axios.post(`${url}/api/chat/send`, payload, {
          headers: { token },
        });
      } catch (err) {
        if (err?.response?.status === 404) {
          res = await axios.post(`${url}/api/chat/message`, payload, {
            headers: { token },
          });
        } else {
          throw err;
        }
      }

      if (res?.data?.success) {
        toast.success("Seller ဆီ Message ပို့ပြီးပါပြီ!");
        setIsMessageOpen(false);
        navTimerRef.current = setTimeout(() => {
          navigate("/chat", {
            state: {
              sellerId: targetId,
              sellerName: product.sellerName || "Seller",
            },
          });
        }, 400);
      } else {
        toast.info(res?.data?.message || "Chat ခန်းသို့ သွားနေပါသည်...");
        navigate("/chat", {
          state: {
            sellerId: targetId,
            sellerName: product.sellerName || "Seller",
          },
        });
      }
    } catch (error) {
      toast.info("Chat ခန်းသို့ ဖွင့်ပေးနေပါသည်...");
      navigate("/chat", {
        state: {
          sellerId: targetId,
          sellerName: product.sellerName || "Seller",
          prefillMessage: directMessage.trim(),
        },
      });
    } finally {
      setIsSendingMsg(false);
    }
  };

  // Product Link ကူးယူခြင်း
  const handleCopyProductLink = async () => {
    try {
      const shareUrl = window.location.href;
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
        toast.success("Product Link ကူးယူပြီးပါပြီ!");
      } else {
        toast.info(shareUrl);
      }
    } catch {
      toast.error("Link ကူးယူ၍ မရပါ");
    }
  };

  // Comment ရေးသားခြင်း
  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!token) {
      toast.error("Comment ရေးရန် Login အရင်ဝင်ပါ");
      return;
    }
    if (!commentText.trim() || !product?._id) return;

    try {
      const res = await axios.post(
        `${url}/api/food/comment`,
        { foodId: product._id, text: commentText.trim() },
        { headers: { token } }
      );
      if (res.data?.success) {
        toast.success(res.data.message || "Comment တင်ပြီးပါပြီ");
        setComments(
          Array.isArray(res.data.comments) ? res.data.comments : []
        );
        setCommentText("");
        if (typeof fetchFoodList === "function") {
          fetchFoodList();
        }
      } else {
        toast.error(res.data?.message || "Comment ပို့၍မရပါ");
      }
    } catch (error) {
      toast.error("Comment ပို့ရာတွင် အမှားရှိနေပါသည်");
    }
  };

  if (!product) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: "80px 20px",
          color: "#e2e8f0",
        }}
      >
        <h3>Product ရှာမတွေ့ပါ...</h3>
        <button
          type="button"
          onClick={() => navigate("/")}
          className="add-fri-seller-btn"
          style={{ marginTop: "15px" }}
        >
          Home သို့ ပြန်သွားရန်
        </button>
      </div>
    );
  }

  const cleanUrl = String(url || "").replace(/\/+$/, "");
  const productImgSrc = product.image
    ? String(product.image).startsWith("http")
      ? product.image
      : `${cleanUrl}/images/${product.image}`
    : "https://placehold.co";

  const isOwnProduct = Boolean(
    myId && product.userId && String(product.userId) === String(myId)
  );
  const showSellerSection = !isOwnProduct || previewOwnSellerBox;

  return (
    <div className="product-detail-container">
      {/* Product Detail Card */}
      <div className="product-detail-card">
        <img
          src={productImgSrc}
          alt={product.name || "Product"}
          className="product-detail-img"
        />

        <div className="product-detail-info">
          <div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "10px",
                flexWrap: "wrap",
              }}
            >
              <span className="product-category-badge">{product.category}</span>
              <button
                type="button"
                onClick={handleCopyProductLink}
                className="add-fri-seller-btn"
                style={{ padding: "6px 12px", fontSize: "12.5px" }}
              >
                🔗 Copy Link
              </button>
            </div>

            <h1>{product.name}</h1>
            <p className="product-detail-price">
              {Number(product.price || 0).toLocaleString()} Kyats
            </p>
            <p className="product-detail-desc">{product.description}</p>
          </div>

          <div>
            {/* ကိုယ့် Product ဖြစ်နေလျှင် အသိပေးစာ + Preview ခလုတ် */}
            {isOwnProduct && (
              <div
                style={{
                  marginBottom: "10px",
                  padding: "10px 12px",
                  borderRadius: "10px",
                  background: "rgba(30, 41, 59, 0.75)",
                  border: "1px solid rgba(148, 163, 184, 0.25)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "10px",
                  flexWrap: "wrap",
                }}
              >
                <small style={{ color: "#cbd5e1" }}>
                  ဤ Product ကို သင်ကိုယ်တိုင် တင်ထားခြင်း ဖြစ်ပါသည် (Buyer
                  မြင်ကွင်းတွင် Add Friend / Message ပေါ်မည်)။
                </small>
                <button
                  type="button"
                  onClick={() => setPreviewOwnSellerBox((prev) => !prev)}
                  style={{
                    padding: "5px 10px",
                    borderRadius: "8px",
                    border: "1px solid rgba(56, 189, 248, 0.45)",
                    background: "rgba(15, 23, 42, 0.9)",
                    color: "#38bdf8",
                    cursor: "pointer",
                    fontSize: "12px",
                  }}
                >
                  {previewOwnSellerBox ? "Hide Preview" : "Preview Buttons"}
                </button>
              </div>
            )}

            {/* Seller Box: Add Friend + Direct Message */}
            {showSellerSection && (
              <div className="seller-box">
                <div className="seller-info">
                  <h4>Seller: {product.sellerName || "IBRIDGE Official"}</h4>
                  <small>
                    သူငယ်ချင်းဖွဲ့ရန် သို့မဟုတ် Message တိုက်ရိုက်ပို့ရန်
                  </small>
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: "8px",
                    flexWrap: "wrap",
                    alignItems: "center",
                  }}
                >
                  <button
                    type="button"
                    onClick={handleAddFriend}
                    disabled={isAddingFriend || friendStatus === "friend"}
                    className="add-fri-seller-btn"
                    style={
                      friendStatus === "friend"
                        ? {
                            background:
                              "linear-gradient(180deg, #00ff88, #059669)",
                            color: "#020617",
                            borderColor: "#6ee7b7",
                          }
                        : {}
                    }
                  >
                    {isAddingFriend
                      ? "Adding..."
                      : friendStatus === "friend"
                      ? "✓ Friends"
                      : friendStatus === "sent"
                      ? "⏳ Requested"
                      : "➕ Add Friend"}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (!token) {
                        toast.error("Message ပို့ရန် Login အရင်ဝင်ပါ");
                        return;
                      }
                      setIsMessageOpen((prev) => !prev);
                    }}
                    className="add-fri-seller-btn"
                    style={{
                      background:
                        "linear-gradient(180deg, #38bdf8, #0284c7)",
                      color: "#020617",
                      borderColor: "#7dd3fc",
                    }}
                  >
                    ✉ Message
                  </button>
                </div>
              </div>
            )}

            {/* Quick Direct Message Box */}
            {showSellerSection && isMessageOpen && (
              <form
                onSubmit={handleSendDirectMessage}
                style={{
                  marginTop: "12px",
                  padding: "14px",
                  borderRadius: "12px",
                  background: "rgba(15, 23, 42, 0.85)",
                  border: "1px solid rgba(56, 189, 248, 0.35)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "8px",
                  }}
                >
                  <strong style={{ fontSize: "13.5px", color: "#e2e8f0" }}>
                    Send Message to {product.sellerName || "Seller"}
                  </strong>
                  <button
                    type="button"
                    onClick={() =>
                      navigate("/chat", {
                        state: {
                          sellerId: product.userId || "admin",
                          sellerName: product.sellerName || "Seller",
                        },
                      })
                    }
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "#38bdf8",
                      cursor: "pointer",
                      fontSize: "12.5px",
                      textDecoration: "underline",
                    }}
                  >
                    Open Full Chat →
                  </button>
                </div>

                {/* Quick Inquiry Chips */}
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "6px",
                    marginBottom: "10px",
                  }}
                >
                  {QUICK_INQUIRIES.map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => setDirectMessage(q)}
                      style={{
                        padding: "4px 10px",
                        fontSize: "12px",
                        borderRadius: "999px",
                        border: "1px solid rgba(148, 163, 184, 0.35)",
                        background: "rgba(30, 41, 59, 0.8)",
                        color: "#cbd5e1",
                        cursor: "pointer",
                      }}
                    >
                      {q}
                    </button>
                  ))}
                </div>

                <div style={{ display: "flex", gap: "8px" }}>
                  <input
                    type="text"
                    value={directMessage}
                    onChange={(e) => setDirectMessage(e.target.value)}
                    placeholder="Seller ကို ပို့လိုသော message ရိုက်ပါ..."
                    style={{
                      flex: 1,
                      padding: "10px 12px",
                      borderRadius: "8px",
                      border: "1px solid rgba(148, 163, 184, 0.3)",
                      background: "#0f172a",
                      color: "#f8fafc",
                    }}
                    required
                  />
                  <button
                    type="submit"
                    disabled={isSendingMsg}
                    className="add-fri-seller-btn"
                  >
                    {isSendingMsg ? "Sending..." : "Send"}
                  </button>
                </div>
              </form>
            )}

            <button
              type="button"
              onClick={() => {
                if (typeof addToCart === "function") {
                  addToCart(product._id);
                }
                toast.success("Cart ထဲသို့ ထည့်ပြီးပါပြီ");
              }}
              className="add-cart-detail-btn"
              style={{ marginTop: "12px" }}
            >
              ADD TO CART
            </button>
          </div>
        </div>
      </div>

      {/* Comments Section */}
      <div className="comments-section">
        <h3>Customer Comments & Questions ({comments.length})</h3>

        <form onSubmit={handleCommentSubmit} className="comment-form">
          <input
            type="text"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="ဤပစ္စည်းနှင့် ပတ်သက်၍ မေးမြန်းလိုသည်များ / မှတ်ချက်များ ရေးပါ..."
          />
          <button type="submit">Post Comment</button>
        </form>

        <div className="comment-list">
          {comments.length > 0 ? (
            comments.map((c, idx) => (
              <div key={c?.id || c?._id || idx} className="comment-item">
                <div className="comment-header">
                  <strong>{c?.userName || "User"}</strong>
                  <span>{c?.date || ""}</span>
                </div>
                <p>{c?.text || ""}</p>
              </div>
            ))
          ) : (
            <p style={{ color: "#94a3b8", fontSize: "14px" }}>
              Comment မရှိသေးပါ။ ပထမဆုံး မှတ်ချက်ရေးသားသူ ဖြစ်လိုက်ပါ။
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;