import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
  userId: { type: String, required: true },      // ဝယ်ယူသူ (Buyer) ID
  sellerIds: { type: Array, default: [] },       // ဤ Order ထဲတွင် ပါဝင်သော ပစ္စည်းပိုင်ရှင် (Seller) ID များ
  items: { type: Array, required: true },
  amount: { type: Number, required: true },
  address: { type: Object, required: true },
  status: { type: String, default: "Order Processing" },
  date: { type: Date, default: Date.now() },
  payment: { type: Boolean, default: false },
});

const orderModel = mongoose.models.order || mongoose.model("order", orderSchema);
export default orderModel;
