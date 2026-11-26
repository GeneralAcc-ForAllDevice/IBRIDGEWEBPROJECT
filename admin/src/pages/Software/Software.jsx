import React, { useState, useContext, useEffect } from "react";
import "./Software.css";
import axios from "axios";
import { toast } from "react-toastify";
import { StoreContext } from "../../context/StoreContext";
import { useNavigate } from "react-router-dom";

const Software = ({ url }) => {
  const navigate = useNavigate();
  const { token, admin } = useContext(StoreContext);

  const imageState = useState(false);
  const image = imageState.at(0);
  const setImage = imageState.at(1);

  const fileState = useState(false);
  const softwareFile = fileState.at(0);
  const setSoftwareFile = fileState.at(1);

  const loadingState = useState(false);
  const loading = loadingState.at(0);
  const setLoading = loadingState.at(1);

  const dataState = useState({
    name: "",
    description: "",
    price: "",
    category: "Operating System",
    version: "",
    platform: "Windows",
  });
  const data = dataState.at(0);
  const setData = dataState.at(1);

  const onChangeHandler = (event) => {
    const name = event.target.name;
    const value = event.target.value;
    setData((prev) => ({ ...prev, [name]: value }));
  };

  // ပုံရွေးချယ်ရန် Handler (.item(0) သုံးထားပါသည်)
  const handleImageChange = (e) => {
    const file = e.target.files.item(0);
    if (file) {
      setImage(file);
    }
  };

  // Software ဖိုင်ရွေးချယ်ရန် Handler (.item(0) သုံးထားပါသည်)
  const handleFileChange = (e) => {
    const file = e.target.files.item(0);
    if (file) {
      setSoftwareFile(file);
    }
  };

  const onSubmitHandler = async (event) => {
    event.preventDefault();

    if (!image) {
      toast.error("Software ပုံ (Image/Logo) ရွေးချယ်ပါ");
      return;
    }

    if (!softwareFile) {
      toast.error("Software ဖိုင် (.exe, .zip, .apk) ရွေးချယ်ပါ");
      return;
    }

    setLoading(true);
    const fileSizeInMB = (softwareFile.size / (1024 * 1024)).toFixed(2) + " MB";

    const formData = new FormData();
    formData.append("name", data.name);
    formData.append("description", data.description);
    formData.append("price", Number(data.price));
    formData.append("category", data.category);
    formData.append("version", data.version);
    formData.append("platform", data.platform);
    formData.append("fileSize", fileSizeInMB);
    formData.append("image", image);
    formData.append("softwareFile", softwareFile);

    try {
      const response = await axios.post(`${url}/api/software/add`, formData, {
        headers: { token },
      });

      if (response.data.success) {
        setData({
          name: "",
          description: "",
          price: "",
          category: "Operating System",
          version: "",
          platform: "Windows",
        });
        setImage(false);
        setSoftwareFile(false);
        event.target.reset(); // Form တစ်ခုလုံးကို Reset ပြန်ချခြင်း
        toast.success(response.data.message);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.log(error);
      toast.error("Software တင်ရာတွင် အမှားအယွင်း ရှိနေပါသည်");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!admin && !token) {
      toast.error("Please Login First");
      navigate("/");
    }
  }, [admin, token, navigate]);

  return (
    <div className="add">
      <form onSubmit={onSubmitHandler} className="flex-col">
        {/* Software ပုံ (Image/Logo) တင်ရန် */}
        <div className="add-product-name flex-col">
          <p>Upload Software Image / Logo (.jpg, .png, .webp)</p>
          <input
            onChange={handleImageChange}
            type="file"
            accept="image/*"
            style={{
              padding: "12px",
              border: "1px dashed #a9a9a9",
              cursor: "pointer",
            }}
            required
          />
          {image && (
            <div style={{ marginTop: "10px" }}>
              <img
                src={URL.createObjectURL(image)}
                alt="Preview"
                style={{
                  width: "120px",
                  height: "120px",
                  objectFit: "cover",
                  borderRadius: "8px",
                  border: "1px solid #ddd",
                }}
              />
            </div>
          )}
        </div>

        {/* Software File သီးသန့် Upload တင်ရန် */}
        <div className="add-product-name flex-col">
          <p>Upload Software File (.exe, .zip, .apk, .rar)</p>
          <input
            onChange={handleFileChange}
            type="file"
            accept=".exe,.zip,.rar,.apk,.dmg,.msi,.7z"
            style={{
              padding: "12px",
              border: "1px dashed #a9a9a9",
              cursor: "pointer",
            }}
            required
          />
          {softwareFile && (
            <small style={{ color: "green", marginTop: "5px" }}>
              ရွေးချယ်ထားသောဖိုင်: {softwareFile.name} (
              {(softwareFile.size / (1024 * 1024)).toFixed(2)} MB)
            </small>
          )}
        </div>

        <div className="add-product-name flex-col">
          <p>Software Name</p>
          <input
            onChange={onChangeHandler}
            value={data.name}
            type="text"
            name="name"
            placeholder="ဥပမာ - Adobe Photoshop 2026"
            required
          />
        </div>

        <div className="add-product-description flex-col">
          <p>Software Description & System Requirements</p>
          <textarea
            onChange={onChangeHandler}
            value={data.description}
            name="description"
            rows="6"
            placeholder="Software အကြောင်းနှင့် လိုအပ်သော စက်ပစ္စည်း အချက်အလက်များ ရေးပါ"
            required
          ></textarea>
        </div>

        <div className="add-category-price">
          <div className="add-category flex-col">
            <p>Software Category</p>
            <select
              name="category"
              required
              onChange={onChangeHandler}
              value={data.category}
            >
              <option value="Operating System">
                Operating System (Windows/Linux)
              </option>
              <option value="Office & Productivity">
                Office & Productivity
              </option>
              <option value="Graphic & Video Editing">
                Graphic & Video Editing
              </option>
              <option value="Antivirus & Security">Antivirus & Security</option>
              <option value="Developer Tools">Developer Tools & IDE</option>
              <option value="Utility & Drivers">Utility & Drivers</option>
              <option value="Games">Games</option>
              <option value="Mobile Apps">Mobile Apps (APK/iOS)</option>
            </select>
          </div>

          <div className="add-price flex-col">
            <p>Price (အခမဲ့ဆိုလျှင် 0 ထည့်ပါ)</p>
            <input
              onChange={onChangeHandler}
              value={data.price}
              type="number"
              name="price"
              placeholder="0"
              min="0"
              required
            />
          </div>
        </div>

        <div className="add-category-price">
          <div className="add-category flex-col">
            <p>Supported OS / Platform</p>
            <select
              name="platform"
              onChange={onChangeHandler}
              value={data.platform}
            >
              <option value="Windows">Windows (64-bit / 32-bit)</option>
              <option value="macOS">macOS</option>
              <option value="Linux">Linux</option>
              <option value="Android">Android</option>
              <option value="iOS">iOS</option>
              <option value="Cross-Platform">All Platforms</option>
            </select>
          </div>

          <div className="add-price flex-col">
            <p>Version</p>
            <input
              onChange={onChangeHandler}
              value={data.version}
              type="text"
              name="version"
              placeholder="ဥပမာ - v1.0.5"
              required
            />
          </div>
        </div>

        <button type="submit" className="add-btn" disabled={loading}>
          {loading ? "UPLOADING..." : "ADD SOFTWARE"}
        </button>
      </form>
    </div>
  );
};

export default Software;
