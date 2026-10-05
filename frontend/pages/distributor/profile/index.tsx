import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import Head from "next/head";
import { User, MapPin, ShieldCheck, Camera, CheckCircle2, Star, ExternalLink, Save, X, UserCog, LocateFixed, Truck, Building2, Wallet } from "lucide-react";
import { KYCVerificationStatus, getKycStatusLabel } from "../../../types/kyc";
import MetaMaskWalletConnect from "../../../components/shared/MetaMaskWalletConnect";

export default function DistributorProfilePage() {
  const { data: session, status, update: updateSession } = useSession();
  const router = useRouter();
  const aadhaarFrontInputRef = useRef<HTMLInputElement>(null);
  const aadhaarBackInputRef = useRef<HTMLInputElement>(null);

  const targetUserId = (router.query.id as string) || session?.user?.id;

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const [name, setName] = useState("");
  const [aadhaarNumber, setAadhaarNumber] = useState("");
  const [aadhaarFront, setAadhaarFront] = useState("");
  const [aadhaarFrontPublicId, setAadhaarFrontPublicId] = useState("");
  const [aadhaarBack, setAadhaarBack] = useState("");
  const [aadhaarBackPublicId, setAadhaarBackPublicId] = useState("");

  const [companyName, setCompanyName] = useState("");
  const [location, setLocation] = useState("");
  const [latitude, setLatitude] = useState<number | undefined>();
  const [longitude, setLongitude] = useState<number | undefined>();
  const [storageCapacity, setStorageCapacity] = useState("");
  const [operatingFacilities, setOperatingFacilities] = useState("");
  const [transportFleet, setTransportFleet] = useState("");
  const [isLocating, setIsLocating] = useState(false);

  // Bank Account Details
  const [bankName, setBankName] = useState("");
  const [accountHolderName, setAccountHolderName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [ifscCode, setIfscCode] = useState("");
  const [branchLocation, setBranchLocation] = useState("");

  const [walletAddress, setWalletAddress] = useState("");

  const [kycStatus, setKycStatus] = useState<string>(KYCVerificationStatus.PENDING);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
      return;
    }
    if (targetUserId) {
      fetchProfile(targetUserId);
    } else if (status !== "loading") {
      setLoading(false);
    }
  }, [targetUserId, status]);

  const fetchProfile = async (userId: string) => {
    try {
      const res = await fetch(`/api/users/${userId}`);
      if (res.ok) {
        const data = await res.json();
        setUser(data);
        populateForm(data);
      } else {
        if (session?.user) {
          const fallbackData = {
            id: session.user.id,
            name: session.user.name || "",
            email: session.user.email || "",
            distributorId: (session.user as any)?.distributorId || "",
            role: "DISTRIBUTOR"
          };
          setUser(fallbackData);
          populateForm(fallbackData);
        }
      }
    } catch (err) {
      console.error("Error loading distributor profile", err);
    } finally {
      setLoading(false);
    }
  };

  const populateForm = (data: any) => {
    const kyc = data.kycDetails || {};
    const bank = data.bankDetails || {};
    const dist = data.distributorDetails || {};

    setName(data.name || "");

    setAadhaarNumber(kyc.aadhaarNumber || "");
    setAadhaarFront(kyc.aadhaarFront || "");
    setAadhaarBack(kyc.aadhaarBack || "");
    setKycStatus(kyc.kycStatus || KYCVerificationStatus.PENDING);

    setBankName(bank.bankName || "");
    setAccountHolderName(bank.accountHolderName || "");
    setAccountNumber(bank.accountNumber || "");
    setIfscCode(bank.ifscCode || "");
    setBranchLocation(bank.branchLocation || "");

    setWalletAddress(data.walletAddress || "");

    setCompanyName(dist.companyName || "");
    setLocation(dist.location || "");
    setStorageCapacity(dist.storageCapacity || "");
    setOperatingFacilities(dist.operatingFacilities || "");
    setTransportFleet(dist.transportFleet || "");
  };

  const toBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: "profile" | "aadhaar_front" | "aadhaar_back") => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;
    const file = fileList[0];

    try {
      const base64 = await toBase64(file);
      if (type === "aadhaar_front") {
        setAadhaarFront(base64);
      } else if (type === "aadhaar_back") {
        setAadhaarBack(base64);
      }

      const res = await fetch("/api/users/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ file: base64, type })
      });

      if (res.ok) {
        const data = await res.json();
        if (type === "aadhaar_front") {
          setAadhaarFront(data.url);
          if (data.publicId) setAadhaarFrontPublicId(data.publicId);
        } else if (type === "aadhaar_back") {
          setAadhaarBack(data.url);
          if (data.publicId) setAadhaarBackPublicId(data.publicId);
        }
        setMessage({ type: "success", text: "Image uploaded successfully." });
      }
    } catch (err) {
      setMessage({ type: "success", text: "Image preview loaded." });
    }
  };

  
  const handleDetectGPSLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = parseFloat(position.coords.latitude.toFixed(4));
        const lng = parseFloat(position.coords.longitude.toFixed(4));
        setLatitude(lat);
        setLongitude(lng);
        setLocation(prev => prev.includes("GPS:") ? prev : `${prev} (GPS: ${lat}, ${lng})`);
        setIsLocating(false);
      },
      (error) => {
        setIsLocating(false);
        setLatitude(29.6857);
        setLongitude(76.9905);
        setLocation("Karnal Industrial Zone, Haryana, India (GPS: 29.6857, 76.9905)");
      }
    );
  };

  const handleSave = async () => {
    setMessage({ type: "", text: "" });
    setSaving(true);
    try {
      if (targetUserId) {
        const payload = {
          name,
          kycDetails: {
            aadhaarNumber,
            aadhaarFront,
            aadhaarFrontPublicId,
            aadhaarBack,
            aadhaarBackPublicId,
            submitKyc: true,
          },
          distributorDetails: {
            companyName,
            location,
            latitude,
            longitude,
            storageCapacity,
            operatingFacilities,
            transportFleet,
          },
          bankDetails: {
            bankName,
            accountHolderName,
            accountNumber,
            ifscCode,
            branchLocation,
          },
          walletAddress
        };

        console.log(`🟢 [DistributorProfile:handleSave] Sending PUT request to /api/users/${targetUserId} with payload:`, payload);

        const res = await fetch(`/api/users/${targetUserId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        console.log(`🟢 [DistributorProfile:handleSave] Response HTTP Status: ${res.status}`);

        if (res.ok) {
          const updated = await res.json();
          console.log("🟢 [DistributorProfile:handleSave] Response Payload Received:", updated);
          setUser(updated);
          populateForm(updated);
        } else {
          const errorData = await res.json().catch(() => ({}));
          console.error("❌ [DistributorProfile:handleSave] Error Response Received:", errorData);
          throw new Error(errorData.message || `Save failed with status ${res.status}`);
        }
      }
      setEditMode(false);
      window.dispatchEvent(new CustomEvent("profileUpdated", { detail: {} }));
      setMessage({ type: "success", text: "Profile information & KYC documents saved successfully!" });
    } catch (err) {
      console.error("❌ [DistributorProfile:handleSave] Network or runtime error:", err);
      setMessage({ type: "error", text: `Failed to save profile: ${(err as Error).message || "Unknown error"}` });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (user) populateForm(user);
    setEditMode(false);
    setMessage({ type: "", text: "" });
  };

  const handleKycSubmit = async () => {
    if (!aadhaarNumber || !aadhaarFront || !aadhaarBack) {
      setMessage({ type: "error", text: "Please provide Aadhaar number, front image, and back image for verification." });
      return;
    }
    await handleSave();
    setKycStatus(KYCVerificationStatus.PENDING);
    setMessage({ type: "success", text: "KYC Aadhaar verification documents submitted for Admin review." });
  };

  if (loading || status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#00d26a] border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-bold text-stone-400">Loading Profile...</span>
        </div>
      </div>
    );
  }

  const distributorId = user?.distributorId || (session?.user as any)?.distributorId || "S2S-DST-0001";
  const currentKycStatus = kycStatus || KYCVerificationStatus.PENDING;
  const hasRealRating = user && (user.averageRating !== undefined && user.averageRating !== null && user.reviewCount);

  return (
    <div className="min-h-screen relative text-white pt-6 pb-20 z-20">
      {/* Solid Dark Background Overlay (Matching Wallet Style) */}

      <Head>
        <title>{name || "Distributor Profile"} | Seed2Shelf</title>
      </Head>

      <div className="relative z-10 max-w-4xl mx-auto px-6 py-8 space-y-8">
        
        {message.text && (
          <div className={`p-4 rounded-2xl border text-sm font-bold flex items-center gap-2 ${
            message.type === "success" 
              ? "bg-[#00d26a]/10 border-[#00d26a]/20 text-[#00d26a]" 
              : "bg-red-500/10 border-red-500/20 text-red-400"
          }`}>
            <CheckCircle2 className="w-5 h-5" />
            <span>{message.text}</span>
          </div>
        )}

        {/* 1. Profile Header Section */}
        <div className="matte-glass p-8 md:p-10 rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden group">
          <div className="absolute right-0 top-0 w-80 h-80 bg-green-500/5 rounded-full blur-3xl"></div>

          <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
            
            <div className="flex flex-col md:flex-row items-center gap-6">
              
              {/* Photo & Badge */}
              <div className="flex flex-col items-center shrink-0">
                <div className="relative w-28 h-28 rounded-full border-2 border-[#00d26a]/40 overflow-hidden bg-gradient-to-br from-[#0d2a1a] to-[#081a10] flex items-center justify-center shadow-lg">
                  <span className="text-4xl font-black text-[#00d26a]">{name ? name[0].toUpperCase() : "F"}</span>
                </div>

                {/* Reviews Pill Badge */}
                {hasRealRating ? (
                  <div className="pt-2 flex items-center gap-1.5 bg-[#121413] border border-white/10 px-3 py-1 rounded-full text-center mt-2">
                    <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                    <span className="text-xs font-bold text-[#00d26a]">{user.averageRating}</span>
                    <span className="text-[10px] text-stone-400 font-medium">({user.reviewCount})</span>
                  </div>
                ) : (
                  <span className="bg-[#121413] border border-white/10 text-stone-400 text-[11px] italic font-medium px-3.5 py-1 rounded-full text-center mt-2.5 inline-block">
                    No reviews yet
                  </span>
                )}
              </div>

              {/* Title & Metadata */}
              <div className="text-center md:text-left space-y-2">
                <div className="flex items-center justify-center md:justify-start gap-2.5 flex-wrap">
                  <h1 className="text-3xl font-black text-white">{name || "Distributor User"}</h1>
                  {(currentKycStatus === "Verified" || currentKycStatus === "Approved") && (
                    <span className="flex items-center gap-1 bg-[#00d26a]/15 text-[#00d26a] border border-[#00d26a]/20 text-[10px] font-black uppercase px-2.5 py-1 rounded-full">
                      <CheckCircle2 className="w-3 h-3" />
                      Verified Distributor
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-center md:justify-start gap-3">
                  <span className="text-xs font-black uppercase tracking-wider text-[#00d26a]">Distributor</span>
                  <span className="text-stone-500">•</span>
                  <span className="font-mono text-xs font-extrabold text-white bg-stone-900 border border-white/10 px-3 py-1 rounded-lg">
                    ID: {distributorId}
                  </span>
                </div>
              </div>

            </div>

            {/* Controls: Edit Profile / Save / Cancel */}
            <div className="shrink-0">
              {editMode ? (
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="flex items-center gap-1.5 bg-white/5 hover:bg-white/10 text-stone-300 border border-white/10 px-4 py-2.5 rounded-xl font-bold text-xs transition cursor-pointer"
                  >
                    <X className="w-4 h-4" /> Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-1.5 bg-[#00d26a] hover:bg-[#00b25a] text-black font-extrabold px-5 py-2.5 rounded-xl text-xs transition shadow-lg shadow-[#00d26a]/20 cursor-pointer disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" /> {saving ? "Saving..." : "Save"}
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setEditMode(true)}
                  className="px-4 py-2.5 rounded-xl bg-[#00d26a]/10 hover:bg-[#00d26a]/20 border border-[#00d26a]/30 text-[#00d26a] font-bold text-xs transition flex items-center gap-2 cursor-pointer shadow-sm"
                >
                  <UserCog className="w-4 h-4 text-[#00d26a]" />
                  <span>Edit Profile</span>
                </button>
              )}
            </div>

          </div>
        </div>

        {/* 2. Public Identity Section */}
        <div className="matte-glass p-8 rounded-3xl border border-white/10 shadow-2xl space-y-6">
          <h2 className="text-lg font-bold text-green-300 flex items-center gap-2">
            <User className="w-5 h-5 text-[#00d26a]" />
            Public Identity
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div>
              <label className="text-xs text-stone-400 font-bold uppercase block mb-2">Name</label>
              {editMode ? (
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00d26a] transition"
                />
              ) : (
                <div className="p-4 bg-white/5 rounded-2xl border border-white/5 font-semibold text-white">
                  {name || "N/A"}
                </div>
              )}
            </div>

            <div>
              <label className="text-xs text-stone-400 font-bold uppercase block mb-2">Role ID (Unique ID)</label>
              <div className="p-4 bg-white/5 rounded-2xl border border-white/5 font-bold text-[#00d26a]">
                {distributorId}
              </div>
            </div>
          </div>
        </div>

        {/* 4. KYC Verification Section (Aadhaar Only) */}
        <div className="matte-glass p-8 rounded-3xl border border-white/10 shadow-2xl space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-green-300 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#00d26a]" />
              KYC Verification (Aadhaar Only)
            </h2>
            <span className={`text-xs px-3 py-1.5 rounded-full font-black border uppercase tracking-wider ${
              currentKycStatus && (currentKycStatus.toUpperCase().includes("VERIFIED") || currentKycStatus.toUpperCase().includes("APPROVED"))
                ? "bg-[#00d26a]/15 text-[#00d26a] border-[#00d26a]/20"
                : currentKycStatus && currentKycStatus.toUpperCase().includes("REJECT")
                ? "bg-red-500/15 text-red-400 border-red-500/20"
                : currentKycStatus && (currentKycStatus.toUpperCase().includes("RE_UPLOAD") || currentKycStatus.toUpperCase().includes("RE-UPLOAD"))
                ? "bg-amber-500/15 text-amber-400 border-amber-500/20"
                : "bg-yellow-500/15 text-yellow-400 border-yellow-500/20"
            }`}>
              {getKycStatusLabel(currentKycStatus)}
            </span>
          </div>

          <div className="space-y-6">
            <div>
              <label className="text-xs text-stone-400 font-bold uppercase block mb-2">12-Digit Aadhaar Number</label>
              {editMode ? (
                <input
                  type="text"
                  value={aadhaarNumber}
                  onChange={(e) => setAadhaarNumber(e.target.value)}
                  placeholder="e.g. 1234 5678 9012"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00d26a] transition"
                />
              ) : (
                <div className="p-4 bg-white/5 rounded-2xl border border-white/5 font-bold text-white">
                  {aadhaarNumber || "Not Provided"}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Aadhaar Front */}
              <div className="p-5 bg-white/5 border border-white/5 rounded-2xl space-y-3">
                <span className="text-xs font-bold text-stone-300 block">Upload Aadhaar Front</span>
                {aadhaarFront ? (
                  <div className="relative group rounded-xl overflow-hidden border border-white/10 h-36 bg-black">
                    <img src={aadhaarFront} alt="Aadhaar Front" className="w-full h-full object-cover" />
                    <a
                      href={aadhaarFront}
                      target="_blank"
                      rel="noreferrer"
                      className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2 text-xs font-bold text-white"
                    >
                      <ExternalLink className="w-4 h-4 text-[#00d26a]" /> Preview
                    </a>
                  </div>
                ) : (
                  <div className="h-36 border-2 border-dashed border-white/10 rounded-xl flex items-center justify-center text-xs text-stone-500 font-medium">
                    No Document Uploaded
                  </div>
                )}
                {editMode && (
                  <button
                    type="button"
                    onClick={() => aadhaarFrontInputRef.current?.click()}
                    className="w-full py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold text-[#00d26a] transition cursor-pointer"
                  >
                    Select Front Image
                  </button>
                )}
                <input
                  type="file"
                  ref={aadhaarFrontInputRef}
                  onChange={(e) => handleFileUpload(e, "aadhaar_front")}
                  accept="image/*"
                  className="hidden"
                />
              </div>

              {/* Aadhaar Back */}
              <div className="p-5 bg-white/5 border border-white/5 rounded-2xl space-y-3">
                <span className="text-xs font-bold text-stone-300 block">Upload Aadhaar Back</span>
                {aadhaarBack ? (
                  <div className="relative group rounded-xl overflow-hidden border border-white/10 h-36 bg-black">
                    <img src={aadhaarBack} alt="Aadhaar Back" className="w-full h-full object-cover" />
                    <a
                      href={aadhaarBack}
                      target="_blank"
                      rel="noreferrer"
                      className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2 text-xs font-bold text-white"
                    >
                      <ExternalLink className="w-4 h-4 text-[#00d26a]" /> Preview
                    </a>
                  </div>
                ) : (
                  <div className="h-36 border-2 border-dashed border-white/10 rounded-xl flex items-center justify-center text-xs text-stone-500 font-medium">
                    No Document Uploaded
                  </div>
                )}
                {editMode && (
                  <button
                    type="button"
                    onClick={() => aadhaarBackInputRef.current?.click()}
                    className="w-full py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold text-[#00d26a] transition cursor-pointer"
                  >
                    Select Back Image
                  </button>
                )}
                <input
                  type="file"
                  ref={aadhaarBackInputRef}
                  onChange={(e) => handleFileUpload(e, "aadhaar_back")}
                  accept="image/*"
                  className="hidden"
                />
              </div>

            </div>

            {editMode && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleKycSubmit}
                  className="w-full py-3 rounded-xl bg-[#00d26a] hover:bg-[#00b25a] text-black font-extrabold text-xs transition shadow-lg shadow-[#00d26a]/20 cursor-pointer"
                >
                  Submit for Verification
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 4.5. Bank Account Details */}
        <div className="matte-glass p-8 rounded-3xl border border-white/10 shadow-2xl space-y-6">
          <h2 className="text-lg font-bold text-green-300 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-[#00d26a]" />
            Bank Account Details
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div>
              <label className="text-xs text-stone-400 font-bold uppercase block mb-2">Bank Name</label>
              {editMode ? (
                <input
                  type="text"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder="e.g. State Bank of India"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00d26a] transition"
                />
              ) : (
                <div className="p-4 bg-white/5 rounded-2xl border border-white/5 font-semibold text-white">
                  {bankName || "Not Provided"}
                </div>
              )}
            </div>

            <div>
              <label className="text-xs text-stone-400 font-bold uppercase block mb-2">Account Holder Name</label>
              {editMode ? (
                <input
                  type="text"
                  value={accountHolderName}
                  onChange={(e) => setAccountHolderName(e.target.value)}
                  placeholder="e.g. Arpan Ghosh"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00d26a] transition"
                />
              ) : (
                <div className="p-4 bg-white/5 rounded-2xl border border-white/5 font-semibold text-white">
                  {accountHolderName || "Not Provided"}
                </div>
              )}
            </div>

            <div>
              <label className="text-xs text-stone-400 font-bold uppercase block mb-2">Account Number</label>
              {editMode ? (
                <input
                  type="text"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="e.g. 98765432104829"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00d26a] transition font-mono"
                />
              ) : (
                <div className="p-4 bg-white/5 rounded-2xl border border-white/5 font-semibold text-white font-mono">
                  {accountNumber ? `•••• •••• ${accountNumber.slice(-4)}` : "Not Provided"}
                </div>
              )}
            </div>

            <div>
              <label className="text-xs text-stone-400 font-bold uppercase block mb-2">IFSC Code</label>
              {editMode ? (
                <input
                  type="text"
                  value={ifscCode}
                  onChange={(e) => setIfscCode(e.target.value)}
                  placeholder="e.g. SBIN0001234"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00d26a] transition font-mono uppercase"
                />
              ) : (
                <div className="p-4 bg-white/5 rounded-2xl border border-white/5 font-semibold text-white font-mono uppercase">
                  {ifscCode || "Not Provided"}
                </div>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="text-xs text-stone-400 font-bold uppercase block mb-2">Branch Location</label>
              {editMode ? (
                <input
                  type="text"
                  value={branchLocation}
                  onChange={(e) => setBranchLocation(e.target.value)}
                  placeholder="e.g. Karnal Main Branch, Haryana"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00d26a] transition"
                />
              ) : (
                <div className="p-4 bg-white/5 rounded-2xl border border-white/5 font-semibold text-white">
                  {branchLocation || "Not Provided"}
                </div>
              )}
            </div>
          </div>
        </div>

        
        {/* 4.6. Connect MetaMask Wallet */}
        <MetaMaskWalletConnect
          initialWalletAddress={walletAddress}
          onWalletConnected={(addr) => setWalletAddress(addr)}
          onWalletDisconnected={() => setWalletAddress("")}
        />

        {/* 5. Registered Distributor Record Section */}
        <div className="matte-glass p-8 rounded-3xl border border-white/10 shadow-2xl space-y-6">
          <h2 className="text-lg font-bold text-green-300 flex items-center gap-2">
            <Truck className="w-5 h-5 text-[#00d26a]" />
            Registered Distributor Record
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div>
              <label className="text-xs text-stone-400 font-bold uppercase block mb-2">Company Name</label>
              {editMode ? (
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Enter company name"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00d26a] transition"
                />
              ) : (
                <div className="p-4 bg-white/5 rounded-2xl border border-white/5 font-semibold text-white">
                  {companyName || "Not Registered"}
                </div>
              )}
            </div>

            <div>
              <label className="text-xs text-stone-400 font-bold uppercase block mb-2">Location</label>
              {editMode ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Enter location"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00d26a] transition"
                  />
                  <button
                    type="button"
                    onClick={handleDetectGPSLocation}
                    disabled={isLocating}
                    className="shrink-0 px-4 py-3 bg-[#00d26a]/10 hover:bg-[#00d26a]/20 border border-[#00d26a]/30 text-[#00d26a] rounded-xl font-bold flex items-center gap-2 transition disabled:opacity-50"
                  >
                    <LocateFixed className="w-4 h-4" />
                    {isLocating ? "Locating..." : "Current Location"}
                  </button>
                </div>
              ) : (
                <div className="p-4 bg-white/5 rounded-2xl border border-white/5 font-semibold text-white">
                  {location || "Not Registered"}
                </div>
              )}
            </div>

            <div>
              <label className="text-xs text-stone-400 font-bold uppercase block mb-2">Storage Capacity</label>
              {editMode ? (
                <input
                  type="text"
                  value={storageCapacity}
                  onChange={(e) => setStorageCapacity(e.target.value)}
                  placeholder="e.g. 5000 sq ft"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00d26a] transition"
                />
              ) : (
                <div className="p-4 bg-white/5 rounded-2xl border border-white/5 font-semibold text-white">
                  {storageCapacity || "Not Registered"}
                </div>
              )}
            </div>

            <div>
              <label className="text-xs text-stone-400 font-bold uppercase block mb-2">Operating Facilities</label>
              {editMode ? (
                <input
                  type="text"
                  value={operatingFacilities}
                  onChange={(e) => setOperatingFacilities(e.target.value)}
                  placeholder="e.g. 3 Warehouses"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00d26a] transition"
                />
              ) : (
                <div className="p-4 bg-white/5 rounded-2xl border border-white/5 font-semibold text-white">
                  {operatingFacilities || "Not Registered"}
                </div>
              )}
            </div>

            <div>
              <label className="text-xs text-stone-400 font-bold uppercase block mb-2">Transport Fleet</label>
              {editMode ? (
                <input
                  type="text"
                  value={transportFleet}
                  onChange={(e) => setTransportFleet(e.target.value)}
                  placeholder="e.g. 15 Trucks"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00d26a] transition"
                />
              ) : (
                <div className="p-4 bg-white/5 rounded-2xl border border-white/5 font-semibold text-white">
                  {transportFleet || "Not Registered"}
                </div>
              )}
            </div>
          </div>
        </div>

        

        {/* 6. Ratings & Reviews Section */}
        <div className="matte-glass p-8 rounded-3xl border border-white/10 shadow-2xl space-y-6">
          <div className="flex items-center gap-2">
            <Star className="w-5 h-5 text-[#00d26a] fill-[#00d26a]" />
            <h2 className="text-lg font-bold text-white">Ratings & Reviews</h2>
          </div>

          <div className="flex flex-col md:flex-row items-start justify-between gap-8 pt-2">
            <div className="space-y-2">
              <h3 className="font-bold text-white text-sm">User Reviews</h3>
              <p className="text-stone-400 text-xs italic">
                {hasRealRating ? `${user.reviewCount} reviews received` : "No reviews received yet."}
              </p>
            </div>

            <div className="p-5 bg-white/5 border border-white/10 rounded-2xl max-w-sm text-stone-300 text-xs leading-relaxed font-medium text-center md:text-left">
              You cannot review your own profile. Your average rating is calculated based on reviews from processors.
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
