'use client';
import PublicUserProfilePage from '../../views/public/PublicUserProfilePage';
import { Suspense } from 'react';
import CultoPlusPageShell from '../../components/CultoPlusPageShell';

export default function MinhaContaPage() {
  return (
    <CultoPlusPageShell>
      <Suspense fallback={<div className="module-accent-text p-8 text-center font-serif italic animate-pulse">Preparando seu perfil...</div>}>
        <PublicUserProfilePage />
      </Suspense>
    </CultoPlusPageShell>
  );
}
