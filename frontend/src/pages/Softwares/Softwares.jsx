import React, { useContext, useState, useMemo, useEffect } from "react";
import { StoreContext } from "../../context/StoreContext";
import { toast } from "react-toastify";
import "./Softwares.css";

const BASE_SOFTWARE_CATEGORIES = [
  "All",
  "Operating System",
  "Office & Productivity",
  "Graphic & Video Editing",
  "Utility & Drivers",
  "Games",
  "Mobile Apps",
  "Security & Antivirus",
  "Programming & Development",
  "BIOS",
  "BOARDVIEW",
  "SCHEMATIC",
];

const normalizeText = (val) => String(val ?? "").trim().toLowerCase();

const Softwares = () => {
  const {
    url,
    software_list,
    fetchSoftwareList,
    addToCart,
    searchTerm,
  } = useContext(StoreContext) || {};
  const [selectedCat, setSelectedCat] = useState("All");

  // Page ဖွင့်တိုင်း၊ tab/window ပြန်ဖွင့်တိုင်း software list ကို refresh လုပ်စရာမလိုဘဲ ဆွဲယူခြင်း
  useEffect(() => {
    if (typeof fetchSoftwareList === "function") {
      fetchSoftwareList();
    }

    const handleFocus = () => {
      if (typeof fetchSoftwareList === "function") {
        fetchSoftwareList();
      }
    };

    const handleVisibilityChange = () => {
      if (
        document.visibilityState === "visible" &&
        typeof fetchSoftwareList === "function"
      ) {
        fetchSoftwareList();
      }
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [fetchSoftwareList]);

  const safeSoftwareList = useMemo(
    () => (Array.isArray(software_list) ? software_list : []),
    [software_list]
  );

  const categories = useMemo(() => {
    const knownLower = new Set(
      BASE_SOFTWARE_CATEGORIES.map((c) => normalizeText(c))
    );
    const extraCats = [];

    safeSoftwareList.forEach((item) => {
      const rawCat = String(item?.category ?? "").trim();
      const lowerCat = normalizeText(rawCat);
      if (rawCat && !knownLower.has(lowerCat)) {
        knownLower.add(lowerCat);
        extraCats.push(rawCat);
      }
    });

    return [...BASE_SOFTWARE_CATEGORIES, ...extraCats];
  }, [safeSoftwareList]);

  const handleDownload = (fileName) => {
    if (!fileName) {
      toast.warning("Download ဖိုင် မရှိသေးပါခင်ဗျာ။");
      return;
    }
    const cleanUrl = String(url || "").replace(/\/+$/, "");
    const fullUrl = String(fileName).startsWith("http")
      ? fileName
      : `${cleanUrl}/download/${fileName}`;
    window.open(fullUrl, "_blank", "noopener,noreferrer");
  };

  const filteredSoftwares = useMemo(() => {
    const keyword = normalizeText(searchTerm);
    const selectedLower = normalizeText(selectedCat);
    const isAllSelected = !selectedLower || selectedLower === "all";

    return safeSoftwareList.filter((item) => {
      if (!item || typeof item !== "object") return false;

      const itemCatLower = normalizeText(item.category);
      const matchCat = isAllSelected || itemCatLower === selectedLower;
      if (!matchCat) return false;

      if (!keyword) return true;
      return (
        normalizeText(item.name).includes(keyword) ||
        itemCatLower.includes(keyword) ||
        normalizeText(item.platform).includes(keyword) ||
        normalizeText(item.description).includes(keyword)
      );
    });
  }, [safeSoftwareList, selectedCat, searchTerm]);

  return (
    <div className="softwares-space-page">
      {/* 3D Floating Hologram Hero Banner */}
      <div className="softwares-holo-header" style={{ overflow: "visible" }}>
        <div className="holo-scan-line"></div>
        <div className="holo-header-badge">
          <span className="holo-dot"></span>
          <span>ORBITAL SOFTWARE REPOSITORY</span>
        </div>
        <h1>IBRIDGE Softwares, Drivers & Apps</h1>
        <p>
          Windows OS, Office Suites, Chipset Drivers, BIOS, Boardview, Schematic
          နှင့် Application များကို အခမဲ့ တိုက်ရိုက် Download
          ရယူနိုင်ပါသည်။
        </p>

        {/* Floating Hologram Category Pills + Select Dropdown */}
        <div
          className="softwares-cat-bar"
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            maxHeight: "none",
            overflow: "visible",
          }}
        >
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => {
                setSelectedCat(cat);
                if (typeof fetchSoftwareList === "function") {
                  fetchSoftwareList();
                }
              }}
              className={`soft-cat-pill ${
                normalizeText(selectedCat) === normalizeText(cat)
                  ? "active"
                  : ""
              }`}
            >
              {cat}
            </button>
          ))}

          <select
            aria-label="Select Software Category"
            value={selectedCat}
            onChange={(e) => {
              setSelectedCat(e.target.value);
              if (typeof fetchSoftwareList === "function") {
                fetchSoftwareList();
              }
            }}
            className="soft-cat-select"
            style={{
              padding: "8px 14px",
              borderRadius: "999px",
              background: "rgba(15, 23, 42, 0.85)",
              color: "#e2e8f0",
              border: "1px solid rgba(56, 189, 248, 0.45)",
              cursor: "pointer",
              outline: "none",
            }}
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 3D Hologram Floating Cards Grid */}
      <div className="softwares-holo-grid">
        {filteredSoftwares.length > 0 ? (
          filteredSoftwares.map((item, idx) => {
            const cleanUrl = String(url || "").replace(/\/+$/, "");
            const imgSrc = item.image
              ? String(item.image).startsWith("http")
                ? item.image
                : `${cleanUrl}/images/${item.image}`
              : "https://placehold.co";

            return (
              <div
                key={item._id || idx}
                className="holo-software-card"
                style={{ animationDelay: `${(idx % 4) * 0.6}s` }}
              >
                {/* Card အတွင်းပိုင်း Hologram Light Sweep */}
                <div className="holo-card-glare"></div>

                <div className="holo-card-top">
                  <div className="holo-icon-frame">
                    <img
                      src={imgSrc}
                      alt={item.name || "Software"}
                      loading="lazy"
                      decoding="async"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "https://placehold.co";
                      }}
                    />
                  </div>

                  <div className="holo-title-meta">
                    <h3>{item.name}</h3>
                    <div className="holo-badges-row">
                      <span className="holo-platform-tag">{item.platform}</span>
                      <span className="holo-version-tag">{item.version}</span>
                    </div>
                  </div>
                </div>

                <p className="holo-desc">{item.description}</p>

                <div className="holo-specs-strip">
                  <span>SIZE: {item.fileSize || "N/A"}</span>
                  <span>LICENSE: {item.license || "FREEWARE"}</span>
                </div>

                {Number(item.price) === 0 ? (
                  <button
                    type="button"
                    onClick={() => handleDownload(item.downloadUrl)}
                    className="holo-download-btn"
                  >
                    <span>⬇</span>
                    <span>DOWNLOAD FREE</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() =>
                      typeof addToCart === "function" && addToCart(item._id)
                    }
                    className="holo-buy-btn"
                  >
                    BUY LICENSE ({Number(item.price || 0).toLocaleString()}{" "}
                    Kyats)
                  </button>
                )}
              </div>
            );
          })
        ) : (
          <div className="holo-empty-box">
            ရွေးချယ်ထားသော Category တွင် Software မရှိသေးပါ...
          </div>
        )}
      </div>
    </div>
  );
};

export default Softwares;