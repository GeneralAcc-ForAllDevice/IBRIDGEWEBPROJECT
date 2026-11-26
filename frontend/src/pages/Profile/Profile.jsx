import React, { useContext, useState, useEffect } from "react";
import "./Profile.css";
import axios from "axios";
import { toast } from "react-toastify";
import { StoreContext } from "../../context/StoreContext";
import { useNavigate } from "react-router-dom";

const Profile = () => {
  const { url, token } = useContext(StoreContext);
  const navigate = useNavigate();

  // Profile နှိပ်လိုက်တာနဲ့ Edit Profile ကို အရင်ဆုံး ပေါ်စေချင်လို့ default ကို "edit" ထားပါတယ်
  const [activeTab, setActiveTab] = useState("edit");

  // --- User Profile Edit States ---
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileProgress, setProfileProgress] = useState(0);
  const [profileImage, setProfileImage] = useState(null);
  const [existingAvatar, setExistingAvatar] = useState("");
  const [userData, setUserData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    bio: "",
    newPassword: "",
  });

  // --- Existing States ---
  const [myItems, setMyItems] = useState([]);
  const [mySoftwares, setMySoftwares] = useState([]);
  const [incomingOrders, setIncomingOrders] = useState([]);

  const [itemImage, setItemImage] = useState(false);
  const [itemLoading, setItemLoading] = useState(false);
  const [itemProgress, setItemProgress] = useState(0);
  const [itemData, setItemData] = useState({
    name: "",
    description: "",
    price: "",
    category: "RAM",
  });

  const [softImage, setSoftImage] = useState(false);
  const [softwareFile, setSoftwareFile] = useState(false);
  const [softLoading, setSoftLoading] = useState(false);
  const [softProgress, setSoftProgress] = useState(0);
  const [softData, setSoftData] = useState({
    name: "",
    description: "",
    category: "Operating System",
    version: "",
    platform: "Windows",
  });

  // Reusable Progress Bar Component
  const renderProgressBar = (progress, label) => (
    <div style={{ margin: "14px 0", width: "100%" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: "6px",
          fontSize: "13.5px",
          fontWeight: "600",
          color: "#333",
        }}
      >
        <span>{progress < 100 ? label : "Server တွင် သိမ်းဆည်းနေပါသည်..."}</span>
        <span style={{ color: "#ff4c24" }}>{progress}%</span>
      </div>
      <div
        style={{
          width: "100%",
          height: "10px",
          backgroundColor: "#e5e7eb",
          borderRadius: "999px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${progress}%`,
            height: "100%",
            backgroundColor: progress === 100 ? "#16a34a" : "#ff4c24",
            transition: "width 0.2s ease",
            borderRadius: "999px",
          }}
        />
      </div>
    </div>
  );
  // လက်ရှိ User ရဲ့ အချက်အလက်အဟောင်းများကို Backend မှ ဆွဲယူခြင်း
  const fetchUserProfile = async () => {
    if (!token || !url) return;
    try {
      const res = await axios.get(`${url}/api/user/profile`, { headers: { token } });
      if (res.data.success) {
        const user = res.data.user;
        setUserData({
          name: user.name || "",
          email: user.email || "",
          phone: user.phone || "",
          address: user.address || "",
          bio: user.bio || "",
          newPassword: "",
        });
        setExistingAvatar(user.avatar || "");
      }
    } catch (error) {
      console.log("Profile fetch error:", error);
    }
  };

  const fetchUserListings = async () => {
    if (!token || !url) return;
    try {
      const itemRes = await axios.post(`${url}/api/food/user-list`, {}, { headers: { token } });
      if (itemRes.data.success) setMyItems(itemRes.data.data);

      const softRes = await axios.post(`${url}/api/software/user-list`, {}, { headers: { token } });
      if (softRes.data.success) setMySoftwares(softRes.data.data);

      const orderRes = await axios.post(`${url}/api/order/seller-orders`, {}, { headers: { token } });
      if (orderRes.data.success) setIncomingOrders(orderRes.data.data);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    if (!token) {
      toast.error("ကျေးဇူးပြု၍ Login အရင်ဝင်ပါ");
      navigate("/");
    } else {
      fetchUserProfile();
      fetchUserListings();
    }
  }, [token, url, navigate]);

  // Profile Edit လုပ်ပြီး Save နှိပ်သည့် Function
  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileProgress(0);

    const formData = new FormData();
    formData.append("name", userData.name);
    formData.append("email", userData.email);
    formData.append("phone", userData.phone);
    formData.append("address", userData.address);
    formData.append("bio", userData.bio);
    if (userData.newPassword) {
      formData.append("password", userData.newPassword);
    }
    if (profileImage) {
      formData.append("avatar", profileImage);
    }

    try {
      const response = await axios.post(`${url}/api/user/update`, formData, {
        headers: { token },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setProfileProgress(percent);
          }
        },
      });

      if (response.data.success) {
        toast.success("Profile အချက်အလက်များ ပြင်ဆင်ပြီးပါပြီ");
        setProfileImage(null);
        setUserData((prev) => ({ ...prev, newPassword: "" }));
        fetchUserProfile();
      } else {
        toast.error(response.data.message || "ပြင်ဆင်ရာတွင် အမှားရှိနေပါသည်");
      }
    } catch (error) {
      toast.error("Server နှင့် ချိတ်ဆက်ရာတွင် အမှားရှိနေပါသည်");
    } finally {
      setProfileLoading(false);
      setProfileProgress(0);
    }
  };

  // Hardware ပစ္စည်းတင်သည့် Function
  const handleItemSubmit = async (e) => {
    e.preventDefault();
    if (!itemImage) {
      toast.error("ပစ္စည်းပုံ ရွေးချယ်ပါ");
      return;
    }

    setItemLoading(true);
    setItemProgress(0);

    const formData = new FormData();
    formData.append("name", itemData.name);
    formData.append("description", itemData.description);
    formData.append("price", Number(itemData.price));
    formData.append("category", itemData.category);
    formData.append("image", itemImage);

    try {
      const response = await axios.post(`${url}/api/food/add`, formData, {
        headers: { token },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setItemProgress(percent);
          }
        },
      });

      if (response.data.success) {
        toast.success(response.data.message);
        setItemData({ name: "", description: "", price: "", category: "RAM" });
        setItemImage(false);
        e.target.reset();
        fetchUserListings();
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.error("ပစ္စည်းတင်ရာတွင် အမှားရှိနေပါသည်");
    } finally {
      setItemLoading(false);
      setItemProgress(0);
    }
  };

  // Software ဖိုင်တင်သည့် Function
  const handleSoftwareSubmit = async (e) => {
    e.preventDefault();
    if (!softImage || !softwareFile) {
      toast.error("ပုံနှင့် Software ဖိုင် နှစ်မျိုးလုံး ရွေးချယ်ပါ");
      return;
    }

    setSoftLoading(true);
    setSoftProgress(0);

    const fileSizeInMB = (softwareFile.size / (1024 * 1024)).toFixed(2) + " MB";
    const formData = new FormData();
    formData.append("name", softData.name);
    formData.append("description", softData.description);
    formData.append("price", 0);
    formData.append("category", softData.category);
    formData.append("version", softData.version);
    formData.append("platform", softData.platform);
    formData.append("fileSize", fileSizeInMB);
    formData.append("image", softImage);
    formData.append("softwareFile", softwareFile);

    try {
      const response = await axios.post(`${url}/api/software/add`, formData, {
        headers: { token },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setSoftProgress(percent);
          }
        },
      });

      if (response.data.success) {
        toast.success("Software အောင်မြင်စွာ တင်ပြီးပါပြီ");
        setSoftData({ name: "", description: "", category: "Operating System", version: "", platform: "Windows" });
        setSoftImage(false);
        setSoftwareFile(false);
        e.target.reset();
        fetchUserListings();
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.error("Software တင်ရာတွင် အမှားရှိနေပါသည်");
    } finally {
      setSoftLoading(false);
      setSoftProgress(0);
    }
  };
  const handleDeleteItem = async (id) => {
    if (!window.confirm("ဤပစ္စည်းကို အရောင်းစာရင်းမှ ဖျက်ရန် သေချာပါသလား?")) return;
    try {
      const res = await axios.post(`${url}/api/food/remove`, { id }, { headers: { token } });
      if (res.data.success) {
        toast.success(res.data.message);
        fetchUserListings();
      }
    } catch (error) {
      toast.error("ဖျက်ရာတွင် အမှားရှိနေပါသည်");
    }
  };

  const handleDeleteSoftware = async (id) => {
    if (!window.confirm("ဤ Software ကို ဖျက်ရန် သေချာပါသလား?")) return;
    try {
      const res = await axios.post(`${url}/api/software/remove`, { id }, { headers: { token } });
      if (res.data.success) {
        toast.success(res.data.message);
        fetchUserListings();
      }
    } catch (error) {
      toast.error("ဖျက်ရာတွင် အမှားရှိနေပါသည်");
    }
  };

  const handleStatusChange = async (event, orderId) => {
    try {
      const response = await axios.post(`${url}/api/order/status`, {
        orderId,
        status: event.target.value,
      });
      if (response.data.success) {
        toast.success("Order Status ပြောင်းလဲပြီးပါပြီ");
        fetchUserListings();
      }
    } catch (error) {
      toast.error("Status ပြောင်းရာတွင် အမှားရှိနေပါသည်");
    }
  };

  // Seller မှ ပေးပြီးသွားသော Order ကို ဖျက်ခြင်း
  const handleSellerDeleteOrder = async (orderId) => {
    if (!window.confirm("ဤ Order မှတ်တမ်းကို ဖျက်ပစ်ရန် သေချာပါသလား?")) return;
    try {
      const res = await axios.post(`${url}/api/order/remove`, { orderId }, { headers: { token } });
      if (res.data.success) {
        toast.success("Order မှတ်တမ်းကို ဖျက်ပြီးပါပြီ");
        setIncomingOrders((prev) => prev.filter((o) => o._id !== orderId));
      } else {
        toast.error(res.data.message);
      }
    } catch (err) {
      toast.error("Order ဖျက်၍မရပါ");
    }
  };

  return (
    <div className="profile-container">
      <div className="profile-header">
        <h2>My Profile</h2>
        <p>သင်၏ ကိုယ်ရေးအချက်အလက်များ၊ ကွန်ပျူတာပစ္စည်းများနှင့် Software များကို ဤနေရာမှ စီမံနိုင်ပါသည်။</p>
      </div>

      {/* Navigation Tabs */}
      <div className="profile-tabs">
        <button
          className={`profile-tab-btn ${activeTab === "edit" ? "active" : ""}`}
          onClick={() => setActiveTab("edit")}
        >
          Edit Profile
        </button>
        <button
          className={`profile-tab-btn ${activeTab === "item" ? "active" : ""}`}
          onClick={() => setActiveTab("item")}
        >
          Sell Computer & Accessories
        </button>
        <button
          className={`profile-tab-btn ${activeTab === "software" ? "active" : ""}`}
          onClick={() => setActiveTab("software")}
        >
          Upload Software
        </button>
        <button
          className={`profile-tab-btn ${activeTab === "orders" ? "active" : ""}`}
          onClick={() => setActiveTab("orders")}
        >
          Customer Orders ({incomingOrders.length})
        </button>
      </div>

      {/* 1. EDIT PROFILE TAB */}
      {activeTab === "edit" && (
        <form onSubmit={handleProfileUpdate} className="profile-upload-card">
          <h3>Edit Personal Information</h3>

          {/* Profile Photo Section */}
          <div className="file-box" style={{ textAlign: "center", marginBottom: "20px" }}>
            <div style={{ marginBottom: "10px" }}>
              <img
                src={
                  profileImage
                    ? URL.createObjectURL(profileImage)
                    : existingAvatar
                    ? `${url}/images/${existingAvatar}`
                    : "https://placehold.co"
                }
                alt="Profile Avatar"
                style={{
                  width: "120px",
                  height: "120px",
                  borderRadius: "50%",
                  objectFit: "cover",
                  border: "3px solid #ddd",
                }}
              />
            </div>
            <label style={{ cursor: "pointer", fontWeight: "bold", color: "#ff4c24" }}>
              Change Profile Photo
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setProfileImage(e.target.files.item(0))}
                style={{ display: "block", margin: "10px auto" }}
              />
            </label>
          </div>

          {/* Name & Gmail */}
          <div className="profile-row">
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: "14px", fontWeight: "600" }}>Full Name / Shop Name</label>
              <input
                type="text"
                value={userData.name}
                onChange={(e) => setUserData({ ...userData, name: e.target.value })}
                placeholder="သင့်အမည် သို့မဟုတ် ဆိုင်အမည်"
                className="profile-input"
                required
              />
            </div>

            <div style={{ flex: 1 }}>
              <label style={{ fontSize: "14px", fontWeight: "600" }}>Gmail Address</label>
              <input
                type="email"
                value={userData.email}
                onChange={(e) => setUserData({ ...userData, email: e.target.value })}
                placeholder="example@gmail.com"
                className="profile-input"
                required
              />
            </div>
          </div>

          {/* Phone & New Password */}
          <div className="profile-row">
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: "14px", fontWeight: "600" }}>Phone Number (ဆက်သွယ်ရန်ဖုန်း)</label>
              <input
                type="tel"
                value={userData.phone}
                onChange={(e) => setUserData({ ...userData, phone: e.target.value })}
                placeholder="09xxxxxxxxx"
                className="profile-input"
              />
            </div>

            <div style={{ flex: 1 }}>
              <label style={{ fontSize: "14px", fontWeight: "600" }}>New Password (မပြောင်းလိုပါက အလွတ်ထားပါ)</label>
              <input
                type="password"
                value={userData.newPassword}
                onChange={(e) => setUserData({ ...userData, newPassword: e.target.value })}
                placeholder="Password အသစ်ရိုက်ထည့်ပါ"
                className="profile-input"
              />
            </div>
          </div>

          {/* Address */}
          <div>
            <label style={{ fontSize: "14px", fontWeight: "600" }}>Address (မြို့နယ် / လိပ်စာ)</label>
            <input
              type="text"
              value={userData.address}
              onChange={(e) => setUserData({ ...userData, address: e.target.value })}
              placeholder="ဥပမာ - ချမ်းအေးသာစံမြို့နယ်၊ မန္တလေးမြို့"
              className="profile-input"
            />
          </div>

          {/* Bio / Description */}
          <div>
            <label style={{ fontSize: "14px", fontWeight: "600" }}>Bio / About Me</label>
            <textarea
              value={userData.bio}
              onChange={(e) => setUserData({ ...userData, bio: e.target.value })}
              rows="3"
              placeholder="သင်ရောင်းချသော ပစ္စည်းများအကြောင်း သို့မဟုတ် ကိုယ်ရေးအကျဉ်း"
              className="profile-textarea"
            />
          </div>

          {/* Profile Upload Progress Bar */}
          {profileLoading && renderProgressBar(profileProgress, "Profile အချက်အလက်များ တင်နေပါသည်...")}

          <button type="submit" disabled={profileLoading} className="profile-submit-btn">
            {profileLoading ? `SAVING CHANGES (${profileProgress}%)...` : "SAVE PROFILE CHANGES"}
          </button>
        </form>
      )}
      {/* 2. SELL ITEM TAB */}
      {activeTab === "item" && (
        <>
          <form onSubmit={handleItemSubmit} className="profile-upload-card">
            <h3>Add New Item For Sale</h3>

            <div className="file-box">
              <label>ပစ္စည်းဓာတ်ပုံ ရွေးချယ်ရန် (Product Image)</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setItemImage(e.target.files.item(0))}
                required
              />
              {itemImage && (
                <img src={URL.createObjectURL(itemImage)} alt="Preview" className="image-preview" />
              )}
            </div>

            <input
              type="text"
              value={itemData.name}
              onChange={(e) => setItemData({ ...itemData, name: e.target.value })}
              placeholder="ပစ္စည်းအမည် (ဥပမာ - Dell Latitude 7490 i7 / DDR4 8GB RAM)"
              className="profile-input"
              required
            />

            <textarea
              value={itemData.description}
              onChange={(e) => setItemData({ ...itemData, description: e.target.value })}
              rows="4"
              placeholder="ပစ္စည်းအခြေအနေ၊ Spec နှင့် အာမခံအချက်အလက်များ ရေးပါ"
              className="profile-textarea"
              required
            />

            <div className="profile-row">
              <select
                value={itemData.category}
                onChange={(e) => setItemData({ ...itemData, category: e.target.value })}
                className="profile-select"
              >
                <option value="RAM">RAM</option>
                <option value="SSD">SSD</option>
                <option value="HDD">HDD</option>
                <option value="BATTERY">BATTERY</option>
                <option value="LCD DISPLAY">LCD DISPLAY</option>
                <option value="KEYBOARD">KEYBOARD</option>
                <option value="SPEAKER">SPEAKER</option>
                <option value="LAPTOP SECOND">LAPTOP SECOND</option>
                <option value="LAPTOP NEW">LAPTOP NEW</option>
                <option value="DESKTOP PC">DESKTOP PC</option>
                <option value="MONITOR">MONITOR</option>
                <option value="PRINTER">PRINTER</option>
                <option value="MOUSE">MOUSE</option>
                <option value="KEYBOARD">KEYBOARD</option>
                <option value="HEADSET">HEADSET</option>
                <option value="USB DRIVE">USB DRIVE</option>
                <option value="OTHER">OTHER</option>
              </select>

              <input
                type="number"
                value={itemData.price}
                onChange={(e) => setItemData({ ...itemData, price: e.target.value })}
                placeholder="ရောင်းဈေး ($)"
                min="1"
                className="profile-input"
                required
              />
            </div>

            {/* Item Upload Progress Bar */}
            {itemLoading && renderProgressBar(itemProgress, "ပစ္စည်းပုံနှင့် အချက်အလက်များ တင်နေပါသည်...")}

            <button type="submit" disabled={itemLoading} className="profile-submit-btn">
              {itemLoading ? `POSTING ITEM (${itemProgress}%)...` : "POST ITEM FOR SALE"}
            </button>
          </form>

          <div className="my-softwares-section">
            <h3>My Listed Items ({myItems.length})</h3>
            <div className="my-software-list">
              {myItems.length > 0 ? (
                myItems.map((item) => (
                  <div key={item._id} className="my-software-item">
                    <div className="my-software-info">
                      <img
                        src={item.image ? `${url}/images/${item.image}` : "https://placehold.co"}
                        alt={item.name}
                      />
                      <div>
                        <h4>{item.name}</h4>
                        <div className="my-software-meta">
                          <span className="meta-badge">{item.category}</span>
                          <span className="meta-badge">${item.price}</span>
                        </div>
                      </div>
                    </div>
                    <button onClick={() => handleDeleteItem(item._id)} className="delete-btn">
                      Delete
                    </button>
                  </div>
                ))
              ) : (
                <p className="empty-text">သင်တင်ရောင်းထားသော ပစ္စည်း မရှိသေးပါ။</p>
              )}
            </div>
          </div>
        </>
      )}
      {/* 3. UPLOAD SOFTWARE TAB */}
      {activeTab === "software" && (
        <>
          <form onSubmit={handleSoftwareSubmit} className="profile-upload-card">
            <h3>Upload New Software</h3>

            <div className="file-upload-group">
              <div className="file-box">
                <label>Software Image / Logo</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setSoftImage(e.target.files.item(0))}
                  required
                />
                {softImage && (
                  <img src={URL.createObjectURL(softImage)} alt="Preview" className="image-preview" />
                )}
              </div>

              <div className="file-box">
                <label>Software File (.exe, .zip, .apk, .rar)</label>
                <input
                  type="file"
                  accept=".exe,.zip,.rar,.apk,.dmg,.msi,.7z"
                  onChange={(e) => setSoftwareFile(e.target.files.item(0))}
                  required
                />
              </div>
            </div>

            <input
              type="text"
              value={softData.name}
              onChange={(e) => setSoftData({ ...softData, name: e.target.value })}
              placeholder="Software အမည်"
              className="profile-input"
              required
            />

            <textarea
              value={softData.description}
              onChange={(e) => setSoftData({ ...softData, description: e.target.value })}
              rows="4"
              placeholder="အကြောင်းအရာနှင့် စက်ပစ္စည်း လိုအပ်ချက်များ"
              className="profile-textarea"
              required
            />

            <div className="profile-row">
              <select
                value={softData.category}
                onChange={(e) => setSoftData({ ...softData, category: e.target.value })}
                className="profile-select"
              >
                <option value="Operating System">Operating System</option>
                <option value="Office & Productivity">Office & Productivity</option>
                <option value="Graphic & Video Editing">Graphic & Video Editing</option>
                <option value="Utility & Drivers">Utility & Drivers</option>
                <option value="Games">Games</option>
                <option value="Mobile Apps">Mobile Apps</option>
                <option value="Security & Antivirus">Security & Antivirus</option>
                <option value="Programming & Development">Programming & Development</option>
                <option value="BIOS">BIOS</option>
                <option value="BOARDVIEW">BOARDVIEW</option>
                <option value="SCHEMATIC">SCHEMATIC</option>
              </select>

              <select
                value={softData.platform}
                onChange={(e) => setSoftData({ ...softData, platform: e.target.value })}
                className="profile-select"
              >
                <option value="Windows">Windows</option>
                <option value="macOS">macOS</option>
                <option value="Android">Android</option>
                <option value="iOS">iOS</option>
              </select>
            </div>

            <input
              type="text"
              value={softData.version}
              onChange={(e) => setSoftData({ ...softData, version: e.target.value })}
              placeholder="Version (ဥပမာ - v1.0)"
              className="profile-input"
              required
            />

            {/* Software Upload Progress Bar */}
            {softLoading && renderProgressBar(softProgress, "Software ဖိုင် Upload တင်နေပါသည်...")}

            <button type="submit" disabled={softLoading} className="profile-submit-btn">
              {softLoading ? `UPLOADING (${softProgress}%)...` : "UPLOAD SOFTWARE"}
            </button>
          </form>

          <div className="my-softwares-section">
            <h3>My Uploaded Softwares ({mySoftwares.length})</h3>
            <div className="my-software-list">
              {mySoftwares.length > 0 ? (
                mySoftwares.map((item) => (
                  <div key={item._id} className="my-software-item">
                    <div className="my-software-info">
                      <img
                        src={item.image ? `${url}/images/${item.image}` : "https://placehold.co"}
                        alt={item.name}
                      />
                      <div>
                        <h4>{item.name}</h4>
                        <div className="my-software-meta">
                          <span className="meta-badge">{item.platform}</span>
                          <span className="meta-badge">{item.version}</span>
                          <span className="meta-badge">Free</span>
                        </div>
                      </div>
                    </div>
                    <button onClick={() => handleDeleteSoftware(item._id)} className="delete-btn">
                      Delete
                    </button>
                  </div>
                ))
              ) : (
                <p className="empty-text">သင်တင်ထားသော Software မရှိသေးပါ။</p>
              )}
            </div>
          </div>
        </>
      )}
      {/* 4. CUSTOMER ORDERS TAB */}
      {activeTab === "orders" && (
        <div className="my-softwares-section">
          <h3>Incoming Customer Orders ({incomingOrders.length})</h3>
          <div className="my-software-list">
            {incomingOrders.length > 0 ? (
              incomingOrders.map((order) => (
                <div key={order._id} className="my-software-item" style={{ alignItems: "flex-start", gap: "15px" }}>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ color: "#ff4c24", marginBottom: "6px" }}>
                      {order.items.map((i) => `${i.name} x ${i.quantity}`).join(", ")}
                    </h4>
                    <p style={{ margin: "4px 0", fontSize: "14px", fontWeight: "600" }}>
                      ဝယ်ယူသူ: {order.address.firstName} | ဖုန်း: {order.address.phone}
                    </p>
                    <p style={{ margin: "4px 0", fontSize: "13.5px", color: "#555" }}>
                      လိပ်စာ: {order.address.street}
                    </p>
                    <div className="my-software-meta" style={{ marginTop: "8px" }}>
                      <span className="meta-badge">ရရှိငွေ: ${order.amount}</span>
                      <span className="meta-badge">{order.payment ? "Paid" : "Pending Payment"}</span>
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    <select
                      value={order.status}
                      onChange={(e) => handleStatusChange(e, order._id)}
                      className="profile-select"
                      style={{ width: "170px", padding: "8px 12px" }}
                    >
                      <option value="Order Processing">Order Processing</option>
                      <option value="Out for delivery">Out for delivery</option>
                      <option value="Delivered">Delivered</option>
                    </select>
                    <button onClick={() => handleSellerDeleteOrder(order._id)} className="delete-btn">
                      Delete Order
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className="empty-text">သင်တင်ထားသော ပစ္စည်းကို ဝယ်ယူထားသည့် Order မရှိသေးပါ။</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
