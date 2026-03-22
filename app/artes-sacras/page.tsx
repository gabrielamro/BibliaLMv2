"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ArtesSacrasPage() {
  const router = useRouter();

  useEffect(() => {
    try {
      sessionStorage.setItem('rn_state', JSON.stringify({ tool: 'image' }));
      window.dispatchEvent(new Event('rn_state_change'));
    } catch {
      // navegação segue mesmo sem state
    }
    router.replace('/estudio-criativo');
  }, [router]);

  return null;
}
