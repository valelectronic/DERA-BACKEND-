import express from "express";
import { verifyPayment } from "../controllers/verifyPayment.controller.js";

const router = express.Router();

router.post("/verify", verifyPayment); // POST /api/payments/verify

export default router;
