import jwt, { SignOptions } from "jsonwebtoken";
import crypto from "crypto";

interface TokenPayload {
  id: string;
  exp?: number; // expiry time (seconds since 1970), added automatically by jsonwebtoken
}

export const signToken = (payload: { id: string }) =>
  jwt.sign(payload, process.env.JWT_SECRET as string, {
    expiresIn: (process.env.JWT_EXPIRES_IN || "1d") as SignOptions["expiresIn"],
  });

export const verifyToken = (token: string) =>
  jwt.verify(token, process.env.JWT_SECRET as string) as TokenPayload;

// We store a hash of logged-out tokens instead of the raw token
export const hashToken = (token: string) =>
  crypto.createHash("sha256").update(token).digest("hex");
