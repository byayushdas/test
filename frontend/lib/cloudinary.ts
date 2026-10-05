import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "kgfnikzg",
  api_key: process.env.CLOUDINARY_API_KEY || "494649442875528",
  api_secret: process.env.CLOUDINARY_API_SECRET || "2UPcqvsxfOb3wJkcmhnAnCsru1U",
  secure: true,
});

export interface CloudinaryUploadResponse {
  url: string;
  publicId: string;
}

/**
 * Upload image (Base64 data URI or buffer string) directly to Cloudinary
 */
export async function uploadToCloudinary(inputData: string, folder: string): Promise<CloudinaryUploadResponse> {
  return new Promise((resolve, reject) => {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME || "kgfnikzg";
    if (!cloudName) {
      return reject(new Error("CLOUDINARY_CLOUD_NAME is not defined in environment variables."));
    }

    if (!inputData || inputData.trim().length === 0) {
      return reject(new Error("Cannot upload empty image data to Cloudinary."));
    }

    let payload = inputData.trim();
    // Ensure Base64 string is properly formatted as a data URI if raw Base64 was passed
    if (!payload.startsWith("data:image/") && !payload.startsWith("http://") && !payload.startsWith("https://")) {
      payload = `data:image/png;base64,${payload}`;
    }

    console.log(`[CloudinaryService] Uploading image (${payload.length} chars) to folder 'Seed2Shelf/${folder}'...`);

    cloudinary.uploader.upload(
      payload,
      {
        folder: `Seed2Shelf/${folder}`,
        resource_type: "image",
      },
      (error, result) => {
        if (error || !result) {
          console.error("Cloudinary Upload Error:", error);
          return reject(new Error(error?.message || "Cloudinary image upload failed"));
        }
        console.log(`✅ [CloudinaryService] Uploaded asset successfully: ${result.secure_url} (${result.width}x${result.height}, ${result.bytes} bytes)`);
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
        });
      }
    );
  });
}

/**
 * Delete image from Cloudinary by publicId
 */
export async function deleteFromCloudinary(publicId: string): Promise<boolean> {
  if (!publicId) return false;
  try {
    const result = await cloudinary.uploader.destroy(publicId, { resource_type: "image" });
    return result.result === "ok" || result.result === "not found";
  } catch (error: any) {
    console.warn(`Failed to delete '${publicId}' from Cloudinary:`, error?.message || error);
    return false;
  }
}

export default cloudinary;
