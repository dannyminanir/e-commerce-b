import { Schema, model } from "mongoose";

// Tokens that were logged out. A JWT can't be "cancelled", so we remember it here
// and the authenticate middleware rejects it.
export interface IRevokedToken {
  tokenHash: string;
  expiresAt: Date;
}

const revokedTokenSchema = new Schema<IRevokedToken>({
  tokenHash: { type: String, required: true, unique: true },
  expiresAt: { type: Date, required: true },
});

// MongoDB deletes the record automatically once the token would have expired anyway
revokedTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const RevokedToken = model<IRevokedToken>("RevokedToken", revokedTokenSchema);
