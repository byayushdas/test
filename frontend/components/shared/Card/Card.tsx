import React from "react";

interface CardProps {
  children: React.ReactNode;
  title?: string;
  className?: string;
}

export function Card({ children, title, className = "" }: CardProps) {
  return (
    <div className={`bg-stone-900/60 backdrop-blur-md rounded-2xl border border-white/10 overflow-hidden text-white ${className}`}>
      {title && (
        <div className="px-6 py-4 border-b border-white/10 bg-white/5">
          <h3 className="text-lg font-semibold text-stone-200">{title}</h3>
        </div>
      )}
      <div className="p-6">{children}</div>
    </div>
  );
}

export function StatCard({
  label,
  value,
  icon,
  trend,
}: {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: string;
}) {
  return (
    <Card className="hover:border-white/20 transition-all">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-bold uppercase text-stone-400 mb-1">{label}</p>
          <p className="text-2xl font-extrabold text-white">{value}</p>
          {trend && (
            <p className="text-xs font-bold text-[#00d26a] mt-2 flex items-center gap-1">
              <span>↑</span> {trend}
            </p>
          )}
        </div>
        {icon && <div className="p-3 bg-white/5 text-[#00d26a] rounded-xl border border-white/10">{icon}</div>}
      </div>
    </Card>
  );
}
