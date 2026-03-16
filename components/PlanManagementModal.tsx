"use client";


import React, { useState, useEffect, useMemo, useRef } from 'react';
import { X, Users, Search, Ban, Trash2, CheckCircle2, ShieldAlert, Trophy, ChevronDown, ChevronUp, User, UserPlus, Copy, Send, Loader2, Settings, Globe, Lock, Save } from 'lucide-react';
import { dbService } from '../services/supabase';
import { PlanParticipant, CustomPlan, PlanTeam, UserProfile } from '../types';

interface PlanManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: CustomPlan;
}

// Fallback for older plans
const LEGACY_TEAMS: PlanTeam[] = [
    { id: 'Vermelho', name: 'Vermelho', color: 'bg-red-500', members: [] },
    { id: 'Azul', name: 'Azul', color: 'bg-blue-500', members: [] },
    { id: 'Amarelo', name: 'Amarelo', color: 'bg-yellow-500', members: [] },
    { id: 'Verde', name: 'Verde', color: 'bg-green-500', members: [] }
];

const PlanManagementModal: React.FC<PlanManagementModalProps> = ({ isOpen, onClose, plan: initialPlan }) => {
  const [plan, setPlan] = useState<CustomPlan>(initialPlan);
  const [participants, setParticipants] = useState<PlanParticipant[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'members' | 'invites' | 'settings'>('overview');
  const [expandedTeam, setExpandedTeam] = useState<string | null>(null);

  // Invite Tab State
  const [inviteSearch, setInviteSearch] = useState('');
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [addingUid, setAddingUid] = useState<string | null>(null); 
  const [selectedTeamForInvite, setSelectedTeamForInvite] = useState<string>('');
  const searchTimeoutRef = useRef<any>(null);
  
  // Settings Tab State
  const [privacyType, setPrivacyType] = useState(initialPlan.privacyType);
  const [planStatus, setPlanStatus] = useState(initialPlan.status || 'published');
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  useEffect(() => {
    if (isOpen) {
        loadParticipants();
    }
  }, [isOpen, plan.id]);

  const loadParticipants = async () => {
      setLoading(true);
      try {
          const list = await dbService.getAllPlanParticipants(plan.id);
          // Map DocumentData to PlanParticipant to fix type error
          const typedList: PlanParticipant[] = list.map(doc => ({
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
          setParticipants(typedList);
      } catch (e) {
          console.error(e);
      } finally {
          setLoading(false);
      }
  };

  const handleAction = async (userId: string, action: 'block' | 'unblock' | 'remove') => {
      if (!confirm(`Tem certeza que deseja realizar a ação: ${action}?`)) return;
      try {
          await dbService.manageParticipant(plan.id, userId, action);
          if (action === 'remove') {
              setParticipants(prev => prev.filter(p => p.uid !== userId));
          } else {
              setParticipants(prev => prev.map(p => p.uid === userId ? { ...p, status: action === 'block' ? 'blocked' : 'active' } : p));
          }
      } catch (e) {
          alert("Erro ao realizar ação.");
      }
  };

  useEffect(() => {
    const term = inviteSearch.trim();
    if (term.length >= 2) {
        if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
        
        setIsSearching(true);
        searchTimeoutRef.current = setTimeout(async () => {
            try {
                const results = await dbService.searchUsersGlobal(term);
                const filtered = results.filter(u => !participants.some(p => p.uid === u.uid));
                setSearchResults(filtered);
            } catch (e) {
                console.error("Erro na busca de convite:", e);
            } finally {
                setIsSearching(false);
            }
        }, 500);
    } else {
        setSearchResults([]);
    }
    return () => { if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current); };
  }, [inviteSearch, participants]);

  const handleAddUser = async (user: UserProfile) => {
      setAddingUid(user.uid);
      try {
          await dbService.inviteUserToPlan(plan.id, user, selectedTeamForInvite || undefined);
          const newParticipant: PlanParticipant = { 
              uid: user.uid, 
              displayName: user.displayName, 
              username: user.username, 
              photoURL: user.photoURL || undefined, 
              points: 0, 
              completedSteps: [], 
              joinedAt: new Date().toISOString(), 
              lastActivityAt: new Date().toISOString(),
              status: 'active', 
              team: selectedTeamForInvite 
          };
          setParticipants(prev => [...prev, newParticipant]);
          setSearchResults(prev => prev.filter(u => u.uid !== user.uid));
          alert(`${user.displayName} adicionado com sucesso!`);
      } catch (e) {
          console.error("Erro ao adicionar membro:", e);
          alert("Erro ao adicionar usuário à sala.");
      } finally {
          setAddingUid(null);
      }
  };
  
  const handleSaveSettings = async () => {
      setIsSavingSettings(true);
      try {
          await dbService.updateCustomPlan(plan.id, {
              privacyType,
              status: planStatus,
              updatedAt: new Date().toISOString()
          });
          setPlan(prev => ({ ...prev, privacyType, status: planStatus }));
          alert("Configurações atualizadas!");
      } catch (e) {
          alert("Erro ao salvar configurações.");
      } finally {
          setIsSavingSettings(false);
      }
  };

  const copyInviteText = () => {
      const url = `${window.location.origin}/#/jornada/${plan.id}`;
      const text = `Olá! Te convido para participar da jornada de estudos "${plan.title}" no BíbliaLM.\n\nAcesse aqui: ${url}`;
      navigator.clipboard.writeText(text);
      alert("Convite copiado! Envie no WhatsApp.");
  };

  const filteredParticipants = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return participants;
    return participants.filter(p => 
        (p.displayName || '').toLowerCase().includes(term) || 
        (p.username || '').toLowerCase().includes(term)
    );
  }, [participants, searchTerm]);

  const planTeams = useMemo(() => {
      if (plan.teams && plan.teams.length > 0) return plan.teams;
      return LEGACY_TEAMS;
  }, [plan]);

  const teamStats = planTeams.map(team => {
      const score = plan.teamScores?.[team.id] || 0;
      const teamMembers = participants.filter(p => p.team === team.id);
      return { ...team, score, count: teamMembers.length, members: teamMembers };
  }).sort((a, b) => b.score - a.score);

  const toggleTeamExpand = (teamId: string) => {
      setExpandedTeam(prev => prev === teamId ? null : teamId);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
        <div className="bg-white dark:bg-bible-darkPaper w-full max-w-4xl h-[90vh] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col border border-gray-100 dark:border-gray-800">
            
            <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-black/20">
                <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <ShieldAlert className="text-bible-gold" /> Gestão da Sala
                    </h2>
                    <p className="text-xs text-gray-500">{plan.title}</p>
                </div>
                <button onClick={onClose} className="p-2 bg-white dark:bg-gray-800 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    <X size={20} className="text-gray-500" />
                </button>
            </div>

            <div className="flex bg-white dark:bg-bible-darkPaper border-b border-gray-100 dark:border-gray-800 px-6 pt-4 gap-4 overflow-x-auto no-scrollbar">
                <button 
                    onClick={() => setActiveTab('overview')}
                    className={`pb-3 text-xs font-bold uppercase tracking-widest border-b-2 transition-all whitespace-nowrap ${activeTab === 'overview' ? 'border-bible-gold text-bible-gold' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                >
                    Equipes & Ranking
                </button>
                <button 
                    onClick={() => setActiveTab('members')}
                    className={`pb-3 text-xs font-bold uppercase tracking-widest border-b-2 transition-all whitespace-nowrap ${activeTab === 'members' ? 'border-bible-gold text-bible-gold' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                >
                    Membros ({participants.length})
                </button>
                <button 
                    onClick={() => setActiveTab('invites')}
                    className={`pb-3 text-xs font-bold uppercase tracking-widest border-b-2 transition-all whitespace-nowrap ${activeTab === 'invites' ? 'border-bible-gold text-bible-gold' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                >
                    Convites
                </button>
                <button 
                    onClick={() => setActiveTab('settings')}
                    className={`pb-3 text-xs font-bold uppercase tracking-widest border-b-2 transition-all whitespace-nowrap ${activeTab === 'settings' ? 'border-bible-gold text-bible-gold' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                >
                    Configurações
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 bg-gray-50 dark:bg-black/10">
                
                {activeTab === 'overview' && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <Trophy className="text-yellow-500" size={20} /> Placar e Membros
                            </h3>
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Clique no time para ver membros</span>
                        </div>
                        
                        {teamStats.length === 0 ? (
                            <div className="p-8 text-center text-gray-400 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-xl">
                                Nenhuma equipe configurada ou ativa.
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-4">
                                {teamStats.map((team, index) => (
                                    <div key={team.id} className="bg-white dark:bg-bible-darkPaper rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden transition-all">
                                        <div 
                                            className="p-5 flex items-center gap-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50"
                                            onClick={() => toggleTeamExpand(team.id)}
                                        >
                                            <div className={`w-12 h-12 rounded-xl ${team.color} flex items-center justify-center text-white font-black text-lg shadow-lg border-2 border-white dark:border-gray-700 shrink-0`}>
                                                {index + 1}º
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex justify-between items-center mb-1">
                                                    <h4 className="font-bold text-gray-900 dark:text-white">{team.name}</h4>
                                                    <span className="text-sm font-black text-bible-gold">{team.score} pts</span>
                                                </div>
                                                <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden mb-2">
                                                    <div className={`h-full ${team.color}`} style={{ width: '100%' }}></div>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">{team.count} Membros</p>
                                                    {expandedTeam === team.id ? <ChevronUp size={16} className="text-gray-400"/> : <ChevronDown size={16} className="text-gray-400"/>}
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {/* Expandable Member List */}
                                        {expandedTeam === team.id && (
                                            <div className="bg-gray-50 dark:bg-black/20 border-t border-gray-100 dark:border-gray-800 p-4 animate-in slide-in-from-top-2">
                                                <h5 className="text-[10px] font-black uppercase text-gray-400 mb-3 tracking-widest">Integrantes desta equipe</h5>
                                                {team.members.length === 0 ? (
                                                    <p className="text-xs text-gray-400 italic">Nenhum membro nesta equipe ainda.</p>
                                                ) : (
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                        {team.members.map(member => (
                                                            <div key={member.uid} className="flex items-center gap-3 p-2 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800">
                                                                <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden shrink-0">
                                                                    {member.photoURL ? <img src={member.photoURL} className="w-full h-full object-cover" /> : <User className="w-full h-full p-1.5 text-gray-400"/>}
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <p className="text-xs font-bold text-gray-900 dark:text-white truncate">{member.displayName}</p>
                                                                    <p className="text-[10px] text-gray-500 truncate">@{member.username}</p>
                                                                </div>
                                                                <div className="ml-auto text-[10px] font-bold text-bible-gold">
                                                                    {member.points} pts
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'members' && (
                    <div className="space-y-4">
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            <input 
                                type="text" 
                                placeholder="Filtrar membros da sala..." 
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="w-full pl-12 p-3 rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-bible-darkPaper text-sm outline-none focus:ring-2 ring-bible-gold"
                            />
                        </div>

                        <div className="bg-white dark:bg-bible-darkPaper rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
                            {filteredParticipants.length === 0 ? (
                                <div className="p-8 text-center text-gray-400 text-sm">
                                    {searchTerm ? 'Nenhum membro encontrado com este filtro.' : 'Nenhum membro na sala.'}
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                                    {filteredParticipants.map(p => {
                                        const userTeam = planTeams.find(t => t.id === p.team);
                                        return (
                                            <div key={p.uid} className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                                                        {p.photoURL ? <img src={p.photoURL} className="w-full h-full object-cover" /> : <Users className="w-full h-full p-2 text-gray-400"/>}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-2">
                                                            {p.displayName}
                                                            {p.status === 'blocked' && <span className="bg-red-100 text-red-600 text-[9px] px-2 py-0.5 rounded font-black uppercase">Bloqueado</span>}
                                                        </p>
                                                        <div className="flex items-center gap-2 text-xs text-gray-500">
                                                            <span>@{p.username}</span>
                                                            {userTeam && <span className={`w-2 h-2 rounded-full ${userTeam.color}`}></span>}
                                                            {userTeam && <span className="text-[10px] font-bold">{userTeam.name}</span>}
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                <div className="flex gap-2">
                                                    {p.status === 'blocked' ? (
                                                        <button onClick={() => handleAction(p.uid, 'unblock')} className="p-2 text-green-600 hover:bg-green-50 rounded-lg text-xs font-bold" title="Desbloquear"><CheckCircle2 size={16}/></button>
                                                    ) : (
                                                        <button onClick={() => handleAction(p.uid, 'block')} className="p-2 text-orange-500 hover:bg-orange-50 rounded-lg text-xs font-bold" title="Bloquear"><Ban size={16}/></button>
                                                    )}
                                                    <button onClick={() => handleAction(p.uid, 'remove')} className="p-2 text-red-500 hover:bg-red-50 rounded-lg text-xs font-bold" title="Remover da Sala"><Trash2 size={16}/></button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                )}
                
                {activeTab === 'invites' && (
                    <div className="space-y-6 animate-in fade-in">
                        <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-100 dark:border-blue-800 text-xs text-blue-800 dark:text-blue-200">
                            <strong>Nota Pastoral:</strong> Pesquise por nome ou @username. Adicionar um membro por aqui o inscreve automaticamente na sala.
                        </div>

                        <div className="space-y-4">
                            <div className="flex flex-col md:flex-row gap-2">
                                {plan.isRanked && (
                                    <div className="w-full md:w-1/3">
                                        <select 
                                            value={selectedTeamForInvite} 
                                            onChange={(e) => setSelectedTeamForInvite(e.target.value)}
                                            className="w-full p-3 bg-white dark:bg-bible-darkPaper border border-gray-200 dark:border-gray-800 rounded-xl text-sm font-bold outline-none"
                                        >
                                            <option value="">Sem Time (Automático)</option>
                                            {planTeams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                        </select>
                                    </div>
                                )}
                                <div className="relative flex-1">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                    <input 
                                        type="text" 
                                        placeholder="Pesquisar Membros (Nome ou @username)..." 
                                        value={inviteSearch}
                                        onChange={e => setInviteSearch(e.target.value)}
                                        className="w-full pl-12 p-3 bg-white dark:bg-bible-darkPaper border border-gray-200 dark:border-gray-800 rounded-xl text-sm font-bold outline-none focus:border-bible-gold"
                                    />
                                    {isSearching && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-bible-gold" size={16} />}
                                </div>
                            </div>

                            <div className="bg-white dark:bg-bible-darkPaper rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden min-h-[100px]">
                                {searchResults.length === 0 ? (
                                    <div className="p-8 text-center text-gray-400 text-xs italic">
                                        {inviteSearch.length >= 2 ? 'Nenhum usuário encontrado.' : 'Digite pelo menos 2 letras para pesquisar.'}
                                    </div>
                                ) : (
                                    <div className="divide-y divide-gray-100 dark:divide-gray-800 max-h-60 overflow-y-auto custom-scrollbar">
                                        {searchResults.map(user => (
                                            <div key={user.uid} className="p-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                                                        {user.photoURL ? <img src={user.photoURL} className="w-full h-full object-cover" /> : <User className="w-full h-full p-1.5 text-gray-400"/>}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-gray-900 dark:text-white">{user.displayName}</p>
                                                        <p className="text-[10px] text-gray-500">@{user.username}</p>
                                                    </div>
                                                </div>
                                                <button 
                                                    onClick={() => handleAddUser(user)}
                                                    className="bg-green-600 text-white px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-1 hover:bg-green-700 transition-colors shadow-sm disabled:opacity-50"
                                                    disabled={addingUid === user.uid}
                                                >
                                                    {addingUid === user.uid ? <Loader2 size={12} className="animate-spin" /> : <UserPlus size={12} />} 
                                                    Adicionar
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            
                            <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Link de Convite Externo</label>
                                <div className="flex gap-2">
                                    <div className="flex-1 p-3 bg-gray-100 dark:bg-black/40 rounded-xl text-xs text-gray-500 truncate font-mono border border-gray-200 dark:border-gray-800">
                                        {`${window.location.origin}/#/jornada/${plan.id}`}
                                    </div>
                                    <button 
                                        onClick={copyInviteText}
                                        className="px-4 bg-bible-gold text-white rounded-xl flex items-center justify-center hover:bg-yellow-600 transition-colors shadow-sm"
                                    >
                                        <Copy size={16} />
                                    </button>
                                    <button 
                                        onClick={() => {
                                             const url = `${window.location.origin}/#/jornada/${plan.id}`;
                                             const text = `Participe da jornada "${plan.title}" no BíbliaLM: ${url}`;
                                             window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
                                        }}
                                        className="px-4 bg-green-500 text-white rounded-xl flex items-center justify-center hover:bg-green-600 transition-colors shadow-sm"
                                    >
                                        <Send size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                
                {activeTab === 'settings' && (
                    <div className="space-y-6 animate-in fade-in">
                        <div className="bg-white dark:bg-bible-darkPaper p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
                            <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-6">
                                <Settings size={20} className="text-gray-400" /> Configurações da Sala
                            </h3>
                            
                            <div className="space-y-6">
                                <div>
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block flex items-center gap-1">
                                        <Globe size={12}/> Privacidade
                                    </label>
                                    <select 
                                        value={privacyType} 
                                        onChange={(e) => setPrivacyType(e.target.value as any)}
                                        className="w-full p-4 bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-gray-700 rounded-xl font-bold text-sm outline-none focus:ring-2 ring-bible-gold"
                                    >
                                        <option value="public">Público (Todos podem ver e entrar)</option>
                                        <option value="followers">Apenas Seguidores</option>
                                        <option value="church">Minha Igreja (Apenas membros)</option>
                                        <option value="group">Apenas Convidados (Link Privado)</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block flex items-center gap-1">
                                        <Lock size={12}/> Status da Sala
                                    </label>
                                    <div className="flex gap-2">
                                        <button 
                                            onClick={() => setPlanStatus('draft')} 
                                            className={`flex-1 py-3 rounded-xl text-xs font-bold border-2 transition-all ${planStatus === 'draft' ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20 text-orange-600' : 'border-gray-200 dark:border-gray-700 text-gray-400'}`}
                                        >
                                            Rascunho (Oculto)
                                        </button>
                                        <button 
                                            onClick={() => setPlanStatus('published')} 
                                            className={`flex-1 py-3 rounded-xl text-xs font-bold border-2 transition-all ${planStatus === 'published' ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-600' : 'border-gray-200 dark:border-gray-700 text-gray-400'}`}
                                        >
                                            Publicado (Ativo)
                                        </button>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex justify-end">
                                    <button 
                                        onClick={handleSaveSettings}
                                        disabled={isSavingSettings}
                                        className="bg-bible-gold text-white px-8 py-3 rounded-xl font-black uppercase text-xs tracking-widest shadow-lg flex items-center gap-2 hover:opacity-90 disabled:opacity-50"
                                    >
                                        {isSavingSettings ? <Loader2 className="animate-spin"/> : <Save size={16}/>}
                                        Salvar Alterações
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    </div>
  );
};

export default PlanManagementModal;
