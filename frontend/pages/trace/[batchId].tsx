import Head from "next/head";
import { useRouter } from "next/router";
import { Card } from "@/components/shared/Card/Card";
import { HelpCircle } from 'lucide-react';
import Link from "next/link";

export default function TraceBatch() {
  const router = useRouter();
  const { batchId } = router.query;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 text-center">
      <HelpCircle className="w-16 h-16 text-gray-400 mb-4" />
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Blockchain Tracing Disabled</h1>
      <p className="text-gray-500 mb-6 max-w-md">Blockchain functionality has been removed.</p>
      <Link href="/" className="px-6 py-3 bg-agri-green text-white rounded-lg hover:bg-agri-green-800 transition-colors">
        Return Home
      </Link>
    </div>
  );
}


