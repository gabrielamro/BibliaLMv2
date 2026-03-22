"use client";

import React from "react";

export default function MocSantuarioPage() {
  return (
    <div className="w-full h-[calc(100dvh-60px)] md:h-[calc(100dvh-80px)] bg-white dark:bg-black">
      <iframe
        title="Mockup Santuario Central"
        src="/mockups/santuario-central-mockup.html"
        className="w-full h-full border-0"
      />
    </div>
  );
}
