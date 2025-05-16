import express from 'express';
import { protectRoute } from '../middleware/auth.middleware.js';
import { payStackWebhook,createCheckoutSession } from '../controllers/paystack.contoller.js';

const router = express.Router();

router.post("/create-checkout-session",protectRoute,createCheckoutSession)
router.post("/payStackWebhook", protectRoute,express.raw({ type: 'application/json' }), payStackWebhook)

export default router;