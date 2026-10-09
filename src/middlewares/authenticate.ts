import { Request, Response, NextFunction } from "express";
import { verifyToken, hashToken } from "../utils/jwt";
import { User } from "../models/user.model";
import { RevokedToken } from "../models/revokedToken.model";

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const token = header.split(" ")[1];

  try {
    const { id } = verifyToken(token);

    // Reject tokens that were already logged out
    const loggedOut = await RevokedToken.exists({ tokenHash: hashToken(token) });
    if (loggedOut) {
      return res.status(401).json({ message: "You are logged out, please log in again" });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(401).json({ message: "User no longer exists" });
    }

    req.user = user;
    req.token = token;
    next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};
