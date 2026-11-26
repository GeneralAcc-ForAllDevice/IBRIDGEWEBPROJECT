import express from "express";
import { addSoftware, listSoftware, removeSoftware, userSoftwares } from "../controllers/softwareController.js";
import multer from "multer";

const softwareRouter = express.Router();

// Storage Engine
const storage = multer.diskStorage({
  destination: "uploads",
  filename: (req, file, cb) => {
    const cleanName = file.originalname.replace(/\s+/g, "_");
    return cb(null, `${Date.now()}_${cleanName}`);
  },
});

const upload = multer({ storage: storage });

softwareRouter.post("/add", upload.any(), addSoftware);
softwareRouter.get("/list", listSoftware);
softwareRouter.post("/user-list", userSoftwares); // <-- User ကိုယ်တိုင် တင်ထားသမျှ ယူရန်
softwareRouter.post("/remove", removeSoftware);

export default softwareRouter;
