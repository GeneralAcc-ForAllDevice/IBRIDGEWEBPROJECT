import React, { useContext, useEffect, useState } from "react";
import "./MyOrders.css";
import { StoreContext } from "../../context/StoreContext";
import axios from "axios";
import { assets } from "../../assets/frontend_assets/assets";
import { toast } from "react-toastify";

const MyOrders = () => {
  const { url, token } = useContext(StoreContext);
  const [data, setData] = useState([]);

  const fetchOrders = async () => {
    if (!token) return;
    try {
      const response = await axios.post(
        url + "/api/order/userorders",
        {},
        { headers: { token } }
      );
      if (response.data.success) {
        setData(response.data.data || []);
      }
    } catch (e) {}
  };

  useEffect(() => {
    if (token) {
      fetchOrders();
    }
  }, [token]);

  // Buyer မှ Order Cancel လုပ်ခြင်း
  const handleCancelOrder = async (orderId) => {
    if (!window.confirm("ဤ Order ကို ပယ်ဖျက် (Cancel) မှာ သေချာပါသလား?")) return;
    try {
      const res = await axios.post(
        `${url}/api/order/cancel`,
        { orderId },
        { headers: { token } }
      );
      if (res.data.success) {
        toast.success(res.data.message);
        setData((prev) => prev.filter((o) => o._id !== orderId));
      } else {
        toast.error(res.data.message);
      }
    } catch (err) {
      toast.error("Order Cancel လုပ်၍မရပါ");
    }
  };

  return (
    <div className="my-orders">
      <h2>My Orders</h2>
      <div className="container">
        {data.length === 0 ? (
          <p style={{ color: "#94a3b8", textAlign: "center", padding: "30px" }}>
            မှာယူထားသော Order မရှိသေးပါ။
          </p>
        ) : (
          data.map((order) => (
            <div key={order._id} className="my-orders-order">
              <img src={assets.parcel_icon} alt="" />
              <p>
                {order.items.map((item, idx) =>
                  idx === order.items.length - 1
                    ? `${item.name} x ${item.quantity}`
                    : `${item.name} x ${item.quantity}, `
                )}
              </p>
              <p>{Number(order.amount).toLocaleString()} Ks</p>
              <p>Items: {order.items.length}</p>
              <p>
                <span>&#x25cf;</span> <b>{order.status}</b>
              </p>

              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                <button type="button" onClick={fetchOrders}>
                  Track Order
                </button>

                {/* Order Processing ဖြစ်နေတုန်း Cancel လုပ်ခွင့်ပေးခြင်း */}
                {order.status === "Order Processing" && (
                  <button
                    type="button"
                    onClick={() => handleCancelOrder(order._id)}
                    style={{
                      background: "rgba(244, 63, 94, 0.16)",
                      border: "1px solid rgba(244, 63, 94, 0.5)",
                      color: "#fb7185",
                      fontWeight: "700",
                    }}
                  >
                    ✕ Cancel Order
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default MyOrders;
