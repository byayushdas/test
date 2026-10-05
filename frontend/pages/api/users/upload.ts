import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";

const EXPRESS_BACKEND_URL = process.env.EXPRESS_BACKEND_URL || "http://localhost:5001";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "10mb",
    },
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const { file, type } = req.body;

    if (!file || !type) {
      return res.status(400).json({ message: "Missing file or type parameter" });
    }

    const isKycType = type.startsWith("aadhaar") || type.includes("kyc") || type === "pan" || type === "document";
    const section = isKycType ? "kyc" : "profile";
    const userRole = (session?.user?.role || "FARMER").toLowerCase();

    // 1. Convert Base64 payload to FormData buffer for Express upload
    const match = file.match(/^data:image\/(\w+);base64,(.+)$/);
    if (!match) {
      return res.status(400).json({ message: "Invalid image format. Must be base64 data URI." });
    }

    const ext = match[1];
    const base64Data = match[2];
    const fileBuffer = Buffer.from(base64Data, "base64");

    const formData = new FormData();
    const blob = new Blob([fileBuffer], { type: `image/${ext}` });
    formData.append("file", blob, `${type}.${ext}`);
    formData.append("userId", session.user.id);
    formData.append("role", userRole);
    if (isKycType) {
      formData.append("side", type.includes("back") ? "back" : "front");
    }

    const endpoint = isKycType ? "/api/v1/media/upload/kyc" : "/api/v1/media/upload/profile";
    const expressRes = await fetch(`${EXPRESS_BACKEND_URL}${endpoint}`, {
      method: "POST",
      body: formData,
    });

    if (expressRes.ok) {
      const expressData = await expressRes.json();
      return res.status(200).json({
        url: expressData.data?.secure_url || expressData.secure_url,
        publicId: expressData.data?.public_id || expressData.public_id,
      });
    }

    const errorBody = await expressRes.json().catch(() => ({ message: "Express upload failed" }));
    return res.status(expressRes.status).json(errorBody);
  } catch (error) {
    console.error("Upload proxy error:", error);
    return res.status(500).json({ message: "Failed to upload file via Express backend" });
  }
}
