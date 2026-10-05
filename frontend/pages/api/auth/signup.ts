import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const BACKEND_URL = process.env.EXPRESS_BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5001";
    
    const backendRes = await fetch(`${BACKEND_URL}/api/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, role })
    });

    const data = await backendRes.json();

    if (!backendRes.ok) {
      return res.status(backendRes.status).json({ message: data.message || "Failed to create user" });
    }

    return res.status(201).json(data);
  } catch (error) {
    console.error("Signup proxy error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}
