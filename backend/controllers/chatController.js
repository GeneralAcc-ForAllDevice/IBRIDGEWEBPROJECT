import messageModel from "../models/messageModel.js";
import userModel from "../models/userModel.js";
import foodModel from "../models/foodModel.js"; // သူငယ်ချင်းတင်ထားသော ပစ္စည်းများပြရန်
import jwt from "jsonwebtoken";

const getUserId = (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded.id;
  } catch (error) {
    return null;
  }
};

// Video Call Signals များကို ယာယီသိမ်းထားရန် Memory Queue
const callSignals = {};

// 1. User စာရင်း၊ Online Status၊ Friends၊ Requests နှင့် နောက်ဆုံးစာ ID ယူခြင်း
const getUsersAndFriends = async (req, res) => {
  try {
    const myId = getUserId(req.headers.token);
    if (!myId) return res.json({ success: false, message: "Login အရင်ဝင်ပါ" });

    // မိမိ၏ Online Status (lastActive) ကို အချိန်နှင့်တပြေးညီ Update လုပ်မည်
    const me = await userModel.findByIdAndUpdate(
      myId,
      { lastActive: new Date() },
      { new: true }
    );

    const allUsers = await userModel
      .find({ _id: { $ne: myId } })
      .select("name email avatar phone address bio lastActive friends friendRequests");

    const latestMsg = await messageModel
      .findOne({ receiverId: myId })
      .sort({ createdAt: -1 })
      .select("_id");

    res.json({
      success: true,
      myId,
      myFriends: me.friends || [],
      myRequests: me.friendRequests || [],
      allUsers,
      latestMsgId: latestMsg ? latestMsg._id.toString() : null,
    });
  } catch (error) {
    res.json({ success: false, message: "Data ယူရာတွင် အမှားရှိနေပါသည်" });
  }
};

// 2. Add Friend
const sendFriendRequest = async (req, res) => {
  try {
    const myId = getUserId(req.headers.token);
    const { targetUserId } = req.body;

    const targetUser = await userModel.findById(targetUserId);
    if (!targetUser) return res.json({ success: false, message: "User ရှာမတွေ့ပါ" });

    if (!targetUser.friendRequests.includes(myId) && !targetUser.friends.includes(myId)) {
      targetUser.friendRequests.push(myId);
      await targetUser.save();
    }

    res.json({ success: true, message: "Friend Request ပို့ပြီးပါပြီ" });
  } catch (error) {
    res.json({ success: false, message: "Add Friend လုပ်ရာတွင် အမှားရှိနေပါသည်" });
  }
};

// 3. Accept Friend Request
const acceptFriendRequest = async (req, res) => {
  try {
    const myId = getUserId(req.headers.token);
    const { requesterId } = req.body;

    const me = await userModel.findById(myId);
    const requester = await userModel.findById(requesterId);

    if (!me || !requester) return res.json({ success: false, message: "User ရှာမတွေ့ပါ" });

    me.friendRequests = me.friendRequests.filter((id) => id !== requesterId);
    if (!me.friends.includes(requesterId)) me.friends.push(requesterId);
    if (!requester.friends.includes(myId)) requester.friends.push(myId);

    await me.save();
    await requester.save();

    res.json({ success: true, message: "သူငယ်ချင်းအဖြစ် လက်ခံပြီးပါပြီ" });
  } catch (error) {
    res.json({ success: false, message: "လက်ခံရာတွင် အမှားရှိနေပါသည်" });
  }
};

// 4. စာနှင့် ပုံ ပို့ခြင်း (Send Message & Image)
const sendMessage = async (req, res) => {
  try {
    const senderId = getUserId(req.headers.token);
    if (!senderId) return res.json({ success: false, message: "Login အရင်ဝင်ပါ" });

    const sender = await userModel.findById(senderId);
    const { receiverId, text } = req.body;
    const imageFilename = req.file ? req.file.filename : "";

    if (!text && !imageFilename) {
      return res.json({ success: false, message: "စာ သို့မဟုတ် ပုံ ထည့်ပါ" });
    }

    const newMessage = new messageModel({
      senderId,
      senderName: sender ? sender.name : "User",
      receiverId,
      text: text || "",
      image: imageFilename,
    });

    await newMessage.save();
    res.json({ success: true, data: newMessage });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "စာပို့ရာတွင် အမှားရှိနေပါသည်" });
  }
};

