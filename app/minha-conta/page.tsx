'use client';
import ProfilePage from '../../views/ProfilePage';
import { Suspense } from 'react';

function ProfileContent() {
  return <ProfilePage />;
}

export default function MinhaContaPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Carregando...</div>}>
      <ProfileContent />
    </Suspense>
  );
}
