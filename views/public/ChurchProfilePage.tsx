"use client";
import { useNavigate, useLocation, useParams, useSearchParams } from '../../utils/router';

import React, { useEffect, useState, useCallback, useRef } from 'react';

import Link from "next/link";
import { dbService, uploadBlob } from '../../services/supabase';
import { Church, UserProfile, ChurchGroup, PrayerRequest } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Loader2, MapPin, Users, Shield, ArrowLeft, Trophy, LogIn, 
  CheckCircle2, MessageSquareHeart, Heart, Send, Plus, 
  Home, Crown, Star, ChevronRight, Calendar, Info, Share2, 
  Flame, LayoutGrid, Award, Bell, Boxes, MessageSquare, Edit2, Trash2, AtSign, Zap, BookOpen, Brain, MapPinned,
  User as UserIcon, Search, X, Check, UserCheck, Camera, MoreHorizontal, UserCog, ChevronDown, CornerDownRight
} from 'lucide-react';
import SEO from '../../components/SEO';
import ConfirmationModal from '../../components/ConfirmationModal';
import PromptModal from '../../components/PromptModal';

// Novo componente para exibir reações como respostas
const ResponseList = ({ prayer }: { prayer: PrayerRequest }) => {
    if (!prayer.intercessors || prayer.intercessors.length === 0) return null;
    
    return (
        <div className="mt-4 pt-3 border-t border-gray-50 dark:border-gray-800 space-y-2">
            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-1">
                <CornerDownRight size={10} /> Intercessões do Grupo
            </p>
            <div className="flex flex-wrap gap-1.5">
                {prayer.intercessors.map((uid, idx) => (
                    <div key={`${uid}-${idx}`} className="flex items-center gap-1 bg-gray-50 dark:bg-gray-900/50 px-2 py-1 rounded-full border border-gray-100 dark:border-gray-800">
                        <span className="text-xs">🙏</span>
                        <span className="text-[10px] font-bold text-gray-500">Irmão</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

const PostMenu = ({ prayer, onEdit, onDelete }: { prayer: PrayerRequest, onEdit: (p: PrayerRequest) => void, onDelete: (id: string) => void }) => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const handleOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) setIsOpen(false);
        };
        document.addEventListener('mousedown', handleOutside);
        return () => document.removeEventListener('mousedown', handleOutside);
    }, []);
    return (
        <div className="relative" ref={menuRef}>
            <button onClick={() => setIsOpen(!isOpen)} className="text-gray-400 hover:text-gray-600 p-2 transition-colors"><MoreHorizontal size={18}/></button>
            {isOpen && (
                <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 py-2 z-50 animate-in fade-in zoom-in-95">
                    <button onClick={() => { onEdit(prayer); setIsOpen(false); }} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 text-left text-xs font-bold text-gray-600 dark:text-gray-300 transition-colors">
                        <Edit2 size={14} className="text-bible-gold" /> Editar
                    </button>
                    <button onClick={() => { onDelete(prayer.id); setIsOpen(false); }} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 dark:hover:bg-red-900/20 text-left text-xs font-bold text-red-500 transition-colors">
                        <Trash2 size={14} /> Excluir
                    </button>
                </div>
            )}
        </div>
    );
};

