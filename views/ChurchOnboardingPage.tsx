"use client";
import { useNavigate, useLocation, useSearchParams } from '../utils/router';

import React, { useState, useEffect, useRef } from 'react';

import { useAuth } from '../contexts/AuthContext';
import { dbService } from '../services/supabase';
import { generateSlug } from '../utils/textUtils';
import { Church, MapPin, Search, Plus, ArrowRight, ArrowLeft, CheckCircle2, ShieldCheck, Users, Loader2, AlertCircle, Trophy, Palette, Home, LogOut, ChevronRight, MapPinned, AtSign, Check, User as UserIcon, Crown, Lock, Zap } from 'lucide-react';
import { Church as ChurchType, ChurchGroup, UserProfile } from '../types';
import FirebaseTutorial from '../components/FirebaseTutorial';
import ConfirmationModal from '../components/ConfirmationModal';
import SocialNavigation from '../components/SocialNavigation';

const BRAZIL_STATES = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'];

const ChurchOnboardingPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, userProfile, earnMana, showNotification } = useAuth();

  const isSocialMode = location.pathname.startsWith('/social');

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showTutorial, setShowTutorial] = useState(false);
  
  // ... Restante do estado e lógica (Mantido Igual)
  const [modalConfig, setModalConfig] = useState<{isOpen: boolean, title: string, message: string, onConfirm: () => void, variant?: any}>({
      isOpen: false, title: '', message: '', onConfirm: () => {}
  });

  const [state, setState] = useState(userProfile?.state || '');
  const [city, setCity] = useState(userProfile?.city || '');
  const [citiesList, setCitiesList] = useState<string[]>([]);
  const [loadingCities, setLoadingCities] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<ChurchType[]>([]);
  const [selectedChurch, setSelectedChurch] = useState<ChurchType | null>(null);

  const [newChurchName, setNewChurchName] = useState('');
  const [newChurchAddress, setNewChurchAddress] = useState('');
  const [newChurchSigla, setNewChurchSigla] = useState('');
  const [newChurchDenomination, setNewChurchDenomination] = useState('');
  const [hasTeams, setHasTeams] = useState(false);

  const [groups, setGroups] = useState<ChurchGroup[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<ChurchGroup | null>(null);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupLeader, setNewGroupLeader] = useState('');
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  
  const [leaderSearchResults, setLeaderSearchResults] = useState<UserProfile[]>([]);
  const [isSearchingLeader, setIsSearchingLeader] = useState(false);
  const [selectedLeaderUser, setSelectedLeaderUser] = useState<UserProfile | null>(null);
  const searchTimeoutRef = useRef<any>(null);

  // Verificação de Licença: Fiel (silver) ou Visionário (gold)
  const canRegisterChurch = userProfile?.subscriptionTier === 'silver' || userProfile?.subscriptionTier === 'gold';

  useEffect(() => {
    if (state) {
      setLoadingCities(true);
      fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${state}/municipios`)
        .then(res => res.json())
        .then(data => setCitiesList(data.map((c: any) => c.nome).sort()))
        .finally(() => setLoadingCities(false));
    }
  }, [state]);

  useEffect(() => {
    const term = newGroupLeader.trim();
    if (term.startsWith('@') && term.length > 2 && !selectedLeaderUser) {
        if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
        searchTimeoutRef.current = setTimeout(async () => {
            setIsSearchingLeader(true);
            try {
                const usernamePart = term.substring(1).toLowerCase();
                const results = await dbService.searchUsersByUsername(usernamePart);
                setLeaderSearchResults(results);
            } catch (e) { console.error(e); }
            finally { setIsSearchingLeader(false); }
        }, 400);
    } else {
        setLeaderSearchResults([]);
    }
  }, [newGroupLeader, selectedLeaderUser]);

  const handleSelectLeader = (user: UserProfile) => {
      setSelectedLeaderUser(user);
      setNewGroupLeader(user.displayName);
      setLeaderSearchResults([]);
  };

  const handleManualSearch = async () => {
    if (!city || !state) {
        showNotification("Selecione Estado e Cidade para buscar.", "info");
        return;
    }
    setLoading(true);
    setError(null);
    try {
        const results = await dbService.searchChurches(searchTerm, city, state);
        setSearchResults(results);
        setStep(2);
    } catch (e: any) {
        setError("Falha na busca. Verifique sua conexão.");
    } finally {
        setLoading(false);
    }
  };

  const handleCreateChurch = async () => {
      if (!currentUser) { navigate('/login'); return; }
      if (!canRegisterChurch) {
          showNotification("Apenas membros com Plano Fiel ou superior podem fundar igrejas.", "error");
          return;
      }
      if (!newChurchName.trim()) { showNotification("Digite o nome da igreja.", "error"); return; }
      
      setLoading(true);
      try {
          const slug = generateSlug(newChurchName + ' ' + state);
          const newChurch: Omit<ChurchType, 'id'> = {
              name: newChurchName,
              acronym: newChurchSigla.toUpperCase(),
              slug,
              denomination: newChurchDenomination,
              location: { city, state, address: newChurchAddress },
              stats: { memberCount: 1, totalMana: 0, totalChaptersRead: 0, totalStudiesCreated: 0 },
              teams: hasTeams ? ['Vermelho', 'Azul', 'Amarelo', 'Verde'] : [],
              teamScores: {},
              admins: [currentUser.uid]
          };
          const id = await dbService.createChurch(newChurch);
          setSelectedChurch({ id, ...newChurch });
          setStep(3);
      } catch (e: any) {
          setError("Erro ao cadastrar igreja. " + e.message);
      } finally {
          setLoading(false);
      }
  };

  const selectExistingChurch = async (church: ChurchType) => {
      setSelectedChurch(church);
      setLoading(true);
      try {
          const churchGroups = await dbService.getChurchRootGroups(church.id);
          setGroups(churchGroups);
          setStep(3);
      } catch(e) { console.error(e); }
      setLoading(false);
  };

  const handleCreateGroup = async () => {
      if (!selectedChurch || !newGroupName.trim() || !currentUser) return;
      
      setLoading(true);
      try {
          const newGroupData = {
              churchId: selectedChurch.id,
              name: newGroupName.trim(),
              slug: generateSlug(newGroupName),
              stats: { memberCount: 1, totalMana: 0 },
              leaderName: selectedLeaderUser ? selectedLeaderUser.displayName : (newGroupLeader.trim() || "Liderança Coletiva"),
              leaderUid: selectedLeaderUser?.uid,
              createdBy: currentUser.uid,
              createdAt: new Date().toISOString()
          };
          const id = await dbService.createCell(newGroupData);
          const groupWithId = { id, ...newGroupData } as ChurchGroup;
          setGroups(prev => [...prev, groupWithId]);
          setSelectedGroup(groupWithId);
          setIsCreatingGroup(false);
          setNewGroupName('');
          setNewGroupLeader('');
          setSelectedLeaderUser(null);
          showNotification("Grupo criado!", "success");
      } catch(e) { 
          showNotification("Erro ao salvar grupo.", "error"); 
          console.error(e);
      }
      setLoading(false);
  };

  const finishOnboarding = async () => {
      if (!currentUser || !selectedChurch) return;
      setLoading(true);
      try {
          await dbService.updateUserProfile(currentUser.uid, {
              churchData: {
                  churchId: selectedChurch.id,
                  churchName: selectedChurch.name,
                  churchSlug: selectedChurch.slug,
                  groupId: selectedGroup?.id,
                  groupName: selectedGroup?.name,
                  groupSlug: selectedGroup?.slug,
                  teamColor: selectedTeam || null,
                  isAnonymous: false
              }
          });
          await earnMana('daily_goal');
          navigate(`/social/igreja/${selectedChurch.slug}`);
      } catch (e) {
          showNotification("Erro ao concluir vínculo.", "error");
      } finally {
          setLoading(false);
      }
  };

  const [selectedTeam, setSelectedTeam] = useState<string>('');

  return (
    <div className="h-full bg-gray-50 dark:bg-black/20 flex flex-col overflow-hidden relative">
       {isSocialMode && <SocialNavigation activeTab="church" />}
       
       <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center">
       <div className="w-full max-w-xl pb-24">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 mb-10 text-gray-500 font-black uppercase text-[10px] tracking-[0.2em] hover:text-bible-gold transition-colors">
              <ArrowLeft size={16} /> Voltar
          </button>

          <div className="text-center mb-10">
              <div className="w-20 h-20 bg-bible-gold/10 rounded-[1.5rem] flex items-center justify-center mx-auto mb-6 text-bible-gold shadow-sm rotate-3">
                  <Church size={40} />
              </div>
              <h1 className="text-3xl font-serif font-bold text-gray-900 dark:text-white">Conexão Ecclesia</h1>
              <p className="text-gray-500 text-sm mt-3 leading-relaxed">Sua jornada espiritual é mais forte quando vivida em comunidade.</p>
          </div>

          {step === 1 && (
              <div className="bg-white dark:bg-bible-darkPaper p-8 rounded-[2.5rem] shadow-xl border border-gray-100 dark:border-gray-800 space-y-6 animate-in fade-in">
                  <div className="grid grid-cols-4 gap-3">
                      <div className="col-span-1">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2 block">UF</label>
                          <select value={state} onChange={(e) => setState(e.target.value)} className="w-full p-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl outline-none focus:ring-2 ring-bible-gold font-bold">
                              <option value="" disabled>UF</option>
                              {BRAZIL_STATES.map(uf => <option key={uf} value={uf}>{uf}</option>)}
                          </select>
                      </div>
                      <div className="col-span-3">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2 block">Cidade</label>
                          <select value={city} onChange={(e) => setCity(e.target.value)} className="w-full p-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl outline-none focus:ring-2 ring-bible-gold font-bold appearance-none disabled:opacity-50" disabled={!state}>
                              <option value="" disabled>{loadingCities ? 'Carregando...' : 'Escolha a Cidade'}</option>
                              {citiesList.map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                      </div>
                  </div>
                  <button onClick={handleManualSearch} disabled={loading || !city} className="w-full py-5 bg-bible-leather dark:bg-bible-gold text-white dark:text-black font-black uppercase tracking-widest rounded-2xl flex items-center justify-center gap-3 hover:opacity-90 shadow-xl disabled:opacity-50 transition-all">
                    {loading ? <Loader2 className="animate-spin" size={18} /> : <Search size={20} />} Buscar Igrejas Locais
                  </button>
              </div>
          )}

          {step === 2 && (
              <div className="space-y-6 animate-in slide-in-from-right-8">
                  <div className="flex items-center gap-2 bg-white dark:bg-bible-darkPaper p-2 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-md">
                      <div className="pl-4 text-gray-400"><Search size={20} /></div>
                      <input type="text" placeholder={`Filtrar por nome...`} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleManualSearch()} className="flex-1 p-3 bg-transparent outline-none text-sm font-bold" />
                      <button onClick={handleManualSearch} className="bg-bible-gold text-white p-3 rounded-xl shadow-lg hover:scale-105 transition-transform"><ArrowRight size={20} /></button>
                  </div>

                  <div className="space-y-4">
                      {searchResults.length > 0 ? searchResults.map(church => (
                          <div key={church.id} onClick={() => selectExistingChurch(church)} className="bg-white dark:bg-bible-darkPaper p-6 rounded-[2rem] border border-gray-100 dark:border-gray-800 flex justify-between items-center cursor-pointer hover:border-bible-gold hover:shadow-xl transition-all group">
                              <div className="flex items-center gap-4">
                                  <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center overflow-hidden border border-gray-100">
                                      {church.logoUrl ? <img src={church.logoUrl} className="w-full h-full object-cover" alt="" /> : <Church className="text-gray-400" size={24} />}
                                  </div>
                                  <div>
                                      <h4 className="font-bold text-gray-900 dark:text-white group-hover:text-bible-gold transition-colors">{church.name}</h4>
                                      <span className="text-[10px] font-black uppercase text-gray-400">{church.denomination || 'Cristã'}</span>
                                  </div>
                              </div>
                              <ChevronRight size={20} className="text-gray-300 group-hover:text-bible-gold transition-colors" />
                          </div>
                      )) : (
                          <div className="text-center py-10 bg-white dark:bg-bible-darkPaper rounded-[2rem] border-2 border-dashed border-gray-200 dark:border-gray-800">
                              <p className="text-sm text-gray-400 font-bold uppercase tracking-widest">Nenhuma igreja encontrada</p>
                          </div>
                      )}

                      {/* SEÇÃO DE CADASTRO COM TRAVA DE LICENÇA */}
                      <div className="bg-white dark:bg-bible-darkPaper p-8 rounded-[2.5rem] shadow-xl border border-gray-100 dark:border-gray-800 space-y-6 mt-10 relative overflow-hidden">
                          {!canRegisterChurch && (
                              <div className="absolute inset-0 bg-white/80 dark:bg-bible-darkPaper/80 backdrop-blur-[2px] z-20 flex flex-col items-center justify-center p-8 text-center animate-in fade-in">
                                  <div className="w-16 h-16 bg-bible-gold/10 text-bible-gold rounded-full flex items-center justify-center mb-4 border border-bible-gold/20">
                                      <Crown size={32} />
                                  </div>
                                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Fundação de Comunidade</h3>
                                  <p className="text-sm text-gray-500 mb-6 max-w-xs">
                                      Para fundar e gerenciar uma nova igreja no BíbliaLM, você precisa do <strong>Plano Fiel</strong> ou superior.
                                  </p>
                                  <button 
                                    onClick={() => navigate('/planos')}
                                    className="px-8 py-3 bg-bible-leather dark:bg-bible-gold text-white dark:text-black font-black uppercase tracking-widest rounded-xl shadow-lg flex items-center gap-2 hover:scale-105 transition-transform"
                                  >
                                      <Zap size={16} fill="currentColor" /> Ver Planos Premium
                                  </button>
                              </div>
                          )}

                          <h3 className="font-bold text-xl text-gray-900 dark:text-white flex items-center gap-3">
                            <Plus size={20} className="text-green-500" /> Cadastrar Minha Igreja
                          </h3>
                          <div className="space-y-4">
                              <div className="grid grid-cols-4 gap-3">
                                  <div className="col-span-3"><label className="text-[9px] font-black text-gray-400 uppercase ml-1">Nome</label><input type="text" value={newChurchName} onChange={(e) => setNewChurchName(e.target.value)} className="w-full p-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl outline-none focus:ring-2 ring-bible-gold font-bold" placeholder="Ex: Igreja Vida Cristã" /></div>
                                  <div className="col-span-1"><label className="text-[9px] font-black text-gray-400 uppercase ml-1">Sigla</label><input type="text" maxLength={6} value={newChurchSigla} onChange={(e) => setNewChurchSigla(e.target.value.toUpperCase())} className="w-full p-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl outline-none focus:ring-2 ring-bible-gold text-center font-black" placeholder="IVC" /></div>
                              </div>
                              <div>
                                  <label className="text-[9px] font-black text-gray-400 uppercase ml-1 block mb-1">Endereço Completo</label>
                                  <div className="relative">
                                      <MapPinned className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                      <input type="text" value={newChurchAddress} onChange={(e) => setNewChurchAddress(e.target.value)} className="w-full pl-12 p-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl outline-none focus:ring-2 ring-bible-gold text-sm font-medium" placeholder="Ex: Av. das Nações, 1000 - Centro" />
                                  </div>
                              </div>
                          </div>
                          <div className="flex items-center gap-4 p-4 bg-orange-50 dark:bg-orange-900/10 rounded-2xl border border-orange-100">
                              <input type="checkbox" checked={hasTeams} onChange={(e) => setHasTeams(e.target.checked)} className="w-6 h-6 accent-bible-gold rounded-lg" />
                              <div className="text-xs"><span className="font-black block uppercase tracking-tighter text-orange-900">Ativar Gincana?</span><span className="text-orange-700 opacity-80">Permite competições por equipes de cores.</span></div>
                          </div>
                          <button onClick={handleCreateChurch} disabled={loading || !newChurchName} className="w-full py-5 bg-green-600 text-white font-black uppercase tracking-widest rounded-2xl flex items-center justify-center gap-3 hover:bg-green-700 transition-all shadow-xl disabled:opacity-50">
                            {loading ? <Loader2 className="animate-spin" /> : <ShieldCheck size={20} />} Fundar Comunidade no BíbliaLM
                          </button>
                      </div>
                  </div>
              </div>
          )}

          {step === 3 && selectedChurch && (
              <div className="space-y-6 animate-in slide-in-from-right-8">
                  <div className="text-center">
                      <h2 className="text-2xl font-serif font-bold text-gray-900 dark:text-white mb-2">{selectedChurch.name}</h2>
                      <p className="text-gray-500 text-sm">Quase lá! Vincule seu pequeno grupo e equipe.</p>
                  </div>

                  <div className="bg-white dark:bg-bible-darkPaper p-8 rounded-[2.5rem] shadow-xl border border-gray-100 dark:border-gray-800 space-y-6">
                      <h3 className="font-bold text-xl flex items-center gap-3"><Users size={20} className="text-purple-500" /> Pequeno Grupo / Célula</h3>
                      {!isCreatingGroup ? (
                          <div className="space-y-4">
                              {groups.length > 0 ? (
                                  <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                                      {groups.map(group => (
                                          <div key={group.id} onClick={() => setSelectedGroup(group)} className={`p-4 rounded-xl flex justify-between items-center cursor-pointer transition-all border-2 ${selectedGroup?.id === group.id ? 'border-bible-gold bg-bible-gold/5' : 'border-gray-50 dark:bg-gray-900'}`}>
                                              <div><span className="font-bold text-sm block">{group.name}</span><span className="text-[10px] text-gray-400 uppercase font-bold">Líder: {group.leaderName || "Indefinido"}</span></div>
                                              {selectedGroup?.id === group.id && <CheckCircle2 size={20} className="text-bible-gold" />}
                                          </div>
                                      ))}
                                  </div>
                              ) : (
                                  <p className="text-sm text-gray-400 text-center py-6 bg-gray-50 dark:bg-gray-900 rounded-2xl">Nenhum grupo ainda.</p>
                              )}
                              <button onClick={() => setIsCreatingGroup(true)} className="w-full py-4 border-2 border-dashed border-gray-200 dark:border-gray-800 text-gray-400 font-bold rounded-xl hover:border-bible-gold hover:text-bible-gold transition-all flex items-center justify-center gap-2 group"><Plus size={20} /> Adicionar Grupo</button>
                          </div>
                      ) : (
                          <div className="space-y-4">
                              <input type="text" placeholder="Nome do Grupo (ex: Casa da Paz)" value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} className="w-full p-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 ring-bible-gold font-bold mb-2" />
                              
                              <div className="relative">
                                  <label className="text-[10px] font-black text-gray-400 uppercase ml-1 mb-1 block">Líder do Grupo (Opcional)</label>
                                  <div className="relative">
                                      <AtSign className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                      <input 
                                          type="text" 
                                          value={newGroupLeader} 
                                          onChange={(e) => {
                                              setNewGroupLeader(e.target.value);
                                              if (selectedLeaderUser) setSelectedLeaderUser(null);
                                          }} 
                                          placeholder="Nome por extenso ou @usuario" 
                                          className={`w-full pl-12 pr-10 p-4 bg-gray-50 dark:bg-gray-900 rounded-2xl border outline-none focus:ring-2 ring-bible-gold font-bold ${selectedLeaderUser ? 'border-bible-gold' : 'border-gray-200 dark:border-gray-700'}`} 
                                      />
                                      {isSearchingLeader && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-bible-gold" size={18} />}
                                      {selectedLeaderUser && <Check className="absolute right-4 top-1/2 -translate-y-1/2 text-green-500" size={18} />}
                                  </div>

                                  {leaderSearchResults.length > 0 && (
                                      <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden z-[100] animate-in fade-in slide-in-from-top-2">
                                          <div className="p-2 bg-gray-50 dark:bg-gray-900 border-b border-gray-100 dark:border-gray-700">
                                              <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-2">Membro Encontrado</span>
                                          </div>
                                          {leaderSearchResults.map(user => (
                                              <button 
                                                  key={user.uid}
                                                  onClick={() => handleSelectLeader(user)}
                                                  className="w-full flex items-center gap-3 p-3 hover:bg-bible-gold/5 text-left transition-colors border-b border-gray-50 dark:border-gray-700 last:border-0"
                                              >
                                                  <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200 shrink-0">
                                                      {user.photoURL ? <img src={user.photoURL} className="w-full h-full object-cover" /> : <UserIcon size={16} className="m-auto mt-2 text-gray-400" />}
                                                  </div>
                                                  <div>
                                                      <p className="text-sm font-bold text-gray-900 dark:text-white leading-tight">{user.displayName}</p>
                                                      <p className="text-[10px] text-gray-400">@{user.username}</p>
                                                  </div>
                                              </button>
                                          ))}
                                      </div>
                                  )}
                              </div>

                              <div className="flex gap-2 pt-2">
                                  <button onClick={() => setIsCreatingGroup(false)} className="flex-1 py-3 bg-gray-100 dark:bg-gray-800 text-gray-500 rounded-xl font-bold">Voltar</button>
                                  <button onClick={handleCreateGroup} disabled={!newGroupName} className="flex-1 py-3 bg-bible-gold text-white rounded-xl font-bold">Criar</button>
                              </div>
                          </div>
                      )}
                  </div>

                  {selectedChurch.teams && selectedChurch.teams.length > 0 && (
                      <div className="bg-white dark:bg-bible-darkPaper p-8 rounded-[2.5rem] shadow-xl border border-gray-100 dark:border-gray-800 space-y-6">
                          <h3 className="font-bold text-xl flex items-center gap-3"><Trophy size={20} className="text-orange-500" /> Sua Equipe na Gincana</h3>
                          <div className="grid grid-cols-2 gap-3">
                              {selectedChurch.teams.map(team => (
                                  <button key={team} onClick={() => setSelectedTeam(team)} className={`p-4 rounded-2xl border-2 font-black uppercase text-[10px] tracking-widest transition-all flex items-center justify-center gap-3 ${selectedTeam === team ? 'border-bible-gold bg-bible-gold/10 text-bible-leather dark:text-bible-gold' : 'border-transparent bg-gray-50 dark:bg-gray-900 text-gray-400'}`}>
                                      <div className={`w-3 h-3 rounded-full ${team.toLowerCase().includes('vermelh') ? 'bg-red-500' : team.toLowerCase().includes('azul') ? 'bg-blue-500' : team.toLowerCase().includes('amarel') ? 'bg-yellow-500' : 'bg-green-500'}`}></div>
                                      {team}
                                  </button>
                              ))}
                          </div>
                      </div>
                  )}

                  <button onClick={finishOnboarding} disabled={loading} className="w-full py-5 bg-bible-leather dark:bg-bible-gold text-white dark:text-black font-black uppercase tracking-[0.2em] rounded-2xl shadow-2xl flex items-center justify-center gap-3 hover:opacity-90 active:scale-[0.98] transition-all">
                    {loading ? <Loader2 className="animate-spin" /> : <CheckCircle2 size={24} />} Concluir Vínculo
                  </button>
              </div>
          )}
       </div>
       </div>
       <FirebaseTutorial isOpen={showTutorial} onClose={() => setShowTutorial(false)} />
    </div>
  );
};

export default ChurchOnboardingPage;