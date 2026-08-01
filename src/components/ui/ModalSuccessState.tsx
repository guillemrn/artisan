import React from "react";
import { CheckCircle2, ArrowRight } from "lucide-react";

type DetailItem = {
  label: string;
  value: string | number;
};

type ModalSuccessStateProps = {
  title: string;
  description: React.ReactNode;
  onDone: () => void;
  actionText?: string;
  details?: DetailItem[];
  badgeText?: string;
};

export function ModalSuccessState({
  title,
  description,
  onDone,
  actionText = "Listo",
  details,
  badgeText,
}: ModalSuccessStateProps) {
  return (
    <div className="flex flex-col items-center text-center py-4 px-2 animate-in zoom-in-95 fade-in duration-300">
      {/* Animated Success Badge */}
      <div className="relative mb-5 flex items-center justify-center">
        <div className="absolute inset-0 rounded-full bg-emerald-100/80 animate-ping opacity-30" />
        <div className="h-16 w-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 shadow-sm relative z-10">
          <CheckCircle2 className="h-9 w-9 stroke-[2.2]" />
        </div>
      </div>

      {badgeText && (
        <span className="mb-2 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200/60">
          {badgeText}
        </span>
      )}

      {/* Main Title */}
      <h3 className="text-xl font-bold font-display text-text-primary tracking-tight">
        {title}
      </h3>

      {/* Detailed Description Copy */}
      <div className="mt-2 text-sm text-text-secondary max-w-sm leading-relaxed">
        {description}
      </div>

      {/* Optional Metadata Details Card */}
      {details && details.length > 0 && (
        <div className="w-full mt-4 bg-muted/60 rounded-xl p-3.5 border border-border/80 text-xs space-y-2 text-left">
          {details.map((item, idx) => (
            <div key={idx} className="flex justify-between items-center">
              <span className="text-text-muted font-medium">{item.label}</span>
              <span className="font-bold text-text-primary">{item.value}</span>
            </div>
          ))}
        </div>
      )}

      {/* Primary Action Button */}
      <button
        type="button"
        onClick={onDone}
        className="w-full mt-6 h-12 rounded-xl bg-primary text-white text-sm font-bold shadow-lg hover:bg-emerald-700 transition flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
      >
        <span>{actionText}</span>
        <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
}
