import express from "express";
import multer from "multer";
import {
  getUsersAndFriends,
  sendFriendRequest,
  acceptFriendRequest,
  sendMessage,
  getMessages,
  getFriendProfile,
  sendCallSignal,
  getCallSignals,
} from "../controllers/chatController.js";

const chatRouter = express.Router();

// Chat ထဲတွင် ပုံပို့ရန် Multer Setup
const storage = multer.diskStorage({
  destination: "uploads",
  filename: (req, file, cb) => {
    return cb(null, `chat_${Date.now()}_${file.originalname}`);
  },
});
const upload = multer({ storage });

chatRouter.get("/users", getUsersAndFriends);
chatRouter.post("/add-friend", sendFriendRequest);
chatRouter.post("/accept-friend", acceptFriendRequest);
chatRouter.post("/send", upload.single("image"), sendMessage);
chatRouter.post("/messages", getMessages);

// Friend Account နှိပ်ပြီး Profile ဝင်ကြည့်ရန်
chatRouter.post("/friend-profile", getFriendProfile);

// Video Call (VC) Signaling Routes
chatRouter.post("/call/signal", sendCallSignal);
chatRouter.get("/call/poll", getCallSignals);

export default chatRouter;
