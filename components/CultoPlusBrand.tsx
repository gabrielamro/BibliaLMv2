"use client";

import React from "react";

interface CultoPlusBrandProps {
  compact?: boolean;
  className?: string;
}

export default function CultoPlusBrand({ compact = false, className = "" }: CultoPlusBrandProps) {
  if (compact) {
    return (
      <div
        className={`h-12 w-12 overflow-hidden rounded-xl bg-[#fffdf9] flex items-center justify-start ${className}`}
        aria-label="Culto+"
      >
        <img
          src="/brand/culto-plus-logo.png"
          alt="Culto+"
          className="h-full w-[200%] max-w-none object-cover object-left"
        />
      </div>
    );
  }

  return (
    <div
      className={`aspect-[2/1] h-14 w-auto overflow-hidden rounded-xl bg-[#fffdf9] flex items-center justify-start ${className}`}
      aria-label="Culto+"
    >
      <img
        src="/brand/culto-plus-logo.png"
        alt="Culto+"
        className="h-full w-full object-contain object-left"
      />
    </div>
  );
}
