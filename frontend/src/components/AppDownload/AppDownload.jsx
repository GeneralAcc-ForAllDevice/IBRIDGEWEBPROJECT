import React, { useContext, useState, useMemo } from 'react';
import './AppDownload.css';
import { StoreContext } from '../../context/StoreContext';
import { toast } from 'react-toastify';

const AppDownload = () => {
  const { url, software_list, addToCart, searchTerm } = useContext(StoreContext);
  const [visibleCount, setVisibleCount] = useState(12);

  const handleDownload = (fileName) => {
    if (!fileName) {
      toast.warning("Download ဖိုင် မရှိသေးပါခင်ဗျာ။");
      return;
    }
    const fullUrl = fileName.startsWith("http")
      ? fileName
      : `${url}/download/${fileName}`;

    window.open(fullUrl, '_blank', 'noopener,noreferrer');
  };

  // Search Box စာသားဖြင့် စစ်ထုတ်ခြင်းကို Cache မှတ်ထားခြင်း (Lag မဖြစ်စေရန်)
  const filteredSoftwares = useMemo(() => {
    const list = software_list || [];
    if (!searchTerm || searchTerm.trim() === "") return list;
    const keyword = searchTerm.toLowerCase().trim();
    return list.filter((item) => {
      return (
        (item.name && item.name.toLowerCase().includes(keyword)) ||
        (item.category && item.category.toLowerCase().includes(keyword)) ||
        (item.platform && item.platform.toLowerCase().includes(keyword)) ||
        (item.description && item.description.toLowerCase().includes(keyword))
      );
    });
  }, [software_list, searchTerm]);

  const isSearching = searchTerm && searchTerm.trim() !== "";
  const displayedSoftwares = isSearching
    ? filteredSoftwares
    : filteredSoftwares.slice(0, visibleCount);

  return (
    <div className='app-download' id='app-download'>
      <p>For Better Experience Download <br /> IBRIDGE Softwares & Apps</p>
      
      {isSearching && (
        <p style={{ fontSize: "16px", color: "#38bdf8", marginBottom: "15px" }}>
          "{searchTerm}" နှင့် ကိုက်ညီသော ရလဒ် ({filteredSoftwares.length}) ခု တွေ့ရှိပါသည်
        </p>
      )}

      <div className="software-download-grid">
        {displayedSoftwares.length > 0 ? (
          displayedSoftwares.map((item) => (
            <div key={item._id} className="software-card">
              <img 
                src={
                  item.image 
                    ? `${url}/images/${item.image}` 
                    : "https://placehold.co"
                } 
                alt={item.name} 
                loading="lazy"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "https://placehold.co";
                }}
                className="software-icon" 
              />
              <div className="software-info">
                <h3>{item.name}</h3>
                <span className="badge">{item.platform} • {item.version}</span>
                <p className="file-size">Size: {item.fileSize || "N/A"} | {item.license || "Free"}</p>
                <p className="desc">{item.description}</p>
              </div>
              
              {Number(item.price) === 0 ? (
                <button 
                  type="button"
                  onClick={() => handleDownload(item.downloadUrl)} 
                  className="download-btn"
                >
                  Download Free
                </button>
              ) : (
                <button 
                  type="button"
                  onClick={() => addToCart(item._id)} 
                  className="buy-btn"
                >
                  Buy Now ({Number(item.price).toLocaleString()} Kyats)
                </button>
              )}
            </div>
          ))
        ) : (
          <p className="loading-text">
            {isSearching 
              ? `"${searchTerm}" နှင့် ကိုက်ညီသော Software မတွေ့ပါ...` 
              : "Software များ မရှိသေးပါ..."}
          </p>
        )}
      </div>

      {/* Software ၁၂ ခုထက် ပိုများနေပါက ထပ်ကြည့်ရန် ခလုတ် */}
      {!isSearching && visibleCount < filteredSoftwares.length && (
        <div style={{ textAlign: "center", marginTop: "28px" }}>
          <button
            type="button"
            onClick={() => setVisibleCount((prev) => prev + 12)}
            style={{
              padding: "11px 28px",
              borderRadius: "12px",
              border: "1px solid #00ff88",
              background: "rgba(15, 23, 42, 0.9)",
              color: "#00ff88",
              fontWeight: "800",
              fontSize: "13.5px",
              cursor: "pointer",
            }}
          >
            Software များ ထပ်ကြည့်ရန် ({filteredSoftwares.length - visibleCount} ခု ကျန်သေးသည်) ↓
          </button>
        </div>
      )}
    </div>
  );
};

export default AppDownload;
