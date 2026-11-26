import express from "express";
import multer from "multer";
import authMiddleware from "../middleware/auth.js";
import {
  loginUser,
  registerUser,
  getUserProfile,
  updateUserProfile,
  listAllUsers,
  updateUserRole,
  deleteUserAccount,
} from "../controllers/userController.js";

const userRouter = express.Router();

const storage = multer.diskStorage({
  destination: "uploads",
  filename: (req, file, cb) => {
    return cb(null, `${Date.now()}${file.originalname}`);
  },
});

const upload = multer({ storage: storage });

userRouter.post("/register", registerUser);
userRouter.post("/login", loginUser);

// Edit Profile Routes
userRouter.get("/profile", authMiddleware, getUserProfile);
userRouter.post("/update", upload.single("avatar"), authMiddleware, updateUserProfile);

// Admin User Management Routes
userRouter.get("/admin/list", listAllUsers);
userRouter.post("/admin/role", updateUserRole);
userRouter.post("/admin/delete", deleteUserAccount);

export default userRouter;
