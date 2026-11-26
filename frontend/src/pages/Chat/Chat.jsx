import React, { useContext, useEffect, useRef, useState } from "react";
import "./Chat.css";
import axios from "axios";
import { StoreContext } from "../../context/StoreContext";
import { toast } from "react-toastify";
import { useLocation, useNavigate } from "react-router-dom";

const QUICK_EMOJIS = ["👍", "❤️", "😂", "🔥", "🔧", "💻"];

const Chat = () => {
  const { url, token } = useContext(StoreContext);
  const navigate = useNavigate();
  const location = useLocation();

  const [activeTab, setActiveTab] = useState("friends");
  const [myId, setMyId] = useState("");
  const [allUsers, setAllUsers] = useState([]);
  const [myFriends, setMyFriends] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  // Image & Profile Modal States
  const [chatImage, setChatImage] = useState(null);
  const [previewFullImg, setPreviewFullImg] = useState(null);
  const [showFriendModal, setShowFriendModal] = useState(false);
  const [friendProfileData, setFriendProfileData] = useState(null);
  const [friendItems, setFriendItems] = useState([]);
  const [loadingProfile, setLoadingProfile] = useState(false);

  const chatBoxRef = useRef(null);
  const prevMsgCountRef = useRef(0);

  // Search & Unread States
  const [searchUser, setSearchUser] = useState("");
  const [unreadCounts, setUnreadCounts] = useState({});
  const [lastActivity, setLastActivity] = useState(() => {
    try { return JSON.parse(localStorage.getItem("chat_last_activity") || "{}"); } catch { return {}; }
  });
  const [lastReadCounts, setLastReadCounts] = useState(() => {
    try { return JSON.parse(localStorage.getItem("chat_read_counts") || "{}"); } catch { return {}; }
  });

  const isUserOnline = (user) => {
    if (!user?.lastActive) return false;
    return Date.now() - new Date(user.lastActive).getTime() < 45000;
  };

  const renderUserAvatar = (user, size = 42, showDot = true) => {
    const initial = user?.name ? user.name.charAt(0).toUpperCase() : "U";
    const online = isUserOnline(user);

    return (
      <div style={{ position: "relative", width: `${size}px`, height: `${size}px`, flexShrink: 0 }}>
        {user?.avatar ? (
          <img
            src={`${url}/images/${user.avatar}`}
            alt={user.name}
            style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover", border: "2px solid #38bdf8" }}
          />
        ) : (
          <div
            style={{
              width: "100%", height: "100%", borderRadius: "50%",
              background: "linear-gradient(135deg, #0284c7, #38bdf8)",
              color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
              fontWeight: "bold", fontSize: `${Math.floor(size * 0.42)}px`
            }}
          >
            {initial}
          </div>
        )}
        {showDot && (
          <span
            style={{
              position: "absolute", bottom: "0px", right: "0px",
              width: `${Math.max(10, Math.floor(size * 0.26))}px`,
              height: `${Math.max(10, Math.floor(size * 0.26))}px`,
              borderRadius: "50%", backgroundColor: online ? "#22c55e" : "#64748b",
              border: "2px solid #0f172a"
            }}
          />
        )}
      </div>
    );
  };
  // GlobalVideoCall Component ကို ဖွင့်၍ Video Call စတင်ခေါ်ဆိုခြင်း
  const startVideoCall = () => {
    if (!selectedFriend) return;
    window.dispatchEvent(
      new CustomEvent("ibridge:start-vc", { detail: selectedFriend })
    );
  };

  // Real-time Message Fetching
  const fetchMessages = async (otherId) => {
    if (!otherId || !token) return;
    try {
      const res = await axios.post(
        `${url}/api/chat/messages`,
        { otherUserId: otherId },
        { headers: { token } }
      );
      if (res.data.success) {
        const msgs = res.data.data || [];
        setMessages((prev) => {
          if (prev.length === msgs.length && prev[prev.length - 1]?._id === msgs[msgs.length - 1]?._id) {
            return prev;
          }
          return msgs;
        });

        const incomingCount = msgs.filter((m) => m.senderId === otherId).length;
        setLastReadCounts((prev) => {
          const updated = { ...prev, [otherId]: incomingCount };
          localStorage.setItem("chat_read_counts", JSON.stringify(updated));
          return updated;
        });
        setUnreadCounts((prev) => ({ ...prev, [otherId]: 0 }));
      }
    } catch (error) {}
  };

  // Refresh မလိုဘဲ ချက်ချင်း စာပို့ပြသခြင်း (Instant Optimistic Update)
  const sendMessageInstant = async (msgText, imgFile = null) => {
    if ((!msgText.trim() && !imgFile) || !selectedFriend || sending) return;

    const tempId = `temp_${Date.now()}`;
    const optimisticMsg = {
      _id: tempId,
      senderId: myId,
      receiverId: selectedFriend._id,
      text: msgText,
      image: null,
      tempPreview: imgFile ? URL.createObjectURL(imgFile) : null,
      createdAt: new Date().toISOString(),
      isSending: true,
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    setText("");
    setChatImage(null);
    setSending(true);

    const formData = new FormData();
    formData.append("receiverId", selectedFriend._id);
    formData.append("text", msgText);
    if (imgFile) formData.append("image", imgFile);

    try {
      const res = await axios.post(`${url}/api/chat/send`, formData, { headers: { token } });
      if (res.data.success) {
        const updatedAct = { ...lastActivity, [selectedFriend._id]: Date.now() };
        setLastActivity(updatedAct);
        localStorage.setItem("chat_last_activity", JSON.stringify(updatedAct));
        await fetchMessages(selectedFriend._id);
      } else {
        toast.error(res.data.message || "စာပို့မရပါ");
        setMessages((prev) => prev.filter((m) => m._id !== tempId));
      }
    } catch (error) {
      toast.error("စာပို့မရပါ");
      setMessages((prev) => prev.filter((m) => m._id !== tempId));
    } finally {
      setSending(false);
    }
  };

  const handleSend = (e) => {
    e.preventDefault();
    sendMessageInstant(text, chatImage);
  };

  const handleOpenFriendProfile = async (friendId) => {
    setShowFriendModal(true);
    setLoadingProfile(true);
    try {
      const res = await axios.post(`${url}/api/chat/friend-profile`, { friendId }, { headers: { token } });
      if (res.data.success) {
        setFriendProfileData(res.data.profile);
        setFriendItems(res.data.items || []);
      }
    } catch (error) {} finally {
      setLoadingProfile(false);
    }
  };
  const fetchData = async () => {
    if (!token) return;
    try {
      const res = await axios.get(`${url}/api/chat/users`, { headers: { token } });
      if (res.data.success) {
        setMyId(res.data.myId);
        const users = res.data.allUsers || [];
        const friends = res.data.myFriends || [];
        setAllUsers(users);
        setMyFriends(friends);
        setMyRequests(res.data.myRequests || []);

        if (selectedFriend) {
          const updatedSelected = users.find((u) => u._id === selectedFriend._id);
          if (updatedSelected) setSelectedFriend(updatedSelected);
        }
        if (location.state?.sellerId && !selectedFriend) {
          const targetSeller = users.find((u) => u._id === location.state.sellerId);
          if (targetSeller) {
            if (friends.includes(targetSeller._id)) {
              setActiveTab("friends");
              setSelectedFriend(targetSeller);
            } else {
              setActiveTab("all");
              setSearchUser(targetSeller.name || "");
            }
          }
        }
      }
    } catch (error) {}
  };

  const checkAllFriendsActivity = async () => {
    if (!token || myFriends.length === 0) return;
    const savedReads = JSON.parse(localStorage.getItem("chat_read_counts") || "{}");
    const savedAct = JSON.parse(localStorage.getItem("chat_last_activity") || "{}");
    let hasActChange = false;
    const newUnreads = {};

    await Promise.all(
      myFriends.map(async (fId) => {
        try {
          const res = await axios.post(`${url}/api/chat/messages`, { otherUserId: fId }, { headers: { token } });
          if (res.data.success) {
            const msgs = res.data.data || [];
            const incomingMsgs = msgs.filter((m) => m.senderId === fId);
            const readSoFar = savedReads[fId] || 0;
            if (selectedFriend?._id === fId) {
              savedReads[fId] = incomingMsgs.length;
              newUnreads[fId] = 0;
            } else {
              const diff = incomingMsgs.length - readSoFar;
              newUnreads[fId] = diff > 0 ? diff : 0;
            }
            if (msgs.length > 0) {
              const lastMsg = msgs[msgs.length - 1];
              const msgTime = lastMsg.createdAt ? new Date(lastMsg.createdAt).getTime() : msgs.length;
              if ((savedAct[fId] || 0) < msgTime) {
                savedAct[fId] = msgTime;
                hasActChange = true;
              }
            }
          }
        } catch (err) {}
      })
    );
    localStorage.setItem("chat_read_counts", JSON.stringify(savedReads));
    setUnreadCounts(newUnreads);
    if (hasActChange) {
      localStorage.setItem("chat_last_activity", JSON.stringify(savedAct));
      setLastActivity({ ...savedAct });
    }
  };

  useEffect(() => {
    if (!token) {
      toast.error("စကားပြောရန် Login အရင်ဝင်ပါ");
      navigate("/");
    } else {
      fetchData();
      const userInterval = setInterval(fetchData, 10000);
      return () => clearInterval(userInterval);
    }
  }, [token, navigate]);

  useEffect(() => {
    if (!token || myFriends.length === 0) return;
    checkAllFriendsActivity();
    const bgInterval = setInterval(checkAllFriendsActivity, 6000);
    return () => clearInterval(bgInterval);
  }, [token, myFriends, selectedFriend]);

  useEffect(() => {
    if (!selectedFriend) return;
    fetchMessages(selectedFriend._id);
    const interval = setInterval(() => fetchMessages(selectedFriend._id), 1200);
    return () => clearInterval(interval);
  }, [selectedFriend]);

  useEffect(() => {
    if (chatBoxRef.current && messages.length !== prevMsgCountRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
      prevMsgCountRef.current = messages.length;
    }
  }, [messages]);

  const handleAddFriend = async (targetUserId) => {
    try {
      const res = await axios.post(`${url}/api/chat/add-friend`, { targetUserId }, { headers: { token } });
      if (res.data.success) {
        toast.success(res.data.message);
        fetchData();
      }
    } catch (error) {}
  };

  const handleAcceptFriend = async (requesterId) => {
    try {
      const res = await axios.post(`${url}/api/chat/accept-friend`, { requesterId }, { headers: { token } });
      if (res.data.success) {
        toast.success(res.data.message);
        fetchData();
      }
    } catch (error) {}
  };

  const friendUsers = allUsers
    .filter((u) => myFriends.includes(u._id))
    .sort((a, b) => {
      const unreadA = unreadCounts[a._id] || 0;
      const unreadB = unreadCounts[b._id] || 0;
      if (unreadB !== unreadA) return unreadB - unreadA;
      return (lastActivity[b._id] || 0) - (lastActivity[a._id] || 0);
    });

  const requestUsers = allUsers.filter((u) => myRequests.includes(u._id));
  const filteredFindUsers = allUsers.filter((u) => {
    if (u._id === myId) return false;
    const query = searchUser.toLowerCase().trim();
    if (!query) return true;
    return (u.name && u.name.toLowerCase().includes(query)) || (u.email && u.email.toLowerCase().includes(query));
  });
  const totalUnread = Object.values(unreadCounts).reduce((sum, c) => sum + c, 0);
  return (
    <div className="chat-page">
      <div className={`chat-container ${selectedFriend ? "mobile-chat-open" : ""}`}>
        
        {/* ဘယ်ဘက်ခြမ်း Sidebar */}
        <div className="chat-sidebar">
          <div className="chat-tabs">
            <button className={`chat-tab-btn ${activeTab === "friends" ? "active" : ""}`} onClick={() => setActiveTab("friends")}>
              Friends ({friendUsers.length}) {totalUnread > 0 && `• ${totalUnread}`}
            </button>
            <button className={`chat-tab-btn ${activeTab === "requests" ? "active" : ""}`} onClick={() => setActiveTab("requests")}>
              Requests ({requestUsers.length})
            </button>
            <button className={`chat-tab-btn ${activeTab === "all" ? "active" : ""}`} onClick={() => setActiveTab("all")}>
              Find Users
            </button>
          </div>

          {activeTab === "all" && (
            <div style={{ padding: "10px 12px 4px 12px" }}>
              <input
                type="text"
                value={searchUser}
                onChange={(e) => setSearchUser(e.target.value)}
                placeholder="🔍 နာမည် သို့မဟုတ် Email ဖြင့် ရှာရန်..."
                style={{ width: "100%", padding: "9px 14px", borderRadius: "10px", border: "1px solid rgba(56, 189, 248, 0.5)", background: "#020617", color: "#38bdf8", fontSize: "14px", outline: "none" }}
              />
            </div>
          )}

          <div className="user-list-scroll">
            {activeTab === "friends" && (friendUsers.length > 0 ? friendUsers.map((u) => {
              const unread = unreadCounts[u._id] || 0;
              const online = isUserOnline(u);
              return (
                <div key={u._id} onClick={() => setSelectedFriend(u)} className={`user-card-item clickable ${selectedFriend?._id === u._id ? "selected" : ""}`}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", overflow: "hidden" }}>
                    {renderUserAvatar(u, 42, true)}
                    <div className="user-card-info">
                      <h4>{u.name}</h4>
                      <small style={{ color: online ? "#22c55e" : "#94a3b8" }}>{online ? "● Active now" : u.email}</small>
                    </div>
                  </div>
                  {unread > 0 ? (
                    <span style={{ background: "linear-gradient(135deg, #00ff88, #059669)", color: "#020617", fontWeight: "800", fontSize: "12px", minWidth: "24px", height: "24px", padding: "0 7px", borderRadius: "50px", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 12px #00ff88", flexShrink: 0 }}>
                      {unread}
                    </span>
                  ) : <span className="badge-status">Chat</span>}
                </div>
              );
            }) : <p style={{ textAlign: "center", color: "#94a3b8", fontSize: "13px", marginTop: "20px" }}>သူငယ်ချင်း မရှိသေးပါ။</p>)}

            {activeTab === "requests" && (requestUsers.length > 0 ? requestUsers.map((u) => (
              <div key={u._id} className="user-card-item">
                <div onClick={() => handleOpenFriendProfile(u._id)} style={{ display: "flex", alignItems: "center", gap: "12px", overflow: "hidden", cursor: "pointer" }}>
                  {renderUserAvatar(u, 42, true)}
                  <div className="user-card-info"><h4>{u.name}</h4><small>{u.email}</small></div>
                </div>
                <button onClick={() => handleAcceptFriend(u._id)} className="btn-accept-fri">Accept</button>
              </div>
            )) : <p style={{ textAlign: "center", color: "#94a3b8", fontSize: "13px", marginTop: "20px" }}>Friend Request အသစ် မရှိပါ။</p>)}

            {activeTab === "all" && (filteredFindUsers.length > 0 ? filteredFindUsers.map((u) => {
              const isFriend = myFriends.includes(u._id);
              const isSent = u.friendRequests && u.friendRequests.includes(myId);
              const isIncoming = myRequests.includes(u._id);
              return (
                <div key={u._id} className="user-card-item">
                  <div onClick={() => handleOpenFriendProfile(u._id)} style={{ display: "flex", alignItems: "center", gap: "12px", overflow: "hidden", cursor: "pointer" }}>
                    {renderUserAvatar(u, 42, true)}
                    <div className="user-card-info"><h4>{u.name}</h4><small>{u.email}</small></div>
                  </div>
                  {isFriend ? <span className="badge-status">Friend</span> : isIncoming ? (
                    <button onClick={() => handleAcceptFriend(u._id)} className="btn-accept-fri">Accept</button>
                  ) : isSent ? <span className="badge-status">Sent</span> : (
                    <button onClick={() => handleAddFriend(u._id)} className="btn-add-fri">+ Add</button>
                  )}
                </div>
              );
            }) : <p style={{ textAlign: "center", color: "#94a3b8", fontSize: "13px", marginTop: "20px" }}>User ရှာမတွေ့ပါ။</p>)}
          </div>
        </div>
        {/* ညာဘက်ခြမ်း Chat Main Area */}
        <div className="chat-main">
          {selectedFriend ? (
            <>
              <div className="chat-header">
                <button
                  type="button"
                  className="mobile-back-btn"
                  onClick={() => setSelectedFriend(null)}
                >
                  ←
                </button>

                <div
                  onClick={() => handleOpenFriendProfile(selectedFriend._id)}
                  style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", minWidth: 0, flex: 1 }}
                >
                  {renderUserAvatar(selectedFriend, 38, true)}
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <h3 style={{ margin: 0, display: "flex", alignItems: "center", gap: "6px" }}>
                      <span className="chat-friend-name">{selectedFriend.name}</span>
                      <span className="view-profile-tag" style={{ fontSize: "11px", color: "#38bdf8", fontWeight: "normal" }}>(Profile)</span>
                    </h3>
                    <small style={{ color: isUserOnline(selectedFriend) ? "#22c55e" : "#94a3b8", display: "block", fontSize: "11px" }}>
                      {isUserOnline(selectedFriend) ? "● Active now" : "Offline"}
                    </small>
                  </div>
                </div>

                {/* GlobalVideoCall ကို ခေါ်ဆိုမည့် ခလုတ် */}
                <button type="button" className="vc-call-btn" onClick={startVideoCall}>
                  <span>📹</span>
                  <span>VC Call</span>
                </button>
              </div>

              {/* Messages Box */}
              <div className="chat-messages-box" ref={chatBoxRef}>
                {messages.map((m) => {
                  const isMe = m.senderId === myId;
                  const timeStr = m.createdAt ? new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "";
                  return (
                    <div
                      key={m._id}
                      style={{
                        display: "flex", alignItems: "flex-end", gap: "8px",
                        alignSelf: isMe ? "flex-end" : "flex-start", maxWidth: "82%",
                        opacity: m.isSending ? 0.7 : 1
                      }}
                    >
                      {!isMe && renderUserAvatar(selectedFriend, 28, false)}
                      <div className={`msg-bubble ${isMe ? "msg-me" : "msg-other"}`} style={{ maxWidth: "100%", display: "flex", flexDirection: "column", gap: "4px" }}>
                        {(m.image || m.tempPreview) && (
                          <img
                            src={m.tempPreview || `${url}/images/${m.image}`}
                            alt="attachment"
                            onClick={() => !m.tempPreview && setPreviewFullImg(`${url}/images/${m.image}`)}
                            style={{ maxWidth: "210px", maxHeight: "210px", borderRadius: "10px", objectFit: "cover", cursor: "pointer" }}
                          />
                        )}
                        {m.text && <span>{m.text}</span>}
                        <span style={{ fontSize: "9.5px", opacity: 0.7, alignSelf: "flex-end", fontFamily: "monospace" }}>
                          {m.isSending ? "Sending..." : timeStr}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Quick Emoji Bar */}
              <div className="quick-emoji-bar">
                {QUICK_EMOJIS.map((em) => (
                  <button key={em} type="button" onClick={() => sendMessageInstant(em)} className="quick-emoji-btn">
                    {em}
                  </button>
                ))}
              </div>

              {chatImage && (
                <div style={{ padding: "8px 14px", background: "#0f172a", borderTop: "1px solid #1e293b", display: "flex", alignItems: "center", gap: "12px" }}>
                  <img src={URL.createObjectURL(chatImage)} alt="Preview" style={{ width: "48px", height: "48px", borderRadius: "8px", objectFit: "cover" }} />
                  <span style={{ color: "#38bdf8", fontSize: "12.5px", flex: 1 }}>ပုံပို့ရန် အသင့်ဖြစ်ပါပြီ</span>
                  <button type="button" onClick={() => setChatImage(null)} style={{ background: "#ef4444", color: "#fff", border: "none", borderRadius: "6px", padding: "4px 10px" }}>✕</button>
                </div>
              )}

              <form onSubmit={handleSend} className="chat-input-form">
                <label style={{ cursor: "pointer", fontSize: "20px", padding: "0 6px", display: "flex", alignItems: "center" }}>
                  📷
                  <input type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => { if (e.target.files?.item(0)) setChatImage(e.target.files.item(0)); }} />
                </label>
                <input type="text" value={text} onChange={(e) => setText(e.target.value)} placeholder="စာရိုက်ထည့်ပါ..." />
                <button type="submit" disabled={sending}>Send</button>
              </form>
            </>
          ) : (
            <div className="chat-empty-state">
              စကားပြောလိုသော သူငယ်ချင်းကို ဘယ်ဘက် "Friends" စာရင်းမှ ရွေးချယ်ပါ
            </div>
          )}
        </div>
      </div>

      {/* Image Fullscreen Modal */}
      {previewFullImg && (
        <div onClick={() => setPreviewFullImg(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.9)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
          <img src={previewFullImg} alt="Full" style={{ maxWidth: "95%", maxHeight: "90%", borderRadius: "12px" }} />
        </div>
      )}

      {/* Friend Profile Modal */}
      {showFriendModal && (
        <div onClick={() => setShowFriendModal(false)} style={{ position: "fixed", inset: 0, background: "rgba(2, 6, 23, 0.85)", zIndex: 9998, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: "#0f172a", border: "1px solid #38bdf8", borderRadius: "16px", width: "100%", maxWidth: "460px", maxHeight: "85vh", overflowY: "auto", padding: "24px", color: "#f8fafc", position: "relative" }}>
            <button onClick={() => setShowFriendModal(false)} style={{ position: "absolute", top: "14px", right: "14px", background: "#ef4444", color: "#fff", border: "none", borderRadius: "50%", width: "30px", height: "30px", cursor: "pointer", fontWeight: "bold" }}>✕</button>
            {loadingProfile || !friendProfileData ? <p style={{ textAlign: "center", padding: "30px 0" }}>Loading Profile...</p> : (
              <div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
                  {renderUserAvatar(friendProfileData, 90, true)}
                  <h2 style={{ margin: "12px 0 4px 0", color: "#38bdf8" }}>{friendProfileData.name}</h2>
                  <p style={{ margin: 0, fontSize: "13px", color: "#94a3b8" }}>{friendProfileData.email}</p>
                </div>
                <div style={{ marginTop: "18px", background: "#020617", padding: "14px", borderRadius: "12px", fontSize: "13.5px", display: "flex", flexDirection: "column", gap: "8px" }}>
                  <div><strong style={{ color: "#38bdf8" }}>📞 Phone:</strong> {friendProfileData.phone || "မထည့်သွင်းရသေးပါ"}</div>
                  <div><strong style={{ color: "#38bdf8" }}>📍 Address:</strong> {friendProfileData.address || "မထည့်သွင်းရသေးပါ"}</div>
                  <div><strong style={{ color: "#38bdf8" }}>📝 Bio:</strong> {friendProfileData.bio || "ကိုယ်ရေးအကျဉ်း မရှိသေးပါ"}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Chat;
