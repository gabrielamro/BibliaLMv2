"use client";
import { useNavigate, useLocation, useParams, useSearchParams } from '../../utils/router';


import React, { useEffect, useState, useCallback, useRef } from 'react';

import Link from "next/link";
import { dbService } from '../../services/supabase';
import { ChurchGroup, UserProfile, PrayerRequest } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { useHeader } from '../../contexts/HeaderContext';
import { 
  Loader2, Boxes, MessageSquare, Heart, Plus, ArrowLeft, 
  CheckCircle2, Star, Sparkles, Send, Users, Shield, Calendar, Edit2, Trash2,
  MessageCircle, MoreHorizontal, Trophy, BookOpen, Crown,
  User as UserIcon,
  Smile,
  Share2,
  Settings,
  CornerDownRight,
  LayoutGrid,
  AtSign,
  Check,
  CornerUpLeft
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
                        <Edit2 size={14} className="text-purple-600" /> Editar
                    </button>
                    <button onClick={() => { onDelete(prayer.id); setIsOpen(false); }} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 dark:hover:bg-red-900/20 text-left text-xs font-bold text-red-500 transition-colors">
                        <Trash2 size={14} /> Excluir
                    </button>
                </div>
            )}
        </div>
    );
};

const CellForumPage: React.FC = () => {
    const { cellSlug } = useParams<{ cellSlug: string }>(); // Mantido cellSlug para compatibilidade de rotas
    const navigate = useNavigate();
    const location = useLocation();
    const { currentUser, userProfile, recordActivity, showNotification, openLogin, earnMana } = useAuth();
    const { setTitle, setBreadcrumbs, resetHeader } = useHeader();
    
    const isSocialMode = location.pathname.startsWith('/social');
    const basePath = isSocialMode ? '/social' : '';

    const [group, setGroup] = useState<ChurchGroup | null>(null);

    // --- HEADER MANAGEMENT ---
    useEffect(() => {
        if (group) {
            setTitle(group.name);
            setBreadcrumbs([
                { label: 'Comunidade', path: '/social' },
                { label: group.name }
            ]);
        }
        return () => resetHeader();
    }, [group, setTitle, setBreadcrumbs, resetHeader]);

    const [subgroups, setSubgroups] = useState<ChurchGroup[]>([]);
    const [parentGroup, setParentGroup] = useState<ChurchGroup | null>(null);
    const [prayers, setPrayers] = useState<PrayerRequest[]>([]);
    const [members, setMembers] = useState<UserProfile[]>([]);
    const [newPrayer, setNewPrayer] = useState('');
    const [loading, setLoading] = useState(true);
    const [isPosting, setIsPosting] = useState(false);
    const [activeTab, setActiveTab] = useState<'mural' | 'subgroups' | 'ranking'>('mural');
    
    const [isCellOptionsOpen, setIsCellOptionsOpen] = useState(false);
    const [showDeleteCellModal, setShowDeleteCellModal] = useState(false);
    const [prayerToEdit, setPrayerToEdit] = useState<PrayerRequest | null>(null);
    const [prayerToDelete, setPrayerToDelete] = useState<string | null>(null);
    const [cellToEdit, setCellToEdit] = useState<ChurchGroup | null>(null);
    const [activeReactionPicker, setActiveReactionPicker] = useState<string | null>(null);

    // Subgroup Creation States
    const [isCreatingSubgroup, setIsCreatingSubgroup] = useState(false);
    const [newSubgroupName, setNewSubgroupName] = useState('');
    const [newSubgroupLeader, setNewSubgroupLeader] = useState('');
    const [leaderResults, setLeaderResults] = useState<UserProfile[]>([]);
    const [isSearchingLeader, setIsSearchingLeader] = useState(false);
    const [selectedLeader, setSelectedLeader] = useState<UserProfile | null>(null);
    const searchTimeoutRef = useRef<any>(null);

    const optionsRef = useRef<HTMLDivElement>(null);

    const loadGroup = useCallback(async () => {
        if (!cellSlug) return;
        setLoading(true);
        try {
            // Busca o grupo atual pelo slug
            const data = await dbService.getCellBySlug(cellSlug);
            if (data) {
                setGroup(data);
                
                // Fetch paralelo: mural, membros, subgrupos e (se houver) grupo pai
                const promises: Promise<any>[] = [
                    dbService.getPrayerRequests('cell', data.id),
                    dbService.getCellMembers(data.id),
                    dbService.getSubgroups(data.id)
                ];

                // Se tiver parentGroupId, buscamos os detalhes do pai para breadcrumbs
                if (data.parentGroupId) {
                    // Aqui precisaríamos de um getGroupById, mas podemos usar a lógica de getAll e filtrar ou assumir que o pai existe
                    // Como não temos um getById direto exportado no helper anterior, vamos adaptar ou usar o que tem
                    // Simplificação: não buscamos o nome do pai agora para evitar complexidade extra sem endpoint, 
                    // mas idealmente mostrariamos "Voltar para [Nome Pai]"
                }

                const [prayersList, membersList, subgroupsList] = await Promise.all(promises);
                
                setPrayers(prayersList);
                setMembers(membersList);
                setSubgroups(subgroupsList);
            }
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    }, [cellSlug]);

    useEffect(() => { loadGroup(); }, [loadGroup]);

    useEffect(() => {
        const handleOutside = (e: MouseEvent) => {
            if (optionsRef.current && !optionsRef.current.contains(e.target as Node)) setIsCellOptionsOpen(false);
        };
        document.addEventListener('mousedown', handleOutside);
        return () => document.removeEventListener('mousedown', handleOutside);
    }, []);

    // Leader Search Effect
    useEffect(() => {
        const searchVal = newSubgroupLeader.trim();
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
    }, [newSubgroupLeader]);

    const handleSelectLeader = (user: UserProfile) => {
        setSelectedLeader(user);
        setNewSubgroupLeader(user.displayName);
        setLeaderResults([]);
    };

    const handlePostPrayer = async () => {
        if (!newPrayer.trim() || !currentUser || !group) return;
        setIsPosting(true);
        try {
            const prayerData: Omit<PrayerRequest, 'id'> = {
                userId: currentUser.uid,
                userName: userProfile?.displayName || 'Participante',
                userPhotoURL: userProfile?.photoURL || undefined,
                content: newPrayer,
                createdAt: new Date().toISOString(),
                intercessorsCount: 0,
                intercessors: [],
                targetType: 'cell',
                targetId: group.id,
                churchId: group.churchId,
                cellName: group.name
            };
            const id = await dbService.addPrayerRequest('cell', group.id, prayerData);
            setPrayers(prev => [{ ...prayerData, id } as PrayerRequest, ...prev]);
            setNewPrayer('');
            showNotification("Publicado no grupo!", "success");
            await recordActivity('prayer_wall', `Postou no grupo ${group.name}`);
        } finally {
            setIsPosting(false);
        }
    };

    const handleIntercede = async (prayer: PrayerRequest, emoji: string) => {
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
                showNotification(`Reagiu com ${emoji}`, "success");
                if (emoji === '🔥') await earnMana('social_like');
            }
            setActiveReactionPicker(null);
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
            showNotification("Editado!", "success");
        } catch (e) { showNotification("Erro ao editar.", "error"); }
        setPrayerToEdit(null);
    };

    const handleDeletePrayer = (prayerId: string) => {
        setPrayerToDelete(prayerId);
    };

    const confirmDeletePrayer = async () => {
        if (!prayerToDelete) return;
        try {
            await dbService.deletePrayerRequest(prayerToDelete);
            setPrayers(prev => prev.filter(p => p.id !== prayerToDelete));
            showNotification("Postagem removida.", "info");
        } catch (e) { showNotification("Erro ao excluir.", "error"); }
        setPrayerToDelete(null);
    };

    const handleEditCell = () => {
        if (group) setCellToEdit(group);
    };

    const confirmEditCell = async (newName: string) => {
        if (!group) return;
        try {
            await dbService.updateCell(group.id, { name: newName });
            setGroup({ ...group, name: newName });
            showNotification("Grupo atualizado!", "success");
        } catch (e) { showNotification("Erro ao editar grupo.", "error"); }
        setCellToEdit(null);
    };

    const handleDeleteCell = async () => {
        if (!group) return;
        try {
            await dbService.deleteCell(group.id);
            showNotification("Grupo excluído permanentemente.", "info");
            navigate(-1);
        } catch (e) { showNotification("Erro ao excluir grupo.", "error"); }
    };

    const handleCreateSubgroup = async () => {
        if (!newSubgroupName.trim() || !group || !currentUser) return;
        setLoading(true);
        try {
            const slug = group.slug + '-' + newSubgroupName.toLowerCase().replace(/\s+/g, '-');
            let finalLeaderName = newSubgroupLeader.trim() || "Liderança não definida";
            let leaderUid = selectedLeader?.uid || undefined;
            if (selectedLeader) finalLeaderName = selectedLeader.displayName;
  
            const subgroupData = {
                churchId: group.churchId,
                parentGroupId: group.id, // Hierarquia
                name: newSubgroupName.trim(),
                slug,
                stats: { memberCount: 1, totalMana: 0 },
                leaderName: finalLeaderName,
                leaderUid,
                createdBy: currentUser.uid,
                createdAt: new Date().toISOString()
            };
  
            const id = await dbService.createCell(subgroupData);
            setSubgroups(prev => [...prev, { id, ...subgroupData } as ChurchGroup]);
            setIsCreatingSubgroup(false);
            setNewSubgroupName('');
            setNewSubgroupLeader('');
            setSelectedLeader(null);
            showNotification("Subgrupo criado com sucesso!", "success");
        } catch (e) {
            showNotification("Erro ao criar subgrupo.", "error");
        } finally {
            setLoading(false);
        }
    };

    const isMyGroup = userProfile?.churchData?.groupId === group?.id;
    const isCreator = currentUser && group && (group.createdBy === currentUser.uid);
    const daysSinceCreation = group ? Math.floor((Date.now() - new Date(group.createdAt).getTime()) / (1000 * 60 * 60 * 24)) : 0;
    const canDelete = isCreator && daysSinceCreation <= 20;

    if (loading) return <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-black"><Loader2 className="animate-spin text-bible-gold" size={40} /></div>;
    if (!group) return <div className="h-screen flex flex-col items-center justify-center p-6 text-center"><h2 className="text-xl font-bold">Grupo não encontrado</h2><button onClick={() => navigate(-1)} className="mt-4 text-bible-gold font-bold">Voltar</button></div>;

    const reactions = ['🙌', '🙏', '🔥', '❤️', '📖'];

    return (
        <div className="h-full bg-gray-50 dark:bg-black/20 overflow-y-auto">
            <SEO title={`Fórum ${group.name}`} />
            
            <div className="h-40 md:h-48 bg-gradient-to-br from-purple-600 to-indigo-700 relative">
                <div className="absolute inset-0 flex items-center justify-center opacity-10"><Boxes size={120} /></div>
                
                {isCreator && (
                    <div className="absolute top-4 right-4 z-40" ref={optionsRef}>
                        <button 
                            onClick={() => setIsCellOptionsOpen(!isCellOptionsOpen)}
                            className="p-3 bg-black/40 text-white rounded-full backdrop-blur-md hover:bg-black/60 transition-all shadow-xl border border-white/20"
                            title="Gerenciar Grupo"
                        >
                            <Settings size={20} className={isCellOptionsOpen ? 'rotate-90' : ''} style={{ transition: 'transform 0.4s' }} />
                        </button>
                        {isCellOptionsOpen && (
                            <div className="absolute right-0 mt-3 w-56 bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-700 py-3 z-50 animate-in fade-in zoom-in-95 origin-top-right">
                                <div className="px-4 py-2 border-b border-gray-50 dark:border-gray-700 mb-2">
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Opções do Criador</span>
                                </div>
                                <button onClick={() => { handleEditCell(); setIsCellOptionsOpen(false); }} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 text-left text-xs font-bold text-gray-600 dark:text-gray-300 transition-colors">
                                    <Edit2 size={14} className="text-purple-600" /> Editar Nome do Fórum
                                </button>
                                {canDelete ? (
                                    <button onClick={() => { setShowDeleteCellModal(true); setIsCellOptionsOpen(false); }} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 dark:hover:bg-red-900/20 text-left text-xs font-bold text-red-500 transition-colors">
                                        <Trash2 size={14} /> Excluir Grupo Permanentemente
                                    </button>
                                ) : (
                                    <div className="px-4 py-3 mt-1 bg-gray-50 dark:bg-gray-900/50">
                                        <p className="text-[8px] text-gray-400 uppercase font-black tracking-tighter text-center leading-tight">
                                            A exclusão automática expirou<br/>(Prazo: 20 dias após criação)
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className="max-w-3xl mx-auto px-4 pb-32 relative z-10 -mt-10">
                <div className="bg-white dark:bg-bible-darkPaper rounded-[2rem] shadow-xl p-6 md:p-8 border border-gray-100 dark:border-gray-800 text-center mb-6">
                    <div className="w-20 h-20 bg-white dark:bg-gray-800 rounded-2xl border-4 border-white dark:border-bible-darkPaper shadow-xl mx-auto flex items-center justify-center -mt-16 mb-4">
                        <Boxes size={32} className="text-purple-600" />
                    </div>
                    
                    {/* BREADCRUMBS SE FOR SUBGRUPO */}
                    {group.parentGroupId && (
                        <div className="flex justify-center mb-2">
                            <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full text-[10px] font-bold text-gray-500">
                                <CornerUpLeft size={10} /> Subgrupo
                            </span>
                        </div>
                    )}

                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Fórum de Adoração e Comunhão</p>
                    
                    <div className="flex justify-center bg-gray-100 dark:bg-gray-800 p-1 rounded-xl w-fit mx-auto mb-4 shadow-inner overflow-x-auto no-scrollbar max-w-full">
                        <button onClick={() => setActiveTab('mural')} className={`px-6 py-2 rounded-lg text-xs font-black uppercase transition-all whitespace-nowrap ${activeTab === 'mural' ? 'bg-white dark:bg-gray-700 text-purple-600 shadow-sm' : 'text-gray-400'}`}>Mural</button>
                        <button onClick={() => setActiveTab('subgroups')} className={`px-6 py-2 rounded-lg text-xs font-black uppercase transition-all whitespace-nowrap ${activeTab === 'subgroups' ? 'bg-white dark:bg-gray-700 text-purple-600 shadow-sm' : 'text-gray-400'}`}>Subgrupos</button>
                        <button onClick={() => setActiveTab('ranking')} className={`px-6 py-2 rounded-lg text-xs font-black uppercase transition-all whitespace-nowrap ${activeTab === 'ranking' ? 'bg-white dark:bg-gray-700 text-purple-600 shadow-sm' : 'text-gray-400'}`}>Ranking</button>
                    </div>

                    <div className="flex justify-center gap-6 pt-4 border-t border-gray-50 dark:border-gray-800">
                        <div className="text-center"><span className="block font-black text-purple-600">{members.length}</span><span className="text-[9px] font-bold text-gray-400 uppercase">Membros</span></div>
                        <div className="text-center">
                            <span className="block font-black text-gray-900 dark:text-white">
                                {group.leaderUid ? (
                                    <Link href={`${basePath}/u/${group.leaderName?.replace('@','')}`} className="hover:text-bible-gold transition-colors underline decoration-bible-gold/30">{group.leaderName}</Link>
                                ) : group.leaderName}
                            </span>
                            <span className="text-[9px] font-bold text-gray-400 uppercase">Líder</span>
                        </div>
                    </div>
                </div>

                {activeTab === 'mural' && (
                    <div className="space-y-6">
                        {isMyGroup ? (
                            <div className="bg-white dark:bg-bible-darkPaper p-5 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800">
                                <textarea 
                                    value={newPrayer} 
                                    onChange={(e) => setNewPrayer(e.target.value)} 
                                    placeholder="Compartilhe uma palavra ou pedido com seu grupo..." 
                                    className="w-full bg-transparent outline-none text-sm resize-none h-20 p-2 placeholder-gray-400" 
                                />
                                <div className="flex justify-end mt-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                                    <button 
                                        onClick={handlePostPrayer} 
                                        disabled={!newPrayer.trim() || isPosting}
                                        className="bg-purple-600 text-white px-6 py-2 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-purple-700 transition-all disabled:opacity-50 shadow-md"
                                    >
                                        {isPosting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />} Postar
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="p-8 bg-purple-50 dark:bg-purple-900/10 rounded-[2rem] text-center border-2 border-dashed border-purple-100">
                                <Shield size={32} className="mx-auto text-purple-300 mb-2 opacity-50" />
                                <p className="text-sm text-purple-800 dark:text-purple-300 font-bold uppercase tracking-tighter">Apenas membros do grupo podem postar.</p>
                                <p className="text-[10px] text-purple-600/70 mt-1 uppercase font-medium">Interceda pelas mensagens abaixo!</p>
                            </div>
                        )}

                        <div className="space-y-4">
                            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Atividade do Grupo</h3>
                            {prayers.map(p => (
                                <div key={p.id} className="bg-white dark:bg-bible-darkPaper p-6 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-sm animate-in fade-in group transition-all hover:shadow-md relative">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden flex items-center justify-center border border-gray-200">
                                                {p.userPhotoURL ? <img src={p.userPhotoURL} className="w-full h-full object-cover"/> : <span className="font-bold text-xs text-gray-400">{p.userName.substring(0,1)}</span>}
                                            </div>
                                            <div><h4 className="font-bold text-sm text-gray-900 dark:text-white leading-tight">{p.userName}</h4><span className="text-[9px] text-gray-400 uppercase font-medium">{new Date(p.createdAt).toLocaleDateString()}</span></div>
                                        </div>
                                        {currentUser?.uid === p.userId && (
                                            <PostMenu prayer={p} onEdit={handleEditPrayer} onDelete={handleDeletePrayer} />
                                        )}
                                    </div>
                                    <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed font-medium">"{p.content}"</p>
                                    
                                    {/* Lista de Respostas */}
                                    <ResponseList prayer={p} />

                                    <div className="mt-4 pt-3 border-t border-gray-50 dark:border-gray-800 flex justify-between items-center">
                                        <div className="flex items-center gap-4">
                                            <div className="relative">
                                                <button 
                                                    onClick={() => setActiveReactionPicker(activeReactionPicker === p.id ? null : p.id)}
                                                    className={`flex items-center gap-1.5 text-xs font-bold transition-all p-2 rounded-xl ${p.intercessors?.includes(currentUser?.uid || '') ? 'text-bible-gold bg-bible-gold/10' : 'text-gray-400 hover:text-bible-gold hover:bg-gray-50'}`}
                                                >
                                                    <MessageCircle size={16} /> 
                                                    Responder
                                                </button>
                                                
                                                {activeReactionPicker === p.id && (
                                                    <div className="absolute bottom-full left-0 mb-2 bg-white dark:bg-gray-800 rounded-full shadow-2xl border border-gray-100 dark:border-gray-700 p-1.5 flex gap-1 z-50 animate-in zoom-in slide-in-from-bottom-2">
                                                        {reactions.map(emoji => (
                                                            <button 
                                                                key={emoji} 
                                                                onClick={() => handleIntercede(p, emoji)}
                                                                className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-xl transition-transform active:scale-125"
                                                            >
                                                                {emoji}
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                            
                                            <span className="text-[10px] font-bold text-gray-300 uppercase tracking-tighter">
                                                {p.intercessorsCount} bençãos
                                            </span>
                                        </div>
                                        <button className="p-1 text-gray-200 hover:text-bible-gold transition-colors">
                                            <Share2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'subgroups' && (
                    <div className="space-y-6 animate-in fade-in">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-gray-800 dark:text-gray-200 text-sm uppercase tracking-wide flex items-center gap-2"><LayoutGrid size={18} /> Subgrupos ({subgroups.length})</h3>
                            {(isCreator || isMyGroup) && (
                                <button onClick={() => setIsCreatingSubgroup(true)} className="text-[10px] font-black uppercase tracking-widest bg-bible-gold/10 text-bible-gold px-3 py-1.5 rounded-full flex items-center gap-1 hover:bg-bible-gold/20 transition-colors"><Plus size={14}/> Criar Subgrupo</button>
                            )}
                        </div>

                        {isCreatingSubgroup && (
                            <div className="bg-white dark:bg-bible-darkPaper p-6 rounded-[2rem] border-2 border-dashed border-bible-gold/30 mb-6 animate-in zoom-in-95 relative z-50">
                                <h4 className="font-bold text-sm mb-4">Novo Subgrupo em {group.name}</h4>
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-[10px] font-black text-gray-400 uppercase ml-1 mb-1 block">Nome do Subgrupo</label>
                                        <input type="text" value={newSubgroupName} onChange={(e) => setNewSubgroupName(e.target.value)} placeholder="Ex: Grupo de Jovens, Louvor..." className="w-full p-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl outline-none focus:ring-2 ring-bible-gold font-bold" />
                                    </div>
                                    
                                    <div className="relative">
                                        <label className="text-[10px] font-black text-gray-400 uppercase ml-1 mb-1 block">Líder (Opcional)</label>
                                        <div className="relative">
                                            <AtSign className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                            <input 
                                                type="text" 
                                                value={newSubgroupLeader} 
                                                onChange={(e) => {
                                                    setNewSubgroupLeader(e.target.value);
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
                                    <button onClick={() => { setIsCreatingSubgroup(false); setSelectedLeader(null); setNewSubgroupLeader(''); }} className="flex-1 py-3 bg-gray-100 dark:bg-gray-800 text-gray-500 rounded-xl text-xs font-bold transition-colors">Cancelar</button>
                                    <button onClick={handleCreateSubgroup} disabled={!newSubgroupName.trim()} className="flex-1 py-3 bg-bible-leather dark:bg-bible-gold text-white dark:text-black rounded-xl text-xs font-bold shadow-lg disabled:opacity-50 transition-all">Criar</button>
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {subgroups.map(sub => (
                                <div key={sub.id} onClick={() => navigate(`${basePath}/grupo/${sub.slug}`)} className="bg-white dark:bg-bible-darkPaper p-6 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-sm group hover:border-bible-gold cursor-pointer transition-all">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h4 className="font-bold text-gray-900 dark:text-white group-hover:text-bible-gold transition-colors">{sub.name}</h4>
                                            <div className="flex items-center gap-1">
                                                <span className="text-[10px] font-bold text-gray-400 uppercase">Líder:</span>
                                                <span className="text-[10px] font-bold text-gray-600 dark:text-gray-300">{sub.leaderName || "Indefinido"}</span>
                                            </div>
                                        </div>
                                        <span className="bg-purple-50 dark:bg-purple-900/20 text-purple-600 px-2 py-1 rounded text-[9px] font-black uppercase">{sub.stats.memberCount} M.</span>
                                    </div>
                                    <div className="w-full flex items-center justify-center py-2 bg-gray-50 dark:bg-gray-900 text-gray-400 rounded-xl text-xs font-bold gap-1 group-hover:text-bible-gold group-hover:bg-bible-gold/10 transition-colors">
                                        Entrar no Subgrupo <ArrowLeft size={14} className="rotate-180" />
                                    </div>
                                </div>
                            ))}
                        </div>
                        {subgroups.length === 0 && (
                            <div className="py-10 text-center text-gray-400 italic">Nenhum subgrupo criado.</div>
                        )}
                    </div>
                )}

                {activeTab === 'ranking' && (
                    <div className="animate-in fade-in">
                        <div className="bg-white dark:bg-bible-darkPaper p-8 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-800">
                            <h3 className="font-bold text-lg mb-6 flex items-center gap-2 text-purple-600"><Trophy size={20} /> Ranking de Estudo</h3>
                            <div className="space-y-4">
                                {members.map((member, idx) => (
                                    <Link key={member.uid} href={isSocialMode ? `/social/u/${member.username}` : `/${member.username}`} className="flex items-center gap-4 p-4 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all border border-transparent hover:border-purple-100">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm ${idx === 0 ? 'bg-yellow-100 text-yellow-700' : idx === 1 ? 'bg-gray-100 text-gray-500' : 'text-gray-300'}`}>
                                            {idx === 0 ? <Crown size={16} /> : idx + 1}
                                        </div>
                                        <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700">
                                            {member.photoURL ? <img src={member.photoURL} className="w-full h-full object-cover" /> : <UserIcon className="m-auto mt-2 text-gray-400" size={18}/>}
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-bold text-gray-900 dark:text-white leading-tight">{member.displayName}</p>
                                            <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest flex items-center gap-1"><BookOpen size={10}/> {member.stats?.totalChaptersRead || 0} capítulos</p>
                                        </div>
                                        <div className="text-right">
                                            <span className="block font-black text-purple-600">{member.lifetimeXp}</span>
                                            <span className="text-[8px] font-bold text-gray-400 uppercase tracking-tighter">Maná</span>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
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
                isOpen={!!cellToEdit}
                onClose={() => setCellToEdit(null)}
                onConfirm={confirmEditCell}
                title="Editar Fórum"
                label="Nome do Grupo"
                defaultValue={cellToEdit?.name || ''}
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

            <ConfirmationModal 
                isOpen={showDeleteCellModal}
                onClose={() => setShowDeleteCellModal(false)}
                onConfirm={handleDeleteCell}
                title="Excluir Grupo"
                message="Deseja realmente excluir este fórum permanentemente? Esta ação não pode ser desfeita."
                confirmText="Sim, Excluir"
                cancelText="Cancelar"
                variant="danger"
            />
        </div>
    );
};

export default CellForumPage;
