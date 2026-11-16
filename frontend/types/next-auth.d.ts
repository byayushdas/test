import NextAuth, { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      walletAddress: string | null;
      farmerId?: string;
      processorId?: string;
      adminId?: string;
    } & DefaultSession["user"]
  }

  interface User {
    role: string;
    walletAddress: string | null;
    farmerId?: string;
    processorId?: string;
    adminId?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    walletAddress: string | null;
    farmerId?: string;
    processorId?: string;
    adminId?: string;
  }
}
