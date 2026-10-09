import { Router } from "express";
import { getWishlist, addToWishlist, removeFromWishlist } from "../controllers/wishlist.controller";
import { authenticate } from "../middlewares/authenticate";
import { validateObjectId } from "../middlewares/validateObjectId";

const router = Router();

router.use(authenticate); // the wishlist belongs to the logged-in user

router.get("/", getWishlist);
router.post("/", addToWishlist);
router.delete("/:productId", validateObjectId("productId"), removeFromWishlist);

export default router;
