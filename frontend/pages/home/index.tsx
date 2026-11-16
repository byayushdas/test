import Head from "next/head";
import { useState, useRef } from "react";
import AuthModal from "@/components/common/Modal/AuthModal";
import Navbar from "@/components/common/Navbar/Navbar";
import { useSession } from "next-auth/react";
import Link from "next/link";
import type { ReactElement } from "react";

export default function Home() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const featuresRef = useRef<HTMLDivElement>(null);

  const { data: session } = useSession();
  const userRole = session?.user?.role;

  const getDashboardPath = (role?: string) => {
    switch (role) {
      case "FARMER": return "/farmer/farmerHub/dashboard";
      case "PROCESSOR": return "/processor/processorHub/dashboard";
      case "ADMIN": return "/admin/adminHub/dashboard";
      case "DISTRIBUTOR": return "/distributor";
      case "RETAILER": return "/retailer";
      default: return null;
    }
  };

  const dashboardPath = getDashboardPath(userRole);

  const scrollToFeatures = () => {
    featuresRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <>
      {/* Global Background Video */}
      <video
        autoPlay
        loop
        muted
        playsInline
        style={{
          position: "fixed",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          zIndex: -1,
        }}
        src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260319_015952_e1deeb12-8fb7-4071-a42a-60779fc64ab6.mp4"
      />
      <div
        className="no-scrollbar"
        style={{
          scrollSnapType: "y mandatory",
          height: "100vh",
          overflowY: "scroll",
          overflowX: "hidden",
          position: "relative",
        }}
      >
      <Head>
        <title>Seed2Shelf | Home</title>
        <meta
          name="description"
          content="Track every handoff from farmer to retailer with immutable blockchain records, automated payment protection, and QR-powered transparency."
        />
        <style>{`
          html, body {
            overflow: hidden !important;
          }
          .no-scrollbar::-webkit-scrollbar {
            display: none !important;
            width: 0 !important;
            height: 0 !important;
          }
          .no-scrollbar {
            -ms-overflow-style: none !important;
            scrollbar-width: none !important;
          }
        `}</style>
      </Head>

      {/* Global Navbar Overlay */}
      <Navbar />

      {/* Authentication Modal */}
      <AuthModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialModeIsSignUp={isSignUp}
      />

      {/* ========== HERO SECTION (Page 1) ========== */}
      <section
        style={{
          scrollSnapAlign: "start",
          position: "relative",
          width: "100%",
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Hero Content */}
        <div
          style={{
            position: "relative",
            zIndex: 10,
            textAlign: "center",
            padding: "0 24px",
            maxWidth: "720px",
          }}
        >
          <h1
            style={{
              fontFamily: "'Instrument Serif', serif",
              fontSize: "clamp(2.5rem, 5.5vw, 4.5rem)",
              fontWeight: 400,
              lineHeight: 1.1,
              color: "#1a1a1a",
              marginBottom: "1.5rem",
              letterSpacing: "-0.02em",
            }}
          >
            Building a More{" "}
            <em style={{ fontStyle: "italic" }}>Transparent</em> Food
            <br />
            Supply
          </h1>



          <div style={{ display: "flex", gap: "16px", justifyContent: "center", alignItems: "center" }}>
            <button
              id="explore-platform-btn"
              onClick={scrollToFeatures}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "14px 36px",
                borderRadius: "9999px",
                background: "#1c1c1c",
                color: "#fff",
                fontFamily: "'Inter', sans-serif",
                fontSize: "1rem",
                fontWeight: 500,
                letterSpacing: "0.01em",
                border: "none",
                cursor: "pointer",
                transition: "transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease",
                boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLButtonElement;
                el.style.transform = "translateY(-2px)";
                el.style.boxShadow = "0 8px 30px rgba(0,0,0,0.45)";
                el.style.background = "#333";
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLButtonElement;
                el.style.transform = "translateY(0)";
                el.style.boxShadow = "0 4px 20px rgba(0,0,0,0.3)";
                el.style.background = "#1c1c1c";
              }}
            >
              Explore Platform
            </button>

            {dashboardPath && (
              <Link
                href={dashboardPath}
                className="bg-white/30 backdrop-blur-lg border border-white/40 text-black font-bold tracking-wide rounded-full hover:bg-white/40 hover:scale-[1.02] transition-all duration-300 shadow-xl shadow-black/10 flex items-center justify-center"
                style={{ padding: "14px 36px", fontSize: "1rem" }}
              >
                Dashboard
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* ========== FEATURES SECTION (Page 2) ========== */}
      <section
        ref={featuresRef}
        style={{
          scrollSnapAlign: "start",
          position: "relative",
          width: "100%",
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "flex-start",
          overflow: "hidden",
          paddingTop: "96px",
          paddingBottom: "60px",
        }}
      >
        {/* Content */}
        <div
          style={{
            position: "relative",
            zIndex: 10,
            width: "100%",
            maxWidth: "1100px",
            padding: "0 32px",
          }}
        >
          {/* Features Title */}
          <h2
            style={{
              fontFamily: "'Instrument Serif', serif",
              fontSize: "clamp(2rem, 4vw, 3rem)",
              fontWeight: 400,
              textAlign: "center",
              color: "#1a1a1a",
              marginBottom: "2.5rem",
              letterSpacing: "-0.01em",
            }}
          >
            Features
          </h2>

          {/* Feature Cards */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "32px",
              marginBottom: "64px",
            }}
          >
            {[
              {
                title: "Immutable Blockchain Records",
                desc: "Every handoff in the supply chain is recorded immutably, ensuring full transparency from farm to shelf.",
              },
              {
                title: "Escrow Payments",
                desc: "Automated escrow payments protect both buyers and sellers, releasing funds only when conditions are met.",
              },
              {
                title: "QR-Powered Traceability",
                desc: "Consumers can scan a QR code to instantly verify the origin and journey of their food.",
              },
            ].map((feature, i) => (
              <div
                key={i}
                style={{
                  background: "rgba(255,255,255,0.65)",
                  backdropFilter: "blur(12px)",
                  WebkitBackdropFilter: "blur(12px)",
                  borderRadius: "12px",
                  padding: "28px 24px",
                  textAlign: "center",
                  border: "1px solid rgba(255,255,255,0.8)",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                  transition: "transform 0.2s ease, box-shadow 0.2s ease",
                  cursor: "default",
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLDivElement;
                  el.style.transform = "translateY(-4px)";
                  el.style.boxShadow = "0 12px 36px rgba(0,0,0,0.14)";
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLDivElement;
                  el.style.transform = "translateY(0)";
                  el.style.boxShadow = "0 4px 20px rgba(0,0,0,0.08)";
                }}
              >
                <h3
                  style={{
                    fontFamily: "'Instrument Serif', serif",
                    fontSize: "1.15rem",
                    fontWeight: 400,
                    color: "#1a1a1a",
                    marginBottom: "12px",
                  }}
                >
                  {feature.title}
                </h3>
                <p
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: "0.9rem",
                    color: "#444",
                    lineHeight: 1.65,
                  }}
                >
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>

          {/* How It Works Title */}
          <h2
            style={{
              fontFamily: "'Instrument Serif', serif",
              fontSize: "clamp(1.8rem, 3.5vw, 2.6rem)",
              fontWeight: 400,
              textAlign: "center",
              color: "black",
              marginBottom: "48px",
              letterSpacing: "-0.01em",
              textShadow: "0 2px 12px rgba(0,0,0,0.3)",
            }}
          >
            How It Works
          </h2>

          {/* Steps */}
          <div style={{ position: "relative" }}>
            {/* Dotted connector line */}
            <div
              style={{
                position: "absolute",
                top: "27px",
                left: "calc(10% + 28px)",
                right: "calc(10% + 28px)",
                height: "2px",
                background:
                  "repeating-linear-gradient(to right, rgba(0,200,100,0.75) 0, rgba(0,200,100,0.75) 8px, transparent 8px, transparent 18px)",
                zIndex: 0,
              }}
            />

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(5, 1fr)",
                gap: "16px",
                position: "relative",
                zIndex: 1,
              }}
            >
              {[
                {
                  num: 1,
                  title: "Farmer Harvests",
                  desc: "Crops are harvested and a new batch is created on the blockchain.",
                },
                {
                  num: 2,
                  title: "Processor Acts",
                  desc: "Processor buys the batch via the marketplace; funds locked in escrow.",
                },
                {
                  num: 3,
                  title: "Distributor Ships",
                  desc: "Goods are handed off, tracking ownership transfer and conditions.",
                },
                {
                  num: 4,
                  title: "Retailer Stocks",
                  desc: "Retailer receives the verified product and stacks it on the shelf.",
                },
                {
                  num: 5,
                  title: "Consumer Verifies",
                  desc: "Consumers scan the QR to see the complete history before buying.",
                },
              ].map((step) => (
                <div
                  key={step.num}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    textAlign: "center",
                  }}
                >
                  {/* Circle */}
                  <div
                    style={{
                      width: "56px",
                      height: "56px",
                      borderRadius: "50%",
                      background: "linear-gradient(135deg, #00d26a, #00a855)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#fff",
                      fontFamily: "'Inter', sans-serif",
                      fontWeight: 700,
                      fontSize: "1.25rem",
                      marginBottom: "14px",
                      boxShadow: "0 4px 16px rgba(0,210,106,0.45)",
                      flexShrink: 0,
                    }}
                  >
                    {step.num}
                  </div>
                  <h4
                    style={{
                      fontFamily: "'Instrument Serif', serif",
                      fontSize: "0.95rem",
                      fontWeight: 400,
                      color: "#fff",
                      marginBottom: "8px",
                      textShadow: "0 1px 6px rgba(0,0,0,0.5)",
                    }}
                  >
                    {step.title}
                  </h4>
                  <p
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: "0.8rem",
                      color: "rgba(255,255,255,0.85)",
                      lineHeight: 1.55,
                      textShadow: "0 1px 4px rgba(0,0,0,0.4)",
                    }}
                  >
                    {step.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
    </>
  );
}

Home.getLayout = function getLayout(page: ReactElement) {
  return <>{page}</>;
};
