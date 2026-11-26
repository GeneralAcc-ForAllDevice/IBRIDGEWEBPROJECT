import softwareModel from "../models/softwareModel.js";
import jwt from "jsonwebtoken";
import fs from "fs";

// Token မှ User ID ထုတ်ယူပေးမည့် Helper Function
const getUserIdFromToken = (token) => {
  if (!token) return "admin";
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded.id || "admin";
  } catch (error) {
    return "admin";
  }
};

// 1. Software အသစ်တင်ခြင်း (Admin ရော User ပါ သုံးနိုင်သည်)
const addSoftware = async (req, res) => {
  try {
    const userId = getUserIdFromToken(req.headers.token);

    const imageFile = req.files ? req.files.find((f) => f.fieldname === "image") : null;
    const softFile = req.files ? req.files.find((f) => f.fieldname === "softwareFile") : null;

    const image_filename = imageFile ? imageFile.filename : "";
    const software_filename = softFile ? softFile.filename : "";

    const software = new softwareModel({
      userId: userId, // ဘယ် User တင်တာလဲ မှတ်သားခြင်း
      name: req.body.name,
      description: req.body.description,
      price: Number(req.body.price),
      category: req.body.category,
      version: req.body.version,
      platform: req.body.platform,
      fileSize: req.body.fileSize || "N/A",
      image: image_filename,
      downloadUrl: software_filename,
      license: Number(req.body.price) > 0 ? "Paid" : "Free",
    });

    await software.save();
    res.json({ success: true, message: "Software ဖိုင်နှင့် အချက်အလက်များ တင်ပြီးပါပြီ" });
  } catch (error) {
    console.log("Add Software Error:", error);
    res.json({ success: false, message: "Software တင်ရာတွင် အမှားအယွင်း ရှိနေပါသည်" });
  }
};

// 2. Software စာရင်းအားလုံးကို ပြန်ယူခြင်း (Home Page တွင် ပြရန်)
const listSoftware = async (req, res) => {
  try {
    const softwares = await softwareModel.find({});
    res.json({ success: true, data: softwares });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Software စာရင်းယူရာတွင် အမှားရှိနေပါသည်" });
  }
};

// 3. သက်ဆိုင်ရာ User တင်ထားသော Software များကိုသာ ပြန်ယူခြင်း (User Account Page တွင် ပြရန်)
const userSoftwares = async (req, res) => {
  try {
    const userId = getUserIdFromToken(req.headers.token);
    const softwares = await softwareModel.find({ userId });
    res.json({ success: true, data: softwares });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "စာရင်းယူရာတွင် အမှားရှိနေပါသည်" });
  }
};

// 4. Software ဖျက်ခြင်း
const removeSoftware = async (req, res) => {
  try {
    const software = await softwareModel.findById(req.body.id);
    if (!software) {
      return res.json({ success: false, message: "Software ရှာမတွေ့ပါ" });
    }
    if (software.image) {
      fs.unlink(`uploads/${software.image}`, () => {});
    }
    if (software.downloadUrl) {
      fs.unlink(`uploads/${software.downloadUrl}`, () => {});
    }

    await softwareModel.findByIdAndDelete(req.body.id);
    res.json({ success: true, message: "Software ဖျက်ပြီးပါပြီ" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "ဖျက်ရာတွင် အမှားရှိနေပါသည်" });
  }
};

export { addSoftware, listSoftware, userSoftwares, removeSoftware };