const ChurchProfilePage: React.FC = () => {
  const { churchSlug } = useParams<{ churchSlug: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, userProfile, recordActivity, openLogin, showNotification, earnMana } = useAuth();
  
  const [church, setChurch] = useState<Church | null>(null);
  const [groups, setGroups] = useState<ChurchGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'mural' | 'groups' | 'info'>('mural');
  const [prayers, setPrayers] = useState<PrayerRequest[]>([]);
  const [newPrayer, setNewPrayer] = useState('');
  const [isPostingPrayer, setIsPostingPrayer] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  
  const [members, setMembers] = useState<UserProfile[]>([]);
  const [followers, setFollowers] = useState<any[]>([]);
  const [loadingPeople, setLoadingPeople] = useState(false);

  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupLeader, setNewGroupLeader] = useState('');
  const [newGroupParentId, setNewGroupParentId] = useState('');
  const [leaderResults, setLeaderResults] = useState<UserProfile[]>([]);
  const [isSearchingLeader, setIsSearchingLeader] = useState(false);
  const [selectedLeader, setSelectedLeader] = useState<UserProfile | null>(null);
  const searchTimeoutRef = useRef<any>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUpdatingLogo, setIsUpdatingLogo] = useState(false);

  // Modal States
  const [prayerToEdit, setPrayerToEdit] = useState<PrayerRequest | null>(null);
  const [prayerToDelete, setPrayerToDelete] = useState<string | null>(null);
  const [isEditingPastor, setIsEditingPastor] = useState(false);

  const isSocialMode = location.pathname.startsWith('/social');
  const basePath = isSocialMode ? '/social' : '';

  const loadChurchData = useCallback(async () => {
      if (!churchSlug) return;
      setLoading(true);
      try {
          const data = await dbService.getChurchBySlug(churchSlug);
          if (data) {
              setChurch(data);
              
              if (currentUser) {
                  dbService.checkIsFollowing(currentUser.uid, data.id).then(setIsFollowing).catch(() => {});
              }

              // Carregamento resiliente (try/catch individuais para não quebrar a página toda se um índice faltar)
              try {
                  const loadedGroups = await dbService.getChurchRootGroups(data.id);
                  setGroups(loadedGroups);
              } catch (err) { console.error("Erro ao carregar grupos:", err); }

              try {
                  const loadedPrayers = await dbService.getUnifiedChurchMural(data.id);
                  setPrayers(loadedPrayers);
              } catch (err: any) { 
                  console.error("Erro ao carregar mural (possível falta de índice):", err);
                  if (err.code === 'failed-precondition' || err.message.includes('index')) {
                      // Silently fail or log for admin - functionality unavailable until index built
                  }
              }
          }
      } catch (e) { 
          console.error("Erro crítico ao carregar igreja:", e); 
      } finally { 
          setLoading(false); 
      }
  }, [churchSlug, currentUser]);

  useEffect(() => {
    loadChurchData();
  }, [loadChurchData]);

  const loadCommunityLists = async () => {
      if (!church) return;
      setLoadingPeople(true);
      try {
          const [mList, fList] = await Promise.all([
              dbService.getChurchMembers(church.id),
              dbService.getChurchFollowers(church.id)
          ]);
          setMembers(mList);
          setFollowers(fList);
      } catch (e) { console.error(e); }
      finally { setLoadingPeople(false); }
  };

  useEffect(() => {
      if (activeTab === 'info' && church) loadCommunityLists();
  }, [activeTab, church]);

  useEffect(() => {
    const searchVal = newGroupLeader.trim();
    if (searchVal.startsWith('@') && searchVal.length > 2) {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
      searchTimeoutRef.current = setTimeout(async () => {
        setIsSearchingLeader(true);
        try {
          const results = await dbService.searchUsersByUsername(searchVal.substring(1));
          setLeaderResults(results);
        } catch (e) {
          console.error("Error searching for leader:", e);
        } finally {
          setIsSearchingLeader(false);
        }
      }, 500);
    } else {
      setLeaderResults([]);
    }
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [newGroupLeader]);

  const handleSelectLeader = (user: UserProfile) => {
    setSelectedLeader(user);
    setNewGroupLeader(user.displayName);
    setLeaderResults([]);
  };

  const handleFollowToggle = async () => {
      if (!currentUser || !church) { openLogin(); return; }
      const previous = isFollowing;
      setIsFollowing(!previous);
      try {
          if (previous) {
              await dbService.unfollowChurch(currentUser.uid, church.id);
          } else {
              await dbService.followChurch(
                  currentUser.uid, 
                  church.id, 
                  { displayName: userProfile?.displayName, photoURL: userProfile?.photoURL, username: userProfile?.username },
                  { name: church.name, slug: church.slug, logoUrl: church.logoUrl }
              );
              await earnMana('social_follow');
              showNotification(`Você está seguindo ${church.name}`, "success");
          }
      } catch (e) { setIsFollowing(previous); }
  };

  const isMember = userProfile?.churchData?.churchId === church?.id;
  const isOwner = currentUser && church?.admins?.includes(currentUser.uid);
  const isVisionary = userProfile?.subscriptionTier === 'gold';
  const canChangeLogo = isOwner || isVisionary;

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!church || !e.target.files?.[0]) return;
    setIsUpdatingLogo(true);
    try {
        const file = e.target.files[0];
        const path = `church_logos/${church.id}_${Date.now()}`;
        const url = await uploadBlob(file, path);
        await dbService.updateChurch(church.id, { logoUrl: url });
        setChurch({ ...church, logoUrl: url });
        showNotification("Foto da igreja atualizada!", "success");
    } catch (err) {
        showNotification("Erro ao atualizar foto.", "error");
    } finally {
        setIsUpdatingLogo(false);
    }
  };

  const handleUpdatePastor = async (newName: string) => {
    if (!church) return;
    try {
        await dbService.updateChurch(church.id, { pastorName: newName });
        setChurch({ ...church, pastorName: newName });
        showNotification("Liderança atualizada com sucesso!", "success");
    } catch (e) {
        showNotification("Erro ao atualizar liderança.", "error");
    }
  };

  const handlePostPrayer = async () => {
    if (!newPrayer.trim() || !currentUser || !church) return;
    setIsPostingPrayer(true);
    try {
        const prayerData: Omit<PrayerRequest, 'id'> = {
            userId: currentUser.uid,
            userName: userProfile?.displayName || 'Irmão',
            userPhotoURL: userProfile?.photoURL || undefined,
            content: newPrayer,
            createdAt: new Date().toISOString(),
            intercessorsCount: 0,
            intercessors: [],
            targetType: 'church',
            targetId: church.id,
            churchId: church.id
        };
        const id = await dbService.addPrayerRequest('church', church.id, prayerData);
        setPrayers(prev => [{ ...prayerData, id } as PrayerRequest, ...prev]);
        setNewPrayer('');
        showNotification("Publicado!", "success");
        await recordActivity('prayer_wall', 'Postou no mural da igreja');
    } finally {
        setIsPostingPrayer(false);
    }
  };

  const handleIntercede = async (prayer: PrayerRequest) => {
    if (!currentUser) { openLogin(); return; }
    const isInterceding = prayer.intercessors?.includes(currentUser.uid);
    
    setPrayers(prev => prev.map(p => {
        if (p.id === prayer.id) {
            const count = isInterceding ? (p.intercessorsCount - 1) : (p.intercessorsCount + 1);
            const list = isInterceding 
                ? p.intercessors.filter(id => id !== currentUser.uid)
                : [...(p.intercessors || []), currentUser.uid];
            return { ...p, intercessorsCount: count, intercessors: list };
        }
        return p;
    }));

    try {
        await dbService.togglePrayerIntercession(prayer.id, currentUser.uid, !!isInterceding);
        if (!isInterceding) {
            showNotification("Intercedendo!", "success");
        }
    } catch (e) { console.error(e); }
  };

  const handleEditPrayer = (prayer: PrayerRequest) => {
      setPrayerToEdit(prayer);
  };

  const confirmEditPrayer = async (newContent: string) => {
    if (!prayerToEdit) return;
    try {
        await dbService.updatePrayerRequest(prayerToEdit.id, newContent);
        setPrayers(prev => prev.map(p => p.id === prayerToEdit.id ? { ...p, content: newContent } : p));
        showNotification("Atualizado!", "success");
    } catch (e) { showNotification("Erro ao editar.", "error"); }
    setPrayerToEdit(null);
  };

  const handleDeletePrayer = (id: string) => {
      setPrayerToDelete(id);
  };

  const confirmDeletePrayer = async () => {
    if (!prayerToDelete) return;
    try {
        await dbService.deletePrayerRequest(prayerToDelete);
        setPrayers(prev => prev.filter(p => p.id !== prayerToDelete));
        showNotification("Mensagem removida.", "info");
    } catch (e) { showNotification("Erro ao excluir.", "error"); }
    setPrayerToDelete(null);
  };

  const handleCreateGroup = async () => {
      if (!newGroupName.trim() || !church || !currentUser) return;
      setLoading(true);
      try {
          const slug = church.slug + '-' + newGroupName.toLowerCase().replace(/\s+/g, '-');
          let finalLeaderName = newGroupLeader.trim() || "Liderança não definida";
          let leaderUid = selectedLeader?.uid || undefined;
          if (selectedLeader) finalLeaderName = selectedLeader.displayName;

          const groupData = {
              churchId: church.id,
              parentGroupId: newGroupParentId || undefined,
              name: newGroupName.trim(),
              slug,
              stats: { memberCount: 1, totalMana: 0 },
              leaderName: finalLeaderName,
              leaderUid,
              createdBy: currentUser.uid,
              createdAt: new Date().toISOString()
          };

          const id = await dbService.createCell(groupData);
          
          if (!newGroupParentId) {
              setGroups(prev => [...prev, { id, ...groupData } as ChurchGroup]);
          }
          
          setIsCreatingGroup(false);
          setNewGroupName('');
          setNewGroupLeader('');
          setNewGroupParentId('');
          setSelectedLeader(null);
          showNotification("Grupo criado com sucesso!", "success");
      } catch (e) {
          showNotification("Erro ao criar grupo.", "error");
      } finally {
          setLoading(false);
      }
  };

  const handleJoinGroup = async (group: ChurchGroup) => {
      if (!currentUser) { openLogin(); return; }
      setLoading(true);
      try {
          await dbService.joinCell(currentUser.uid, group.id, { name: group.name, slug: group.slug });
          showNotification(`Bem-vindo ao grupo ${group.name}!`, "success");
          // Re-fetch groups to update status, but handle gracefully
          try {
            const updatedGroups = await dbService.getChurchRootGroups(church!.id);
            setGroups(updatedGroups);
          } catch(e) {}
      } catch (e) {
          showNotification("Erro ao entrar no grupo.", "error");
      } finally {
          setLoading(false);
      }
  };

  if (loading && !church) return <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-black"><Loader2 className="animate-spin text-bible-gold" size={40} /></div>;
  if (!church) return <div className="h-screen flex flex-col items-center justify-center p-6 text-center"><h2 className="text-xl font-bold">Igreja não encontrada</h2><button onClick={() => navigate(`${basePath}/explorar`)} className="mt-4 text-bible-gold font-bold">Voltar</button></div>;

  return (
    <div className="h-full bg-gray-50 dark:bg-black/20 overflow-y-auto">
        <SEO title={church.name} description={`Comunidade ${church.name} no BíbliaLM.`} />
        
        <div className="h-44 md:h-52 bg-[#3d2b25] relative overflow-hidden">
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)', backgroundSize: '15px 15px' }}></div>
        </div>
        
        <div className="max-w-5xl mx-auto px-4 pb-32 relative z-10">
            <div className="relative -mt-20 mb-8">
                <div className="bg-white dark:bg-bible-darkPaper rounded-[2.5rem] shadow-2xl p-6 md:p-10 border border-gray-100 dark:border-gray-800 transition-all">
                    
                    <div className="flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-8 mb-10">
                        <div className="relative group">
                            <div className="w-32 h-32 md:w-36 md:h-36 bg-white dark:bg-gray-800 rounded-[2.2rem] border-2 border-gray-100 dark:border-gray-700 shadow-xl flex-shrink-0 flex items-center justify-center overflow-hidden">
                                {isUpdatingLogo ? (
                                    <Loader2 className="animate-spin text-bible-gold" size={32} />
                                ) : church.logoUrl ? (
                                    <img src={church.logoUrl} className="w-full h-full object-cover" alt={church.name} />
                                ) : (
                                    <Shield size={64} className="text-gray-100 dark:text-gray-700" />
                                )}
                            </div>
                            
                            {canChangeLogo && (
                                <>
                                    <button 
                                        onClick={() => fileInputRef.current?.click()}
                                        className="absolute -bottom-2 -right-2 bg-bible-gold text-white p-2.5 rounded-full shadow-lg border-2 border-white dark:border-bible-darkPaper hover:scale-110 transition-transform"
                                        title="Trocar foto da igreja"
                                    >
                                        <Camera size={16} />
                                    </button>
                                    <input type="file" ref={fileInputRef} onChange={handleLogoUpload} className="hidden" accept="image/*" />
                                </>
                            )}
                        </div>

                        <div className="flex-1 text-center md:text-left pt-2">
                            <h1 className="text-3xl md:text-4xl font-serif font-black text-gray-900 dark:text-white leading-tight mb-1 tracking-tight">
                                {church.name}
                            </h1>

                            <div className="flex flex-col gap-1 mb-4">
                                <div className="flex items-center justify-center md:justify-start gap-2">
                                    <Crown size={18} className="text-bible-gold fill-bible-gold/10" />
                                    {church.pastorName ? (
                                        <p className="text-base font-bold text-bible-gold">
                                            Pastor(a): {church.pastorName}
                                        </p>
                                    ) : (
                                        <span className="text-sm font-medium text-gray-400 italic">Liderança não informada</span>
                                    )}
                                    
                                    {isMember && (
                                        <button 
                                            onClick={() => setIsEditingPastor(true)}
                                            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-bible-gold transition-colors flex items-center gap-1 group/edit"
                                            title={church.pastorName ? "Editar Liderança" : "Cadastrar Liderança"}
                                        >
                                            {church.pastorName ? <Edit2 size={14} /> : <Plus size={14} className="group-hover/edit:scale-125 transition-transform"/>}
                                            {!church.pastorName && <span className="text-[10px] font-black uppercase tracking-tighter">Cadastrar</span>}
                                        </button>
                                    )}
                                </div>

                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center justify-center md:justify-start gap-2">
                                    <MapPin size={12} className="text-bible-gold" /> {church.location.city}, {church.location.state}
                                </p>
                            </div>

                            <div className="flex items-center justify-center md:justify-start gap-2">
                                <button 
                                    onClick={handleFollowToggle}
                                    className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg transition-all active:scale-95 ${isFollowing ? 'bg-gray-100 text-gray-400' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                                >
                                    <Bell size={16} fill={isFollowing ? "currentColor" : "none"} />
                                    {isFollowing ? 'SEGUINDO' : 'SEGUIR'}
                                </button>

                                {!isMember && (
                                    <button 
                                        onClick={() => navigate(`${basePath}/social/church`)}
                                        className="flex items-center gap-2 bg-bible-leather dark:bg-bible-gold text-white dark:text-black px-6 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg hover:opacity-90 transition-all active:scale-95"
                                    >
                                        <LogIn size={16} />
                                        SOU MEMBRO
                                    </button>
                                )}

                                {isMember && (
                                    <div className="flex items-center gap-2 bg-green-50 text-green-600 px-4 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest border border-green-100">
                                        <UserCheck size={16} />
                                        Membro Ativo
                                    </div>
                                )}

                                <button 
                                    onClick={async () => {
                                        if (navigator.share) await navigator.share({ title: church.name, url: window.location.href });
                                        else { await navigator.clipboard.writeText(window.location.href); showNotification("Link copiado!", "success"); }
                                    }}
                                    className="p-3 bg-gray-50 dark:bg-gray-800 text-gray-400 hover:text-bible-gold rounded-2xl transition-all shadow-sm border border-gray-100 dark:border-gray-700"
                                >
                                    <Share2 size={18} />
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 border-t border-gray-50 dark:border-gray-800 pt-8 gap-4">
                        <div className="text-center md:text-left">
                            <span className="block text-2xl font-black text-gray-900 dark:text-white mb-0.5 leading-none">
                                {church.stats.memberCount || 0}
                            </span>
                            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Fiéis</span>
                        </div>
                        
                        <div className="text-center md:text-left border-l border-gray-100 dark:border-gray-800 pl-4">
                            <span className="block text-2xl font-black text-gray-900 dark:text-white mb-0.5 leading-none">
                                {church.stats.followersCount || 0}
                            </span>
                            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Seguidores</span>
                        </div>

                        <div className="text-center md:text-left border-l border-gray-100 dark:border-gray-800 pl-4">
                            <span className="block text-2xl font-black text-purple-600 mb-0.5 leading-none">
                                {church.stats.totalMana || 0}
                            </span>
                            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Vitalidade</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex bg-white dark:bg-bible-darkPaper p-1.5 rounded-[1.5rem] border border-gray-100 dark:border-gray-800 mb-8 shadow-sm overflow-x-auto no-scrollbar">
                <button onClick={() => setActiveTab('mural')} className={`flex-1 min-w-[100px] flex items-center justify-center gap-2 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${activeTab === 'mural' ? 'bg-bible-gold text-white shadow-md' : 'text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}><MessageSquareHeart size={16} /> Mural</button>
                <button onClick={() => setActiveTab('groups')} className={`flex-1 min-w-[100px] flex items-center justify-center gap-2 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${activeTab === 'groups' ? 'bg-bible-gold text-white shadow-md' : 'text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}><Boxes size={16} /> Grupos</button>
                <button onClick={() => setActiveTab('info')} className={`flex-1 min-w-[100px] flex items-center justify-center gap-2 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${activeTab === 'info' ? 'bg-bible-gold text-white shadow-md' : 'text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}><Info size={16} /> Info</button>
            </div>

            <div className="min-h-[300px]">
                {activeTab === 'mural' && (
                    <div className="space-y-6 animate-in fade-in">
                        {isMember && (
                            <div className="bg-white dark:bg-bible-darkPaper p-4 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm flex gap-3">
                                <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden flex items-center justify-center shrink-0 border border-gray-200">
                                    {userProfile?.photoURL ? <img src={userProfile.photoURL} className="w-full h-full object-cover"/> : <UserIcon size={20} className="text-gray-400" />}
                                </div>
                                <div className="flex-1">
                                    <textarea value={newPrayer} onChange={(e) => setNewPrayer(e.target.value)} placeholder="Compartilhe um pedido de oração ou testemunho com a igreja..." className="w-full bg-transparent outline-none text-sm resize-none h-12 pt-2 placeholder-gray-400" />
                                    <div className="flex justify-between items-center mt-2 border-t border-gray-100 dark:border-gray-800 pt-2">
                                        <span className="text-[10px] font-bold text-gray-400 uppercase">Mural da Igreja</span>
                                        <button onClick={handlePostPrayer} disabled={!newPrayer.trim() || isPostingPrayer} className="bg-bible-leather dark:bg-bible-gold text-white dark:text-black px-4 py-1.5 rounded-lg text-xs font-bold hover:opacity-90 transition-opacity disabled:opacity-50 shadow-sm">Publicar</button>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div className="space-y-4">
                            {prayers.map(prayer => (
                                <div key={prayer.id} className="bg-white dark:bg-bible-darkPaper p-6 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-sm animate-in fade-in group transition-all hover:shadow-md relative">
                                    {prayer.cellName && (
                                        <div className="absolute top-4 right-14 flex items-center gap-1 bg-purple-50 dark:bg-purple-900/20 text-purple-600 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border border-purple-100">
                                            <Boxes size={10}/> Grupo: {prayer.cellName}
                                        </div>
                                    )}
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden flex items-center justify-center border border-gray-200">
                                                {prayer.userPhotoURL ? <img src={prayer.userPhotoURL} className="w-full h-full object-cover"/> : <span className="font-bold text-xs text-gray-400">{prayer.userName.substring(0,1)}</span>}
                                            </div>
                                            <div><h4 className="font-bold text-sm text-gray-900 dark:text-white leading-tight">{prayer.userName}</h4><span className="text-[9px] text-gray-400 uppercase font-medium">{new Date(prayer.createdAt).toLocaleDateString()}</span></div>
                                        </div>
                                        {currentUser?.uid === prayer.userId && (
                                            <PostMenu prayer={prayer} onEdit={handleEditPrayer} onDelete={handleDeletePrayer} />
                                        )}
                                    </div>
                                    <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed mb-4">"{prayer.content}"</p>
                                    <div className="flex items-center justify-between border-t border-gray-50 dark:border-gray-800 pt-3">
                                        <button 
                                            onClick={() => handleIntercede(prayer)} 
                                            className={`flex items-center gap-2 text-xs font-bold transition-all ${prayer.intercessors?.includes(currentUser?.uid || '') ? 'text-red-500 scale-105' : 'text-gray-400 hover:text-red-500'}`}
                                        >
                                            <Heart size={16} fill={prayer.intercessors?.includes(currentUser?.uid || '') ? "currentColor" : "none"} />
                                            {prayer.intercessorsCount} Intercessões
                                        </button>
                                        <span className="text-[9px] text-gray-300 font-bold uppercase">{new Date(prayer.createdAt).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            ))}
                            {prayers.length === 0 && (
                                <div className="text-center py-12 text-gray-400 text-sm">
                                    Nenhuma oração ou mensagem no mural.
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'groups' && (
                    <div className="space-y-6 animate-in fade-in">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-gray-800 dark:text-gray-200 text-sm uppercase tracking-wide flex items-center gap-2"><Boxes size={18} /> Grupos ({groups.length})</h3>
                            {isMember && (
                                <button onClick={() => setIsCreatingGroup(true)} className="text-[10px] font-black uppercase tracking-widest bg-bible-gold/10 text-bible-gold px-3 py-1.5 rounded-full flex items-center gap-1 hover:bg-bible-gold/20 transition-colors"><Plus size={14}/> Criar Grupo</button>
                            )}
                        </div>

                        {/* Modal/Area de Criação de Grupo (Mantido do anterior) */}
                        {isCreatingGroup && (
                            <div className="bg-white dark:bg-bible-darkPaper p-6 rounded-[2rem] border-2 border-dashed border-bible-gold/30 mb-6 animate-in zoom-in-95 relative z-50">
                                <h4 className="font-bold text-sm mb-4">Novo Grupo</h4>
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-[10px] font-black text-gray-400 uppercase ml-1 mb-1 block">Nome do Grupo</label>
                                        <input type="text" value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} placeholder="Ex: Betel ou Casa da Paz" className="w-full p-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl outline-none focus:ring-2 ring-bible-gold font-bold" />
                                    </div>

                                    <div className="relative">
                                        <label className="text-[10px] font-black text-gray-400 uppercase ml-1 mb-1 block">Vincular a Grupo (Opcional)</label>
                                        <div className="relative">
                                            <select 
                                                value={newGroupParentId} 
                                                onChange={(e) => setNewGroupParentId(e.target.value)}
                                                className="w-full p-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl outline-none focus:ring-2 ring-bible-gold font-bold text-sm appearance-none text-gray-700 dark:text-gray-200"
                                            >
                                                <option value="">Nenhum (Grupo Principal)</option>
                                                {groups.map(g => (
                                                    <option key={g.id} value={g.id}>{g.name}</option>
                                                ))}
                                            </select>
                                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                                        </div>
                                    </div>
                                    
                                    <div className="relative">
                                        <label className="text-[10px] font-black text-gray-400 uppercase ml-1 mb-1 block">Líder do Grupo (Opcional)</label>
                                        <div className="relative">
                                            <AtSign className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                            <input 
                                                type="text" 
                                                value={newGroupLeader} 
                                                onChange={(e) => {
                                                    setNewGroupLeader(e.target.value);
                                                    if (selectedLeader) setSelectedLeader(null);
                                                }} 
                                                placeholder="Nome ou @username" 
                                                className={`w-full pl-12 pr-10 p-4 bg-gray-50 dark:bg-gray-900 rounded-2xl border outline-none focus:ring-2 ring-bible-gold font-bold ${selectedLeader ? 'border-bible-gold' : 'border-gray-200 dark:border-gray-700'}`} 
                                            />
                                            {isSearchingLeader && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-bible-gold" size={18} />}
                                            {selectedLeader && <Check className="absolute right-4 top-1/2 -translate-y-1/2 text-green-500" size={18} />}
                                        </div>

                                        {leaderResults.length > 0 && (
                                            <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden z-[100] animate-in fade-in slide-in-from-top-2">
                                                <div className="p-2 bg-gray-50 dark:bg-gray-900 border-b border-gray-100 dark:border-gray-700">
                                                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-2">Membro Encontrado</span>
                                                </div>
                                                {leaderResults.map(user => (
                                                    <button 
                                                        key={user.uid}
                                                        onClick={() => handleSelectLeader(user)}
                                                        className="w-full flex items-center gap-3 p-3 hover:bg-bible-gold/5 text-left transition-colors border-b border-gray-50 dark:border-gray-700 last:border-0"
                                                    >
                                                        <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200 shrink-0">
                                                            {user.photoURL ? <img src={user.photoURL} className="w-full h-full object-cover" /> : <UserIcon size={16} className="m-auto mt-2 text-gray-400" />}
                                                        </div>
                                                        <p className="text-sm font-bold text-gray-900 dark:text-white leading-tight">{user.displayName}</p>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="flex gap-2 mt-6">
                                    <button onClick={() => { setIsCreatingGroup(false); setSelectedLeader(null); setNewGroupLeader(''); setNewGroupParentId(''); }} className="flex-1 py-3 bg-gray-100 dark:bg-gray-800 text-gray-500 rounded-xl text-xs font-bold transition-colors">Cancelar</button>
                                    <button onClick={handleCreateGroup} disabled={!newGroupName} className="flex-1 py-3 bg-bible-leather dark:bg-bible-gold text-white dark:text-black rounded-xl text-xs font-bold shadow-lg disabled:opacity-50 transition-all">Criar</button>
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {groups.map(group => {
                                const isMyGroup = userProfile?.churchData?.groupId === group.id;
                                return (
                                    <div key={group.id} className="bg-white dark:bg-bible-darkPaper p-6 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-sm group">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <h4 className="font-bold text-gray-900 dark:text-white group-hover:text-bible-gold transition-colors">{group.name}</h4>
                                                <div className="flex items-center gap-1">
                                                    <span className="text-[10px] font-bold text-gray-400 uppercase">Líder:</span>
                                                    {group.leaderUid ? (
                                                        <Link href={`${basePath}/u/${group.leaderName?.replace('@','')}`} className="text-[10px] font-black text-bible-gold hover:underline flex items-center gap-1">
                                                            {group.leaderName} <CheckCircle2 size={10} className="fill-bible-gold text-white" />
                                                        </Link>
                                                    ) : (
                                                        <span className="text-[10px] font-bold text-gray-600 dark:text-gray-300">{group.leaderName || "Indefinido"}</span>
                                                    )}
                                                </div>
                                            </div>
                                            <span className="bg-purple-50 dark:bg-purple-900/20 text-purple-600 px-2 py-1 rounded text-[9px] font-black uppercase">{group.stats.memberCount} Membros</span>
                                        </div>
                                        <div className="flex gap-2">
                                            <button 
                                                onClick={() => navigate(`${basePath}/grupo/${group.slug}`)}
                                                className="flex-1 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-xl text-xs font-bold hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                                            >
                                                <MessageSquare size={14} /> Fórum
                                            </button>
                                            {!isMyGroup && isMember && (
                                                <button onClick={() => handleJoinGroup(group)} className="flex-1 py-2.5 bg-bible-gold text-white dark:text-black rounded-xl text-xs font-bold shadow-sm hover:opacity-90 transition-opacity">Participar</button>
                                            )}
                                            {isMyGroup && (
                                                <div className="flex-1 flex items-center justify-center gap-2 text-green-600 text-xs font-bold"><CheckCircle2 size={16}/> Meu Grupo</div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        {groups.length === 0 && (
                            <div className="py-20 text-center text-gray-400 italic">Nenhum grupo cadastrado ainda.</div>
                        )}
                    </div>
                )}

                {activeTab === 'info' && (
                    <div className="space-y-8 animate-in fade-in">
                        <div className="bg-white dark:bg-bible-darkPaper p-8 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-800">
                            <h3 className="font-bold text-lg mb-6 flex items-center gap-2 text-bible-gold"><MapPinned size={20} /> Endereço e Localização</h3>
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-2xl"><MapPin size={24} className="text-gray-400" /></div>
                                <div>
                                    <p className="text-gray-900 dark:text-white font-bold text-lg">{church.location.address || 'Endereço não cadastrado'}</p>
                                    <p className="text-gray-500 font-medium">{church.location.city}, {church.location.state}</p>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-white dark:bg-bible-darkPaper p-8 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-800">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="font-bold flex items-center gap-2 text-bible-gold"><UserCheck size={20} /> Membros da Igreja</h3>
                                    <span className="bg-bible-gold/10 text-bible-gold px-3 py-1 rounded-full text-[10px] font-black">{members.length}</span>
                                </div>
                                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 no-scrollbar">
                                    {members.map(member => (
                                        <Link key={member.uid} href={`${basePath}/u/${member.username}`} className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                            <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700">
                                                {member.photoURL ? <img src={member.photoURL} className="w-full h-full object-cover" /> : <UserIcon className="m-auto mt-2 text-gray-400" size={20}/>}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-gray-900 dark:text-white">{member.displayName}</p>
                                                <p className="text-[10px] text-gray-400">@{member.username}</p>
                                            </div>
                                        </Link>
                                    ))}
                                    {members.length === 0 && <p className="text-xs text-gray-400 italic text-center py-4">Nenhum membro vinculado.</p>}
                                </div>
                            </div>

                            <div className="bg-white dark:bg-bible-darkPaper p-8 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-800">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="font-bold flex items-center gap-2 text-gray-500"><Users size={20} /> Seguidores</h3>
                                    <span className="bg-gray-100 dark:bg-gray-800 text-gray-500 px-3 py-1 rounded-full text-[10px] font-black">{followers.length}</span>
                                </div>
                                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 no-scrollbar">
                                    {followers.map(follower => (
                                        <Link key={follower.id} href={`${basePath}/u/${follower.username}`} className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                            <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700">
                                                {follower.photoURL ? <img src={follower.photoURL} className="w-full h-full object-cover" /> : <UserIcon className="m-auto mt-2 text-gray-400" size={20}/>}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-gray-900 dark:text-white">{follower.displayName}</p>
                                                <p className="text-[10px] text-gray-400">@{follower.username}</p>
                                            </div>
                                        </Link>
                                    ))}
                                    {followers.length === 0 && <p className="text-xs text-gray-400 italic text-center py-4">Nenhum seguidor ainda.</p>}
                                </div>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-bible-darkPaper p-8 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-800">
                            <h3 className="font-bold text-lg mb-6 flex items-center gap-2 text-purple-600"><Zap size={20} /> Desempenho da Comunidade</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="p-6 bg-blue-50 dark:bg-blue-900/10 rounded-[2rem] border border-blue-100 dark:border-blue-800 text-center">
                                    <BookOpen size={28} className="mx-auto text-blue-600 mb-2" />
                                    <span className="block font-black text-2xl text-blue-700 dark:text-blue-300">{church.stats.totalChaptersRead || 0}</span>
                                    <span className="text-[10px] font-black uppercase text-blue-400 tracking-widest">Capítulos Lidos</span>
                                </div>
                                <div className="p-6 bg-purple-50 dark:bg-purple-900/10 rounded-[2rem] border border-purple-100 dark:border-purple-800 text-center">
                                    <Star size={28} className="mx-auto text-purple-600 mb-2" />
                                    <span className="block font-black text-2xl text-purple-700 dark:text-purple-300">{church.stats.totalMana || 0}</span>
                                    <span className="text-[10px] font-black uppercase text-blue-400 tracking-widest">Maná Acumulado</span>
                                </div>
                                <div className="p-6 bg-orange-50 dark:bg-orange-900/10 rounded-[2rem] border border-orange-100 dark:border-orange-800 text-center">
                                    <Brain size={28} className="mx-auto text-orange-600 mb-2" />
                                    <span className="block font-black text-2xl text-orange-700 dark:text-orange-300">{church.stats.totalStudiesCreated || 0}</span>
                                    <span className="text-[10px] font-black uppercase text-orange-400 tracking-widest">Estudos Gerados</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>

        <PromptModal 
            isOpen={!!prayerToEdit}
            onClose={() => setPrayerToEdit(null)}
            onConfirm={confirmEditPrayer}
            title="Editar Postagem"
            label="Mensagem no Grupo"
            defaultValue={prayerToEdit?.content || ''}
        />

        <PromptModal 
            isOpen={isEditingPastor}
            onClose={() => setIsEditingPastor(false)}
            onConfirm={handleUpdatePastor}
            title="Liderança da Igreja"
            label="Nome do Pastor(a) ou Líder"
            defaultValue={church.pastorName || ''}
            placeholder="Ex: Pr. João Silva"
        />

        <ConfirmationModal 
            isOpen={!!prayerToDelete}
            onClose={() => setPrayerToDelete(null)}
            onConfirm={confirmDeletePrayer}
            title="Excluir Postagem"
            message="Deseja remover esta mensagem do mural do grupo?"
            confirmText="Sim, Excluir"
            variant="danger"
        />
    </div>
  );
};

export default ChurchProfilePage;