import express from "express";
import {
  addToCart,
  clearCart,
  updateQuantity,
  getCartProducts,
  removeFromCart, // new controller
} from "../controllers/cart.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/", protectRoute, addToCart);
router.get("/", protectRoute, getCartProducts);
router.put("/:id", protectRoute, updateQuantity);

// 🚀 Add DELETE /cart/:id to remove one item
router.delete("/:id", protectRoute, removeFromCart);

// 🚀 Add DELETE /cart to clear all items
router.delete("/", protectRoute, clearCart);

export default router;
