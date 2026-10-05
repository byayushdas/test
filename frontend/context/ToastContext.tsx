import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from "lucide-react";

export type ToastType = "success" | "error" | "warning" | "info";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: ToastType = "info") => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ toast: addToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-3 pointer-events-none">
        <AnimatePresence>
          {toasts.map((t) => {
            let Icon = Info;
            let bgColor = "bg-stone-900";
            let borderColor = "border-stone-700";
            let iconColor = "text-stone-400";

            switch (t.type) {
              case "success":
                Icon = CheckCircle2;
                bgColor = "bg-emerald-950/90";
                borderColor = "border-emerald-500/30";
                iconColor = "text-emerald-400";
                break;
              case "error":
                Icon = XCircle;
                bgColor = "bg-red-950/90";
                borderColor = "border-red-500/30";
                iconColor = "text-red-400";
                break;
              case "warning":
                Icon = AlertTriangle;
                bgColor = "bg-amber-950/90";
                borderColor = "border-amber-500/30";
                iconColor = "text-amber-400";
                break;
            }

            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 50, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                className={`pointer-events-auto flex items-center gap-3 p-4 rounded-2xl border backdrop-blur-md shadow-2xl ${bgColor} ${borderColor} min-w-[300px] max-w-sm`}
              >
                <Icon className={`w-5 h-5 shrink-0 ${iconColor}`} />
                <p className="text-sm font-semibold text-stone-200 flex-1">{t.message}</p>
                <button
                  onClick={() => removeToast(t.id)}
                  className="p-1 hover:bg-white/10 rounded-lg transition"
                >
                  <X className="w-4 h-4 text-stone-400" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
