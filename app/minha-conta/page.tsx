'use client';
import PublicUserProfilePage from '../../views/public/PublicUserProfilePage';
import { Suspense } from 'react';

export default function MinhaContaPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-bible-gold animate-pulse italic font-serif">Preparando seu Reino...</div>}>
      <PublicUserProfilePage />
    </Suspense>
  );
}
