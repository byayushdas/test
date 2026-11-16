import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/router";
import Head from "next/head";
import Link from "next/link";
import { LogIn, Mail, Lock, UserPlus, AlertCircle, ArrowRight, ShieldCheck } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRedirect = (role: string) => {
    const r = role?.toUpperCase();
    switch (r) {
      case 'FARMER': router.push('/farmer/farmerHub/dashboard'); break;
      case 'PROCESSOR': router.push('/processor/processorHub/dashboard'); break;
      case 'ADMIN': router.push('/admin/adminHub/dashboard'); break;
      case 'DISTRIBUTOR': router.push('/distributor/distributorHub/dashboard'); break;
      case 'RETAILER': router.push('/retailer/retailerHub/dashboard'); break;

      default: router.push('/');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await signIn("credentials", {
        redirect: false,
        email: email.trim().toLowerCase(),
        password,
      });

      if (res?.error) {
        setError(res.error || "Invalid email or password credentials.");
        setLoading(false);
      } else {
        // Fetch session to determine role and redirect
        const sessionRes = await fetch("/api/auth/session");
        const sessionData = await sessionRes.json();
        handleRedirect(sessionData?.user?.role);
      }
    } catch (err: any) {
      setError("An unexpected authentication error occurred.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 font-sans flex items-center justify-center p-4 relative overflow-hidden">
      <Head>
        <title>Account Login | Seed2Shelf</title>
      </Head>

      {/* Ambient background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-md bg-stone-900/90 border border-stone-800 rounded-3xl p-8 space-y-6 shadow-2xl backdrop-blur-xl">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto shadow-inner">
            <LogIn className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Welcome Back</h1>
          <p className="text-xs text-stone-400 font-medium">Log in to access your Seed2Shelf ecosystem hub</p>
        </div>

        {error && (
          <div className="p-3.5 bg-red-500/10 border border-red-500/20 rounded-2xl text-xs text-red-400 font-bold flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="space-y-1.5">
            <label className="text-stone-300 font-bold block">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-stone-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-stone-950 border border-stone-800 rounded-2xl pl-10 pr-4 py-3 text-white placeholder-stone-600 focus:outline-none focus:border-emerald-500/50 transition font-medium"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-stone-300 font-bold block">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-stone-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-stone-950 border border-stone-800 rounded-2xl pl-10 pr-4 py-3 text-white placeholder-stone-600 focus:outline-none focus:border-emerald-500/50 transition font-medium"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-extrabold text-xs rounded-2xl transition shadow-lg cursor-pointer flex items-center justify-center gap-2 mt-2"
          >
            <span>{loading ? "Authenticating..." : "Log In to Account"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="pt-2 border-t border-stone-800 text-center text-xs text-stone-400 space-y-2">
          <p>
            Don't have an account?{" "}
            <Link href="/" className="text-emerald-400 font-bold hover:underline">
              Sign Up on Home Page
            </Link>
          </p>
          <div className="flex items-center justify-center gap-1 text-[11px] text-stone-500">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Protected by Blockchain Identity Ledger</span>
          </div>
        </div>

      </div>
    </div>
  );
}
