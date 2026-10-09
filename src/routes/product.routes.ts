import { Router } from "express";
import { getProducts, getCategories, getProductById } from "../controllers/product.controller";
import { validateObjectId } from "../middlewares/validateObjectId";

const router = Router();

// Public: no login needed
router.get("/", getProducts);
router.get("/categories", getCategories); // must stay above "/:id"
router.get("/:id", validateObjectId(), getProductById);

export default router;
