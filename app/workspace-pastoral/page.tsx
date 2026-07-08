"use client";

import { useEffect } from 'react';
import ProtectedRoute from '../../components/ProtectedRoute';
import PastoralWorkspacePage from '../../views/PastoralWorkspacePage';
import { useAuth } from '../../contexts/AuthContext';

function PastoralWorkspaceGate() {
  const { checkFeatureAccess, openSubscription } = useAuth();
  const allowed = checkFeatureAccess('churchAdminPanel');

  useEffect(() => {
    if (!allowed) openSubscription('O Workspace Pastoral organiza salas, igreja, equipe e acompanhamento em um painel de lideranca.');
  }, [allowed, openSubscription]);

  if (!allowed) {
    return (
      <div className="flex h-full items-center justify-center bg-gray-50 p-8 text-center dark:bg-black">
        <div className="max-w-md rounded-3xl border border-gray-100 bg-white p-8 shadow-sm dark:border-gray-800 dark:bg-bible-darkPaper">
          <h1 className="text-2xl font-serif font-bold text-gray-900 dark:text-white">Workspace Pastoral</h1>
          <p className="mt-3 text-sm text-gray-500">Este recurso faz parte do plano pastoral ou igreja.</p>
        </div>
      </div>
    );
  }

  return <PastoralWorkspacePage />;
}

export default function Page() {
  return (
    <ProtectedRoute><PastoralWorkspaceGate /></ProtectedRoute>
  );
}
