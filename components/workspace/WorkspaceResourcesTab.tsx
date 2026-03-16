"use client";
import { useNavigate } from '../../utils/router';

import React from 'react';

import { Map, HandHeart, ArrowRight } from 'lucide-react';

const WorkspaceResourcesTab: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-8 animate-in fade-in">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Gestor de Trilhas (DESATIVADO)
        <div 
          onClick={() => navigate('/trilhas/gerenciar')} 
          className="bg-white dark:bg-bible-darkPaper p-8 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-800 cursor-pointer hover:border-bible-gold transition-all group"
        >
          <div className="flex justify-between items-start mb-4">
            <div className="p-4 bg-blue-100 dark:bg-blue-900/20 text-blue-600 rounded-2xl group-hover:scale-110 transition-transform">
              <Map size={32} />
            </div>
            <ArrowRight className="text-gray-300 group-hover:text-bible-gold" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Gestor de Trilhas</h3>
          <p className="text-sm text-gray-500">Crie sequências de leitura bíblica temáticas para sua igreja ou grupo.</p>
        </div>
        */}

        <div 
          onClick={() => navigate('/oracoes/gerenciar')} 
          className="bg-white dark:bg-bible-darkPaper p-8 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-800 cursor-pointer hover:border-bible-gold transition-all group"
        >
          <div className="flex justify-between items-start mb-4">
            <div className="p-4 bg-purple-100 dark:bg-purple-900/20 text-purple-600 rounded-2xl group-hover:scale-110 transition-transform">
              <HandHeart size={32} />
            </div>
            <ArrowRight className="text-gray-300 group-hover:text-bible-gold" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Gestor de Orações</h3>
          <p className="text-sm text-gray-500">Escreva e grave orações guiadas para momentos específicos (Manhã, Noite, Culto).</p>
        </div>

      </div>
    </div>
  );
};

export default WorkspaceResourcesTab;
