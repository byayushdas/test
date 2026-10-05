import React, { useState, useEffect } from "react";
import { Wallet } from "lucide-react";

interface MetaMaskWalletConnectProps {
  initialWalletAddress?: string;
  onWalletConnected?: (address: string) => void;
  onWalletDisconnected?: () => void;
}

export default function MetaMaskWalletConnect({
  initialWalletAddress = "",
  onWalletConnected,
  onWalletDisconnected,
}: MetaMaskWalletConnectProps) {
  const [walletAddress, setWalletAddress] = useState<string>(initialWalletAddress);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync prop changes and auto-connect
  useEffect(() => {
    if (initialWalletAddress) {
      setWalletAddress(initialWalletAddress);
    } else {
      // Auto-check if already connected to MetaMask
      const checkConnection = async () => {
        if (typeof window !== "undefined" && (window as any).ethereum) {
          try {
            const accounts = await (window as any).ethereum.request({ method: "eth_accounts" });
            if (accounts && accounts.length > 0) {
              setWalletAddress(accounts[0]);
              if (onWalletConnected) onWalletConnected(accounts[0]);
            }
          } catch (err) {
            console.error("Auto-connect failed:", err);
          }
        }
      };
      checkConnection();
    }
  }, [initialWalletAddress]);

  // Handle account changes from MetaMask
  useEffect(() => {
    if (typeof window !== "undefined" && (window as any).ethereum) {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length > 0) {
          setWalletAddress(accounts[0]);
          if (onWalletConnected) onWalletConnected(accounts[0]);
        }
      };

      (window as any).ethereum.on("accountsChanged", handleAccountsChanged);
      return () => {
        if ((window as any).ethereum.removeListener) {
          (window as any).ethereum.removeListener("accountsChanged", handleAccountsChanged);
        }
      };
    }
  }, [onWalletConnected, onWalletDisconnected]);

  const connectWallet = async () => {
    if (typeof window === "undefined" || !(window as any).ethereum) {
      setError("MetaMask extension not found. Please install MetaMask.");
      return;
    }

    try {
      setIsConnecting(true);
      setError(null);
      const accounts = await (window as any).ethereum.request({ method: "eth_requestAccounts" });
      if (accounts && accounts.length > 0) {
        setWalletAddress(accounts[0]);
        if (onWalletConnected) onWalletConnected(accounts[0]);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to connect to MetaMask.");
    } finally {
      setIsConnecting(false);
    }
  };

  const switchAccount = async () => {
    if (typeof window === "undefined" || !(window as any).ethereum) return;
    try {
      setIsConnecting(true);
      setError(null);
      await (window as any).ethereum.request({
        method: "wallet_requestPermissions",
        params: [{ eth_accounts: {} }],
      });
      // The `accountsChanged` listener will handle the state update if successful
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to switch account.");
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
    setWalletAddress("");
    setError(null);
    if (onWalletDisconnected) onWalletDisconnected();
  };

  const formatAddress = (address: string) => {
    if (!address) return "";
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  return (
    <div className="bg-stone-900/50 border border-stone-800 rounded-3xl p-6 sm:p-8 space-y-6">
      <div className="flex items-center gap-3 border-b border-stone-800/60 pb-4">
        <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400 shadow-inner">
          <Wallet className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-stone-100 tracking-tight">Crypto Wallet</h3>
          <p className="text-sm text-stone-400 font-medium">Connect MetaMask for Blockchain tracking</p>
        </div>
      </div>

      <div className="space-y-4">
        {error && <p className="text-xs text-red-400 font-medium">{error}</p>}

        {!walletAddress ? (
          <div className="flex items-center justify-between bg-stone-950 border border-stone-800 rounded-2xl p-5">
            <div>
              <p className="text-sm font-bold text-stone-200">Not Connected</p>
              <p className="text-xs text-stone-500 font-medium mt-1">Please connect your MetaMask wallet.</p>
            </div>
            <button
              onClick={connectWallet}
              disabled={isConnecting}
              className="px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white font-extrabold text-xs transition cursor-pointer shadow-md"
            >
              {isConnecting ? "Connecting..." : "Connect MetaMask"}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-stone-950 border border-stone-800 rounded-2xl p-5">
              <div>
                <p className="text-xs text-stone-500 font-bold uppercase tracking-wider mb-1">Connected Address</p>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                  <p className="text-sm font-bold text-emerald-400 font-mono tracking-tight" title={walletAddress}>
                    {formatAddress(walletAddress)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={switchAccount}
                  disabled={isConnecting}
                  className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold text-xs transition cursor-pointer"
                >
                  Switch Account
                </button>
                <button
                  onClick={disconnectWallet}
                  className="px-4 py-2 rounded-xl bg-red-900/20 hover:bg-red-900/40 text-red-400 border border-red-900/30 font-bold text-xs transition cursor-pointer"
                >
                  Disconnect
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
