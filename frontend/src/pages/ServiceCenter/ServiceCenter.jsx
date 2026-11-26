import React, { useContext, useState } from "react";
import axios from "axios";
import { StoreContext } from "../../context/StoreContext";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "./ServiceCenter.css";

const ServiceCenter = () => {
  const { url, token } = useContext(StoreContext);
  const navigate = useNavigate();

  const [codeInput, setCodeInput] = useState("");
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSearchCode = async (e) => {
    e.preventDefault();
    if (!codeInput.trim()) {
      toast.warning("ဆိုင်မှပေးထားသော Code နံပါတ် ရိုက်ထည့်ပါ");
      return;
    }
    setLoading(true);
    setTicket(null);
    try {
      const res = await axios.post(`${url}/api/repair/track`, { query: codeInput });
      if (res.data.success && res.data.data) {
        setTicket(res.data.data);
      } else {
        toast.error(res.data.message || "စက်မှတ်တမ်း ရှာမတွေ့ပါ");
      }
    } catch (err) {
      toast.error("Server နှင့် ချိတ်ဆက်၍မရပါ");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeStyle = (status) => {
    if (status === "ပြင်ဆင်ပြီးပါပြီ") {
      return { background: "#dcfce7", color: "#15803d", border: "1px solid #86efac", icon: "✅" };
    }
    if (status === "ပြင်ဆင်နေဆဲ") {
      return { background: "#fef9c3", color: "#a16207", border: "1px solid #fde047", icon: "🔧" };
    }
    return { background: "#fee2e2", color: "#b91c1c", border: "1px solid #fca5a5", icon: "⏳" };
  };

  const handleChatTechnician = () => {
    if (!token) {
      toast.info("Service ဆရာနှင့် Chat ပြောရန် Login အရင်ဝင်ပါ");
      return;
    }
    navigate("/chat", { state: { sellerId: ticket?.technicianUserId } });
  };

  return (
    <div className="srv-page">
      {/* Header Banner */}
      <div className="srv-hero">
        <span className="srv-badge">● IBRIDGE REPAIR TRACKING SYSTEM</span>
        <h1>စက်ပြင်အခြေအနေ စစ်ဆေးရန်</h1>
        <p>
          ဆိုင်တွင် စက်လာအပ်စဉ်က ပေးထားသော <strong>VOUNCHER Code နံပါတ်</strong> ကို အောက်ပါအကွက်တွင် ရိုက်ထည့်ပြီး မိမိစက် ပြင်ဆင်ပြီး/မပြီး အခြေအနေနှင့် Service ဆရာထံ တိုက်ရိုက်ဆက်သွယ် မေးမြန်းနိုင်ပါသည်။
        </p>
      </div>

      {/* Code Search Box */}
      <div className="srv-tracker-card">
        <h3>🔍 Enter VOUNCHER Code (စက်နံပါတ် ရိုက်ထည့်ပါ)</h3>
        <form onSubmit={handleSearchCode} className="srv-track-form">
          <input
            type="text"
            placeholder="ဥပမာ - 1234"
            value={codeInput}
            onChange={(e) => setCodeInput(e.target.value)}
            className="srv-track-input"
            style={{ textTransform: "uppercase", fontWeight: "700", letterSpacing: "1px" }}
          />
          <button type="submit" disabled={loading} className="srv-track-btn">
            {loading ? "ရှာဖွေနေသည်..." : "စစ်ဆေးမည်"}
          </button>
        </form>

        {/* Search Result Card */}
        {ticket && (() => {
          const badge = getStatusBadgeStyle(ticket.status);
          return (
            <div className="srv-track-result" style={{ marginTop: "20px", padding: "20px", background: "#ffffff", borderRadius: "16px", border: "1.5px solid #cbd5e1" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px", paddingBottom: "12px", borderBottom: "1px solid #e2e8f0" }}>
                <div>
                  <span style={{ fontSize: "12px", color: "#64748b", fontWeight: "700" }}>CODE: {ticket.trackingCode}</span>
                  <h2 style={{ margin: "4px 0 0 0", fontSize: "20px", color: "#0f172a" }}>{ticket.deviceModel}</h2>
                </div>

                <span
                  style={{
                    padding: "8px 16px",
                    borderRadius: "50px",
                    fontSize: "14px",
                    fontWeight: "800",
                    background: badge.background,
                    color: badge.color,
                    border: badge.border,
                  }}
                >
                  {badge.icon} {ticket.status}
                </span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "10px", marginTop: "12px", fontSize: "14px", color: "#334155" }}>
                <div><strong>👤 Customer:</strong> {ticket.customerName}</div>
                <div><strong>💰 ခန့်မှန်းကျသင့်ငွေ:</strong> <span style={{ color: "#16a34a", fontWeight: "700" }}>{ticket.estimatedCost}</span></div>
                <div><strong>🔧 ပြဿနာ:</strong> {ticket.issueDescription || "အထွေထွေ စစ်ဆေးပြုပြင်ခြင်း"}</div>
                <div><strong>📅 လက်ခံသည့်ရက်:</strong> {new Date(ticket.createdAt).toLocaleDateString()}</div>
              </div>

                            {ticket.technicianNote && (
                <div
                  style={{
                    marginTop: "14px",
                    padding: "14px 16px",
                    background: "rgba(245, 158, 11, 0.14)",
                    border: "1.5px solid rgba(251, 191, 36, 0.55)",
                    borderRadius: "12px",
                    fontSize: "14.5px",
                    lineHeight: "1.6",
                    color: "#fef3c7",
                  }}
                >
                  <strong style={{ color: "#fbbf24", display: "block", marginBottom: "4px", fontSize: "13px" }}>
                    📝 Service ဆရာ၏ မှတ်ချက်:
                  </strong>
                  <span style={{ fontWeight: "600", color: "#ffffff" }}>
                    {ticket.technicianNote}
                  </span>
                </div>
              )}


              {/* Service ဆရာကို တိုက်ရိုက်ဆက်သွယ်မေးမြန်းရန် Box */}
              <div style={{ marginTop: "16px", padding: "16px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "14px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
                <div>
                  <span style={{ fontSize: "11px", fontWeight: "700", color: "#64748b", display: "block" }}>ASSIGNED TECHNICIAN</span>
                  <strong style={{ fontSize: "15px", color: "#0f172a" }}>👨‍🔧 {ticket.technicianName}</strong>
                  <span style={{ display: "block", fontSize: "13px", color: "#2563eb", fontWeight: "600" }}>📞 {ticket.technicianPhone}</span>
                </div>

                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  {ticket.technicianPhone && (
                    <a
                      href={`tel:${ticket.technicianPhone}`}
                      style={{ padding: "10px 16px", borderRadius: "10px", background: "#16a34a", color: "#ffffff", textDecoration: "none", fontWeight: "700", fontSize: "13px" }}
                    >
                      📞 ဖုန်းဆက်မေးရန်
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={handleChatTechnician}
                    style={{ padding: "10px 16px", borderRadius: "10px", border: "none", background: "#2563eb", color: "#ffffff", fontWeight: "700", fontSize: "13px", cursor: "pointer" }}
                  >
                    💬 Service ဆရာနှင့် Chat မေးရန်
                  </button>
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
};

export default ServiceCenter;
