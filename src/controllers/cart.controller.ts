import { Request, Response } from "express";
import { isValidObjectId } from "mongoose";
import Product, { IProduct } from "../models/product.model";
import { Cart, ICartItem } from "../models/cart.model";

const MAX_QUANTITY = 99;

// After populate, "product" holds the full product instead of just its id
type PopulatedItem = Omit<ICartItem, "product"> & { product: IProduct | null };

const isValidQuantity = (value: unknown) =>
  Number.isInteger(value) && (value as number) >= 1 && (value as number) <= MAX_QUANTITY;

// Loads the user's cart with full product details and calculates the totals.
// Products that were deleted or hidden by an admin are left out.
const buildCartResponse = async (userId: string) => {
  const cart = await Cart.findOne({ user: userId }).populate<{ items: PopulatedItem[] }>("items.product");

  const items = (cart?.items ?? [])
    .filter((item) => item.product && !item.product.isHidden)
    .map((item) => ({
      product: item.product,
      quantity: item.quantity,
      subtotal: Math.round(item.product!.price * item.quantity * 100) / 100,
    }));

  return {
    items,
    totalItems: items.reduce((sum, item) => sum + item.quantity, 0),
    totalPrice: Math.round(items.reduce((sum, item) => sum + item.subtotal, 0) * 100) / 100,
  };
};

// GET /api/cart
export const getCart = async (req: Request, res: Response) => {
  res.json(await buildCartResponse(req.user!.id));
};

// POST /api/cart  { productId, quantity? } - adds the product, or increases its quantity
export const addToCart = async (req: Request, res: Response) => {
  const { productId, quantity = 1 } = req.body;

  if (!isValidObjectId(productId)) {
    return res.status(400).json({ message: "A valid productId is required" });
  }
  if (!isValidQuantity(quantity)) {
    return res.status(400).json({ message: `Quantity must be a whole number from 1 to ${MAX_QUANTITY}` });
  }

  const product = await Product.findOne({ _id: productId, isHidden: false });
  if (!product) {
    return res.status(404).json({ message: "Product not found" });
  }

  // Find the user's cart, or create an empty one the first time
  const cart = (await Cart.findOne({ user: req.user!.id })) ?? new Cart({ user: req.user!.id, items: [] });

  const existingItem = cart.items.find((item) => item.product.toString() === productId);
  if (existingItem) {
    existingItem.quantity = Math.min(MAX_QUANTITY, existingItem.quantity + quantity);
  } else {
    cart.items.push({ product: product._id, quantity });
  }

  await cart.save();

  res.status(201).json(await buildCartResponse(req.user!.id));
};

// PUT /api/cart/:productId  { quantity } - sets the quantity of a product already in the cart
export const updateCartItem = async (req: Request, res: Response) => {
  const { quantity } = req.body;

  if (!isValidQuantity(quantity)) {
    return res.status(400).json({ message: `Quantity must be a whole number from 1 to ${MAX_QUANTITY}` });
  }

  const cart = await Cart.findOne({ user: req.user!.id });
  const item = cart?.items.find((item) => item.product.toString() === req.params.productId);

  if (!cart || !item) {
    return res.status(404).json({ message: "Product is not in your cart" });
  }

  item.quantity = quantity;
  await cart.save();

  res.json(await buildCartResponse(req.user!.id));
};

// DELETE /api/cart/:productId - removes one product from the cart
export const removeFromCart = async (req: Request, res: Response) => {
  await Cart.updateOne(
    { user: req.user!.id },
    { $pull: { items: { product: req.params.productId } } }
  );

  res.json(await buildCartResponse(req.user!.id));
};

// DELETE /api/cart - empties the cart
export const clearCart = async (req: Request, res: Response) => {
  await Cart.updateOne({ user: req.user!.id }, { $set: { items: [] } });

  res.json(await buildCartResponse(req.user!.id));
};
