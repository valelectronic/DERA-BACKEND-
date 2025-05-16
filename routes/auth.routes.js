import express from 'express';
import { signUp,logIn,logOut,refreshToken, profile } from '../controllers/auth.controller.js';
import { protectRoute } from '../middleware/auth.middleware.js';


const router = express.Router();

router.post("/signUp",signUp);
router.post("/logIn",logIn);
router.post("/logOut",logOut);
router.get("/profile",protectRoute, profile);
router.post("/refreshToken",refreshToken);


export default router;
