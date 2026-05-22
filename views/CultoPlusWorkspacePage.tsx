"use client";

import React, { useEffect } from 'react';
import { CalendarDays, LayoutDashboard, Plus, Radio } from 'lucide-react';
import SEO from '../components/SEO';
import CultoPlusManager from '../components/culto-plus/CultoPlusManager';
import CultoPlusTopActions from '../components/culto-plus/CultoPlusTopActions';
import { useHeader } from '../contexts/HeaderContext';
import { useAuth } from '../contexts/AuthContext';

type CultoPlusWorkspacePageProps = {
  initialMode?: 'list' | 'create';
  initialView?: 'list' | 'calendar';
};

const CultoPlusWorkspacePage: React.FC<CultoPlusWorkspacePageProps> = ({ initialMode = 'list', initialView = 'list' }) => {
  const { setIsHeaderHidden, resetHeader } = useHeader();
  const { showNotification } = useAuth();

  useEffect(() => {
    setIsHeaderHidden(true);
    return () => {
      setIsHeaderHidden(false);
      resetHeader();
    };
  }, [setIsHeaderHidden, resetHeader]);

  return (
    <div className="relative h-full overflow-y-auto bg-gray-50 p-4 pt-20 dark:bg-black/20 md:p-8 md:pt-20">
      <SEO title="Culto+" />
      <CultoPlusTopActions
        backHref="/workspace-pastoral"
        onNotify={() => showNotification('Notificacoes de Culto+ em breve.', 'info')}
        items={[
          { label: 'Novo Culto+', icon: <Plus size={15} />, href: '/workspace-pastoral/cultos/novo' },
          { label: 'Abrir calendario', icon: <CalendarDays size={15} />, href: '/workspace-pastoral/cultos?view=calendar' },
          { label: 'Ver lista', icon: <Radio size={15} />, href: '/workspace-pastoral/cultos' },
          { label: 'Espaco pastoral', icon: <LayoutDashboard size={15} />, href: '/workspace-pastoral' },
        ]}
      />
      <div className="mx-auto max-w-7xl pb-24">
        <CultoPlusManager
          initialMode={initialMode}
          initialView={initialView}
          pageTitle="Gestao do Culto+"
          pageDescription="Organize a liturgia, publique a OnePage e acompanhe check-ins, escalas, posts e engajamento em uma pagina dedicada."
        />
      </div>
    </div>
  );
};

export default CultoPlusWorkspacePage;
