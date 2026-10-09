import { HydratedDocument } from "mongoose";
import { IUser } from "../models/user.model";

declare global {
  namespace Express {
    interface Request {
      user?: HydratedDocument<IUser>; // set by the authenticate middleware
      token?: string; // the raw JWT of the current request (needed for logout)
    }
  }
}
