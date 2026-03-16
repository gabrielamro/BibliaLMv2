"use client";


import React, { useEffect } from 'react';
import { PenTool } from 'lucide-react';
import SEO from '../components/SEO';
import { WorkspaceProvider } from '../contexts/WorkspaceContext';
import { useHeader } from '../contexts/HeaderContext';
import WorkspaceOnePage from '../components/workspace/WorkspaceOnePage';

const PastoralWorkspaceContent: React.FC = () => {
  const { setTitle, setSubtitle, setIcon, resetHeader } = useHeader();

  useEffect(() => {
    setTitle('Área do Pastor ');
    setIcon(<PenTool size={20} />);
    return () => resetHeader();
  }, [setTitle, setIcon, resetHeader]);

  return (
    <div className="h-full overflow-y-auto bg-gray-50 dark:bg-black/20 p-4 md:p-8">
      <SEO title="Área do Pastor" />

      <div className="max-w-7xl mx-auto pb-24">
        <WorkspaceOnePage />
      </div>
    </div>
  );
};

const PastoralWorkspacePage: React.FC = () => {
  return (
    <WorkspaceProvider>
      <PastoralWorkspaceContent />
    </WorkspaceProvider>
  );
};

export default PastoralWorkspacePage;
