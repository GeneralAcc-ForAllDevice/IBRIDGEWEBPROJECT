import express from "express";
import { addFood, listFood, userFoods, removeFood, addFoodComment } from "../controllers/foodController.js";
import multer from "multer";

const foodRouter = express.Router();

const storage = multer.diskStorage({
  destination: "uploads",
  filename: (req, file, cb) => {
    return cb(null, `${Date.now()}${file.originalname}`);
  },
});

const upload = multer({ storage: storage });

foodRouter.post("/add", upload.single("image"), addFood);
foodRouter.get("/list", listFood);
foodRouter.post("/user-list", userFoods);
foodRouter.post("/remove", removeFood);
foodRouter.post("/comment", addFoodComment); // <-- Comment ရေးရန် Route

export default foodRouter;
