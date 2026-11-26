import mongoose from "mongoose";

const softwareSchema = new mongoose.Schema(
  {
    userId: { type: String, default: "admin" }, // <-- မည်သည့် User တင်ထားကြောင်း မှတ်သားရန်
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true, default: 0 },
    image: { type: String, default: "" }, // <-- ပုံမပါလည်း ရအောင် ပြင်ထားသည်
    category: { type: String, required: true },
    version: { type: String, required: true },
    platform: { type: String, required: true, default: "Windows" },
    downloadUrl: { type: String, default: "" },
    fileSize: { type: String, default: "N/A" },
    license: { type: String, default: "Free" }
  },
  { timestamps: true }
);

const softwareModel = mongoose.models.software || mongoose.model("software", softwareSchema);

export default softwareModel;
