import express from "express";
import {
  addRepairTicket,
  trackRepairStatus,
  listAllRepairs,
  updateRepairStatus,
  deleteRepairTicket,
} from "../controllers/repairController.js";

const repairRouter = express.Router();

repairRouter.post("/add", addRepairTicket);
repairRouter.post("/track", trackRepairStatus);
repairRouter.get("/list", listAllRepairs);
repairRouter.post("/update", updateRepairStatus);
repairRouter.post("/delete", deleteRepairTicket);

export default repairRouter;
