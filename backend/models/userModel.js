import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, default: "user" },
    avatar: { type: String, default: "" },
    phone: { type: String, default: "" },
    address: { type: String, default: "" },
    bio: { type: String, default: "" },
    lastActive: { type: Date, default: Date.now }, // Online / Offline စစ်ဆေးရန်
    cartData: { type: Object, default: {} },
    friends: { type: Array, default: [] },
    friendRequests: { type: Array, default: [] },
  },
  { minimize: false }
);

const userModel = mongoose.models.user || mongoose.model("user", userSchema);
export default userModel;
