"use client";

import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import NewHomePage from "../../views/NewHomePage";

export default function NewHomeRoute() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-[#fdfbf7]"><Loader2 className="animate-spin text-[#c5a059]" size={36} /></div>}>
      <NewHomePage />
    </Suspense>
  );
}
