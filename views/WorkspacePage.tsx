"use client";
import { useNavigate } from '../utils/router';

import React, { useState, useEffect, useMemo } from 'react';

import { useAuth } from '../contexts/AuthContext';
import { dbService } from '../services/supabase';
import { SavedStudy, CustomPlan, Note, ContentStatus, ContentType } from '../types';
import {
    PlusCircle, BookOpen, Trash2, Search, Loader2,
    PenTool, FileText, Globe, Lock, MoreHorizontal, Eye, Edit3,
    LayoutGrid, List, Filter, Calendar, Layers, Sparkles, MessageSquare, Coffee, Share2, Copy
} from 'lucide-react';
import SEO from '../components/SEO';
import StandardCard from '../components/ui/StandardCard';
import ConfirmationModal from '../components/ConfirmationModal';
import { useHeader } from '../contexts/HeaderContext';
import { getEditDestinationForContent } from '../utils/contentEditing';

// --- TYPES ---
type ViewMode = 'grid' | 'list';
type FilterType = 'all' | 'study' | 'plan' | 'note';

// Helper to check type
const isNote = (item: any): item is Note => item.type === 'note';
const isPlan = (item: any): item is CustomPlan => item.type === 'plan';
const isStudy = (item: any): item is SavedStudy => item.type === 'study';

