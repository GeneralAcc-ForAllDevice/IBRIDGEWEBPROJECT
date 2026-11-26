import React, { useContext, useEffect, useState } from "react";
import axios from "axios";
import { StoreContext } from "../../context/StoreContext";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "./AdminDashboard.css";

const AdminDashboard = () => {
  const {
    url,
    token,
    role,
    food_list,
    fetchFoodList,
    software_list,
    fetchSoftwareList,
  } = useContext(StoreContext) || {};
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("repairs"); // repairs | users | orders | products | softwares | posts
  const [allUsers, setAllUsers] = useState([]);
  const [currentAdminId, setCurrentAdminId] = useState("");
  const [allOrders, setAllOrders] = useState([]);
  const [allPosts, setAllPosts] = useState([]);
  const [repairs, setRepairs] = useState([]);
  const [loading, setLoading] = useState(true);

  const [newRepair, setNewRepair] = useState({
    trackingCode: "",
    customerName: "",
    phone: "",
    deviceModel: "",
    issueDescription: "",
    estimatedCost: "",
    status: "မပြင်ရသေးပါ",
    technicianName: "",
    technicianPhone: "09-757779228",
    technicianNote: "",
  });

  useEffect(() => {
    if (!token || role !== "admin") {
      toast.error("Admin အကောင့်ဖြင့်သာ ဝင်ရောက်နိုင်ပါသည်");
      navigate("/");
    }
  }, [token, role, navigate]);

  const fetchAdminData = async () => {
    if (!url || !token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [userRes, chatUserRes, orderRes, postRes, repairRes] =
        await Promise.all([
          axios
            .get(`${url}/api/user/admin/list`, {
              headers: { token },
              timeout: 5000,
            })
            .catch(() => null),
          axios
            .get(`${url}/api/chat/users`, {
              headers: { token },
              timeout: 5000,
            })
            .catch(() => null),
          axios.get(`${url}/api/order/list`, { timeout: 5000 }).catch(() => null),
          axios.get(`${url}/api/post/list`, { timeout: 5000 }).catch(() => null),
          axios
            .get(`${url}/api/repair/list`, { timeout: 5000 })
            .catch(() => null),
        ]);

      if (userRes?.data?.success && Array.isArray(userRes.data.data)) {
        setAllUsers(userRes.data.data);
        setCurrentAdminId(userRes.data.currentAdminId || "");
      } else if (chatUserRes?.data?.success) {
        setAllUsers(
          Array.isArray(chatUserRes.data.allUsers)
            ? chatUserRes.data.allUsers
            : []
        );
        setCurrentAdminId(chatUserRes.data.myId || "");
      }

      if (orderRes?.data?.success) {
        setAllOrders(
          Array.isArray(orderRes.data.data) ? orderRes.data.data : []
        );
      }
      if (postRes?.data?.success) {
        setAllPosts(Array.isArray(postRes.data.data) ? postRes.data.data : []);
      }
      if (repairRes?.data?.success) {
        setRepairs(
          Array.isArray(repairRes.data.data) ? repairRes.data.data : []
        );
      }
    } catch (err) {
      console.error("Admin fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, [url, token]);
  // 1. စက်ပြင် Code အသစ် မှတ်တမ်းတင်ခြင်း
  const handleAddRepair = async (e) => {
    e.preventDefault();
    if (
      !newRepair.trackingCode.trim() ||
      !newRepair.customerName.trim() ||
      !newRepair.deviceModel.trim()
    ) {
      toast.warning(
        "Code နံပါတ်၊ Customer အမည်နှင့် စက်အမျိုးအစား ထည့်သွင်းပါ"
      );
      return;
    }
    try {
      const res = await axios.post(`${url}/api/repair/add`, newRepair, {
        headers: { token },
      });
      if (res.data?.success) {
        toast.success(res.data.message);
        setNewRepair({
          trackingCode: "",
          customerName: "",
          phone: "",
          deviceModel: "",
          issueDescription: "",
          estimatedCost: "",
          status: "မပြင်ရသေးပါ",
          technicianName: "",
          technicianPhone: "09-757779228",
          technicianNote: "",
        });
        fetchAdminData();
      } else {
        toast.error(res.data?.message || "စာရင်းသွင်း၍မရပါ");
      }
    } catch (err) {
      toast.error("စာရင်းသွင်း၍မရပါ");
    }
  };

  // 2. စက်ပြင် Status ပြောင်းခြင်း (မပြင်ရသေးပါ / ပြင်ဆင်နေဆဲ / ပြင်ဆင်ပြီးပါပြီ)
  const handleUpdateRepairStatus = async (id, newStatus) => {
    try {
      const res = await axios.post(
        `${url}/api/repair/update`,
        { id, status: newStatus },
        { headers: { token } }
      );
      if (res.data?.success) {
        toast.success(`အခြေအနေကို "${newStatus}" သို့ ပြောင်းပြီးပါပြီ`);
        setRepairs((prev) =>
          (Array.isArray(prev) ? prev : []).map((r) =>
            r._id === id ? { ...r, status: newStatus } : r
          )
        );
      }
    } catch (e) {
      toast.error("Status ပြောင်း၍မရပါ");
    }
  };

  // 3. စက်ပြင်မှတ်တမ်း ဖျက်ခြင်း
  const handleDeleteRepair = async (id) => {
    if (!window.confirm("ဤစက်ပြင်မှတ်တမ်းကို ဖျက်ရန် သေချာပါသလား?")) return;
    try {
      const res = await axios.post(
        `${url}/api/repair/delete`,
        { id },
        { headers: { token } }
      );
      if (res.data?.success) {
        toast.success("စက်ပြင်မှတ်တမ်း ဖျက်ပြီးပါပြီ");
        setRepairs((prev) =>
          (Array.isArray(prev) ? prev : []).filter((r) => r._id !== id)
        );
      }
    } catch (e) {
      toast.error("ဖျက်၍မရပါ");
    }
  };

  // 4. User ကို Admin ပေးခြင်း / ရုပ်သိမ်းခြင်း
  const handleToggleUserRole = async (userObj) => {
    const targetRole = userObj.role === "admin" ? "user" : "admin";
    const confirmMsg =
      targetRole === "admin"
        ? `"${userObj.name}" ကို Admin ရာထူး ပေးအပ်ရန် သေချာပါသလား?`
        : `"${userObj.name}" ထံမှ Admin ရာထူး ပြန်ရုပ်သိမ်းရန် သေချာပါသလား?`;

    if (!window.confirm(confirmMsg)) return;

    try {
      const res = await axios.post(
        `${url}/api/user/admin/role`,
        { targetUserId: userObj._id, newRole: targetRole },
        { headers: { token } }
      );
      if (res.data?.success) {
        toast.success(res.data.message);
        setAllUsers((prev) =>
          (Array.isArray(prev) ? prev : []).map((u) =>
            u._id === userObj._id ? { ...u, role: targetRole } : u
          )
        );
      } else {
        toast.error(res.data?.message || "Admin ရာထူး ပြောင်း၍မရပါ");
      }
    } catch (e) {
      toast.error("Role ပြောင်းရာတွင် အမှားရှိနေပါသည်");
    }
  };

  // 5. User Account ဖျက်ခြင်း
  const handleDeleteUser = async (userObj) => {
    if (
      !window.confirm(
        `သတိပြုရန်: "${userObj.name}" (${userObj.email}) အကောင့်ကို အပြီးတိုင် ဖျက်ပစ်မှာ သေချာပါသလား?`
      )
    )
      return;

    try {
      const res = await axios.post(
        `${url}/api/user/admin/delete`,
        { targetUserId: userObj._id },
        { headers: { token } }
      );
      if (res.data?.success) {
        toast.success(res.data.message);
        setAllUsers((prev) =>
          (Array.isArray(prev) ? prev : []).filter((u) => u._id !== userObj._id)
        );
      } else {
        toast.error(res.data?.message || "Account ဖျက်၍မရပါ");
      }
    } catch (e) {
      toast.error("Account ဖျက်ရာတွင် အမှားရှိနေပါသည်");
    }
  };

  // 6. Order Status ပြောင်းလဲခြင်း
  const handleOrderStatus = async (orderId, newStatus) => {
    try {
      const res = await axios.post(`${url}/api/order/status`, {
        orderId,
        status: newStatus,
      });
      if (res.data?.success) {
        toast.success(`Order Status ကို "${newStatus}" သို့ ပြောင်းပြီးပါပြီ`);
        fetchAdminData();
      }
    } catch (e) {
      toast.error("Status ပြောင်းရာတွင် အမှားရှိနေပါသည်");
    }
  };

  // Order ဖျက်ခြင်း
  const handleDeleteOrder = async (orderId) => {
    if (!window.confirm("ဤ Order ကို အပြီးတိုင် ဖျက်ပစ်ရန် သေချာပါသလား?"))
      return;
    try {
      const res = await axios.post(
        `${url}/api/order/remove`,
        { orderId },
        { headers: { token } }
      );
      if (res.data?.success) {
        toast.success(res.data.message);
        setAllOrders((prev) =>
          (Array.isArray(prev) ? prev : []).filter((o) => o._id !== orderId)
        );
      } else {
        toast.error(res.data?.message || "Order ဖျက်၍မရပါ");
      }
    } catch (e) {
      toast.error("Order ဖျက်၍မရပါ");
    }
  };

  // 7. Product / Software / Post ဖျက်ခြင်း
  const handleRemoveProduct = async (id) => {
    if (!window.confirm("ဤ Product ကို ဖျက်ရန် သေချာပါသလား?")) return;
    try {
      const res = await axios.post(
        `${url}/api/food/remove`,
        { id },
        { headers: { token } }
      );
      if (res.data?.success) {
        toast.success("Product ဖျက်ပြီးပါပြီ");
        if (typeof fetchFoodList === "function") await fetchFoodList();
      }
    } catch (e) {}
  };

  const handleRemoveSoftware = async (id) => {
    if (!window.confirm("ဤ Software ကို ဖျက်ရန် သေချာပါသလား?")) return;
    try {
      const res = await axios.post(
        `${url}/api/software/remove`,
        { id },
        { headers: { token } }
      );
      if (res.data?.success) {
        toast.success("Software ဖျက်ပြီးပါပြီ");
        if (typeof fetchSoftwareList === "function")
          await fetchSoftwareList();
      }
    } catch (e) {}
  };

  const handleRemovePost = async (postId) => {
    if (!window.confirm("ဤ Post ကို ဖျက်ရန် သေချာပါသလား?")) return;
    try {
      const res = await axios.post(`${url}/api/post/delete`, { postId });
      if (res.data?.success) {
        toast.success("Post ဖျက်ပြီးပါပြီ");
        setAllPosts((prev) =>
          (Array.isArray(prev) ? prev : []).filter((p) => p._id !== postId)
        );
      }
    } catch (e) {}
  };

  // Safe Array Guards
  const safeRepairs = Array.isArray(repairs) ? repairs : [];
  const safeUsers = Array.isArray(allUsers) ? allUsers : [];
  const safeOrders = Array.isArray(allOrders) ? allOrders : [];
  const safePosts = Array.isArray(allPosts) ? allPosts : [];
  const safeFoodList = Array.isArray(food_list) ? food_list : [];
  const safeSoftwareList = Array.isArray(software_list) ? software_list : [];

  const totalRevenue = safeOrders.reduce(
    (sum, o) => sum + Number(o?.amount || 0),
    0
  );
  return (
    <div className="admin-dashboard-container">
      <div className="admin-header-bar">
        <div>
          <span className="admin-badge">● MASTER CONTROL PANEL</span>
          <h1>IBRIDGE Admin Dashboard</h1>
        </div>
        <button
          type="button"
          onClick={fetchAdminData}
          className="admin-refresh-btn"
        >
          ↻ Sync Data
        </button>
      </div>

      {/* Overview Stats Cards */}
      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <span className="stat-label">REPAIR TICKETS</span>
          <h2 className="stat-value gold">{safeRepairs.length}</h2>
        </div>
        <div className="admin-stat-card">
          <span className="stat-label">TOTAL USERS</span>
          <h2 className="stat-value">{safeUsers.length}</h2>
        </div>
        <div className="admin-stat-card">
          <span className="stat-label">TOTAL REVENUE</span>
          <h2 className="stat-value gold">
            {totalRevenue.toLocaleString()} Ks
          </h2>
        </div>
        <div className="admin-stat-card">
          <span className="stat-label">ORDERS / ITEMS</span>
          <h2 className="stat-value">
            {safeOrders.length} / {safeFoodList.length}
          </h2>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="admin-tabs-row">
        <button
          type="button"
          className={`admin-tab ${activeTab === "repairs" ? "active" : ""}`}
          onClick={() => setActiveTab("repairs")}
        >
          🔧 Repairs ({safeRepairs.length})
        </button>
        <button
          type="button"
          className={`admin-tab ${activeTab === "users" ? "active" : ""}`}
          onClick={() => setActiveTab("users")}
        >
          👥 Users ({safeUsers.length})
        </button>
        <button
          type="button"
          className={`admin-tab ${activeTab === "orders" ? "active" : ""}`}
          onClick={() => setActiveTab("orders")}
        >
          📦 Orders ({safeOrders.length})
        </button>
        <button
          type="button"
          className={`admin-tab ${activeTab === "products" ? "active" : ""}`}
          onClick={() => setActiveTab("products")}
        >
          💻 Products ({safeFoodList.length})
        </button>
        <button
          type="button"
          className={`admin-tab ${activeTab === "softwares" ? "active" : ""}`}
          onClick={() => setActiveTab("softwares")}
        >
          💿 Softwares ({safeSoftwareList.length})
        </button>
        <button
          type="button"
          className={`admin-tab ${activeTab === "posts" ? "active" : ""}`}
          onClick={() => setActiveTab("posts")}
        >
          📰 Newsfeed ({safePosts.length})
        </button>
      </div>

      {/* TAB 0: REPAIR CODES MANAGEMENT */}
      {activeTab === "repairs" && (
        <div className="admin-list-box">
          <form
            onSubmit={handleAddRepair}
            className="admin-row-card"
            style={{
              flexDirection: "column",
              alignItems: "stretch",
              gap: "12px",
            }}
          >
            <h3 style={{ margin: 0, fontSize: "16px", color: "#34d399" }}>
              + စက်ပြင် Code အသစ် မှတ်တမ်းတင်ရန်
            </h3>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                gap: "10px",
              }}
            >
              <input
                type="text"
                placeholder="Code နံပါတ် (ဥပမာ - IBR-101)"
                value={newRepair.trackingCode}
                onChange={(e) =>
                  setNewRepair({ ...newRepair, trackingCode: e.target.value })
                }
                className="admin-status-select"
                required
              />
              <input
                type="text"
                placeholder="Customer အမည်"
                value={newRepair.customerName}
                onChange={(e) =>
                  setNewRepair({ ...newRepair, customerName: e.target.value })
                }
                className="admin-status-select"
                required
              />
              <input
                type="text"
                placeholder="စက်အမျိုးအစား (ဥပမာ - Dell XPS 13)"
                value={newRepair.deviceModel}
                onChange={(e) =>
                  setNewRepair({ ...newRepair, deviceModel: e.target.value })
                }
                className="admin-status-select"
                required
              />
              <input
                type="text"
                placeholder="ပြဿနာ (ဥပမာ - No Power)"
                value={newRepair.issueDescription}
                onChange={(e) =>
                  setNewRepair({
                    ...newRepair,
                    issueDescription: e.target.value,
                  })
                }
                className="admin-status-select"
              />
              <input
                type="text"
                placeholder="ခန့်မှန်းကျသင့်ငွေ (ဥပမာ - 45,000 Ks)"
                value={newRepair.estimatedCost}
                onChange={(e) =>
                  setNewRepair({ ...newRepair, estimatedCost: e.target.value })
                }
                className="admin-status-select"
              />
              <input
                type="text"
                placeholder="Service ဆရာ အမည်"
                value={newRepair.technicianName}
                onChange={(e) =>
                  setNewRepair({ ...newRepair, technicianName: e.target.value })
                }
                className="admin-status-select"
              />
              <input
                type="text"
                placeholder="Service ဆရာ ဖုန်း (09-...)"
                value={newRepair.technicianPhone}
                onChange={(e) =>
                  setNewRepair({ ...newRepair, technicianPhone: e.target.value })
                }
                className="admin-status-select"
              />
              <select
                value={newRepair.status}
                onChange={(e) =>
                  setNewRepair({ ...newRepair, status: e.target.value })
                }
                className="admin-status-select"
              >
                <option value="မပြင်ရသေးပါ">မပြင်ရသေးပါ</option>
                <option value="ပြင်ဆင်နေဆဲ">ပြင်ဆင်နေဆဲ</option>
                <option value="ပြင်ဆင်ပြီးပါပြီ">ပြင်ဆင်ပြီးပါပြီ</option>
              </select>
            </div>

            <input
              type="text"
              placeholder="Service ဆရာ၏ မှတ်ချက် (Optional - ဥပမာ - IC လဲရန် လိုအပ်ပါသည်)"
              value={newRepair.technicianNote}
              onChange={(e) =>
                setNewRepair({ ...newRepair, technicianNote: e.target.value })
              }
              className="admin-status-select"
            />

            <button
              type="submit"
              style={{
                padding: "11px",
                borderRadius: "10px",
                border: "none",
                background: "#34d399",
                color: "#09090b",
                fontWeight: "800",
                cursor: "pointer",
              }}
            >
              ✓ စက်ပြင် Code သိမ်းဆည်းမည်
            </button>
          </form>

          {safeRepairs.length === 0 ? (
            <p className="admin-empty">စက်ပြင်မှတ်တမ်း မရှိသေးပါ။</p>
          ) : (
            safeRepairs.map((r) => (
              <div key={r._id} className="admin-row-card">
                <div className="admin-row-info">
                  <h4>
                    <span style={{ color: "#34d399" }}>[{r.trackingCode}]</span>{" "}
                    {r.deviceModel} — {r.customerName}
                  </h4>
                  <p className="admin-sub-text">
                    ပြဿနာ: {r.issueDescription || "N/A"} • ကျသင့်ငွေ:{" "}
                    {r.estimatedCost} • ဆရာ: {r.technicianName} (
                    {r.technicianPhone})
                  </p>
                </div>

                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  <select
                    value={r.status}
                    onChange={(e) =>
                      handleUpdateRepairStatus(r._id, e.target.value)
                    }
                    className="admin-status-select"
                  >
                    <option value="မပြင်ရသေးပါ">🔴 မပြင်ရသေးပါ</option>
                    <option value="ပြင်ဆင်နေဆဲ">🟡 ပြင်ဆင်နေဆဲ</option>
                    <option value="ပြင်ဆင်ပြီးပါပြီ">🟢 ပြင်ဆင်ပြီးပါပြီ</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => handleDeleteRepair(r._id)}
                    className="admin-del-btn"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 1: USERS MANAGEMENT */}
      {activeTab === "users" && (
        <div className="admin-list-box">
          {loading ? (
            <p className="admin-empty">Loading users...</p>
          ) : safeUsers.length === 0 ? (
            <p className="admin-empty">User Account မရှိသေးပါ။</p>
          ) : (
            safeUsers.map((u) => {
              const isMe = String(u._id) === String(currentAdminId);
              const isAdmin = u.role === "admin";
              return (
                <div key={u._id} className="admin-row-card">
                  <div className="admin-row-media">
                    {u.avatar ? (
                      <img src={`${url}/images/${u.avatar}`} alt={u.name} />
                    ) : (
                      <div
                        style={{
                          width: "52px",
                          height: "52px",
                          borderRadius: "10px",
                          background: "#27272a",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: "800",
                          fontSize: "18px",
                          color: "#ffffff",
                          flexShrink: 0,
                        }}
                      >
                        {u.name?.charAt(0).toUpperCase() || "U"}
                      </div>
                    )}
                    <div>
                      <h4
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          flexWrap: "wrap",
                        }}
                      >
                        <span>{u.name}</span>
                        {isAdmin ? (
                          <span
                            style={{
                              fontSize: "10.5px",
                              background: "rgba(52, 211, 153, 0.15)",
                              color: "#34d399",
                              border: "1px solid rgba(52, 211, 153, 0.4)",
                              padding: "2px 8px",
                              borderRadius: "6px",
                            }}
                          >
                            🛡️ ADMIN
                          </span>
                        ) : (
                          <span
                            style={{
                              fontSize: "10.5px",
                              background: "rgba(255, 255, 255, 0.08)",
                              color: "#a1a1aa",
                              padding: "2px 8px",
                              borderRadius: "6px",
                            }}
                          >
                            USER
                          </span>
                        )}
                        {isMe && (
                          <span style={{ fontSize: "11px", color: "#60a5fa" }}>
                            (You)
                          </span>
                        )}
                      </h4>
                      <p className="admin-sub-text">
                        ✉️ {u.email} {u.phone && `• 📞 ${u.phone}`}
                      </p>
                    </div>
                  </div>

                  {!isMe && (
                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                      <button
                        type="button"
                        onClick={() => handleToggleUserRole(u)}
                        style={{
                          padding: "8px 13px",
                          borderRadius: "9px",
                          border: isAdmin
                            ? "1px solid rgba(251, 191, 36, 0.45)"
                            : "1px solid rgba(52, 211, 153, 0.45)",
                          background: isAdmin
                            ? "rgba(251, 191, 36, 0.14)"
                            : "rgba(52, 211, 153, 0.14)",
                          color: isAdmin ? "#fbbf24" : "#34d399",
                          fontSize: "12.5px",
                          fontWeight: "700",
                          cursor: "pointer",
                        }}
                      >
                        {isAdmin ? "↓ Remove Admin" : "🛡️ Make Admin"}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteUser(u)}
                        className="admin-del-btn"
                      >
                        🗑️ Delete Acc
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* TAB 2: ORDERS */}
      {activeTab === "orders" && (
        <div className="admin-list-box">
          {safeOrders.length === 0 ? (
            <p className="admin-empty">Order မရှိသေးပါ။</p>
          ) : (
            safeOrders.map((order) => {
              const orderItems = Array.isArray(order?.items)
                ? order.items
                : [];
              return (
                <div key={order._id} className="admin-row-card">
                  <div className="admin-row-info">
                    <h4>
                      {orderItems
                        .map((i) => `${i.name} x${i.quantity}`)
                        .join(", ")}
                    </h4>
                    <p>
                      👤 {order.address?.firstName} {order.address?.lastName} | 📞{" "}
                      {order.address?.phone}
                    </p>
                    <p className="admin-sub-text">
                      📍 {order.address?.street}, {order.address?.city} • 💰{" "}
                      <strong>
                        {Number(order.amount || 0).toLocaleString()} Kyats
                      </strong>
                    </p>
                  </div>

                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    <select
                      value={order.status}
                      onChange={(e) =>
                        handleOrderStatus(order._id, e.target.value)
                      }
                      className="admin-status-select"
                    >
                      <option value="Order Processing">Order Processing</option>
                      <option value="Out for delivery">Out for delivery</option>
                      <option value="Delivered">Delivered</option>
                    </select>

                    <button
                      type="button"
                      onClick={() => handleDeleteOrder(order._id)}
                      className="admin-del-btn"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* TAB 3: PRODUCTS */}
      {activeTab === "products" && (
        <div className="admin-list-box">
          {safeFoodList.length === 0 ? (
            <p className="admin-empty">Product မရှိသေးပါ။</p>
          ) : (
            safeFoodList.map((item) => (
              <div key={item._id} className="admin-row-card">
                <div className="admin-row-media">
                  <img src={`${url}/images/${item.image}`} alt={item.name} />
                  <div>
                    <h4>{item.name}</h4>
                    <p className="admin-sub-text">
                      {item.category} •{" "}
                      {Number(item.price || 0).toLocaleString()} Kyats{" "}
                      {item.sellerName && `• Seller: ${item.sellerName}`}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveProduct(item._id)}
                  className="admin-del-btn"
                >
                  Delete
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 4: SOFTWARES */}
      {activeTab === "softwares" && (
        <div className="admin-list-box">
          {safeSoftwareList.length === 0 ? (
            <p className="admin-empty">Software မရှိသေးပါ။</p>
          ) : (
            safeSoftwareList.map((soft) => (
              <div key={soft._id} className="admin-row-card">
                <div className="admin-row-media">
                  <img src={`${url}/images/${soft.image}`} alt={soft.name} />
                  <div>
                    <h4>{soft.name}</h4>
                    <p className="admin-sub-text">
                      {soft.platform} • {soft.version} • {soft.fileSize || "N/A"}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveSoftware(soft._id)}
                  className="admin-del-btn"
                >
                  Delete
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 5: NEWSFEED POSTS */}
      {activeTab === "posts" && (
        <div className="admin-list-box">
          {safePosts.length === 0 ? (
            <p className="admin-empty">Post မရှိသေးပါ။</p>
          ) : (
            safePosts.map((post) => (
              <div key={post._id} className="admin-row-card">
                <div className="admin-row-info">
                  <h4>
                    {post.author}{" "}
                    <small style={{ color: "#9ca3af", fontWeight: "normal" }}>
                      (
                      {post.createdAt
                        ? new Date(post.createdAt).toLocaleDateString()
                        : ""}
                      )
                    </small>
                  </h4>
                  <p className="admin-sub-text">
                    {post.content || "[Media Post]"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemovePost(post._id)}
                  className="admin-del-btn"
                >
                  Delete Post
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;