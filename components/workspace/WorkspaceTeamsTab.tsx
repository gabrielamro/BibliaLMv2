"use client";

import React, { useState } from 'react';
import { Shield, Plus, Trash2 } from 'lucide-react';
import { useWorkspace } from '../../contexts/WorkspaceContext';

const TEAM_COLORS = [
  { label: 'Vermelho', class: 'bg-red-500' },
  { label: 'Azul', class: 'bg-blue-500' },
  { label: 'Verde', class: 'bg-green-500' },
  { label: 'Amarelo', class: 'bg-yellow-500' },
  { label: 'Roxo', class: 'bg-purple-500' },
  { label: 'Laranja', class: 'bg-orange-500' },
  { label: 'Rosa', class: 'bg-pink-500' },
  { label: 'Preto', class: 'bg-gray-900' }
];

const WorkspaceTeamsTab: React.FC = () => {
  const { teams, loading, createTeam, deleteTeam } = useWorkspace();
  
  const [isCreatingTeam, setIsCreatingTeam] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamColor, setNewTeamColor] = useState(TEAM_COLORS[0].class);

  const handleCreateTeam = async () => {
    if (!newTeamName.trim()) return;
    await createTeam(newTeamName, newTeamColor);
    setIsCreatingTeam(false);
    setNewTeamName('');
  };

  const handleDeleteTeam = async (id: string) => {
    if (!confirm("Tem certeza? Membros vinculados perderão a afiliação.")) return;
    await deleteTeam(id);
  };

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="bg-white dark:bg-bible-darkPaper p-6 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-800">
          <div className="h-6 w-48 bg-gray-200 dark:bg-gray-800 rounded mb-6"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800">
                <div className="w-12 h-12 rounded-xl bg-gray-200 dark:bg-gray-800"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-24 bg-gray-200 dark:bg-gray-800 rounded"></div>
                  <div className="h-3 w-16 bg-gray-200 dark:bg-gray-800 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in">
      <div className="bg-white dark:bg-bible-darkPaper p-6 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-800">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-bold text-lg text-gray-900 dark:text-white flex items-center gap-2">
            <Shield size={20} className="text-blue-500"/> Equipes da Gincana
          </h3>
          {!isCreatingTeam && (
            <button 
              onClick={() => setIsCreatingTeam(true)} 
              className="text-[10px] font-black uppercase tracking-widest bg-bible-gold/10 text-bible-gold px-3 py-1.5 rounded-full flex items-center gap-1 hover:bg-bible-gold/20 transition-colors"
            >
              <Plus size={14}/> Nova Equipe
            </button>
          )}
        </div>

        {isCreatingTeam && (
          <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-700 mb-6 animate-in slide-in-from-top-2">
            <h4 className="font-bold text-sm mb-3">Criar Nova Equipe</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <input 
                type="text" 
                placeholder="Nome da Equipe (ex: Tribo de Judá)" 
                value={newTeamName} 
                onChange={(e) => setNewTeamName(e.target.value)} 
                className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-black text-sm outline-none focus:border-bible-gold"
              />
              <div className="flex gap-2 items-center overflow-x-auto no-scrollbar pb-1">
                {TEAM_COLORS.map(c => (
                  <button 
                    key={c.label} 
                    onClick={() => setNewTeamColor(c.class)} 
                    className={`w-8 h-8 rounded-full ${c.class} ring-2 ring-offset-2 dark:ring-offset-gray-900 transition-all ${newTeamColor === c.class ? 'ring-gray-400 scale-110' : 'ring-transparent opacity-70 hover:opacity-100'}`}
                    title={c.label}
                  />
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setIsCreatingTeam(false)} className="px-4 py-2 text-gray-500 font-bold text-xs hover:text-gray-700">Cancelar</button>
              <button onClick={handleCreateTeam} className="px-6 py-2 bg-bible-gold text-white rounded-lg font-bold text-xs shadow-md hover:scale-105 transition-transform">Criar</button>
            </div>
          </div>
        )}

        {teams.length === 0 ? (
          <div className="text-center py-10 text-gray-400 text-sm italic">Nenhuma equipe criada. Adicione times para criar competições nas suas Jornadas.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {teams.map(team => (
              <div key={team.id} className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800">
                <div className={`w-12 h-12 rounded-xl ${team.color} flex items-center justify-center text-white font-black shadow-md border-2 border-white dark:border-gray-700`}>
                  {team.name.substring(0,1)}
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-gray-900 dark:text-white text-sm">{team.name}</h4>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wide">0 Membros</p>
                </div>
                <button onClick={() => handleDeleteTeam(team.id)} className="text-gray-300 hover:text-red-500 transition-colors p-2"><Trash2 size={16}/></button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkspaceTeamsTab;
