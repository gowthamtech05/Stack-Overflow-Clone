import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import multer from "multer";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => ({
    folder: "stackoverflow_clone",
    resource_type: file.mimetype.startsWith("video") ? "video" : "image",
    allowed_formats: ["jpg", "jpeg", "png", "gif", "webp", "mp4", "mov"],
  }),
});

export const upload = multer({ storage });
export default cloudinary;
