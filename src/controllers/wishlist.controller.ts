import { Request, Response } from "express";
import { isValidObjectId } from "mongoose";
import Product, { IProduct } from "../models/product.model";
import { Wishlist } from "../models/wishlist.model";

// Loads the user's wishlist with full product details (hidden/deleted products are left out)
const buildWishlistResponse = async (userId: string) => {
  const wishlist = await Wishlist.findOne({ user: userId }).populate<{ products: (IProduct | null)[] }>("products");

  const products = (wishlist?.products ?? []).filter((product) => product && !product.isHidden);

  return { count: products.length, products };
};

// GET /api/wishlist
export const getWishlist = async (req: Request, res: Response) => {
  res.json(await buildWishlistResponse(req.user!.id));
};

// POST /api/wishlist  { productId }
export const addToWishlist = async (req: Request, res: Response) => {
  const { productId } = req.body;

  if (!isValidObjectId(productId)) {
    return res.status(400).json({ message: "A valid productId is required" });
  }

  const product = await Product.findOne({ _id: productId, isHidden: false });
  if (!product) {
    return res.status(404).json({ message: "Product not found" });
  }

  // $addToSet adds the product only if it is not already in the list; upsert creates the wishlist if needed
  await Wishlist.updateOne(
    { user: req.user!.id },
    { $addToSet: { products: product._id } },
    { upsert: true }
  );

  res.status(201).json(await buildWishlistResponse(req.user!.id));
};

// DELETE /api/wishlist/:productId
export const removeFromWishlist = async (req: Request, res: Response) => {
  await Wishlist.updateOne({ user: req.user!.id }, { $pull: { products: req.params.productId } });

  res.json(await buildWishlistResponse(req.user!.id));
};
