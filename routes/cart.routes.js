import express from "express"

import { addToCart, removeAllFromCart, updateQuantity,getCartProducts } from "../controllers/cart.controller.js"
import { protectRoute } from "../middleware/auth.middleware.js"

const router = express.Router()



router.post("/",protectRoute, addToCart)
router.put("/:id",protectRoute, updateQuantity)
router.get("/",protectRoute, getCartProducts)
router.post("/",protectRoute, removeAllFromCart)




export default router