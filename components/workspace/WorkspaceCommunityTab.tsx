"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { dbService } from '../../services/supabase';
import { PlanParticipant, CustomPlan } from '../../types';
import { Users, Search, Mail, MessageCircle, Download, Loader2, ArrowRight } from 'lucide-react';

interface CommunityMember extends PlanParticipant {
  enrolledPlans: string[]; // Plan IDs
  totalPoints: number;
}

const WorkspaceCommunityTab: React.FC = () => {
  const { plans, loading: workspaceLoading } = useWorkspace();
  const [members, setMembers] = useState<CommunityMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const loadCommunity = async () => {
      if (workspaceLoading) return;
      setLoading(true);
      try {
        const memberMap = new Map<string, CommunityMember>();

        for (const plan of plans) {
          const participants = await dbService.getAllPlanParticipants(plan.id);
          // Map DocumentData to PlanParticipant
          const typedParticipants: PlanParticipant[] = participants.map(doc => ({
              uid: doc.uid,
              displayName: doc.displayName,
              username: doc.username,
              photoURL: doc.photoURL,
              points: doc.points || 0,
              completedSteps: doc.completedSteps || [],
              joinedAt: doc.joinedAt,
              lastActivityAt: doc.lastActivityAt,
              status: doc.status || 'active',
              team: doc.team
          }));

          typedParticipants.forEach(p => {
            if (memberMap.has(p.uid)) {
              const existing = memberMap.get(p.uid)!;
              existing.enrolledPlans.push(plan.title);
              existing.totalPoints += p.points;
              // Keep the most recent activity
              if (new Date(p.lastActivityAt) > new Date(existing.lastActivityAt)) {
                existing.lastActivityAt = p.lastActivityAt;
              }
            } else {
              memberMap.set(p.uid, {
                ...p,
                enrolledPlans: [plan.title],
                totalPoints: p.points
              });
            }
          });
        }

        setMembers(Array.from(memberMap.values()));
      } catch (e) {
        console.error("Error loading community:", e);
      } finally {
        setLoading(false);
      }
    };

    loadCommunity();
  }, [plans, workspaceLoading]);

  const filteredMembers = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return members.filter(m => 
      m.displayName.toLowerCase().includes(term) || 
      m.username.toLowerCase().includes(term)
    );
  }, [members, searchTerm]);

  const handleExport = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "UID,Nome,Username,Pontos Totais,Planos,Última Atividade\n"
      + members.map(m => `${m.uid},"${m.displayName}",${m.username},${m.totalPoints},"${m.enrolledPlans.join('; ')}",${m.lastActivityAt}`).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "minha_comunidade.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (workspaceLoading || loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-12 bg-gray-200 dark:bg-gray-800 rounded-xl w-full max-w-md"></div>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-20 bg-gray-200 dark:bg-gray-800 rounded-2xl"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Buscar membro por nome ou @username..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-12 p-4 bg-white dark:bg-bible-darkPaper border border-gray-100 dark:border-gray-800 rounded-2xl text-sm font-bold outline-none focus:ring-2 ring-bible-gold"
          />
        </div>
        
        <button 
          onClick={handleExport}
          className="px-6 py-4 bg-white dark:bg-bible-darkPaper border border-gray-100 dark:border-gray-800 text-gray-700 dark:text-gray-300 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center gap-2 shadow-sm"
        >
          <Download size={16} /> Exportar CSV
        </button>
      </div>

      <div className="bg-white dark:bg-bible-darkPaper rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
        <div className="p-6 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-black/20 flex justify-between items-center">
          <h3 className="font-bold text-lg text-gray-900 dark:text-white flex items-center gap-2">
            <Users size={20} className="text-bible-gold"/> Minha Comunidade ({members.length})
          </h3>
        </div>

        {filteredMembers.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <Users size={48} className="mx-auto mb-4 opacity-20" />
            <p className="text-sm">Nenhum membro encontrado.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {filteredMembers.map(member => (
              <div key={member.uid} className="p-6 flex flex-col md:flex-row items-center gap-6 hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors">
                <div className="flex items-center gap-4 w-full md:w-auto">
                  <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-800 overflow-hidden shrink-0">
                    {member.photoURL ? (
                      <img src={member.photoURL} alt={member.displayName} className="w-full h-full object-cover" />
                    ) : (
                      <Users className="w-full h-full p-3 text-gray-400" />
                    )}
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 dark:text-white">{member.displayName}</h4>
                    <p className="text-xs text-gray-500">@{member.username}</p>
                  </div>
                </div>

                <div className="flex-1 w-full md:w-auto grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-xl">
                    <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">Pontos Totais</p>
                    <p className="font-bold text-bible-gold">{member.totalPoints}</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-xl">
                    <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">Planos</p>
                    <p className="font-bold text-gray-700 dark:text-gray-300">{member.enrolledPlans.length}</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-xl col-span-2 md:col-span-1">
                    <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">Última Atividade</p>
                    <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
                      {new Date(member.lastActivityAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2 w-full md:w-auto justify-end">
                  <button className="p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors" title="Enviar Mensagem">
                    <MessageCircle size={18} />
                  </button>
                  <button className="p-3 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors" title="Ver Perfil">
                    <ArrowRight size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkspaceCommunityTab;
