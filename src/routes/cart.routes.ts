import { Router } from "express";
import { getCart, addToCart, updateCartItem, removeFromCart, clearCart } from "../controllers/cart.controller";
import { authenticate } from "../middlewares/authenticate";
import { validateObjectId } from "../middlewares/validateObjectId";

const router = Router();

router.use(authenticate); // the cart belongs to the logged-in user

router.get("/", getCart);
router.post("/", addToCart);
router.delete("/", clearCart);
router.put("/:productId", validateObjectId("productId"), updateCartItem);
router.delete("/:productId", validateObjectId("productId"), removeFromCart);

export default router;
