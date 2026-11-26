import repairModel from "../models/repairModel.js";
import userModel from "../models/userModel.js";
import jwt from "jsonwebtoken";

const checkAdmin = async (token) => {
  try {
    if (!token) return null;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await userModel.findById(decoded.id);
    return user && user.role === "admin" ? user : null;
  } catch {
    return null;
  }
};

// 1. Admin မှ စက်ပြင် Ticket အသစ် တင်ခြင်း
const addRepairTicket = async (req, res) => {
  try {
    const admin = await checkAdmin(req.headers.token);
    if (!admin) return res.json({ success: false, message: "Admin ခွင့်ပြုချက် မရှိပါ" });

    const {
      trackingCode,
      customerName,
      phone,
      deviceModel,
      issueDescription,
      estimatedCost,
      status,
      technicianName,
      technicianPhone,
      technicianNote,
    } = req.body;

    if (!trackingCode || !customerName || !deviceModel) {
      return res.json({ success: false, message: "Code နံပါတ်၊ Customer အမည်နှင့် စက်အမျိုးအစား ထည့်ပါ" });
    }

    const cleanCode = trackingCode.trim().toUpperCase();
    const exists = await repairModel.findOne({ trackingCode: cleanCode });
    if (exists) {
      return res.json({ success: false, message: `Code (${cleanCode}) သည် ရှိနှင့်ပြီးသား ဖြစ်ပါသည်` });
    }

    const newTicket = new repairModel({
      trackingCode: cleanCode,
      customerName,
      phone: phone || "",
      deviceModel,
      issueDescription: issueDescription || "",
      estimatedCost: estimatedCost || "စစ်ဆေးဆဲ",
      status: status || "မပြင်ရသေးပါ",
      technicianName: technicianName || admin.name || "IBRIDGE Technician",
      technicianPhone: technicianPhone || admin.phone || "09-757779228",
      technicianUserId: String(admin._id),
      technicianNote: technicianNote || "",
    });

    await newTicket.save();
    res.json({ success: true, message: `Code (${cleanCode}) စာရင်းသွင်းပြီးပါပြီ`, data: newTicket });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "စာရင်းသွင်းရာတွင် အမှားရှိနေပါသည်" });
  }
};

// 2. User မှ Code နံပါတ် ရိုက်ရှာခြင်း (Public)
// 2. User မှ Code နံပါတ် ရိုက်ရှာခြင်း (Admin မတင်ရသေးလျှင်လည်း "မပြင်ရသေးပါ" ဟု ပြသပေးမည်)
const trackRepairStatus = async (req, res) => {
  try {
    const { query } = req.body;
    if (!query || !query.trim()) {
      return res.json({ success: false, message: "Code နံပါတ် ရိုက်ထည့်ပါ" });
    }

    const cleanQuery = query.trim().toUpperCase();
    const record = await repairModel.findOne({ trackingCode: cleanQuery });

    if (!record) {
      // Admin စာရင်းမသွင်းရသေးသည့် Code အားလုံးအတွက် Default အနေဖြင့် "မပြင်ရသေးပါ" ပြသမည်
      return res.json({
        success: true,
        data: {
          trackingCode: cleanQuery,
          customerName: "IBRIDGE Customer",
          deviceModel: "စက်အချက်အလက် စာရင်းသွင်းနေဆဲ",
          issueDescription: "စစ်ဆေးရန် စောင့်ဆိုင်းနေပါသည်",
          estimatedCost: "စစ်ဆေးပြီးမှ အတည်ပြုပေးပါမည်",
          status: "မပြင်ရသေးပါ",
          technicianName: "IBRIDGE Service Team",
          technicianPhone: "09-757779228",
          technicianNote: "သင်၏ စက်အား စစ်ဆေးပြုပြင်ရန် အလှည့်စောင့်ဆိုင်းနေပါသည်။ အသေးစိတ်သိရှိလိုပါက အောက်ပါ ဖုန်း/Chat မှ ဆက်သွယ်မေးမြန်းနိုင်ပါသည်။",
          createdAt: new Date(),
        },
      });
    }

    res.json({ success: true, data: record });
  } catch (error) {
    res.json({ success: false, message: "စစ်ဆေးရာတွင် အမှားရှိနေပါသည်" });
  }
};

// 3. Admin အတွက် စက်စာရင်းအားလုံး ယူခြင်း
const listAllRepairs = async (req, res) => {
  try {
    const list = await repairModel.find({}).sort({ createdAt: -1 });
    res.json({ success: true, data: list });
  } catch (error) {
    res.json({ success: false, message: "Error fetching repairs" });
  }
};

// 4. Admin မှ Status / Note / ဈေးနှုန်း ပြင်ဆင်ခြင်း
const updateRepairStatus = async (req, res) => {
  try {
    const admin = await checkAdmin(req.headers.token);
    if (!admin) return res.json({ success: false, message: "Admin ခွင့်ပြုချက် မရှိပါ" });

    const { id, status, estimatedCost, technicianNote } = req.body;
    await repairModel.findByIdAndUpdate(id, {
      ...(status && { status }),
      ...(estimatedCost !== undefined && { estimatedCost }),
      ...(technicianNote !== undefined && { technicianNote }),
    });
    res.json({ success: true, message: "အခြေအနေ Update လုပ်ပြီးပါပြီ" });
  } catch (error) {
    res.json({ success: false, message: "Update လုပ်၍မရပါ" });
  }
};

// 5. Admin မှ Repair Ticket ဖျက်ခြင်း
const deleteRepairTicket = async (req, res) => {
  try {
    const admin = await checkAdmin(req.headers.token);
    if (!admin) return res.json({ success: false, message: "Admin ခွင့်ပြုချက် မရှိပါ" });

    const { id } = req.body;
    await repairModel.findByIdAndDelete(id);
    res.json({ success: true, message: "စက်ပြင်မှတ်တမ်း ဖျက်ပြီးပါပြီ" });
  } catch (error) {
    res.json({ success: false, message: "ဖျက်၍မရပါ" });
  }
};

export {
  addRepairTicket,
  trackRepairStatus,
  listAllRepairs,
  updateRepairStatus,
  deleteRepairTicket,
};
