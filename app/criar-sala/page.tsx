"use client";

import { useEffect } from 'react';
import CreateRoomStudioPage from '../../views/CreateRoomStudioPage';
import { useAuth } from '../../contexts/AuthContext';
import CultoPlusPageShell from '../../components/CultoPlusPageShell';

function CreateRoomGate() {
  const { checkFeatureAccess, openSubscription } = useAuth();
  const allowed = checkFeatureAccess('churchAdminPanel');

  useEffect(() => {
    if (!allowed) openSubscription('Criar salas faz parte dos recursos pastorais para organizar ensino, membros e jornadas.');
  }, [allowed, openSubscription]);

  if (!allowed) {
    return (
      <div className="flex h-full items-center justify-center bg-gray-50 p-8 text-center dark:bg-black">
        <div className="max-w-md rounded-3xl border border-gray-100 bg-white p-8 shadow-sm dark:border-gray-800 dark:bg-bible-darkPaper">
          <h1 className="text-2xl font-serif font-bold text-gray-900 dark:text-white">Criar Sala</h1>
          <p className="mt-3 text-sm text-gray-500">A criacao de salas faz parte do plano pastoral ou igreja.</p>
        </div>
      </div>
    );
  }

  return <CreateRoomStudioPage />;
}

export default function Page() {
  return <CultoPlusPageShell compactDesktop><CreateRoomGate /></CultoPlusPageShell>;
}
