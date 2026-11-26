import React, { useContext } from "react";
import { StoreContext } from "../../context/StoreContext";
import "./BackgroundUploadBanner.css";

const BackgroundUploadBanner = ({ isMobile = false }) => {
  const store = useContext(StoreContext) || {};
  const activeUpload = store.activeUpload;

  if (!activeUpload?.isUploading) return null;

  return (
    <div
      className="bg-upload-floating-card"
      style={{ bottom: isMobile ? "82px" : "20px" }}
    >
      <div className="bg-upload-header">
        <span className="bg-upload-dot" />
        <strong className="bg-upload-title" title={activeUpload.fileName}>
          🎬 {activeUpload.fileName}
        </strong>
      </div>

      <div className="bg-upload-mb-grid">
        <span>
          စုစုပေါင်း: <strong>{activeUpload.totalMB} MB</strong>
        </span>
        <span>
          တင်ပြီး: <strong>{activeUpload.uploadedMB} MB</strong>
        </span>
        <span>
          လိုသေး: <strong>{activeUpload.remainingMB} MB</strong>
        </span>
      </div>
    </div>
  );
};

export default BackgroundUploadBanner;