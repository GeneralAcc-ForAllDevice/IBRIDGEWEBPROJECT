import userModel from "../models/userModel.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import validator from "validator";
import fs from "fs";

// login user
const loginUser = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await userModel.findOne({ email });
    if (!user) {
      return res.json({ success: false, message: "User Doesn't exist" });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.json({ success: false, message: "Invalid Credentials" });
    }
    const role = user.role;
    const token = createToken(user._id);
    res.json({ success: true, token, role, name: user.name });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error" });
  }
};

// Create token
const createToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET);
};

// register user
const registerUser = async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const exists = await userModel.findOne({ email });
    if (exists) {
      return res.json({ success: false, message: "User already exists" });
    }

    if (!validator.isEmail(email)) {
      return res.json({ success: false, message: "Please enter valid email" });
    }
    if (password.length < 8) {
      return res.json({
        success: false,
        message: "Please enter strong password",
      });
    }

    const salt = await bcrypt.genSalt(Number(process.env.SALT) || 10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new userModel({
      name: name,
      email: email,
      password: hashedPassword,
    });

    const user = await newUser.save();
    const role = user.role;
    const token = createToken(user._id);
    res.json({ success: true, token, role, name: user.name });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error" });
  }
};

// 1. လက်ရှိ User Profile အချက်အလက်များ ဆွဲယူခြင်း
const getUserProfile = async (req, res) => {
  try {
    const userId = req.body.userId || req.userId;
    const user = await userModel.findById(userId).select("-password");
    if (!user) {
      return res.json({ success: false, message: "User ရှာမတွေ့ပါ" });
    }
    res.json({ success: true, user });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Profile ဆွဲယူရာတွင် အမှားရှိနေပါသည်" });
  }
};

// 2. User Profile အချက်အလက်များ ပြင်ဆင်သိမ်းဆည်းခြင်း (Edit Profile)
const updateUserProfile = async (req, res) => {
  try {
    const userId = req.body.userId || req.userId;
    const { name, email, phone, address, bio, password } = req.body;

    const user = await userModel.findById(userId);
    if (!user) {
      return res.json({ success: false, message: "User ရှာမတွေ့ပါ" });
    }

    if (email && email !== user.email) {
      if (!validator.isEmail(email)) {
        return res.json({ success: false, message: "Gmail Format မှားယွင်းနေပါသည်" });
      }
      const emailExists = await userModel.findOne({ email });
      if (emailExists) {
        return res.json({ success: false, message: "ဤ Gmail ဖြင့် အကောင့်ရှိနှင့်ပြီးသား ဖြစ်ပါသည်" });
      }
      user.email = email;
    }

    if (name) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (address !== undefined) user.address = address;
    if (bio !== undefined) user.bio = bio;

    if (password && password.trim() !== "") {
      if (password.length < 8) {
        return res.json({ success: false, message: "Password အနည်းဆုံး ၈ လုံး ရှိရပါမည်" });
      }
      const salt = await bcrypt.genSalt(Number(process.env.SALT) || 10);
      user.password = await bcrypt.hash(password, salt);
    }

    if (req.file) {
      if (user.avatar) {
        fs.unlink(`uploads/${user.avatar}`, (err) => {
          if (err) console.log("Old avatar delete error:", err);
        });
      }
      user.avatar = req.file.filename;
    }

    await user.save();

    res.json({
      success: true,
      message: "Profile အချက်အလက်များ အောင်မြင်စွာ ပြင်ဆင်ပြီးပါပြီ",
      user: {
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        bio: user.bio,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Profile ပြင်ဆင်ရာတွင် အမှားရှိနေပါသည်" });
  }
};

// Admin စစ်ဆေးသည့် Helper
const verifyAdmin = async (token) => {
  try {
    if (!token) return null;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const adminUser = await userModel.findById(decoded.id);
    if (adminUser && adminUser.role === "admin") return adminUser;
    return null;
  } catch (e) {
    return null;
  }
};

// 3. User စာရင်းအားလုံး ယူခြင်း (Admin Only)
const listAllUsers = async (req, res) => {
  try {
    const admin = await verifyAdmin(req.headers.token);
    if (!admin) return res.json({ success: false, message: "Admin ခွင့်ပြုချက် မရှိပါ" });

    const users = await userModel.find({}).select("-password").sort({ _id: -1 });
    res.json({ success: true, data: users, currentAdminId: admin._id });
  } catch (error) {
    res.json({ success: false, message: "User စာရင်း ယူ၍မရပါ" });
  }
};

// 4. User ကို Admin ပေးခြင်း / ရုပ်သိမ်းခြင်း (Change Role)
const updateUserRole = async (req, res) => {
  try {
    const admin = await verifyAdmin(req.headers.token);
    if (!admin) return res.json({ success: false, message: "Admin ခွင့်ပြုချက် မရှိပါ" });

    const { targetUserId, newRole } = req.body;
    if (String(admin._id) === String(targetUserId)) {
      return res.json({ success: false, message: "မိမိကိုယ်ပိုင် Admin Role ကို ပြောင်း၍မရပါ" });
    }

    await userModel.findByIdAndUpdate(targetUserId, { role: newRole });
    res.json({
      success: true,
      message: newRole === "admin" ? "Admin ရာထူး ပေးအပ်ပြီးပါပြီ" : "သာမန် User အဖြစ် ပြောင်းလဲပြီးပါပြီ",
    });
  } catch (error) {
    res.json({ success: false, message: "Role ပြောင်းရာတွင် အမှားရှိနေပါသည်" });
  }
};

// 5. User Account ဖျက်ပစ်ခြင်း (Delete User)
const deleteUserAccount = async (req, res) => {
  try {
    const admin = await verifyAdmin(req.headers.token);
    if (!admin) return res.json({ success: false, message: "Admin ခွင့်ပြုချက် မရှိပါ" });

    const { targetUserId } = req.body;
    if (String(admin._id) === String(targetUserId)) {
      return res.json({ success: false, message: "မိမိကိုယ်ပိုင် အကောင့်ကို ဖျက်၍မရပါ" });
    }

    await userModel.findByIdAndDelete(targetUserId);
    res.json({ success: true, message: "User Account ကို ဖျက်ပစ်ပြီးပါပြီ" });
  } catch (error) {
    res.json({ success: false, message: "User ဖျက်ရာတွင် အမှားရှိနေပါသည်" });
  }
};

export {
  loginUser,
  registerUser,
  getUserProfile,
  updateUserProfile,
  listAllUsers,
  updateUserRole,
  deleteUserAccount,
};
