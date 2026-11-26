import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js";
import jwt from "jsonwebtoken";

const getUserIdFromToken = (token) => {
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded.id;
  } catch (error) {
    return null;
  }
};

// 1. Order တင်ခြင်း (Cash on Delivery - Stripe မလိုပါ)
const placeOrder = async (req, res) => {
  try {
    const buyerId = req.body.userId || getUserIdFromToken(req.headers.token);
    if (!buyerId) {
      return res.json({ success: false, message: "Login အရင်ဝင်ပေးပါ" });
    }

    const items = req.body.items || [];
    if (items.length === 0) {
      return res.json({ success: false, message: "Cart ထဲတွင် ပစ္စည်းမရှိပါ" });
    }

    // Order ထဲပါသော ပစ္စည်းများ၏ Seller ID များကို စုစည်းခြင်း
    const sellerIds = [...new Set(items.map((item) => item.userId || "admin"))];

    const newOrder = new orderModel({
      userId: buyerId,
      sellerIds: sellerIds,
      items: items,
      amount: Number(req.body.amount),
      address: req.body.address,
      payment: true,
    });

    await newOrder.save();
    await userModel.findByIdAndUpdate(buyerId, { cartData: {} });

    res.json({
      success: true,
      message: "Order အောင်မြင်စွာ တင်ပြီးပါပြီ",
    });
  } catch (error) {
    console.log("Place Order Error:", error);
    res.json({ success: false, message: error.message || "Order တင်ရာတွင် အမှားရှိနေပါသည်" });
  }
};

// 2. ငွေပေးချေမှု စစ်ဆေးခြင်း
const verifyOrder = async (req, res) => {
  const { orderId, success } = req.body;
  try {
    if (success === "true") {
      await orderModel.findByIdAndUpdate(orderId, { payment: true });
      res.json({ success: true, message: "Paid" });
    } else {
      await orderModel.findByIdAndDelete(orderId);
      res.json({ success: false, message: "Not Paid" });
    }
  } catch (error) {
    res.json({ success: false, message: "Error" });
  }
};

// 3. ဝယ်ယူသူ (Buyer) ၏ Order စာရင်းများ ယူခြင်း
const userOrders = async (req, res) => {
  try {
    const buyerId = req.body.userId || getUserIdFromToken(req.headers.token);
    const orders = await orderModel.find({ userId: buyerId });
    res.json({ success: true, data: orders });
  } catch (error) {
    res.json({ success: false, message: "Error" });
  }
};

// 4. ရောင်းချသူ (Seller) ထံသို့ ရောက်လာသော Order များကိုသာ သီးသန့်ယူခြင်း
const sellerOrders = async (req, res) => {
  try {
    const sellerId = getUserIdFromToken(req.headers.token);
    if (!sellerId) return res.json({ success: false, message: "Login အရင်ဝင်ပါ" });

    const orders = await orderModel.find({ sellerIds: sellerId });

    const filteredOrders = orders.map((order) => {
      const mySoldItems = order.items.filter((item) => item.userId === sellerId);
      const myEarnings = mySoldItems.reduce((sum, item) => sum + Number(item.price) * Number(item.quantity), 0);
      return {
        _id: order._id,
        address: order.address,
        status: order.status,
        payment: order.payment,
        date: order.date,
        items: mySoldItems,
        amount: myEarnings,
      };
    });

    res.json({ success: true, data: filteredOrders });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Seller Orders ယူရာတွင် အမှားရှိနေပါသည်" });
  }
};

// 5. Admin Panel အတွက် Order အားလုံး ယူခြင်း
const listOrders = async (req, res) => {
  try {
    const orders = await orderModel.find({});
    res.json({ success: true, data: orders });
  } catch (error) {
    res.json({ success: false, message: "Error" });
  }
};

// 6. Order Status ပြောင်းလဲခြင်း
const updateStatus = async (req, res) => {
  try {
    await orderModel.findByIdAndUpdate(req.body.orderId, { status: req.body.status });
    res.json({ success: true, message: "Status Updated" });
  } catch (error) {
    res.json({ success: false, message: "Error" });
  }
};

// Admin မှ Order ဖျက်ပစ်ခြင်း
const removeOrder = async (req, res) => {
  try {
    const { orderId } = req.body;
    if (!orderId) {
      return res.json({ success: false, message: "Order ID မရှိပါ" });
    }
    await orderModel.findByIdAndDelete(orderId);
    res.json({ success: true, message: "Order ကို ဖျက်ပစ်ပြီးပါပြီ" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Order ဖျက်ရာတွင် အမှားရှိနေပါသည်" });
  }
};
// 1. Order မှာသူ (Buyer) မှ မိမိ၏ Order ကို Cancel လုပ်ခြင်း
const cancelUserOrder = async (req, res) => {
  try {
    const { orderId } = req.body;
    const order = await orderModel.findById(orderId);
    if (!order) {
      return res.json({ success: false, message: "Order ရှာမတွေ့ပါ" });
    }
    if (order.status !== "Order Processing") {
      return res.json({
        success: false,
        message: "ပစ္စည်းပို့ဆောင်နေပြီ ဖြစ်သောကြောင့် Cancel လုပ်၍မရတော့ပါ",
      });
    }
    await orderModel.findByIdAndDelete(orderId);
    res.json({ success: true, message: "Order ကို ပယ်ဖျက် (Cancel) ပြီးပါပြီ" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Order Cancel လုပ်ရာတွင် အမှားရှိနေပါသည်" });
  }
};



export {cancelUserOrder,removeOrder,placeOrder, verifyOrder, userOrders, sellerOrders, listOrders, updateStatus };
