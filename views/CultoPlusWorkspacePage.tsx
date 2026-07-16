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
  initialServiceId?: string | null;
  initialEdit?: boolean;
};

const CultoPlusWorkspacePage: React.FC<CultoPlusWorkspacePageProps> = ({ initialMode = 'list', initialView = 'list', initialServiceId = null, initialEdit = false }) => {
  const { setIsHeaderHidden, resetHeader } = useHeader();
  const { showNotification } = useAuth();
  const showTopActions = !initialEdit;

  useEffect(() => {
    setIsHeaderHidden(true);
    return () => {
      setIsHeaderHidden(false);
      resetHeader();
    };
  }, [setIsHeaderHidden, resetHeader]);

  return (
    <div className={`relative h-full overflow-y-auto bg-gray-50 p-4 dark:bg-black/20 md:p-8 ${showTopActions ? 'pt-20 md:pt-20' : ''}`}>
      <SEO title="Culto+" />
      {showTopActions && (
        <CultoPlusTopActions
          backHref="/workspace-pastoral"
          onNotify={() => showNotification('Notificações de Culto+ em breve.', 'info')}
          items={[
            { label: 'Novo Culto+', icon: <Plus size={15} />, href: '/workspace-pastoral/cultos/novo' },
            { label: 'Abrir calendário', icon: <CalendarDays size={15} />, href: '/workspace-pastoral/cultos?view=calendar' },
            { label: 'Ver lista', icon: <Radio size={15} />, href: '/workspace-pastoral/cultos' },
            { label: 'Espaco pastoral', icon: <LayoutDashboard size={15} />, href: '/workspace-pastoral' },
          ]}
        />
      )}
      <div className="mx-auto max-w-7xl pb-24">
        <CultoPlusManager
          initialMode={initialMode}
          initialView={initialView}
          initialServiceId={initialServiceId}
          initialEdit={initialEdit}
          pageTitle="Gestão do Culto+"
          pageDescription="Organize a liturgia, publique a OnePage e acompanhe check-ins, escalas, posts e engajamento em uma página dedicada."
        />
      </div>
    </div>
  );
};

export default CultoPlusWorkspacePage;
