import { Request } from "express";
import cloudinary from "../config/cloudinary";

// Uploads a file buffer (from multer) to Cloudinary
const uploadBufferToCloudinary = (buffer: Buffer): Promise<any> => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream({ folder: "products" }, (error, result) => {
      if (error) reject(error);
      else resolve(result);
    });
    stream.end(buffer);
  });
};

// Accepts either an uploaded file (form-data) or a string in a JSON body:
// an https image URL, or a base64 data URI ("data:image/png;base64,....").
// Returns the Cloudinary result, or null when no image was sent.
export const uploadImage = async (req: Request): Promise<any | null> => {
  if (req.file) {
    return uploadBufferToCloudinary(req.file.buffer);
  }

  const image = req.body?.image;
  if (typeof image === "string" && image.trim()) {
    return cloudinary.uploader.upload(image.trim(), { folder: "products" });
  }

  return null;
};
