import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/router";
import { motion, AnimatePresence } from "framer-motion";
import { X, UserPlus, LogIn, Mail, Lock, User, Shield, AlertCircle, ArrowRight, Eye, EyeOff } from "lucide-react";
import loginHero from "@/assets/images/auth/login-hero.jpg";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialModeIsSignUp?: boolean;
}

export default function AuthModal({ isOpen, onClose, initialModeIsSignUp = false }: AuthModalProps) {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(initialModeIsSignUp);
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "FARMER",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const switchMode = (isSignUpMode: boolean) => {
    setIsSignUp(isSignUpMode);
    setFormData({ name: "", email: "", password: "", confirmPassword: "", role: "FARMER" });
    setError("");
    setShowPassword(false);
  };

  // Force clean empty state when modal opens or switches tabs
  useEffect(() => {
    switchMode(initialModeIsSignUp);
  }, [initialModeIsSignUp, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRedirect = (role: string) => {
    const r = role?.toUpperCase();
    switch (r) {
      case 'FARMER': router.push('/farmer/farmerHub/dashboard'); break;
      case 'PROCESSOR': router.push('/processor/processorHub/dashboard'); break;
      case 'DISTRIBUTOR': router.push('/distributor/distributorHub/dashboard'); break;
      case 'RETAILER': router.push('/retailer/retailerHub/dashboard'); break;

      default: router.push('/');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (isSignUp && formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      if (isSignUp) {
        // Signup
        const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5001";
        const res = await fetch(`${BACKEND_URL}/api/auth/signup`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formData.name,
            email: formData.email.trim().toLowerCase(),
            password: formData.password,
            role: formData.role
          })
        }).catch(() => null);

        if (!res) {
          throw new Error("Server Issue Detected. Try Again Later.");
        }

        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data.message || "Server Issue Detected. Try Again Later.");
        }
      }

      // Login
      const res = await signIn("credentials", {
        redirect: false,
        email: formData.email.trim().toLowerCase(),
        password: formData.password
      });

      if (res?.error) {
        if (res.error.toLowerCase().includes("fetch") || res.error.toLowerCase().includes("network")) {
          throw new Error("Server Issue Detected. Try Again Later.");
        }
        throw new Error(isSignUp ? "Signed up successfully, but failed to log in automatically." : (res.error || "Failed to login"));
      }
      
      const sessionRes = await fetch("/api/auth/session").catch(() => null);
      if (!sessionRes) throw new Error("Server Issue Detected. Try Again Later.");
      
      const sessionData = await sessionRes.json().catch(() => ({}));
      onClose();
      handleRedirect(sessionData?.user?.role);
    } catch (err: any) {
      const msg = err.message || "Server Issue Detected. Try Again Later.";
      setError(msg.toLowerCase().includes("fetch") || msg.toLowerCase().includes("network") || msg.toLowerCase().includes("failed to fetch") ? "Server Issue Detected. Try Again Later." : msg);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 overflow-y-auto">
        {/* Dark Glass Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/85 backdrop-blur-md"
        />

        {/* Auth Modal Container: Split Screen Layout */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="relative z-10 w-full max-w-4xl bg-[#0d0f0e]/95 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl text-white overflow-hidden my-auto"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch min-h-[540px]">
            
            {/* Left Column: Authentication Form (~55% width on desktop) */}
            <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between">
              
              <div>
                {/* Header Row with Title & Close Icon Button */}
                <div className="flex justify-between items-start mb-5">
                  <div>
                    <h2 className="text-2xl font-black tracking-tight text-white">
                      {isSignUp ? "Create Your Account" : "Welcome Back"}
                    </h2>
                    <p className="text-xs text-stone-400 font-medium leading-relaxed mt-1">
                      {isSignUp 
                        ? "Register to join the Seed2Shelf supply chain network." 
                        : "Log in to access your dashboard and ecosystem tools."}
                    </p>
                  </div>

                  <button 
                    onClick={onClose}
                    className="text-stone-400 hover:text-white p-2 rounded-full bg-white/5 hover:bg-white/10 transition cursor-pointer shrink-0 ml-3 lg:hidden"
                    title="Close"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Segmented Control Container */}
                <div className="bg-black/60 p-1.5 rounded-2xl border border-white/10 relative flex items-center mb-5 text-xs font-bold select-none">
                  {/* Sliding Green Active Pill Background */}
                  <motion.div
                    className="absolute top-1.5 bottom-1.5 rounded-xl bg-[#00d26a] shadow-md shadow-[#00d26a]/20"
                    initial={false}
                    animate={{
                      left: isSignUp ? "50%" : "6px",
                      width: "calc(50% - 9px)"
                    }}
                    transition={{ type: "spring", stiffness: 400, damping: 35 }}
                  />

                  <button
                    type="button"
                    onClick={() => switchMode(false)}
                    className={`flex-1 py-2.5 rounded-xl transition-colors duration-200 z-10 flex items-center justify-center gap-2 cursor-pointer ${
                      !isSignUp ? "text-black font-extrabold" : "text-stone-400 hover:text-white font-medium"
                    }`}
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>Log In</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => switchMode(true)}
                    className={`flex-1 py-2.5 rounded-xl transition-colors duration-200 z-10 flex items-center justify-center gap-2 cursor-pointer ${
                      isSignUp ? "text-black font-extrabold" : "text-stone-400 hover:text-white font-medium"
                    }`}
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Sign Up</span>
                  </button>
                </div>

                {/* Error Banner */}
                {error && (
                  <div className="p-3 mb-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs font-bold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Form Fields - Clean Inputs with Dummy Fields to prevent unwanted browser pre-fill */}
                <form onSubmit={handleSubmit} autoComplete="off" className="space-y-3.5">
                  
                  {/* Dummy hidden inputs to trap aggressive browser autofill */}
                  <input type="text" style={{ display: 'none' }} tabIndex={-1} />
                  <input type="password" style={{ display: 'none' }} tabIndex={-1} />

                  <AnimatePresence>
                    {isSignUp && (
                      <motion.div
                        initial={{ opacity: 0, height: 0, overflow: 'hidden' }}
                        animate={{ opacity: 1, height: 'auto', overflow: 'visible' }}
                        exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
                        transition={{ duration: 0.2 }}
                      >
                        <label className="block text-[11px] font-bold text-stone-400 uppercase tracking-wider mb-1">Full Name</label>
                        <div className="relative mb-3.5">
                          <User className="absolute left-3.5 top-3.5 w-4 h-4 text-stone-500" />
                          <input 
                            type="text" 
                            name="name" 
                            value={formData.name || ""} 
                            onChange={handleChange} 
                            required={isSignUp}
                            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-[#00d26a] focus:ring-1 focus:ring-[#00d26a]/50 transition" 
                            placeholder="John Doe" 
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div>
                    <label className="block text-[11px] font-bold text-stone-400 uppercase tracking-wider mb-1">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-stone-500" />
                      <input 
                        type="email" 
                        name="email" 
                        value={formData.email} 
                        onChange={handleChange} 
                        required 
                        autoComplete="new-password"
                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-[#00d26a] focus:ring-1 focus:ring-[#00d26a]/50 transition" 
                        placeholder="name@example.com" 
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-stone-400 uppercase tracking-wider mb-1">
                      {isSignUp ? "Create Password" : "Password"}
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-stone-500" />
                      <input 
                        type={showPassword ? "text" : "password"} 
                        name="password" 
                        value={formData.password} 
                        onChange={handleChange} 
                        required 
                        autoComplete="new-password"
                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-10 py-2.5 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-[#00d26a] focus:ring-1 focus:ring-[#00d26a]/50 transition" 
                        placeholder="••••••••" 
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-2.5 p-1 text-stone-500 hover:text-stone-300 transition cursor-pointer focus:outline-none"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <AnimatePresence>
                    {isSignUp && (
                      <motion.div
                        initial={{ opacity: 0, height: 0, overflow: 'hidden' }}
                        animate={{ opacity: 1, height: 'auto', overflow: 'visible' }}
                        exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
                        transition={{ duration: 0.2 }}
                      >
                        <label className="block text-[11px] font-bold text-stone-400 uppercase tracking-wider mb-1">Confirm Password</label>
                        <div className="relative">
                          <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-stone-500" />
                          <input 
                            type={showPassword ? "text" : "password"} 
                            name="confirmPassword" 
                            value={formData.confirmPassword} 
                            onChange={handleChange} 
                            required={isSignUp}
                            autoComplete="new-password"
                            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-10 py-2.5 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-[#00d26a] focus:ring-1 focus:ring-[#00d26a]/50 transition" 
                            placeholder="••••••••" 
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {isSignUp && (
                    <div>
                      <label className="block text-[11px] font-bold text-stone-400 uppercase tracking-wider mb-1">Ecosystem Role</label>
                      <div className="relative">
                        <Shield className="absolute left-3.5 top-3.5 w-4 h-4 text-stone-500" />
                        <select 
                          name="role" 
                          value={formData.role} 
                          onChange={handleChange} 
                          className="w-full bg-[#181a19] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#00d26a] focus:ring-1 focus:ring-[#00d26a]/50 transition [&>option]:bg-stone-900"
                        >
                          <option value="FARMER">Farmer</option>
                          <option value="PROCESSOR">Processor</option>
                          <option value="DISTRIBUTOR">Distributor</option>
                          <option value="RETAILER">Retailer</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {/* Primary Submit Button */}
                  <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full bg-[#00d26a] hover:bg-[#00b25a] disabled:opacity-50 text-black font-extrabold py-3 rounded-xl transition-all duration-200 shadow-lg shadow-[#00d26a]/20 hover:shadow-[#00d26a]/30 text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer mt-3 hover:scale-[1.01] active:scale-[0.99]"
                  >
                    <span>{loading ? "Processing..." : isSignUp ? "Create Account" : "Sign In to Portal"}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              </div>

              {/* Footer Auth Switch Text */}
              <div className="mt-5 text-center text-xs text-stone-400 border-t border-white/5 pt-3">
                {isSignUp ? "Already have an account?" : "Don't have an account yet?"}{" "}
                <button 
                  type="button"
                  onClick={() => switchMode(!isSignUp)} 
                  className="text-[#00d26a] font-bold hover:underline cursor-pointer ml-1"
                >
                  {isSignUp ? "Log In" : "Sign Up"}
                </button>
              </div>
            </div>

            {/* Right Column: Hero Image (~45% width on desktop, hidden on mobile, completely clean without text overlay) */}
            <div className="hidden lg:block lg:col-span-5 relative p-3">
              <div className="relative w-full h-full min-h-[460px] rounded-[24px] overflow-hidden shadow-2xl group border border-white/10">
                
                <img 
                  src={loginHero.src} 
                  alt="Agriculture Landscape" 
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />

                {/* Subtle Edge Vignette */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-black/20 pointer-events-none" />

                {/* Desktop Close Icon Button */}
                <button 
                  onClick={onClose}
                  className="absolute top-4 right-4 text-stone-300 hover:text-white p-2 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md border border-white/20 transition cursor-pointer z-20"
                  title="Close"
                >
                  <X className="w-4 h-4" />
                </button>

              </div>
            </div>

          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
