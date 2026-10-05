import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcrypt";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "Email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Invalid credentials");
        }

        const normalizedEmail = credentials.email.trim().toLowerCase();

        const BACKEND_URL = process.env.EXPRESS_BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5001";
        const res = await fetch(`${BACKEND_URL}/api/auth/login`, {
          method: 'POST',
          body: JSON.stringify({ email: normalizedEmail, password: credentials.password }),
          headers: { "Content-Type": "application/json" }
        });

        const data = await res.json();

        if (!res.ok || !data.user) {
          throw new Error(data.message || "Invalid credentials");
        }

        const user = data.user;

        let farmerId = user.role === 'FARMER' ? user.uniqueId : undefined;
        let processorId = user.role === 'PROCESSOR' ? user.uniqueId : undefined;
        let distributorId = user.role === 'DISTRIBUTOR' ? user.uniqueId : undefined;
        let retailerId = user.role === 'RETAILER' ? user.uniqueId : undefined;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          farmerId,
          processorId,
          distributorId,
          retailerId,
          walletAddress: user.walletAddress || null,
          image: null
        };
      }
    })
  ],
  pages: {
    signIn: '/',
  },
  session: {
    strategy: "jwt"
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.farmerId = (user as any).farmerId;
        token.processorId = (user as any).processorId;
        token.distributorId = (user as any).distributorId;
        token.retailerId = (user as any).retailerId;
        token.walletAddress = user.walletAddress;
        token.picture = user.image || (user as any).profilePhoto;
      }
      
      // Handle wallet linking or photo updates
      if (trigger === "update" && session?.walletAddress !== undefined) {
        token.walletAddress = session.walletAddress;
      }
      if (trigger === "update" && session?.image !== undefined) {
        token.picture = session.image;
      }

      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        (session.user as any).farmerId = token.farmerId as string | undefined;
        (session.user as any).processorId = token.processorId as string | undefined;
        (session.user as any).distributorId = token.distributorId as string | undefined;
        (session.user as any).retailerId = token.retailerId as string | undefined;
        session.user.walletAddress = token.walletAddress as string | null;
        session.user.image = token.picture as string | null;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      try {
        if (new URL(url).origin === new URL(baseUrl).origin) return url;
      } catch (e) {}
      return baseUrl;
    }
  },
  secret: process.env.NEXTAUTH_SECRET || "supersecret",
};

export default NextAuth(authOptions);
