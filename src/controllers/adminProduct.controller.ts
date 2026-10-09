// Admin-only product management: list everything, add, edit, delete, hide/show.
// (Express 5 automatically sends errors from async functions to the error handler in app.ts,
// so we don't need try/catch in every function.)
import { Request, Response } from "express";
import Product from "../models/product.model";
import { Cart } from "../models/cart.model";
import { Wishlist } from "../models/wishlist.model";
import { Review } from "../models/review.model";
import cloudinary from "../config/cloudinary";
import { uploadImage } from "../utils/uploadImage";

// Form-data sends every field as text, so we convert the price to a number and check it
const parsePrice = (value: unknown): number | null => {
  if (value === undefined || value === "") return null;
  const price = Number(value);
  return Number.isFinite(price) && price >= 0 ? price : null;
};

// GET /api/admin/products - every product, including hidden ones
export const getAllProducts = async (req: Request, res: Response) => {
  const products = await Product.find().sort({ createdAt: -1 });
  res.json({ count: products.length, products });
};

// POST /api/admin/products
export const createProduct = async (req: Request, res: Response) => {
  const { name, description, category } = req.body;
  const price = parsePrice(req.body.price);

  if (!name || !category || price === null) {
    return res.status(400).json({ message: "Name, category and a valid price are required" });
  }

  // The image is optional
  const uploadResult = await uploadImage(req);

  const product = await Product.create({
    name,
    description,
    category,
    price,
    ...(uploadResult && {
      imageUrl: uploadResult.secure_url,
      imagePublicId: uploadResult.public_id,
    }),
  });

  res.status(201).json({ message: "Product created successfully", product });
};

// PUT /api/admin/products/:id - send only the fields you want to change
export const updateProduct = async (req: Request, res: Response) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return res.status(404).json({ message: "Product not found" });
  }

  const { name, description, category } = req.body;

  if (req.body.price !== undefined) {
    const price = parsePrice(req.body.price);
    if (price === null) {
      return res.status(400).json({ message: "Price must be a valid number" });
    }
    product.price = price;
  }

  if (name) product.name = name;
  if (category) product.category = category;
  if (description !== undefined) product.description = description;

  // If a new image was sent, replace the old one
  const uploadResult = await uploadImage(req);
  if (uploadResult) {
    if (product.imagePublicId) {
      await cloudinary.uploader.destroy(product.imagePublicId);
    }
    product.imageUrl = uploadResult.secure_url;
    product.imagePublicId = uploadResult.public_id;
  }

  await product.save();

  res.json({ message: "Product updated successfully", product });
};

// PATCH /api/admin/products/:id/visibility - hide the product if it is shown, show it if it is hidden
export const toggleProductVisibility = async (req: Request, res: Response) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return res.status(404).json({ message: "Product not found" });
  }

  product.isHidden = !product.isHidden;
  await product.save();

  res.json({
    message: product.isHidden ? "Product is now hidden" : "Product is now visible",
    product,
  });
};

// DELETE /api/admin/products/:id
export const deleteProduct = async (req: Request, res: Response) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return res.status(404).json({ message: "Product not found" });
  }

  if (product.imagePublicId) {
    await cloudinary.uploader.destroy(product.imagePublicId);
  }

  await product.deleteOne();

  // Clean up everything that pointed to this product
  await Cart.updateMany({}, { $pull: { items: { product: product._id } } });
  await Wishlist.updateMany({}, { $pull: { products: product._id } });
  await Review.deleteMany({ product: product._id });

  res.json({ message: "Product deleted successfully" });
};
