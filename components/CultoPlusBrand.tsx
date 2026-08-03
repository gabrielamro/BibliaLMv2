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
        className={`relative h-12 w-12 overflow-hidden rounded-xl bg-transparent ${className}`}
        aria-label="Culto+"
      >
        <img
          src="/brand/culto-plus-logo-transparent.png"
          alt="Culto+"
          className="absolute left-1/2 top-1/2 h-[72px] w-[216px] max-w-none -translate-x-[17%] -translate-y-1/2 object-contain dark:hidden"
        />
        <img
          src="/brand/culto-plus-logo-dark-transparent.png"
          alt=""
          aria-hidden="true"
          className="absolute left-1/2 top-1/2 hidden h-[72px] w-[216px] max-w-none -translate-x-[17%] -translate-y-1/2 object-contain dark:block"
        />
      </div>
    );
  }

  return (
    <div
      className={`relative aspect-[3/1] h-14 w-auto overflow-hidden bg-transparent flex items-center justify-start ${className}`}
      aria-label="Culto+"
    >
      <img
        src="/brand/culto-plus-logo-transparent.png"
        alt="Culto+"
        className="h-full w-full object-contain object-left dark:hidden"
      />
      <img
        src="/brand/culto-plus-logo-dark-transparent.png"
        alt=""
        aria-hidden="true"
        className="hidden h-full w-full object-contain object-left dark:block"
      />
    </div>
  );
}
