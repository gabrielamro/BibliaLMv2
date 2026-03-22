"use client";
import { useNavigate } from '../../utils/router';

import React, { useState, useMemo } from 'react';

import { Filter, Plus, Lock, Loader2, Layout, Crown, Settings } from 'lucide-react';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { CustomPlan } from '../../types';
import StandardCard from '../ui/StandardCard';
import PlanManagementModal from '../PlanManagementModal';

const WorkspacePlansTab: React.FC = () => {
  const navigate = useNavigate();
  const { plans, loading, isPastor } = useWorkspace();
  
  const [activeTab, setActiveTab] = useState<'all' | 'draft' | 'published' | 'archived'>('all');
  const [filterAudience, setFilterAudience] = useState<'all' | 'public' | 'church' | 'group'>('all');
  const [managementPlan, setManagementPlan] = useState<CustomPlan | null>(null);

  const filteredPlans = useMemo(() => {
    return plans.filter(plan => {
      const planStatus = plan.status || 'draft';
      if (activeTab !== 'all' && planStatus !== activeTab) return false;
      if (filterAudience !== 'all' && plan.privacyType !== filterAudience) return false;
      return true;
    }).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [plans, activeTab, filterAudience]);

  const openManager = (e: React.MouseEvent, plan: CustomPlan) => { 
    e.stopPropagation(); 
    setManagementPlan(plan); 
  };

  return (
    <>
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8 bg-white dark:bg-bible-darkPaper p-2 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter size={16} className="text-gray-400 ml-2" />
          <select 
            value={filterAudience} 
            onChange={(e) => setFilterAudience(e.target.value as any)} 
            className="p-2 bg-transparent text-xs font-bold text-gray-600 dark:text-gray-300 outline-none cursor-pointer"
          >
            <option value="all">Todos os Públicos</option>
            <option value="public">Global</option>
            <option value="church">Minha Igreja</option>
            <option value="group">Células</option>
          </select>
          
          {isPastor ? (
            <button 
              onClick={() => navigate('/criador-jornada')}
              className="bg-bible-leather dark:bg-bible-gold text-white dark:text-black px-4 py-2 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg flex items-center gap-2 hover:scale-105 transition-transform whitespace-nowrap"
            >
              <Plus size={14} /> Novo Plano
            </button>
          ) : (
            <button 
              onClick={() => navigate('/planos')}
              className="bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 px-4 py-2 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-sm flex items-center gap-2 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors whitespace-nowrap"
              title="Disponível no Plano Pastor"
            >
              <Lock size={12} /> Criar (Pastor)
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-pulse">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white dark:bg-bible-darkPaper h-64 rounded-3xl border border-gray-100 dark:border-gray-800"></div>
          ))}
        </div>
      ) : filteredPlans.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-bible-darkPaper rounded-[2.5rem] border-2 border-dashed border-gray-200 dark:border-gray-800">
          <div className="w-20 h-20 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
            {isPastor ? <Layout size={32} /> : <Crown size={32} />}
          </div>
          <h3 className="text-xl font-bold text-gray-700 dark:text-gray-300 mb-2">Nenhum plano encontrado</h3>
          <p className="text-gray-500 text-sm mb-6 max-w-md mx-auto">
            {activeTab !== 'all' ? `Não há itens com status "${activeTab}".` : "Comece criando seu primeiro plano de ensino."}
          </p>
          
          {isPastor && (
            <button onClick={() => navigate('/criador-jornada')} className="text-bible-gold font-bold hover:underline">Criar Plano</button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-in fade-in">
          {filteredPlans.map(plan => {
            const isPublished = plan.status === 'published';
            return (
              <StandardCard
                key={plan.id}
                title={plan.title}
                subtitle={plan.description ?? ''}
                imageUrl={plan.coverUrl}
                badges={[
                  { label: plan.category || 'Geral', color: 'bg-purple-50 text-purple-600' },
                  { label: plan.planningFrequency === 'daily' ? 'Diário' : 'Semanal', color: 'bg-blue-50 text-blue-600' }
                ]}
                metrics={plan.metrics}
                statusLabel={isPublished ? 'Sala Ativa' : 'Rascunho'}
                statusColor={isPublished ? 'bg-green-500' : 'bg-gray-500'}
                actionLabel={isPastor ? (isPublished ? 'Editar Sala' : 'Editar Plano') : 'Acessar Sala'}
                onAction={(e: React.MouseEvent) => {
                  e.stopPropagation();
                  isPastor 
                    ? navigate(`/criador-jornada`, { state: { planId: plan.id, planData: plan } })
                    : navigate(`/jornada/${plan.id}`)
                }}
                onSecondaryAction={isPastor && isPublished ? (e: React.MouseEvent) => openManager(e, plan) : undefined}
                secondaryIcon={isPastor && isPublished ? <Settings size={14}/> : undefined}
                onClick={() => navigate(`/jornada/${plan.id}`)}
              />
            );
          })}
        </div>
      )}

      {managementPlan && (
        <PlanManagementModal 
          isOpen={!!managementPlan} 
          onClose={() => setManagementPlan(null)} 
          plan={managementPlan}
        />
      )}
    </>
  );
};

export default WorkspacePlansTab;
