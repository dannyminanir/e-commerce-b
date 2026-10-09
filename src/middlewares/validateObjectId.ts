import { Request, Response, NextFunction } from "express";
import { isValidObjectId } from "mongoose";

// Returns 400 when a route parameter (default ":id") is not a valid MongoDB id,
// so controllers never crash on ids like "abc"
export const validateObjectId = (paramName = "id") => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!isValidObjectId(String(req.params[paramName]))) {
      return res.status(400).json({ message: `Invalid ${paramName}` });
    }
    next();
  };
};
