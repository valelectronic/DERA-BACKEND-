import express from 'express';
import {getAllProducts,
     getFeaturedProducts,
    getRecommendedProducts,
    getProductsByCategory,
     createProduct,
     deleteProduct,
    toggleFeaturedProduct,
editProduct} from '../controllers/product.controller.js';
import { protectRoute,adminRoute } from '../middleware/auth.middleware.js';


const router = express.Router();

router.get("/", protectRoute, adminRoute, getAllProducts);
router.get("/featured", getFeaturedProducts);
router.patch("/:id", protectRoute, adminRoute, toggleFeaturedProduct); // Update product by ID
router.get("/category/:category", getProductsByCategory); // Get featured product by category
router.post("/", protectRoute, adminRoute, createProduct); // Get featured product by ID
router.delete("/:id", protectRoute, adminRoute, deleteProduct); // delete product by ID
router.get("/recommendation", getRecommendedProducts); // Get recommended products
router.put("/:id", editProduct); // edit product by ID

export default router;

