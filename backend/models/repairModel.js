import mongoose from "mongoose";

const repairSchema = new mongoose.Schema({
  trackingCode: { type: String, required: true, unique: true }, // Admin ရိုက်ထည့်သော Code (ဥပမာ - IBR-101)
  customerName: { type: String, required: true },
  phone: { type: String, default: "" },
  deviceModel: { type: String, required: true },
  issueDescription: { type: String, default: "" },
  estimatedCost: { type: String, default: "စစ်ဆေးဆဲ" },
  status: {
    type: String,
    default: "မပြင်ရသေးပါ", // မပြင်ရသေးပါ | ပြင်ဆင်နေဆဲ | ပြင်ဆင်ပြီးပါပြီ
  },
  technicianName: { type: String, default: "IBRIDGE Technician" },
  technicianPhone: { type: String, default: "09-757779228" },
  technicianUserId: { type: String, default: "" }, // Chat မှ တိုက်ရိုက်စကားပြောရန် Technician ID
  technicianNote: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
});

const repairModel = mongoose.models.repair || mongoose.model("repair", repairSchema);
export default repairModel;
