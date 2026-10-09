import { Router } from "express";
import { adminLogin, getDashboard } from "../controllers/admin.controller";
import {
  getAllProducts,
  createProduct,
  updateProduct,
  toggleProductVisibility,
  deleteProduct,
} from "../controllers/adminProduct.controller";
import { authenticate } from "../middlewares/authenticate";
import { authorize } from "../middlewares/authorize";
import { upload } from "../middlewares/uploadMiddleware";
import { validateObjectId } from "../middlewares/validateObjectId";

const router = Router();

// The only admin route that does not need a token
router.post("/login", adminLogin);

// Everything below requires a logged-in admin
router.use(authenticate, authorize("admin"));

router.get("/dashboard", getDashboard);

router.get("/products", getAllProducts);
router.post("/products", upload.single("image"), createProduct);
router.put("/products/:id", validateObjectId(), upload.single("image"), updateProduct);
router.patch("/products/:id/visibility", validateObjectId(), toggleProductVisibility);
router.delete("/products/:id", validateObjectId(), deleteProduct);

export default router;