// 5. နှစ်ယောက်ကြား ပြောထားသော စာများ ပြန်ယူခြင်း
const getMessages = async (req, res) => {
  try {
    const myId = getUserId(req.headers.token);
    const { otherUserId } = req.body;

    // စာစစ်နေချိန် Online Status Update လုပ်မည်
    if (myId) {
      await userModel.findByIdAndUpdate(myId, { lastActive: new Date() });
    }

    const messages = await messageModel
      .find({
        $or: [
          { senderId: myId, receiverId: otherUserId },
          { senderId: otherUserId, receiverId: myId },
        ],
      })
      .sort({ createdAt: 1 });

    res.json({ success: true, data: messages });
  } catch (error) {
    res.json({ success: false, message: "စာများယူရာတွင် အမှားရှိနေပါသည်" });
  }
};

// 6. Friend Account ကို နှိပ်ပြီး သူ့ Profile နှင့် သူရောင်းချသော ပစ္စည်းများ ဝင်ကြည့်ခြင်း
const getFriendProfile = async (req, res) => {
  try {
    const { friendId } = req.body;
    const friend = await userModel
      .findById(friendId)
      .select("name email avatar phone address bio lastActive");

    if (!friend) {
      return res.json({ success: false, message: "User Profile ရှာမတွေ့ပါ" });
    }

    // ထိုသူငယ်ချင်း တင်ရောင်းထားသော ပစ္စည်းစာရင်းကိုပါ ရှာပေးမည်
    let items = [];
    try {
      items = await foodModel.find({ userId: friendId });
    } catch (e) {
      items = [];
    }

    res.json({ success: true, profile: friend, items });
  } catch (error) {
    res.json({ success: false, message: "Profile ကြည့်ရာတွင် အမှားရှိနေပါသည်" });
  }
};

// 7. Video Call Signaling (Offer, Answer, ICE Candidate, End Call)
const sendCallSignal = async (req, res) => {
  try {
    const myId = getUserId(req.headers.token);
    if (!myId) return res.json({ success: false });

    const me = await userModel.findById(myId).select("name avatar");
    const { toUserId, type, data } = req.body;

    if (!callSignals[toUserId]) {
      callSignals[toUserId] = [];
    }

    callSignals[toUserId].push({
      fromUserId: myId,
      fromName: me?.name || "User",
      fromAvatar: me?.avatar || "",
      type,
      data,
      timestamp: Date.now(),
    });

    res.json({ success: true });
  } catch (error) {
    res.json({ success: false });
  }
};

// 8. မိမိဆီ ဝင်လာသော Video Call Signals များကို စစ်ဆေးယူခြင်း
const getCallSignals = async (req, res) => {
  try {
    const myId = getUserId(req.headers.token);
    if (!myId) return res.json({ success: false, signals: [] });

    const signals = callSignals[myId] || [];
    callSignals[myId] = []; // ယူပြီးသား Signal များကို ရှင်းလင်းမည်

    // ၃၀ စက္ကန့်ထက် ကျော်နေသော Call အဟောင်းများကို ဖယ်ရှားမည်
    const freshSignals = signals.filter((s) => Date.now() - s.timestamp < 30000);
    res.json({ success: true, signals: freshSignals });
  } catch (error) {
    res.json({ success: false, signals: [] });
  }
};

export {
  getUsersAndFriends,
  sendFriendRequest,
  acceptFriendRequest,
  sendMessage,
  getMessages,
  getFriendProfile,
  sendCallSignal,
  getCallSignals,
};
