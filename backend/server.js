import express from "express";
import cors from "cors";
import "dotenv/config";
import fs from "fs";
import multer from "multer";
import { connectDB } from "./config/db.js";
import foodRouter from "./routes/foodRoute.js";
import softwareRouter from "./routes/softwareRoute.js";
import userRouter from "./routes/userRoute.js";
import chatRouter from "./routes/chatRoute.js";
import cartRouter from "./routes/cartRoute.js";
import orderRouter from "./routes/orderRoute.js";
import postRouter from "./routes/postRoute.js";
import repairRouter from "./routes/repairRoute.js";

// app config
const app = express();
const port = process.env.PORT || 4000;

// ensure uploads folder exists
if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads", { recursive: true });
}

// middlewares
app.use(express.json({ limit: "500mb" }));
app.use(express.urlencoded({ limit: "500mb", extended: true }));
app.use(cors());

// DB connection
connectDB();

// static files
app.use("/images", express.static("uploads"));

// Software ဖိုင်များကို တိုက်ရိုက် Download ဆွဲရန် Route
app.get("/download/:filename", (req, res) => {
  const filePath = `uploads/${req.params.filename}`;
  res.download(filePath, (err) => {
    if (err) {
      if (!res.headersSent) {
        res.status(404).send("ဖိုင်ရှာမတွေ့ပါ");
      }
    }
  });
});

// api endpoints
app.use("/api/food", foodRouter);
app.use("/api/software", softwareRouter);
app.use("/api/user", userRouter);
app.use("/api/cart", cartRouter);
app.use("/api/order", orderRouter);
app.use("/api/chat", chatRouter);
app.use("/api/post", postRouter);
app.use("/api/repair", repairRouter);

app.get("/", (req, res) => {
  res.send("API Working");
});

// Multer & server error handler
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    console.error("Multer Error:", err.code, err.message);
    return res.status(400).json({
      success: false,
      message: `Upload error (${err.code}): ${err.message}`,
    });
  }

  console.error("Server Error:", err);
  if (!res.headersSent) {
    return res.status(err.status || 500).json({
      success: false,
      message: err.message || "Server error",
    });
  }
  next(err);
});

app.listen(port, "0.0.0.0", () => {
  console.log(`Server Started on port: ${port}`);
});