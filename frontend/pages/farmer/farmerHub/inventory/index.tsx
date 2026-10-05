import Head from "next/head";
import Link from "next/link";
import { Package, ArrowLeft } from "lucide-react";

export default function FarmerInventory() {
  const mockInventory = [
    { id: "batch-101", name: "Alphonso Mangoes Grade A", quantity: 500, status: "AVAILABLE", date: "July 12, 2026" },
    { id: "batch-102", name: "Organic Basmati Grain", quantity: 1200, status: "AVAILABLE", date: "July 10, 2026" },
    { id: "batch-103", name: "Desi Wheat Seeds", quantity: 800, status: "LOCKED IN ESCROW", date: "July 08, 2026" }
  ];

  return (
    <div className="min-h-screen relative text-white pt-6 pb-20">
      <Head>
        <title>Inventory | Seed2Shelf</title>
      </Head>

      <div className="relative z-10 max-w-5xl mx-auto px-6 py-8">
        
        <div className="flex items-center gap-4 mb-8">
          <Link
            href="/farmer"
            className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-stone-300 hover:text-white transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-black text-white flex items-center gap-2">
              <Package className="w-8 h-8 text-[#00d26a]" />
              Crop Inventory
            </h1>
            <p className="text-stone-400 text-xs font-medium mt-1">
              View and manage your registered farm produce inventory batches.
            </p>
          </div>
        </div>

        <div className="matte-glass p-8 rounded-3xl border border-white/10 shadow-2xl space-y-6">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-white/10 text-stone-400 text-xs font-black uppercase">
                  <th className="pb-4">Batch ID</th>
                  <th className="pb-4">Crop Name</th>
                  <th className="pb-4">Quantity (kg)</th>
                  <th className="pb-4">Harvest Date</th>
                  <th className="pb-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {mockInventory.map((item) => (
                  <tr key={item.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="py-4 font-mono font-bold text-white text-xs">{item.id}</td>
                    <td className="py-4 text-stone-200 font-bold">{item.name}</td>
                    <td className="py-4 text-stone-300">{item.quantity} kg</td>
                    <td className="py-4 text-stone-400 text-xs">{item.date}</td>
                    <td className="py-4">
                      <span className={`text-[10px] px-2.5 py-1 rounded-full font-black border ${
                        item.status === 'AVAILABLE' 
                          ? 'bg-[#00d26a]/15 text-[#00d26a] border-[#00d26a]/20' 
                          : 'bg-yellow-500/15 text-yellow-400 border-yellow-500/20'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
