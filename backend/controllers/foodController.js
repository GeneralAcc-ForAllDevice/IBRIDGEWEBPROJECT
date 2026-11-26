import foodModel from "../models/foodModel.js";
import userModel from "../models/userModel.js";
import jwt from "jsonwebtoken";
import fs from "fs";

const getUserIdFromToken = (token) => {
  if (!token) return "admin";
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded.id || "admin";
  } catch (error) {
    return "admin";
  }
};

// 1. ပစ္စည်းအသစ် တင်ရောင်းခြင်း
const addFood = async (req, res) => {
  try {
    const userId = getUserIdFromToken(req.headers.token);
    let sellerName = "IBRIDGE Store";

    if (userId !== "admin") {
      const seller = await userModel.findById(userId);
      if (seller) sellerName = seller.name;
    }

    let image_filename = `${req.file.filename}`;

    const food = new foodModel({
      userId: userId,
      sellerName: sellerName,
      name: req.body.name,
      description: req.body.description,
      price: Number(req.body.price),
      category: req.body.category,
      image: image_filename,
      comments: [],
    });

    await food.save();
    res.json({ success: true, message: "ပစ္စည်း အောင်မြင်စွာ တင်ရောင်းပြီးပါပြီ" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "ပစ္စည်းတင်ရာတွင် အမှားရှိနေပါသည်" });
  }
};

// 2. ပစ္စည်းစာရင်းအားလုံး ယူခြင်း
const listFood = async (req, res) => {
  try {
    const foods = await foodModel.find({});
    res.json({ success: true, data: foods });
  } catch (error) {
    res.json({ success: false, message: "Error" });
  }
};

// 3. သက်ဆိုင်ရာ User တင်ရောင်းထားသော ပစ္စည်းများ ယူခြင်း
const userFoods = async (req, res) => {
  try {
    const userId = getUserIdFromToken(req.headers.token);
    const foods = await foodModel.find({ userId });
    res.json({ success: true, data: foods });
  } catch (error) {
    res.json({ success: false, message: "စာရင်းယူရာတွင် အမှားရှိနေပါသည်" });
  }
};

// 4. ပစ္စည်း ပြန်ဖျက်ခြင်း
const removeFood = async (req, res) => {
  try {
    const food = await foodModel.findById(req.body.id);
    if (food && food.image) {
      fs.unlink(`uploads/${food.image}`, () => {});
    }
    await foodModel.findByIdAndDelete(req.body.id);
    res.json({ success: true, message: "ပစ္စည်း ဖျက်ပြီးပါပြီ" });
  } catch (error) {
    res.json({ success: false, message: "Error" });
  }
};

// 5. Product အောက်တွင် Comment ရေးသားခြင်း
const addFoodComment = async (req, res) => {
  try {
    const userId = getUserIdFromToken(req.headers.token);
    if (!userId || userId === "admin") {
      return res.json({ success: false, message: "Comment ရေးရန် Login အရင်ဝင်ပါ" });
    }

    const user = await userModel.findById(userId);
    const { foodId, text } = req.body;

    const newComment = {
      id: Date.now().toString(),
      userId: userId,
      userName: user ? user.name : "User",
      text: text,
      date: new Date().toLocaleDateString(),
    };

    const updatedFood = await foodModel.findByIdAndUpdate(
      foodId,
      { $push: { comments: newComment } },
      { new: true }
    );

    if (!updatedFood) {
      return res.json({ success: false, message: "Product ရှာမတွေ့ပါ" });
    }

    res.json({ success: true, message: "Comment ရေးပြီးပါပြီ", comments: updatedFood.comments });
  } catch (error) {
    console.log("Comment Error:", error);
    res.json({ success: false, message: "Comment ရေးရာတွင် အမှားရှိနေပါသည်" });
  }
};

export { addFood, listFood, userFoods, removeFood, addFoodComment };
