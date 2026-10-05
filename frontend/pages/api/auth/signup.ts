import { NextApiRequest, NextApiResponse } from "next";
import dbConnect from "../../../lib/db";
import User from "../../../models/User";
import bcrypt from "bcrypt";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const normalizedEmail = email.trim().toLowerCase();

    await dbConnect();

    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      return res.status(400).json({ message: "User already exists with this email" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    let uniqueId: string | undefined = undefined;
    if (role === "FARMER") {
      const lastUser = await User.findOne({ role: "FARMER", uniqueId: { $ne: null } })
        .sort({ uniqueId: -1 });

      let nextNum = 1;
      if (lastUser && lastUser.uniqueId) {
        const match = lastUser.uniqueId.match(/S2S-FRM-(\d+)/);
        if (match) {
          nextNum = parseInt(match[1]) + 1;
        }
      }
      uniqueId = `S2S-FRM-${String(nextNum).padStart(4, '0')}`;
    } else if (role === "PROCESSOR") {
      const lastUser = await User.findOne({ role: "PROCESSOR", uniqueId: { $ne: null } })
        .sort({ uniqueId: -1 });

      let nextNum = 1;
      if (lastUser && lastUser.uniqueId) {
        const match = lastUser.uniqueId.match(/S2S-PRC-(\d+)/);
        if (match) {
          nextNum = parseInt(match[1]) + 1;
        }
      }
      uniqueId = `S2S-PRC-${String(nextNum).padStart(4, '0')}`;
    } else if (role === "DISTRIBUTOR") {
      const lastUser = await User.findOne({ role: "DISTRIBUTOR", uniqueId: { $ne: null } })
        .sort({ uniqueId: -1 });

      let nextNum = 1;
      if (lastUser && lastUser.uniqueId) {
        const match = lastUser.uniqueId.match(/S2S-DST-(\d+)/);
        if (match) {
          nextNum = parseInt(match[1]) + 1;
        }
      }
      uniqueId = `S2S-DST-${String(nextNum).padStart(4, '0')}`;
    } else if (role === "RETAILER") {
      const lastUser = await User.findOne({ role: "RETAILER", uniqueId: { $ne: null } })
        .sort({ uniqueId: -1 });

      let nextNum = 1;
      if (lastUser && lastUser.uniqueId) {
        const match = lastUser.uniqueId.match(/S2S-RET-(\d+)/);
        if (match) {
          nextNum = parseInt(match[1]) + 1;
        }
      }
      uniqueId = `S2S-RET-${String(nextNum).padStart(4, '0')}`;
    } else if (role === "ADMIN") {
      const lastUser = await User.findOne({ role: "ADMIN", uniqueId: { $ne: null } })
        .sort({ uniqueId: -1 });

      let nextNum = 1;
      if (lastUser && lastUser.uniqueId) {
        const match = lastUser.uniqueId.match(/S2S-ADM-(\d+)/);
        if (match) {
          nextNum = parseInt(match[1]) + 1;
        }
      }
      uniqueId = `S2S-ADM-${String(nextNum).padStart(4, '0')}`;
    }

    const user = await User.create({
      name,
      email: normalizedEmail,
      password: hashedPassword,
      role,
      uniqueId,
      regDate: new Date()
    });

    return res.status(201).json({ message: "User created successfully", userId: user._id });
  } catch (error) {
    console.error("Signup error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}
