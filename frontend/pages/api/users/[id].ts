import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";

const EXPRESS_BACKEND_URL = process.env.EXPRESS_BACKEND_URL || "http://localhost:5001";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  const userId = id as string;
  const session = await getServerSession(req, res, authOptions);

  // 1. GET Request: Proxy to Express Backend
  if (req.method === "GET") {
    try {
      const expressRes = await fetch(`${EXPRESS_BACKEND_URL}/api/profile/${userId}`, { cache: "no-store" });
      if (expressRes.ok) {
        const expressData = await expressRes.json();
        const u = expressData.data || {};

        return res.status(200).json({
          ...u,
          id: u._id || userId,
          email: u.email || "",
          role: u.role || "FARMER",
          name: u.name || "",
        });
      }

      return res.status(expressRes.status).json({ message: "User not found" });
    } catch (error) {
      console.error("GET Profile proxy error:", error);
      return res.status(500).json({ message: "Error fetching user profile from Express backend" });
    }
  }

  // 2. PUT Request: Proxy to Express Backend
  if (req.method === "PUT") {
    if (!session) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const expressRes = await fetch(`${EXPRESS_BACKEND_URL}/api/profile/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req.body)
      });

      if (expressRes.ok) {
        const expressData = await expressRes.json();
        const u = expressData.data || {};

        return res.status(200).json({
          ...u,
          id: u._id || userId,
          email: u.email || session.user.email,
          role: u.role || "FARMER",
          name: u.name || req.body.name || "",
        });
      }

      const errData = await expressRes.json().catch(() => ({ message: "Failed to update profile" }));
      return res.status(expressRes.status).json(errData);
    } catch (error) {
      console.error("PUT Profile proxy error:", error);
      return res.status(500).json({ message: `Error updating profile: ${(error as Error).message}` });
    }
  }

  return res.status(405).json({ message: "Method not allowed" });
}
