"use client";
import { useNavigate, useParams } from '../../utils/router';


import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';

import { dbService } from '../../services/supabase';
import { CustomPlan, PlanComment, PlanDayContent, PlanParticipant, PlanTeam, SavedStudy } from '../../types';
import {
    Loader2, ArrowLeft, Calendar, Play, Lock, Trophy, BookOpen, CheckCircle2,
    ChevronDown, Share2, Flag, X, User, Activity, Edit3, BookmarkPlus,
    Send, MessageSquare, Coffee, Type, Moon, Sun, Volume2, PauseCircle
} from 'lucide-react';
import SEO from '../../components/SEO';
import { useAuth } from '../../contexts/AuthContext';
import { useHeader } from '../../contexts/HeaderContext';
import StandardHeader from '../../components/ui/StandardHeader';
import { ContentBuilder } from '../../components/Builder/ContentBuilder';

type Tab = 'content' | 'ranking';

const PublicPlanPage: React.FC = () => {
    const { planId } = useParams<{ planId: string }>();
    const navigate = useNavigate();
    const { currentUser, userProfile, openLogin, showNotification, earnMana, updateProfile } = useAuth();
    const { setTitle, setBreadcrumbs, resetHeader, setIsHeaderHidden } = useHeader();

    const [plan, setPlan] = useState<CustomPlan | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<Tab>('content');
    const [ranking, setRanking] = useState<PlanParticipant[]>([]);
    const [myStats, setMyStats] = useState<PlanParticipant | null>(null);

    const [expandedWeeks, setExpandedWeeks] = useState<Record<string, boolean>>({});
    const [readingDay, setReadingDay] = useState<PlanDayContent | null>(null);
    const [isFollowed, setIsFollowed] = useState(false);
    const [isFollowing, setIsFollowing] = useState(false);

    // Forum state
    const [comments, setComments] = useState<PlanComment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [isSubmittingComment, setIsSubmittingComment] = useState(false);
    const [loadingComments, setLoadingComments] = useState(false);

    // Reading experience states
    const [fontSize, setFontSize] = useState<number>(14); // Default 14px 
    const [isFocusedMode, setIsFocusedMode] = useState(false);
    const [isAudioPlaying, setIsAudioPlaying] = useState(false);

    // Reading Scroll State
    const [isReadingScrolled, setIsReadingScrolled] = useState(false);
    const lastReadingScrollY = useRef(0);

    const handleReadingScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const currentScrollY = e.currentTarget.scrollTop;
        if (currentScrollY > lastReadingScrollY.current && currentScrollY > 50) {
            setIsReadingScrolled(true);
        } else if (currentScrollY < lastReadingScrollY.current) {
            setIsReadingScrolled(false);
        }
        lastReadingScrollY.current = currentScrollY;
    };

    const dayLabel = useMemo(() => {
        if (!plan || !readingDay) return '';
        let count = 0;
        for (const week of plan.weeks) {
            for (const day of week.days) {
                count++;
                if (day.id === readingDay.id) return `Aula ${count}`;
            }
        }
        return '';
    }, [plan, readingDay]);
    const [isJoining, setIsJoining] = useState(false);
    const [assignedTeam, setAssignedTeam] = useState<PlanTeam | null>(null);

    // Team Selection Modal
    const [showTeamSelect, setShowTeamSelect] = useState(false);
    const [selectedTeamId, setSelectedTeamId] = useState<string>('');

    // Presence System
    const [activeParticipants, setActiveParticipants] = useState<PlanParticipant[]>([]);
    const [showActiveUsersModal, setShowActiveUsersModal] = useState(false);

    const loadPlan = useCallback(async () => {
        if (!planId) return;
        try {
            const data = await dbService.getCustomPlan(planId);
            setPlan(data);
            // Telemetria
            dbService.incrementMetric('custom_plans', planId, 'views').catch(console.error);

            if (data?.weeks.length) setExpandedWeeks({ [data.weeks[0].id]: true });

            if (currentUser && data) {
                const stats = await dbService.getPlanParticipant(planId, currentUser.uid);
                if (stats) {
                    const typedStats: PlanParticipant = {
                        uid: stats.uid,
                        displayName: stats.displayName,
                        username: stats.username,
                        photoURL: stats.photoURL,
                        points: stats.points || 0,
                        completedSteps: stats.completedSteps || [],
                        joinedAt: stats.joinedAt,
                        lastActivityAt: stats.lastActivityAt,
                        status: stats.status || 'active',
                        team: stats.team
                    };
                    setMyStats(typedStats);
                } else {
                    setMyStats(null);
                }
                if (data.isRanked && data.teams) {
                    // Tenta achar o time onde o usuário está
                    const userTeam = data.teams.find(t => t.members.some(m => m.uid === currentUser.uid));
                    if (userTeam) setAssignedTeam(userTeam);
                    // Se já estiver participando e tiver time no stats, sincroniza
                    else if (stats?.team) {
                        const found = data.teams.find(t => t.id === stats.team);
                        if (found) setAssignedTeam(found);
                    }
                }
            }
        } catch (e) { console.error(e); } finally { setLoading(false); }
    }, [planId, currentUser]);

    useEffect(() => { loadPlan(); }, [loadPlan]);

    // --- HEARTBEAT & REAL-TIME PRESENCE ---
    const isOwner = plan?.authorId === currentUser?.uid;

    // 1. Header Presence & Heartbeat
    useEffect(() => {
        if (plan) {
            setTitle(plan.title);
            setBreadcrumbs([
                { label: 'Comunidade', path: '/social' },
                { label: 'Planos' }
            ]);
        }
        return () => resetHeader();
    }, [plan, setTitle, setBreadcrumbs, resetHeader]);

    // 2. Heartbeat do Usuário (Se matriculado)
    useEffect(() => {
        if (!currentUser || !planId || !myStats) return;

        const updatePresence = async () => {
            await dbService.updateParticipantPresence(planId, currentUser.uid);
        };

        updatePresence(); // Immediate call
        const interval = setInterval(updatePresence, 2 * 60 * 1000); // 2 minutes

        return () => clearInterval(interval);
    }, [currentUser, planId, myStats]);

    // 2. Monitoramento Pastoral (Se for o dono)
    useEffect(() => {
        if (!isOwner || !planId) return;

        const unsubscribe = dbService.subscribeToPlanParticipants(planId, (participants) => {
            const now = new Date().getTime();
            const active = participants.filter(p => {
                if (!p.lastActivityAt) return false;
                const lastActivity = new Date(p.lastActivityAt).getTime();
                return (now - lastActivity) < 5 * 60 * 1000; // 5 minutes threshold
            });
            setActiveParticipants(active);
        });

        return () => { unsubscribe(); };
    }, [isOwner, planId]);


    const loadRanking = async () => {
        if (!planId) return;
        const data = await dbService.getPlanRanking(planId);
        const typedRanking: PlanParticipant[] = data.map(doc => ({
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
        setRanking(typedRanking);
    };

    useEffect(() => {
        if (activeTab === 'ranking') loadRanking();
    }, [activeTab, planId]);

    const toggleWeek = (weekId: string) => {
        setExpandedWeeks(prev => ({ ...prev, [weekId]: !prev[weekId] }));
    };

    const handleJoinClick = () => {
        if (!currentUser || !userProfile) { openLogin(); return; }

        const isPublic = plan?.privacyType === 'public';
        const isChurchOnly = plan?.privacyType === 'church';
        const userChurchId = userProfile.churchData?.churchId;

        // O dono (pastor) sempre tem acesso, independente das regras
        const hasAccess = isPublic || (isChurchOnly && userChurchId === plan?.churchId) || isOwner;

        if (isChurchOnly && !hasAccess) {
            showNotification("Esta sala é exclusiva para membros da mesma igreja.", "error");
            return;
        }

        // FIX: O autor acessa diretamente como espectador/admin sem precisar entrar em equipe
        // FIX: O autor pode escolher entrar como espectador ou realmente se matricular
        if (isOwner && !myStats) {
            handleJoinConfirm(); // Matrícula rápida para o dono
            return;
        }

        // Lógica unificada: Se for Rankeado, OBRIGA a passar pela seleção de time (mesmo o dono)
        // Se não for, entra direto se tiver acesso.

        if (plan?.isRanked) {
            if (assignedTeam) {
                // Se já tem time definido pelo pastor (ou anterior), entra direto
                handleJoinConfirm(assignedTeam.id);
            } else {
                // SE NÃO TEM TIME, ABRE O SELETOR
                setShowTeamSelect(true);
            }
        } else {
            if (hasAccess) handleJoinConfirm();
            else showNotification("Você não tem permissão para entrar nesta sala.", "error");
        }
    };

    const handleJoinConfirm = async (teamId?: string) => {
        if (!plan || !userProfile) return;
        setIsJoining(true);
        try {
            await dbService.joinPlan(plan.id, userProfile, teamId);
            await updateProfile({ enrolledPlans: [...(userProfile.enrolledPlans || []), plan.id] });
            await earnMana('join_plan');
            const stats = await dbService.getPlanParticipant(plan.id, currentUser!.uid);
            if (stats) {
                const typedStats: PlanParticipant = {
                    uid: stats.uid,
                    displayName: stats.displayName,
                    username: stats.username,
                    photoURL: stats.photoURL,
                    points: stats.points || 0,
                    completedSteps: stats.completedSteps || [],
                    joinedAt: stats.joinedAt,
                    lastActivityAt: stats.lastActivityAt,
                    status: stats.status || 'active',
                    team: stats.team
                };
                setMyStats(typedStats);
            } else {
                setMyStats(null);
            }
            if (teamId && plan.teams) {
                const tm = plan.teams.find(t => t.id === teamId);
                setAssignedTeam(tm || null);
            }
            setShowTeamSelect(false);
            showNotification("Bem-vindo à sala de estudo!", "success");
        } catch (e) {
            showNotification("Erro ao entrar.", "error");
        } finally { setIsJoining(false); }
    };

    const handleCompleteReading = async () => {
        if (!readingDay || !plan || !currentUser) { setReadingDay(null); return; }
        const points = 100;
        await dbService.updatePlanProgress(plan.id, currentUser.uid, readingDay.id, points);
        // Telemetria
        dbService.incrementMetric('custom_plans', plan.id, 'completions').catch(console.error);

        setMyStats(prev => prev ? ({ ...prev, points: prev.points + points, completedSteps: [...prev.completedSteps, readingDay.id] }) : null);
        await earnMana('deep_study');
        showNotification("Estudo concluído!", "success");
        setReadingDay(null);
    };

    const handleFollowStudy = async () => {
        if (!currentUser || !readingDay || !plan) return;
        setIsFollowing(true);
        try {
            const studyData: Partial<SavedStudy> = {
                title: readingDay.title,
                sourceText: readingDay.refData?.formatted || '',
                analysis: readingDay.htmlContent,
                isFollowed: true,
                refDayId: readingDay.id,
                planId: plan.id,
                status: 'draft',
                source: 'modulo',
                category: plan.category
            };

            await dbService.add(currentUser.uid, 'studies', studyData);
            setIsFollowed(true);
            showNotification("Aula salva nos Meus Estudos!", "success");
            earnMana('collect_artifact');
        } catch (e) {
            console.error(e);
            showNotification("Erro ao seguir estudo.", "error");
        } finally {
            setIsFollowing(false);
        }
    };

    // --- FORUM LOGIC ---
    const loadComments = useCallback(async () => {
        if (!plan || !readingDay) return;
        setLoadingComments(true);
        try {
            const data = await dbService.getPlanComments(plan.id, readingDay.id);
            setComments(data);
        } catch (e: any) {
            // Log detalhado para capturar erros opacos no console
            const errorReport = {
                message: e?.message || "Erro desconhecido",
                code: e?.code || "No code",
                details: e?.details || "No details",
                hint: e?.hint || "No hint"
            };
            console.error("Erro ao carregar comentários:", errorReport);
            
            // Se for erro de tabela inexistente (PGRST205), ignoramos silenciosamente para não poluir o console do usuário
            if (e?.code === 'PGRST205' || errorReport.code === 'PGRST205') {
                console.warn("Tabela 'plan_comments' ainda não foi criada no Supabase.");
                setComments([]);
            }
        } finally {
            setLoadingComments(false);
        }
    }, [plan, readingDay]);

    useEffect(() => {
        if (readingDay) {
            loadComments();
            // Check if already followed (simplified check)
            checkIfFollowed();
        }
    }, [readingDay, loadComments]);

    const checkIfFollowed = async () => {
        if (!currentUser || !readingDay) return;
        try {
            const allStudies = await dbService.getAll(currentUser.uid, 'studies');
            const followed = allStudies.some((s: any) => s.is_followed && s.ref_day_id === readingDay.id && s.plan_id === plan?.id);
            setIsFollowed(followed);
        } catch (e) { console.error(e); }
    };

    const handleSubmitComment = async () => {
        if (!currentUser || !userProfile || !newComment.trim() || !plan || !readingDay) return;
        setIsSubmittingComment(true);
        try {
            const commentData: Partial<PlanComment> = {
                planId: plan.id,
                dayId: readingDay.id,
                userId: currentUser.uid,
                userName: userProfile.displayName || '',
                userPhoto: userProfile.photoURL || undefined,
                content: newComment
            };
            const added = await dbService.addPlanComment(commentData);
            setComments(prev => [...prev, added]);
            setNewComment('');
            earnMana('social_interaction');
        } catch (e) {
            showNotification("Erro ao postar comentário.", "error");
        } finally {
            setIsSubmittingComment(false);
        }
    };

    const handleDeleteComment = async (commentId: string) => {
        if (!currentUser) return;
        try {
            await dbService.deletePlanComment(commentId, currentUser.uid);
            setComments(prev => prev.filter(c => c.id !== commentId));
            showNotification("Comentário removido.", "info");
        } catch (e) {
            showNotification("Erro ao remover.", "error");
        }
    };

    const calculateProgress = () => {
        if (!plan || !myStats) return 0;
        let total = 0;
        plan.weeks.forEach(w => total += w.days.length);
        if (total === 0) return 0;
        return Math.round((myStats.completedSteps.length / total) * 100);
    };

    // --- HEADER MANAGEMENT ---
    useEffect(() => {
        if (plan) {
            if (readingDay) {
                setIsHeaderHidden(true); // Oculta o topo global para não duplicar com a barra de leitura
                setTitle(dayLabel || readingDay.title);
                setBreadcrumbs([
                    { label: 'Planos', path: '/estudos/planos' },
                    { label: plan.title, onClick: () => setReadingDay(null) },
                    { label: dayLabel || 'Leitura' }
                ]);
            } else {
                setIsHeaderHidden(false);
                setTitle(plan.title);
                setBreadcrumbs([
                    { label: 'Planos', path: '/estudos/planos' },
                    { label: plan.title }
                ]);
            }
        }
        return () => {
            resetHeader();
            setIsHeaderHidden(false);
        };
    }, [plan, readingDay, setTitle, setBreadcrumbs, resetHeader, setIsHeaderHidden]);

    if (loading) return <div className="h-screen flex items-center justify-center bg-bible-paper dark:bg-bible-darkPaper"><Loader2 className="animate-spin text-bible-gold" size={40} /></div>;
    if (!plan) return <div>Plano não encontrado</div>;

    // --- READING VIEW (INLINE) ---
    if (readingDay) {
        return (
            <div
                className={`h-full overflow-y-auto custom-scrollbar transition-all duration-500 ${isFocusedMode ? 'bg-white dark:bg-bible-darkPaper' : 'bg-gray-50 dark:bg-black/20 p-4 md:p-8'}`}
                onScroll={handleReadingScroll}
            >
                <SEO title={readingDay.title} />

                {/* Glassmorphism Progress Bar */}
                <div className={`fixed top-0 left-0 w-full z-[100] h-1 transition-all duration-500 ${isFocusedMode ? 'opacity-0' : 'opacity-100'} bg-black/5 dark:bg-white/5 backdrop-blur-sm`}>
                    <div
                        className="h-full bg-gradient-to-r from-bible-gold to-yellow-600 transition-all duration-1000 ease-out shadow-[0_0_20px_rgba(197,160,89,0.5)]"
                        style={{ width: `${calculateProgress()}%` }}
                    />
                </div>

                <div className={`max-w-7xl mx-auto transition-all duration-500 ${isFocusedMode ? 'pt-12' : 'pt-4'} relative`}>
                    {/* Floating Reading Toolbar */}
                    <div className={`sticky top-4 z-[90] flex justify-center mb-6 transition-all duration-300 ${isReadingScrolled || isFocusedMode ? '-translate-y-24 opacity-0 pointer-events-none' : 'translate-y-0 opacity-100 hover:opacity-100'}`}>
                        <div className="bg-white/80 dark:bg-bible-darkPaper/80 backdrop-blur-md border border-gray-100 dark:border-gray-800 p-2 rounded-2xl shadow-xl flex items-center gap-2">
                                <button
                                    onClick={() => setReadingDay(null)}
                                    className="p-2 text-gray-400 hover:text-bible-gold transition-colors"
                                    title="Voltar"
                                >
                                    <ArrowLeft size={18} />
                                </button>
                                {isOwner && (
                                    <button
                                        onClick={() => navigate('/criador-jornada', { state: { planData: plan } })}
                                        className="px-3 py-1 bg-bible-gold/10 text-bible-gold rounded-lg font-bold text-[10px] uppercase tracking-widest hover:bg-bible-gold hover:text-white transition-all flex items-center gap-1.5"
                                        title="Voltar para Edição"
                                    >
                                        <Edit3 size={12} />
                                        Editar
                                    </button>
                                )}
                            <div className="w-px h-6 bg-gray-100 dark:bg-gray-800 mx-1" />

                            {/* Font Size Controls */}
                            <div className="flex items-center bg-gray-50 dark:bg-gray-900 rounded-xl p-1">
                                <button onClick={() => setFontSize(Math.max(14, fontSize - 2))} className="p-1.5 text-gray-500 hover:text-bible-gold transition-colors"><Type size={14} /></button>
                                <span className="text-[10px] font-bold w-8 text-center text-gray-400">{fontSize}</span>
                                <button onClick={() => setFontSize(Math.min(32, fontSize + 2))} className="p-1.5 text-gray-500 hover:text-bible-gold transition-colors"><Type size={18} /></button>
                            </div>

                            <div className="w-px h-6 bg-gray-100 dark:bg-gray-800 mx-1" />

                            {/* Audio Player */}
                            <button
                                onClick={() => {
                                    if (isAudioPlaying) {
                                        window.speechSynthesis.cancel();
                                        setIsAudioPlaying(false);
                                    } else {
                                        const text = readingDay.htmlContent.replace(/<[^>]*>?/gm, '').trim();
                                        const utter = new SpeechSynthesisUtterance(text);
                                        utter.lang = 'pt-BR';
                                        utter.onend = () => setIsAudioPlaying(false);
                                        setIsAudioPlaying(true);
                                        window.speechSynthesis.speak(utter);
                                    }
                                }}
                                className={`p-2 rounded-xl transition-all ${isAudioPlaying ? 'bg-bible-gold text-white' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                                title="Escutar Leitura"
                            >
                                {isAudioPlaying ? <PauseCircle size={20} /> : <Volume2 size={20} />}
                            </button>

                            {/* Focused Mode */}
                            <button
                                onClick={() => setIsFocusedMode(!isFocusedMode)}
                                className={`p-2 rounded-xl transition-all ${isFocusedMode ? 'bg-bible-gold text-white' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                                title="Modo Leitura Focada"
                            >
                                <Moon size={20} />
                            </button>
                        </div>
                    </div>
                    {/* Content Container */}
                    <div className="p-2 md:p-4">
                        <header className={`mb-8 transition-all duration-500 ${isFocusedMode ? 'opacity-0 h-0 overflow-hidden mb-0' : 'opacity-100'}`}>
                            <p className="text-xs font-bold text-bible-gold uppercase tracking-tighter mb-1">{plan?.title}</p>
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-gray-500 text-[10px] font-bold uppercase tracking-widest">
                                <span className="flex items-center gap-1"><BookOpen size={10} /> {plan?.category}</span>
                                {readingDay.refData?.formatted && (
                                    <span className="text-bible-leather dark:text-bible-gold">{readingDay.refData.formatted}</span>
                                )}
                            </div>
                        </header>

                        {readingDay.blocksConfig && readingDay.blocksConfig.length > 0 ? (
                            <div className="animate-in fade-in duration-700">
                                <ContentBuilder
                                    blocks={readingDay.blocksConfig}
                                    selectedBlockId={null}
                                    onSelectBlock={() => {}}
                                    onUpdateBlock={() => {}}
                                    onMoveBlock={() => {}}
                                    onDuplicateBlock={() => {}}
                                    onRemoveBlock={() => {}}
                                    onAddBlock={() => {}}
                                    isEditing={false}
                                    canvasWidth="full"
                                    authorName={plan.authorName}
                                />
                            </div>
                        ) : (
                            <div
                                className="prose dark:prose-invert max-w-none font-serif leading-relaxed text-gray-800 dark:text-gray-200 empty:hidden [&_h1]:text-[1.5rem] [&_h1]:font-black [&_h1]:mb-6"
                                style={{ fontSize: `${fontSize}px` }}
                                dangerouslySetInnerHTML={{ __html: readingDay.htmlContent }}
                            />
                        )}

                        <div className={`flex flex-row justify-between items-center gap-2 mt-12 py-6 border-y border-gray-100 dark:border-gray-800 transition-all duration-500 ${isFocusedMode ? 'opacity-0 h-0 overflow-hidden' : 'opacity-100'}`}>
                            <div className="hidden sm:block">
                                <span className="text-[10px] font-black text-bible-gold uppercase tracking-[0.2em]">{calculateProgress()}% Concluído</span>
                            </div>
                            <div className="flex flex-1 sm:flex-none justify-between sm:justify-end gap-2 w-full sm:w-auto">
                                {isOwner && (
                                    <button
                                        onClick={() => navigate('/criador-jornada', { state: { planData: plan } })}
                                        className="flex-1 sm:flex-none p-2.5 sm:px-5 rounded-xl font-bold text-[10px] uppercase tracking-widest bg-white dark:bg-bible-darkPaper text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-800 flex items-center justify-center gap-2"
                                    >
                                        <Edit3 size={14} /> <span className="hidden sm:inline">Editar</span>
                                    </button>
                                )}
                                <button
                                    onClick={() => {
                                        const url = window.location.href;
                                        if (navigator.share) navigator.share({ title: readingDay.title, url });
                                        else {
                                            navigator.clipboard.writeText(url);
                                            alert('Link copiado para a área de transferência!');
                                        }
                                    }}
                                    className="flex-1 sm:flex-none p-2.5 sm:px-5 rounded-xl font-bold text-[10px] uppercase tracking-widest bg-white dark:bg-bible-darkPaper text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-800 flex items-center justify-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                                >
                                    <Share2 size={14} /> <span className="hidden sm:inline">Compartilhar</span>
                                </button>
                                {currentUser && (
                                    <button
                                        onClick={handleFollowStudy}
                                        disabled={isFollowed || isFollowing}
                                        className={`flex-1 sm:flex-none p-2.5 sm:px-5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${isFollowed ? 'bg-bible-gold/10 text-bible-gold cursor-default' : 'bg-white dark:bg-bible-darkPaper text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-800'}`}
                                    >
                                        {isFollowing ? <Loader2 className="animate-spin" size={14} /> : (isFollowed ? <CheckCircle2 size={14} /> : <BookmarkPlus size={14} />)}
                                        <span>{isFollowed ? (window.innerWidth < 768 ? 'OK' : 'Salvo') : (window.innerWidth < 768 ? 'Salvar' : 'Acompanhar')}</span>
                                    </button>
                                )}
                                {myStats && (
                                    <button
                                        onClick={handleCompleteReading}
                                        disabled={myStats?.completedSteps.includes(readingDay.id)}
                                        className={`flex-1 sm:flex-none p-2.5 sm:px-5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${myStats?.completedSteps.includes(readingDay.id) ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 cursor-default' : 'bg-bible-gold text-white shadow-md'}`}
                                    >
                                        {myStats?.completedSteps.includes(readingDay.id) ? <CheckCircle2 size={14} /> : <CheckCircle2 size={14} className="opacity-50" />}
                                        <span>{myStats?.completedSteps.includes(readingDay.id) ? 'Lido' : 'Concluir'}</span>
                                    </button>
                                )}
                            </div>
                        </div>

                        {!myStats && (
                            <div className="mt-16 p-8 bg-gray-100 dark:bg-gray-900 rounded-3xl text-center border border-gray-200 dark:border-gray-800">
                                <p className="text-sm text-gray-500 font-bold mb-4">Você está visualizando como espectador</p>
                                <button
                                    onClick={() => { setReadingDay(null); handleJoinClick(); }}
                                    className="px-8 py-4 bg-bible-gold text-white rounded-xl font-bold uppercase text-xs tracking-widest shadow-lg hover:scale-105 transition-transform"
                                >
                                    Entrar para Salvar Progresso
                                </button>
                            </div>
                        )}

                        {/* FORUM / COMMENTS */}
                        {myStats && (
                            <div className={`mt-16 pt-16 border-t border-gray-200 dark:border-gray-800 transition-all duration-500 ${isFocusedMode ? 'opacity-0 h-0 overflow-hidden' : 'opacity-100'}`}>
                                <div className="flex items-center justify-between mb-8">
                                    <h3 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-3">
                                        <MessageSquare className="text-bible-gold" /> Fórum da Aula
                                    </h3>
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{comments.length} Comentários</span>
                                </div>

                                {/* Comment Input */}
                                <div className="bg-white dark:bg-bible-darkPaper p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 mb-8">
                                    <div className="flex gap-4">
                                        <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 shrink-0 overflow-hidden">
                                            {userProfile?.photoURL ? <img src={userProfile.photoURL} className="w-full h-full object-cover" /> : <User className="w-full h-full p-2 text-gray-400" />}
                                        </div>
                                        <div className="flex-1">
                                            <textarea
                                                value={newComment}
                                                onChange={(e) => setNewComment(e.target.value)}
                                                placeholder="O que você achou dessa aula?"
                                                className="w-full bg-transparent border-none outline-none resize-none text-gray-800 dark:text-gray-200 min-h-[80px]"
                                            />
                                            <div className="flex justify-end mt-2">
                                                <button
                                                    onClick={handleSubmitComment}
                                                    disabled={!newComment.trim() || isSubmittingComment}
                                                    className="bg-bible-gold text-white px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg hover:scale-105 active:scale-95 disabled:opacity-50 transition-all flex items-center gap-2"
                                                >
                                                    {isSubmittingComment ? <Loader2 className="animate-spin" size={14} /> : <Send size={14} />}
                                                    Postar
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Comments List */}
                                <div className="space-y-6">
                                    {loadingComments ? (
                                        <div className="flex justify-center py-8"><Loader2 className="animate-spin text-bible-gold" size={24} /></div>
                                    ) : comments.length === 0 ? (
                                        <div className="text-center py-12 text-gray-400">
                                            <Coffee className="mx-auto mb-2 opacity-20" size={32} />
                                            <p className="text-sm font-medium italic">Ninguém comentou ainda. Seja o primeiro!</p>
                                        </div>
                                    ) : (
                                        comments.map(comment => (
                                            <div key={comment.id} className="group relative">
                                                <div className="flex gap-4">
                                                    <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 shrink-0 overflow-hidden">
                                                        {comment.userPhoto ? <img src={comment.userPhoto} className="w-full h-full object-cover" /> : <User className="w-full h-full p-2 text-gray-400" />}
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex items-center justify-between mb-1">
                                                            <span className="text-sm font-black text-gray-900 dark:text-white">{comment.userName}</span>
                                                            <span className="text-[10px] text-gray-400 font-bold">{new Date(comment.createdAt).toLocaleDateString()}</span>
                                                        </div>
                                                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-sm">{comment.content}</p>
                                                        {currentUser?.uid === comment.userId && (
                                                            <button
                                                                onClick={() => handleDeleteComment(comment.id!)}
                                                                className="text-[10px] text-red-500 font-bold uppercase tracking-widest mt-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                                            >Excluir</button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Footer Navigation */}
                        <div className={`mt-16 pt-8 border-t border-gray-200 dark:border-gray-800 flex justify-between items-center text-[10px] font-black text-gray-300 dark:text-gray-600 uppercase tracking-widest transition-all duration-500 ${isFocusedMode ? 'opacity-0 h-0 overflow-hidden' : 'opacity-100'}`}>
                            <span>BíbliaLM &copy; {new Date().getFullYear()}</span>
                            <span>Soli Deo Gloria</span>
                        </div>
                    </div>

                    <div className="h-20"></div>
                </div>
            </div>
        );
    }

    const canViewContent = myStats || plan.privacyType === 'public' || isOwner;

    return (
        <div className="h-full bg-gray-50 dark:bg-black/20 overflow-y-auto">
            <SEO title={plan.title} description={plan.description} />

            <StandardHeader
                title={plan.title || 'Jornada Sem Título'}
                subtitle={plan.description || 'Nenhuma descrição fornecida para esta jornada.'}
                authorName={plan.authorName || (isOwner ? userProfile?.displayName : 'Autor Desconhecido')}
                authorPhoto={plan.authorPhoto || (isOwner ? (userProfile?.photoURL || undefined) : undefined)}
                progress={myStats ? calculateProgress() : undefined}
                coverUrl={plan.coverUrl || 'https://images.unsplash.com/photo-1490730141103-6cac27aaab94?auto=format&fit=crop&q=80'}
                badges={[
                    { label: 'Geral', icon: <BookOpen size={14} /> },
                    { label: `${plan.weeks?.length || 0} Semanas`, icon: <Calendar size={14} /> }
                ]}
                extraFooter={null}
                hideBackButton={false}
                hideTitle={false}
                hideNav={true}
                actions={
                    <div className="flex items-center gap-2 md:gap-3 w-full justify-between md:justify-end">
                        <div className="flex items-center gap-2">
                            {myStats ? (
                                <div className="flex items-center gap-2">
                                    <span className="bg-green-500/20 px-3 py-2 rounded-full text-green-400 border border-green-500/30 text-[10px] md:text-[11px] font-black uppercase tracking-widest leading-none flex items-center gap-1.5 shadow-[0_0_15px_rgba(34,197,94,0.2)]">
                                        <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse shadow-[0_0_5px_rgba(34,197,94,0.8)]"></div>
                                        Inscrito
                                    </span>
                                    {assignedTeam && <span className={`px-3 py-1.5 rounded-full text-white border border-white/20 text-[10px] font-black uppercase tracking-widest leading-none ${assignedTeam.color}`}>{assignedTeam.name}</span>}
                                </div>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={handleJoinClick}
                                        disabled={isJoining}
                                        className="bg-bible-gold text-white px-5 py-2 rounded-full font-bold uppercase text-[10px] md:text-xs tracking-widest shadow-lg hover:scale-105 transition-transform flex items-center justify-center gap-2 active:scale-95"
                                    >
                                        {isJoining ? <Loader2 className="animate-spin" size={14} /> : <Play size={14} fill="currentColor" />}
                                        {isOwner ? 'Acessar como Autor' : 'Entrar na Sala'}
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="flex items-center gap-2">
                            {isOwner && activeParticipants.length > 0 && (
                                <div className="bg-green-500/10 border border-green-500/30 text-green-400 px-3 py-1.5 rounded-full flex items-center gap-2 text-[9px] font-black uppercase tracking-widest shrink-0">
                                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
                                    <span className="hidden sm:inline">{activeParticipants.length} Alunos Online</span>
                                    <span className="sm:hidden">{activeParticipants.length} Online</span>
                                </div>
                            )}
                            <button
                                onClick={() => {
                                    const url = window.location.href;
                                    if (navigator.share) navigator.share({ title: plan.title, url });
                                    else { navigator.clipboard.writeText(url); showNotification("Link copiado!", "success"); }
                                    dbService.incrementMetric('custom_plans', plan.id, 'shares');
                                }}
                                className="bg-white/5 text-white/80 border border-white/20 w-8 h-8 md:w-10 md:h-10 rounded-full hover:bg-white/10 hover:text-white transition-all flex items-center justify-center shrink-0 backdrop-blur-md"
                                title="Compartilhar Sala"
                            >
                                <Share2 size={16} />
                            </button>
                            {isOwner && (
                                <button
                                    onClick={() => navigate('/criador-jornada', { state: { planData: plan } })}
                                    className="bg-white/5 text-white/80 border border-white/20 w-8 h-8 md:w-10 md:h-10 rounded-full hover:bg-white/10 hover:text-white transition-all flex items-center justify-center shrink-0 backdrop-blur-md"
                                    title="Editar Sala"
                                >
                                    <Edit3 size={16} />
                                </button>
                            )}
                        </div>
                    </div>
                }
            />

            <div id="plan-content" className="max-w-7xl mx-auto px-4 pt-4 pb-32 space-y-6">
                {/* Secondary UI removed or moved to header */}

                {/* Tabs and Content List */}
                <div className="flex bg-white dark:bg-bible-darkPaper p-1 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
                    <button onClick={() => setActiveTab('content')} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-all rounded-xl flex items-center justify-center gap-2 ${activeTab === 'content' ? 'bg-bible-gold text-white shadow-md' : 'text-gray-400'}`}><BookOpen size={14} /> Conteúdo</button>
                    {(plan.isRanked || ranking.length > 0) && (
                        <button onClick={() => setActiveTab('ranking')} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-all rounded-xl flex items-center justify-center gap-2 ${activeTab === 'ranking' ? 'bg-bible-gold text-white shadow-md' : 'text-gray-400'}`}><Trophy size={14} /> Ranking</button>
                    )}
                </div>

                {activeTab === 'content' && (
                    <div className="space-y-4 animate-in fade-in">
                        {(!plan.weeks || plan.weeks.length === 0) && (
                            <div className="text-center py-20 bg-white dark:bg-bible-darkPaper rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm mt-4">
                                <BookOpen size={48} className="mx-auto text-gray-200 dark:text-gray-800 mb-4" />
                                <h3 className="text-lg font-black text-gray-900 dark:text-white mb-2">Jornada Vazia</h3>
                                <p className="text-sm text-gray-500 max-w-sm mx-auto">Esta jornada ainda não possui nenhum conteúdo, semana ou aula cadastrada.</p>
                                {isOwner && (
                                    <button onClick={() => navigate('/criador-jornada', { state: { planData: plan } })} className="mt-8 px-6 py-3 bg-bible-gold text-white rounded-xl font-bold uppercase tracking-widest text-[10px] shadow-lg hover:scale-105 transition-transform">
                                        Adicionar Aulas
                                    </button>
                                )}
                            </div>
                        )}
                        {plan.weeks?.map((week, wIdx) => (
                            <div key={week.id} className="bg-white dark:bg-bible-darkPaper rounded-[2rem] border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm transition-all hover:shadow-md">
                                <button onClick={() => toggleWeek(week.id)} className="w-full flex items-center justify-between p-6 hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center font-bold text-sm text-gray-500">{wIdx + 1}</div>
                                        <span className="font-bold text-gray-900 dark:text-white">{week.title}</span>
                                    </div>
                                    <ChevronDown className={`text-gray-400 transition-transform ${expandedWeeks[week.id] ? 'rotate-180' : ''}`} />
                                </button>
                                {expandedWeeks[week.id] && (
                                    <div className="bg-gray-50/50 dark:bg-black/20 p-4 pt-0 space-y-3 pb-6">
                                        <div className="h-px w-full bg-gray-100 dark:bg-gray-800 mb-4"></div>
                                        {week.days.map((day) => {
                                            const isDone = myStats?.completedSteps.includes(day.id);
                                            return (
                                                <div key={day.id} onClick={() => canViewContent ? setReadingDay(day) : showNotification("Entre na sala para ler", "info")} className={`relative flex items-center gap-4 p-4 rounded-2xl border-2 transition-all cursor-pointer group ${isDone ? 'bg-white dark:bg-bible-darkPaper border-green-200 dark:border-green-900/30' : 'bg-white dark:bg-bible-darkPaper border-transparent hover:border-bible-gold/30 hover:shadow-sm'}`}>
                                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-colors ${isDone ? 'bg-green-500 text-white shadow-green-200 shadow-lg' : 'bg-gray-100 dark:bg-gray-800 text-gray-400 group-hover:bg-bible-gold group-hover:text-white'}`}>
                                                        {isDone ? <CheckCircle2 size={20} /> : <Play size={20} className="ml-1" />}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="font-bold text-sm truncate text-gray-900 dark:text-white">{day.title}</h4>
                                                        <p className="text-[10px] text-gray-400 font-medium line-clamp-1">{day.description || 'Conteúdo exclusivo'}</p>
                                                    </div>
                                                    {!canViewContent && <Lock size={14} className="text-gray-300" />}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* TEAM SELECTION MODAL */}
            {showTeamSelect && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white dark:bg-bible-darkPaper w-full max-w-md rounded-[2.5rem] shadow-2xl p-8 border border-gray-100 dark:border-gray-800 relative">
                        <button onClick={() => setShowTeamSelect(false)} className="absolute top-6 right-6 text-gray-400 hover:text-red-500 transition-colors"><X size={20} /></button>

                        <div className="text-center mb-8">
                            <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4 text-yellow-600">
                                <Trophy size={32} />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Escolha sua Equipe</h2>
                            <p className="text-sm text-gray-500">Esta jornada é uma gincana! Selecione seu time para somar pontos.</p>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mb-8">
                            {(plan.teams && plan.teams.length > 0 ? plan.teams : [
                                { id: 'Vermelho', name: 'Vermelho', color: 'bg-red-500' },
                                { id: 'Azul', name: 'Azul', color: 'bg-blue-500' },
                                { id: 'Amarelo', name: 'Amarelo', color: 'bg-yellow-500' },
                                { id: 'Verde', name: 'Verde', color: 'bg-green-500' }
                            ] as PlanTeam[]).map(team => (
                                <button
                                    key={team.id}
                                    onClick={() => setSelectedTeamId(team.id)}
                                    className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${selectedTeamId === team.id ? 'border-bible-gold bg-bible-gold/5 shadow-md scale-105' : 'border-gray-100 dark:border-gray-800 hover:border-gray-300'}`}
                                >
                                    <div className={`w-8 h-8 rounded-full ${team.color} shadow-sm border-2 border-white dark:border-gray-700`}></div>
                                    <span className="text-xs font-bold text-gray-800 dark:text-gray-200">{team.name}</span>
                                </button>
                            ))}
                        </div>

                        <button
                            onClick={() => handleJoinConfirm(selectedTeamId)}
                            disabled={!selectedTeamId || isJoining}
                            className="w-full py-4 bg-bible-gold text-white rounded-xl font-black uppercase tracking-widest shadow-xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
                        >
                            {isJoining ? <Loader2 className="animate-spin inline mr-2" size={16} /> : <Flag className="inline mr-2" size={16} />}
                            Entrar na Equipe
                        </button>
                    </div>
                </div>
            )}

            {/* ACTIVE USERS MODAL */}
            {showActiveUsersModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white dark:bg-bible-darkPaper w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-gray-100 dark:border-gray-800 relative">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold flex items-center gap-2 text-green-600"><Activity size={18} /> Online Agora</h3>
                            <button onClick={() => setShowActiveUsersModal(false)}><X size={20} className="text-gray-400" /></button>
                        </div>
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                            {activeParticipants.map(p => (
                                <div key={p.uid} className="flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl">
                                    <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                                        {p.photoURL ? <img src={p.photoURL} className="w-full h-full object-cover" /> : <User className="w-full h-full p-1.5 text-gray-400" />}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-gray-900 dark:text-white">{p.displayName}</p>
                                        <p className="text-[10px] text-green-500 font-bold uppercase tracking-wider">Estudando</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PublicPlanPage;
