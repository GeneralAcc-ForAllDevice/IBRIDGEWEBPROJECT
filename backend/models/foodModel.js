import mongoose from "mongoose";

const foodSchema = new mongoose.Schema({
  userId: { type: String, default: "admin" },
  sellerName: { type: String, default: "IBRIDGE Store" }, // ရောင်းချသူ အမည်
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  image: { type: String, required: true },
  category: { type: String, required: true },
  comments: { type: Array, default: [] }, // Product အောက်မှ Comment များ
});

const foodModel = mongoose.models.food || mongoose.model("food", foodSchema);
export default foodModel;
