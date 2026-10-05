import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  return res.status(501).json({ message: "Not Implemented - Database migration in progress" });
}