const WorkspacePage: React.FC = () => {
    const { currentUser, showNotification } = useAuth();
    const { setTitle, setIcon, resetHeader } = useHeader();
    const navigate = useNavigate();
    const isFirstRender = React.useRef(true);

    // --- STATE ---
    const [content, setContent] = useState<(SavedStudy | CustomPlan | Note)[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<ViewMode>('grid');
    const [activeFilter, setActiveFilter] = useState<FilterType>('all');
    const [statusFilter, setStatusFilter] = useState<ContentStatus | 'all'>('all');
    const [searchTerm, setSearchTerm] = useState('');

    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [deleteType, setDeleteType] = useState<ContentType | null>(null);

    // --- HEADER SETUP ---
    useEffect(() => {
        setTitle('Meus Estudos');
        setIcon(<Layers size={20} />);
        return () => resetHeader();
    }, [setTitle, setIcon, resetHeader]);

    // --- DATA FETCHING ---
    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
        } else if (content.length > 0) {
            // Skip fetch if we already have content (avoids refetch after delete)
            return;
        }
        
        const fetchData = async () => {
            if (!currentUser) return;
            setLoading(true);
            try {
                // Fetch parallel base data
                const [studiesData, publicStudiesData, notesData, profileData] = await Promise.all([
                    dbService.getAll(currentUser.uid, 'studies'),
                    dbService.getAll(currentUser.uid, 'public_studies'),
                    dbService.getAll(currentUser.uid, 'notes'),
                    dbService.getUserProfile(currentUser.uid)
                ]);

                // Fetch enrolled plans (only those the user is following/viewing)
                const enrolledPlanIds = profileData?.enrolledPlans || [];
                const plansData = enrolledPlanIds.length > 0 
                    ? await dbService.getEnrolledPlans(enrolledPlanIds)
                    : [];

                // Normalize data
                const normalizedStudies = (studiesData as any[]).map(s => {
                    let blocks = s.blocks;
                    let meta = s.meta;
                    try { if (typeof blocks === 'string') blocks = JSON.parse(blocks); } catch(e) { blocks = []; }
                    try { if (typeof meta === 'string') meta = JSON.parse(meta); } catch(e) { meta = {}; }
                    return { ...s, type: 'study', blocks, meta };
                });
                const normalizedPublicStudies = (publicStudiesData as any[]).map(s => {
                    let blocks = s.blocks;
                    let meta = s.meta;
                    try { if (typeof blocks === 'string') blocks = JSON.parse(blocks); } catch(e) { blocks = []; }
                    try { if (typeof meta === 'string') meta = JSON.parse(meta); } catch(e) { meta = {}; }
                    return { ...s, type: 'study', blocks, meta };
                });
                const normalizedPlans = (plansData as any[]).map(p => ({ ...p, type: 'plan' }));
                const normalizedNotes = (notesData as any[]).map(n => ({ ...n, type: 'note', title: n.title || 'Anotação sem título' }));

                setContent([...normalizedStudies, ...normalizedPublicStudies, ...normalizedPlans, ...normalizedNotes]);
            } catch (e) {
                console.error(e);
                showNotification("Erro ao carregar workspace.", "error");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [currentUser, showNotification]);

    // --- FILTERING ---
    const filteredContent = useMemo(() => {
        let filtered = content;

        // Type Filter
        if (activeFilter !== 'all') {
            filtered = filtered.filter(c => {
                if (activeFilter === 'note') return isNote(c);
                if (activeFilter === 'plan') return isPlan(c);
                if (activeFilter === 'study') return isStudy(c);
                return false;
            });
        }

        // Status Filter
        if (statusFilter !== 'all') {
            filtered = filtered.filter(c => c.status === statusFilter);
        }

        // Search
        if (searchTerm) {
            const lower = searchTerm.toLowerCase();
            filtered = filtered.filter(c =>
                (c.title?.toLowerCase().includes(lower)) ||
                (c.description?.toLowerCase().includes(lower)) ||
                (isStudy(c) && c.sourceText?.toLowerCase().includes(lower)) ||
                (isNote(c) && c.content?.toLowerCase().includes(lower))
            );
        }

        // Sort by Date (Newest first)
        return filtered.sort((a, b) => {
            const dateA = new Date(a.updatedAt || a.createdAt).getTime();
            const dateB = new Date(b.updatedAt || b.createdAt).getTime();
            return dateB - dateA;
        });
    }, [content, activeFilter, statusFilter, searchTerm]);

    // --- ACTIONS ---
    const handleEdit = (item: SavedStudy | CustomPlan | Note) => {
        // Se for um estudo seguido, vai para a visualização
        if (isStudy(item) && item.isFollowed) {
            navigate(`/v/${item.id}`);
            return;
        }

        // Se for um plano que não sou o autor (apenas visualizando), vai para a jornada
        if (isPlan(item) && item.authorId !== currentUser.uid) {
            navigate(`/jornada/${item.id}`);
            return;
        }

        const destination = getEditDestinationForContent(item as any);
        if (destination) {
            navigate(destination.path, { state: destination.state });
        }
    };

    const handleShare = (item: any) => {
        const slug = (item as any).slug;
        if (!slug) {
            showNotification("Este item ainda não tem um link público. Publique-o primeiro.", "info");
            return;
        }
        
        const url = `${window.location.origin}/l/${slug}`;
        navigator.clipboard.writeText(url);
        showNotification("Link de compartilhamento copiado!", "success");
    };

    const handleDelete = async () => {
        if (!currentUser || !deleteId || !deleteType) return;
        
        const idToDelete = deleteId;
        
        try {
            if (deleteType === 'plan') {
                 const plan = content.find(c => String(c.id) === String(idToDelete)) as CustomPlan;
                 if (plan && plan.authorId !== currentUser.uid) {
                     const updatedEnrolled = (currentUser as any).enrolledPlans?.filter((id: string) => String(id) !== String(idToDelete)) || [];
                     await dbService.updateUserProfile(currentUser.uid, { enrolledPlans: updatedEnrolled });
                     setContent(prev => prev.filter(c => String(c.id) !== String(idToDelete)));
                     showNotification("Plano removido da sua lista.", "success");
                     return;
                 }
                 await dbService.delete(currentUser.uid, 'custom_plans', idToDelete);
             } else if (deleteType === 'note') {
                 await dbService.delete(currentUser.uid, 'notes', idToDelete);
             } else if (deleteType === 'study') {
                 // Tenta deletar de ambas as tabelas pois um estudo pode estar em qualquer uma delas (legado vs novo)
                 await Promise.allSettled([
                     dbService.delete(currentUser.uid, 'public_studies', idToDelete),
                     dbService.delete(currentUser.uid, 'studies', idToDelete)
                 ]);
             }
            
            // Remove from content state
            const newContent = content.filter(c => String(c.id) !== String(idToDelete));
            console.log('[DELETE] Removed item:', idToDelete, 'from', content.length, 'to', newContent.length);
            setContent(newContent);
            
            showNotification("Item excluído.", "success");
        } catch (e) {
            console.error('[DELETE] Error:', e);
            showNotification("Erro ao processar exclusão.", "error");
        } finally {
            setDeleteId(null);
            setDeleteType(null);
        }
    };

    const getIconForType = (item: SavedStudy | CustomPlan | Note) => {
        if (isPlan(item)) return <Calendar size={14} />;
        if (isNote(item)) return <FileText size={14} />;
        return <BookOpen size={14} />;
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'published': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
            case 'draft': return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400';
            default: return 'bg-blue-100 text-blue-600';
        }
    };

    return (
        <div className="h-full overflow-y-auto bg-gray-50 dark:bg-black/20 p-4 md:p-8 pb-32">
            <SEO title="Workspace" />

            <div className="max-w-7xl mx-auto">

                {/* TOOLBAR */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 bg-white dark:bg-bible-darkPaper p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">

                    {/* Search & View Toggle */}
                    <div className="flex items-center gap-4 w-full md:w-auto flex-1">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            <input
                                type="text"
                                placeholder="Buscar no workspace..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none focus:ring-2 ring-bible-gold/30 transition-all"
                            />
                        </div>

                        <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg shrink-0">
                            <button onClick={() => setViewMode('grid')} className={`p-2 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-gray-700 shadow-sm text-bible-gold' : 'text-gray-400'}`}><LayoutGrid size={16} /></button>
                            <button onClick={() => setViewMode('list')} className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-white dark:bg-gray-700 shadow-sm text-bible-gold' : 'text-gray-400'}`}><List size={16} /></button>
                        </div>
                    </div>

                    {/* Create Button */}
                    <div className="flex gap-2 w-full md:w-auto justify-end">
                        <button
                            onClick={() => navigate('/criar-conteudo')}
                            className="bg-bible-leather dark:bg-bible-gold text-white dark:text-black px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest shadow-md flex items-center gap-2 hover:opacity-90 active:scale-95 transition-all whitespace-nowrap"
                        >
                            <PlusCircle size={16} /> Criar Novo
                        </button>
                    </div>
                </div>

                {/* FILTERS */}
                <div className="flex flex-wrap gap-2 mb-6">
                    {[
                        { id: 'all', label: 'Tudo', icon: <Layers size={14} /> },
                        { id: 'study', label: 'Estudos', icon: <BookOpen size={14} /> },
                        { id: 'plan', label: 'Planos', icon: <Calendar size={14} /> },
                        { id: 'note', label: 'Notas', icon: <FileText size={14} /> }
                    ].map(f => (
                        <button
                            key={f.id}
                            onClick={() => setActiveFilter(f.id as any)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border ${activeFilter === f.id
                                ? 'bg-bible-gold text-white border-bible-gold shadow-md'
                                : 'bg-white dark:bg-bible-darkPaper border-gray-200 dark:border-gray-800 text-gray-500 hover:border-gray-300'
                                }`}
                        >
                            {f.icon} {f.label}
                        </button>
                    ))}

                    <div className="w-px h-8 bg-gray-200 dark:bg-gray-700 mx-2 hidden md:block"></div>

                    {[
                        { id: 'all', label: 'Todos Status' },
                        { id: 'draft', label: 'Rascunhos' },
                        { id: 'published', label: 'Publicados' }
                    ].map(s => (
                        <button
                            key={s.id}
                            onClick={() => setStatusFilter(s.id as any)}
                            className={`px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border ${statusFilter === s.id
                                ? 'bg-gray-800 text-white dark:bg-white dark:text-black border-transparent'
                                : 'bg-transparent border-transparent text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                                }`}
                        >
                            {s.label}
                        </button>
                    ))}
                </div>

                {/* CONTENT GRID/LIST */}
                {loading ? (
                    <div className="flex justify-center py-20"><Loader2 className="animate-spin text-bible-gold" size={32} /></div>
                ) : filteredContent.length === 0 ? (
                    <div className="text-center py-20 bg-white dark:bg-bible-darkPaper rounded-[2rem] border-2 border-dashed border-gray-200 dark:border-gray-800 animate-in fade-in">
                        <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                            <Layers size={24} />
                        </div>
                        <p className="text-gray-500 font-bold text-xs uppercase tracking-widest mb-2">Nada encontrado</p>
                        <p className="text-xs text-gray-400">Tente ajustar os filtros ou crie um novo item.</p>
                    </div>
                ) : (
                    <div className={`animate-in fade-in ${viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6' : 'flex flex-col gap-3'}`}>
                        {filteredContent.map((item) => {
                            const typeLabel = isPlan(item) ? 'Plano' : (isNote(item) ? 'Nota' : 'Estudo');
                            const description = isStudy(item) ? item.sourceText : (isPlan(item) ? item.description : item.content);
                            const itemType = isPlan(item) ? 'plan' : (isNote(item) ? 'note' : 'study');
                            const isFollowedStudy = isStudy(item) && item.isFollowed;
                            const isThirdPartyPlan = isPlan(item) && item.authorId !== currentUser.uid;
                            const actionLabel = (isFollowedStudy || isThirdPartyPlan) ? 'Visualizar' : 'Editar';

                            return viewMode === 'grid' ? (
                                <StandardCard
                                    key={item.id}
                                    title={item.title || 'Sem título'}
                                    subtitle={description?.substring(0, 100) || 'Sem descrição'}
                                    badges={[
                                        { label: typeLabel, color: 'bg-blue-50 text-blue-600', icon: getIconForType(item) },
                                        { label: item.status === 'published' ? 'Publicado' : 'Rascunho', color: item.status === 'published' ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500' },
                                        ...(isFollowedStudy ? [{ label: 'Aula Salva', color: 'bg-bible-gold/10 text-bible-gold font-black' }] : [])
                                    ]}
                                    metrics={isPlan(item) || isStudy(item) ? item.metrics : undefined}
                                    actionLabel={actionLabel}
                                    coverUrl={item.coverUrl}
                                    onAction={() => handleEdit(item)}
                                    // Adiciona Share para itens publicados que tenham slug
                                    onShare={item.status === 'published' && (item as any).slug ? (e) => {
                                        e.stopPropagation();
                                        handleShare(item);
                                    } : undefined}
                                    onSecondaryAction={() => {
                                        setDeleteId(item.id);
                                        setDeleteType(itemType);
                                    }}
                                    secondaryIcon={<Trash2 size={14} />}
                                />
                            ) : (
                                <div key={item.id} className="bg-white dark:bg-bible-darkPaper p-4 rounded-xl border border-gray-100 dark:border-gray-800 flex items-center justify-between hover:border-bible-gold/30 transition-all group">
                                    <div className="flex items-center gap-4 flex-1 min-w-0">
                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${isPlan(item) ? 'bg-purple-50 text-purple-600' : (isFollowedStudy ? 'bg-bible-gold/10 text-bible-gold' : 'bg-blue-50 text-blue-600')}`}>
                                            {getIconForType(item)}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2">
                                                <h4 className="font-bold text-sm text-gray-900 dark:text-white truncate">{item.title}</h4>
                                                {isFollowedStudy && <span className="bg-bible-gold/10 text-bible-gold text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest">Aula</span>}
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-gray-400">
                                                <span className={`w-2 h-2 rounded-full ${item.status === 'published' ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                                                <span>{new Date(item.updatedAt || item.createdAt).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        {item.status === 'published' && (item as any).slug && (
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); handleShare(item); }} 
                                                className="p-2 hover:bg-bible-gold/10 rounded-lg text-bible-gold"
                                                title="Copiar Link de Compartilhamento"
                                            >
                                                <Share2 size={16} />
                                            </button>
                                        )}
                                        <button onClick={() => handleEdit(item)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-500">
                                            {isFollowedStudy ? <Eye size={16} /> : <Edit3 size={16} />}
                                        </button>
                                        <button 
                                            onClick={() => { setDeleteId(item.id); setDeleteType(itemType); }} 
                                            className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-red-500"
                                            title={isPlan(item) && item.authorId !== currentUser.uid ? "Remover da lista" : "Excluir"}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <ConfirmationModal
                isOpen={!!deleteId}
                onClose={() => setDeleteId(null)}
                onConfirm={handleDelete}
                title="Excluir Item"
                message="Tem certeza? Esta ação não pode ser desfeita."
                variant="danger"
                confirmText="Excluir"
            />
        </div>
    );
};

export default WorkspacePage;
