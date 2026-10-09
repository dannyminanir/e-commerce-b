import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { User } from "../models/user.model";
import Product from "../models/product.model";
import { buildAuthResponse } from "../utils/authResponse";

// POST /api/admin/login - same as the normal login, but only admins are accepted
export const adminLogin = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  const user = await User.findOne({ email }).select("+password");
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ message: "Invalid email or password" });
  }

  if (user.role !== "admin") {
    return res.status(403).json({ message: "This account is not an admin" });
  }

  res.json(buildAuthResponse(user));
};

// GET /api/admin/dashboard - numbers shown on the admin dashboard
export const getDashboard = async (req: Request, res: Response) => {
  const [totalProducts, hiddenProducts, totalUsers, recentProducts] = await Promise.all([
    Product.countDocuments(),
    Product.countDocuments({ isHidden: true }),
    User.countDocuments({ role: "user" }),
    Product.find().sort({ createdAt: -1 }).limit(5),
  ]);

  res.json({
    stats: {
      totalProducts,
      visibleProducts: totalProducts - hiddenProducts,
      hiddenProducts,
      totalUsers,
    },
    recentProducts,
  });
};
