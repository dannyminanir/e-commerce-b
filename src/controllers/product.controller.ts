// Public product endpoints: anyone can browse, search, filter and view products.
// Hidden products (isHidden: true) are never returned here.
import { Request, Response } from "express";
import Product from "../models/product.model";
import { Review } from "../models/review.model";

const MAX_PAGE_SIZE = 50;

// --- small helpers to read query parameters safely ---

const readText = (value: unknown): string => (typeof value === "string" ? value.trim() : "");

const readNumber = (value: unknown): number | undefined => {
  if (typeof value !== "string" || value.trim() === "") return undefined;
  const number = Number(value);
  return Number.isNaN(number) ? undefined : number;
};

// Escape special characters so user input is searched as plain text, not as a regex
const escapeRegex = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const sortOptions: Record<string, Record<string, 1 | -1>> = {
  newest: { createdAt: -1 },
  price_asc: { price: 1 },
  price_desc: { price: -1 },
  name: { name: 1 },
};

// GET /api/products?search=mouse&category=electronics&minPrice=10&maxPrice=100&sort=price_asc&page=1&limit=12
export const getProducts = async (req: Request, res: Response) => {
  const search = readText(req.query.search);
  const category = readText(req.query.category);
  const minPrice = readNumber(req.query.minPrice);
  const maxPrice = readNumber(req.query.maxPrice);
  const sort = sortOptions[readText(req.query.sort)] ?? sortOptions.newest;

  const page = Math.max(1, Math.floor(readNumber(req.query.page) ?? 1));
  const limit = Math.min(MAX_PAGE_SIZE, Math.max(1, Math.floor(readNumber(req.query.limit) ?? 12)));

  // Build the MongoDB filter step by step
  const filter: Record<string, any> = { isHidden: false };

  if (search) {
    const searchRegex = new RegExp(escapeRegex(search), "i"); // "i" = ignore upper/lower case
    filter.$or = [{ name: searchRegex }, { description: searchRegex }];
  }

  if (category) {
    filter.category = new RegExp(`^${escapeRegex(category)}$`, "i");
  }

  if (minPrice !== undefined || maxPrice !== undefined) {
    filter.price = {};
    if (minPrice !== undefined) filter.price.$gte = minPrice;
    if (maxPrice !== undefined) filter.price.$lte = maxPrice;
  }

  const [products, total] = await Promise.all([
    Product.find(filter)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit),
    Product.countDocuments(filter),
  ]);

  res.json({
    total,
    page,
    pages: Math.ceil(total / limit),
    products,
  });
};

// GET /api/products/categories - list of categories, handy for a filter dropdown
export const getCategories = async (req: Request, res: Response) => {
  const categories = await Product.distinct("category", { isHidden: false });
  res.json({ categories: categories.sort() });
};

// GET /api/products/:id - product details together with its reviews
export const getProductById = async (req: Request, res: Response) => {
  const product = await Product.findOne({ _id: req.params.id, isHidden: false });

  if (!product) {
    return res.status(404).json({ message: "Product not found" });
  }

  const reviews = await Review.find({ product: product._id })
    .populate("user", "name")
    .sort({ createdAt: -1 });

  const ratingSum = reviews.reduce((sum, review) => sum + review.rating, 0);
  const averageRating = reviews.length ? Math.round((ratingSum / reviews.length) * 10) / 10 : 0;

  res.json({
    product,
    averageRating,
    reviewCount: reviews.length,
    reviews,
  });
};
