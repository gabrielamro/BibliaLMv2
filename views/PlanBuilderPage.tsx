"use client";
import { useNavigate, useLocation, useSearchParams } from '../utils/router';


import React, { useState, useEffect, useRef, useCallback } from 'react';

import { useAuth } from '../contexts/AuthContext';
import { useHeader } from '../contexts/HeaderContext';
import { dbService, uploadBlob } from '../services/supabase';
import { bibleService } from '../services/bibleService';
import { generateImagePromptForPlan, generateStructuredStudy, generateVerseImage, generateAIOnePage } from '../services/pastorAgent';
import { useSettings } from '../contexts/SettingsContext';
import {
    ArrowLeft, Plus, Save, Trash2, Loader2, Search, Check,
    Calendar, Layout, Sparkles, Clock, BookOpen, ChevronDown,
    X, CheckCircle2, GraduationCap, Edit2, Wand2, FileText, Camera, ImageIcon,
    Trophy, Eye, EyeOff, PlayCircle, PenTool, Target, Layers, Zap, Brain, AlignLeft, Globe, Info, Quote, Settings, Monitor, Smartphone, Tablet, Maximize2, Minimize2,
    Undo2, Redo2, Lock, Copy, Image as ImageIconAlt, Sliders
} from 'lucide-react';
import { CustomPlan, PlanDayContent, PlanningFrequency, StudyEvaluation, PlanTeam } from '../types';
import SEO from '../components/SEO';
import ConfirmationModal from '../components/ConfirmationModal';
import EvaluationBuilderModal from '../components/EvaluationBuilderModal';
import { base64ToBlob } from '../utils/imageOptimizer';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';

import { blockLabels } from '../components/Builder/constants';
import { 
    createBlock,
    buildBaseBlocks
} from '../components/Builder/utils';
import { BlockProperties } from '../components/Builder/BlockProperties';
import ObreiroIAChatbot from '../components/ObreiroIAChatbot';
import { MobileToolbar } from '../components/Builder/MobileToolbar';
import { MobilePropertiesSheet } from '../components/Builder/MobilePropertiesSheet';
import { MobileAddBlockMenu } from '../components/Builder/MobileAddBlockMenu';
import { UnifiedEditor, UnifiedEditorRef } from '../components/UnifiedEditor/UnifiedEditor';
import CreateContentV3Page from './CreateContentV3Page';

const getUnitLabel = (freq: PlanningFrequency, index: number) => {
    switch (freq) {
        case 'daily': return `Dia ${index}`;
        case 'weekly': return `Semana ${index}`;
        case 'monthly': return `Mês ${index}`;
        default: return `Unidade ${index}`;
    }
};

const getLessonDisplayTitle = (freq: PlanningFrequency | undefined, index: number, title: string) => {
    const prefix = getUnitLabel(freq || 'weekly', index);
    return `${prefix}: ${title || 'Nova Aula'}`;
};

const stripLessonDisplayPrefix = (title: string) =>
    title.replace(/^(Dia|Semana|Mês|Unidade)\s+\d+:\s*/i, '').trim();

const PlanBuilderPage: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams] = useSearchParams();
    const { currentUser, userProfile, showNotification, checkFeatureAccess, openSubscription, incrementUsage, openLogin } = useAuth();
    const { setTitle: setGlobalTitle, setBreadcrumbs, resetHeader, setIsHeaderHidden } = useHeader();
    const { setIsFocusMode } = useSettings();

    const state = location.state as { planId?: string, planData?: CustomPlan };
    const urlPlanId = searchParams.get('id');

    // --- EDITOR STUDIO STATE ---
    const [editingDayId, setEditingDayId] = useState<string | null>(null);
    const [activeWeekId, setActiveWeekId] = useState<string | null>(null);
    const [editingDayTitle, setEditingDayTitle] = useState('');

    // Editor Configuration
    const [editorTab, setEditorTab] = useState<'config' | 'content'>('config');
    const [studyMode, setStudyMode] = useState<'quick' | 'deep'>('deep');

    // Content Inputs
    const [dayTitle, setDayTitle] = useState('');
    const [dayRef, setDayRef] = useState('');
    const [dayVerseText, setDayVerseText] = useState(''); // Mantido para exibição rápida na lista se necessário
    const [dayCategory, setDayCategory] = useState('Geral');
    const [dayTags, setDayTags] = useState<string[]>([]);
    const [htmlContent, setHtmlContent] = useState('');

    // AI Inputs
    const [aiTheme, setAiTheme] = useState('');
    const [aiAudience, setAiAudience] = useState('');
    const [isGeneratingAI, setIsGeneratingAI] = useState(false);
    const [isFetchingBible, setIsFetchingBible] = useState(false);
    
    // Auxiliar para evitar que a busca automática da bíblia sobrescreva dados salvos ao abrir o editor
    const isLoadingItemRef = useRef(false);

    // --- CONTENT BUILDER STATES ---
    const [editorBlocks, setEditorBlocks] = useState<any[]>([]);
    const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
    const [canvasWidth, setCanvasWidth] = useState<'mobile' | 'tablet' | 'desktop' | 'full'>('desktop');
    const [isMobilePropertiesOpen, setIsMobilePropertiesOpen] = useState(false);
    const [isMobileAddMenuOpen, setIsMobileAddMenuOpen] = useState(false);
    const editorRef = useRef<UnifiedEditorRef>(null);
    const [activeBlockData, setActiveBlockData] = useState<any | null>(null);


    // AI Auto-Builder Modal
    const [showAIBuilderModal, setShowAIBuilderModal] = useState(false);
    const [aiBuilderPrompt, setAIBuilderPrompt] = useState('');
    const [isAIBuilding, setIsAIBuilding] = useState(false);
    const aiBuilderTextareaRef = useRef<HTMLTextAreaElement>(null);

    // Settings Overlay
    const [showSettingsOverlay, setShowSettingsOverlay] = useState(false);
    const [settingsTab, setSettingsTab] = useState<'config' | 'access'>('config');
    const [accessLogs, setAccessLogs] = useState<any[]>([]);
    const [isLoadingLogs, setIsLoadingLogs] = useState(false);

    // Remove old state header
    useEffect(() => {
        setIsHeaderHidden(!!editingDayId);
        return () => setIsHeaderHidden(false);
    }, [editingDayId, setIsHeaderHidden]);

    // --- PLAN STATE ---
    const [plan, setPlan] = useState<Partial<CustomPlan>>({
        title: '',
        description: '',
        category: 'Geral',
        weeks: [],
        isPublic: false,
        privacyType: 'public',
        isRanked: false,
        planningFrequency: 'weekly',
        hasEvaluation: false,
        coverUrl: '',
        teams: [],
        status: 'draft'
    });

    // --- UI STATES ---
    const [isSaving, setIsSaving] = useState(false);
    const [isPublishing, setIsPublishing] = useState(false);
    const [isGeneratingCover, setIsGeneratingCover] = useState(false);
    const [isSuggestingPrompt, setIsSuggestingPrompt] = useState(false);
    const [coverPrompt, setCoverPrompt] = useState('');
    const [isPreviewMode, setIsPreviewMode] = useState(false);

    // Confirmation modals (replace native confirm())
    const [showFreqConfirm, setShowFreqConfirm] = useState(false);
    const [pendingFrequency, setPendingFrequency] = useState<PlanningFrequency | null>(null);
    const [showDeleteDayConfirm, setShowDeleteDayConfirm] = useState(false);
    const [pendingDeleteDay, setPendingDeleteDay] = useState<{weekId: string; dayId: string} | null>(null);

    // Teams for Ranked Mode
    const [pastorTeams, setPastorTeams] = useState<PlanTeam[]>([]);

    const [currentStep, setCurrentStep] = useState(1);
    const steps = [
        { id: 1, title: 'Planejamento', icon: Calendar },
        { id: 2, title: 'Conteúdo', icon: BookOpen },
        { id: 3, title: 'Configurações', icon: Settings },
        { id: 4, title: 'Avaliação', icon: GraduationCap }
    ];


    const searchTimeoutRef = useRef<any>(null);

    const [showSaveSuccessModal, setShowSaveSuccessModal] = useState(false);
    const [savedPlanId, setSavedPlanId] = useState<string | null>(state?.planId || urlPlanId || null);
    const [showEvalModal, setShowEvalModal] = useState(false);
    const [evaluationData, setEvaluationData] = useState<StudyEvaluation | null>(null);
    const [isSavingEval, setIsSavingEval] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const urlTab = params.get('tab');
        const urlLesson = params.get('lesson');

        // Sempre restaurar a Tab se existir na URL, indepedente de ser sala nova ou existente
        if (urlTab) {
            const revTabMap: Record<string, number> = { 'planejamento': 1, 'conteudo': 2, 'configuracoes': 3, 'avaliacao': 4 };
            if (revTabMap[urlTab]) setCurrentStep(revTabMap[urlTab]);
        }

        if (state?.planData) {
            // Dados vieram via navigation state (ex: WorkspacePage)
            setPlan(state.planData);
            setSavedPlanId(state.planData.id);
            if (state.planData.evaluationId) {
                dbService.getEvaluation(state.planData.evaluationId)
                    .then(ev => { if (ev) setEvaluationData(ev); })
                    .catch(err => console.warn(err));
            }
        } else if (urlPlanId) {
            // Dados vieram via ?id= na URL (ex: WorkspaceOnePage)
            dbService.getCustomPlan(urlPlanId)
                .then(planData => {
                    if (planData) {
                        setPlan(planData);
                        setSavedPlanId(planData.id);
                        if (planData.evaluationId) {
                            dbService.getEvaluation(planData.evaluationId)
                                .then(ev => { if (ev) setEvaluationData(ev); })
                                .catch(err => console.warn(err));
                        }
                    } else {
                        showNotification('Sala não encontrada.', 'error');
                        navigate('/workspace-pastoral');
                    }
                })
                .catch(() => {
                    showNotification('Erro ao carregar a sala.', 'error');
                    navigate('/workspace-pastoral');
                });
        } else {
            // Novo plano
            setPlan(prev => {
                if (prev.weeks && prev.weeks.length > 0) return prev;
                const initialFrequency = 'weekly';
                return {
                    ...prev,
                    planningFrequency: initialFrequency,
                    weeks: [{ id: Date.now().toString(), title: getUnitLabel(initialFrequency, 1), days: [] }]
                };
            });
        }
    }, [state, urlPlanId]);

    const lessonRestoredRef = useRef(false);

    // Restaurar Aula da URL (Efeito dedicado para garantir que o plano foi carregado)
    useEffect(() => {
        if (typeof window === 'undefined') return;
        const params = new URLSearchParams(window.location.search);
        const urlLesson = params.get('lesson');
        
        if (urlLesson && !editingDayId && !lessonRestoredRef.current && plan.weeks && plan.weeks.length > 0) {
            const allDays = plan.weeks.flatMap(w => w.days.map(d => ({ ...d, weekId: w.id })));
            
            // Busca por ID exato ou por Slug do título
            const targetDay = allDays.find(d => {
                const slug = d.title.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^\w\s-]/g, '').replace(/[\s_]+/g, '-').replace(/^-+|-+$/g, '');
                return d.id === urlLesson || slug === urlLesson;
            });
            
            if (targetDay) {
                openEditor(targetDay.weekId, targetDay);
            } else if (urlLesson.match(/^\d+$/) || urlLesson.startsWith('type_')) {
                // Se for um ID de rascunho (timestamp ou slug temporário) e não estiver no plano, 
                // abre como aula nova para o CreateContentV3Page recuperar do cache local
                const firstWeekId = plan.weeks[0].id;
                openEditor(firstWeekId, { 
                    id: urlLesson.replace('type_', ''), 
                    title: 'Aula em Recuperação', 
                    description: '', 
                    htmlContent: '', 
                    isCompleted: false 
                });
            }
            lessonRestoredRef.current = true;
        } else if (!urlLesson) {
            lessonRestoredRef.current = true;
        }
    }, [plan.weeks, editingDayId]);

    // Sincronizar URL com Estado (Tabs e Aulas)
    useEffect(() => {
        if (typeof window === 'undefined') return;
        const params = new URLSearchParams(window.location.search);
        
        const tabMap: Record<number, string> = { 1: 'planejamento', 2: 'conteudo', 3: 'configuracoes', 4: 'avaliacao' };
        const currentTabName = tabMap[currentStep] || 'planejamento';
        
        let changed = false;
        if (params.get('tab') !== currentTabName) {
            params.set('tab', currentTabName);
            changed = true;
        }

        if (editingDayId) {
            const day = plan.weeks?.flatMap(w => w.days).find(d => d.id === editingDayId);
            const lessonSlug = day?.title ? day.title.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^\w\s-]/g, '').replace(/[\s_]+/g, '-').replace(/^-+|-+$/g, '') : editingDayId;
            
            if (params.get('lesson') !== lessonSlug) {
                params.set('lesson', lessonSlug);
                changed = true;
            }
        } else if (params.has('lesson') && lessonRestoredRef.current) {
            // Só remove 'lesson' se já passamos do restore inicial, para não apagar a URL antes de carregar
            params.delete('lesson');
            changed = true;
        }

        if (changed) {
            window.history.replaceState({}, '', `${window.location.pathname}?${params.toString()}`);
        }
    }, [currentStep, editingDayId, plan.weeks]);

    // Ouvir mensagens do editor embutido para sincronizar URL
    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            if (event.data?.type === 'SYNC_LESSON_URL' && event.data.slug) {
                const params = new URLSearchParams(window.location.search);
                if (params.get('lesson') !== event.data.slug) {
                    params.set('lesson', event.data.slug);
                    window.history.replaceState({}, '', `${window.location.pathname}?${params.toString()}`);
                }
            }
        };
        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, []);

    // --- UI AUTO-FOCUS MODE ---
    useEffect(() => {
        setIsFocusMode(true);
        return () => {
            setIsFocusMode(false);
            resetHeader();
        };
    }, [setIsFocusMode, resetHeader]);

    useEffect(() => {
        const planTitle = plan.title || 'Nova Sala de Estudo';

        if (editingDayId) {
            const aulLabel = editingDayTitle || 'Nova Aula';
            setGlobalTitle(aulLabel);
            setBreadcrumbs([
                { label: 'Criador de Jornada', path: '/workspace-pastoral' },
                { label: planTitle, path: `/criar-sala?id=${savedPlanId}`, onClick: () => window.location.assign(`/criar-sala?id=${savedPlanId}`) },
                { label: 'Conteúdo', path: `/criar-sala?id=${savedPlanId}`, onClick: () => { setEditingDayId(null); setCurrentStep(2); } },
                { label: aulLabel }
            ]);
            return;
        }

        if (currentStep === 2) {
             setGlobalTitle(planTitle);
             setBreadcrumbs([
                 { label: 'Criador de Jornada', path: '/workspace-pastoral' },
                 { label: planTitle, path: `/criar-sala?id=${savedPlanId}`, onClick: () => window.location.assign(`/criar-sala?id=${savedPlanId}`) },
                 { label: 'Conteúdo' }
             ]);
             return;
        }

        setGlobalTitle(planTitle);
        setBreadcrumbs([
            { label: 'Criador de Jornada', path: '/workspace-pastoral' },
            { label: planTitle, path: `/criar-sala?id=${savedPlanId}` }
        ]);
    }, [plan.title, editingDayId, editingDayTitle, currentStep, setGlobalTitle, setBreadcrumbs, savedPlanId, setEditingDayId, setCurrentStep]);

    // Load Pastor Teams
    useEffect(() => {
        const loadTeams = async () => {
            if (plan.isRanked && currentUser) {
                try {
                    const teams = await dbService.getGlobalTeams(currentUser.uid);
                    setPastorTeams(teams);
                } catch (e) { console.error(e); }
            }
        };
        loadTeams();
    }, [plan.isRanked, currentUser]);

    // Busca automática e handleSearchBible removidos: Agora processados pelo CreateContentV3Page embutido

    const handleFrequencyChange = (freq: PlanningFrequency) => {
        if (plan.weeks && plan.weeks.length > 0 && plan.weeks[0].days.length > 0) {
            setPendingFrequency(freq);
            setShowFreqConfirm(true);
            return;
        }
        applyFrequencyChange(freq);
    };

    const applyFrequencyChange = (freq: PlanningFrequency) => {
        setPlan(prev => ({
            ...prev,
            planningFrequency: freq,
            weeks: prev.weeks?.map((w, i) => ({ ...w, title: getUnitLabel(freq, i + 1) }))
        }));
    };

    const handleSuggestPrompt = async () => {
        if (!checkFeatureAccess('aiImageGen')) {
            openSubscription('A sugestao de capa com IA faz parte dos recursos criativos avancados.');
            return;
        }

        if (!plan.title || !plan.description) {
            showNotification("Preencha título e descrição para a IA sugerir um prompt.", "warning");
            return;
        }
        setIsSuggestingPrompt(true);
        try {
            const suggested = await generateImagePromptForPlan(plan.title, plan.description);
            if (suggested) setCoverPrompt(suggested);
        } catch (e) {
            showNotification("Erro ao sugerir prompt.", "error");
        } finally {
            setIsSuggestingPrompt(false);
        }
    };

    const handleGenerateCover = async () => {
        if (!checkFeatureAccess('aiImageGen')) {
            openSubscription('A geracao de capa com IA usa recursos criativos avancados para melhorar a apresentacao da sala.');
            return;
        }

        const promptToUse = coverPrompt || plan.description;
        if (!plan.title || !promptToUse) {
            showNotification("Informe um título e um prompt (ou descrição) para a IA.", "warning");
            return;
        }

        setIsGeneratingCover(true);
        try {
            const image = await generateVerseImage(plan.title, plan.description || '', promptToUse);
            if (image) {
                const blob = await base64ToBlob(`data:${image.mimeType};base64,${image.data}`);
                const url = await uploadBlob(blob, `plan_covers/${currentUser?.uid}_${Date.now()}.webp`);
                setPlan(prev => ({ ...prev, coverUrl: url }));
                await incrementUsage('images');
                showNotification("Capa gerada com sucesso!", "success");
            } else {
                showNotification("A IA não conseguiu gerar a imagem.", "error");
            }
        } catch (e) {
            console.error(e);
            showNotification("Erro ao gerar capa.", "error");
        } finally {
            setIsGeneratingCover(false);
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0] && currentUser) {
            const file = e.target.files[0];

            // Check dimensions (optional, but good for UX)
            // For now, we just upload
            setIsSaving(true);
            try {
                const url = await uploadBlob(file, `plan_covers/${currentUser.uid}_manual_${Date.now()}.webp`);
                setPlan(prev => ({ ...prev, coverUrl: url }));
                showNotification("Foto de capa enviada!", "success");
            } catch (err) {
                showNotification("Erro no upload.", "error");
            } finally {
                setIsSaving(false);
            }
        }
    };

    // Editor actions
    const handleBlockUndo = useCallback(() => {
        editorRef.current?.undo();
    }, []);

    const handleBlockRedo = useCallback(() => {
        editorRef.current?.redo();
    }, []);

    const openEditor = (weekId: string, dayItem?: PlanDayContent) => {
        setActiveWeekId(weekId);
        setSelectedBlockId(null);
        if (dayItem) {
            isLoadingItemRef.current = true;
            setDayTitle(dayItem.title);
            setEditingDayTitle(dayItem.title);
            setDayRef(dayItem.description || '');
            setDayVerseText('');
            setHtmlContent(dayItem.htmlContent || '<p></p>');
            
            // Inicializar blocos
            if (dayItem.blocksConfig && dayItem.blocksConfig.length > 0) {
                setEditorBlocks(dayItem.blocksConfig);
            } else {
                // Fallback para conteúdo legado (apenas HTML)
                setEditorBlocks([{
                    id: `legacy-${Date.now()}`,
                    type: 'study-content',
                    data: {
                        title: dayItem.title,
                        content: dayItem.htmlContent
                    }
                }]);
            }
            setEditingDayId(dayItem.id);
        } else {
            isLoadingItemRef.current = false;
            const newId = Date.now().toString();
            setEditingDayId(newId);
            setDayTitle('');
            setEditingDayTitle('Nova Aula');
            setDayRef('');
            setDayVerseText('');
            // Template modelo de aula — Sincronizado com CreateLandingPage
            setEditorBlocks(buildBaseBlocks([
                { type: 'hero-split', layoutWidth: '1/1' },
                { type: 'biblical', layoutWidth: '2/3' },
                { type: 'study-outline', layoutWidth: '1/3' },
                { type: 'rich-text', layoutWidth: '1/1' },
                { type: 'slide', layoutWidth: '1/1' },
                { type: 'related-verses', layoutWidth: '1/1' },
                { type: 'authority', layoutWidth: '1/1' },
                { type: 'footer', layoutWidth: '1/1' },
                { type: 'reflection-question', layoutWidth: '1/1' }
            ]));
            setHtmlContent('');
        }
    };

    // handleAiFill e saveDayContent removidos: delegados ao componente CreateContentV3Page embutido

    const handleDeleteDay = (weekId: string, dayId: string) => {
        setPendingDeleteDay({ weekId, dayId });
        setShowDeleteDayConfirm(true);
    };

    const confirmDeleteDay = () => {
        if (!pendingDeleteDay) return;
        setPlan(prev => ({
            ...prev,
            weeks: prev.weeks?.map(w => {
                if (w.id !== pendingDeleteDay.weekId) return w;
                return { ...w, days: w.days.filter(d => d.id !== pendingDeleteDay.dayId) };
            })
        }));
        showNotification("Aula removida.", "success");
        setPendingDeleteDay(null);
        setShowDeleteDayConfirm(false);
    };

    const onDragEnd = (result: DropResult) => {
        const { source, destination } = result;
        if (!destination) return;
        if (source.droppableId === destination.droppableId && source.index === destination.index) return;

        setPlan(prev => {
            if (!prev.weeks) return prev;
            const newWeeks = [...prev.weeks];
            const sourceWeekIndex = newWeeks.findIndex(w => w.id === source.droppableId);
            const destWeekIndex = newWeeks.findIndex(w => w.id === destination.droppableId);

            if (sourceWeekIndex === -1 || destWeekIndex === -1) return prev;

            const sourceDays = [...newWeeks[sourceWeekIndex].days];
            const [movedDay] = sourceDays.splice(source.index, 1);

            if (sourceWeekIndex === destWeekIndex) {
                sourceDays.splice(destination.index, 0, movedDay);
                newWeeks[sourceWeekIndex] = { ...newWeeks[sourceWeekIndex], days: sourceDays };
            } else {
                const destDays = [...newWeeks[destWeekIndex].days];
                destDays.splice(destination.index, 0, movedDay);
                newWeeks[sourceWeekIndex] = { ...newWeeks[sourceWeekIndex], days: sourceDays };
                newWeeks[destWeekIndex] = { ...newWeeks[destWeekIndex], days: destDays };
            }

            return { ...prev, weeks: newWeeks };
        });
    };

    const handleAddBlock = (type: any) => {
        editorRef.current?.insertBlock(type);
    };

    const handleUpdateBlock = (id: string, data: any) => {
        editorRef.current?.updateBlock(id, data);
        if (activeBlockData?.id === id) {
            setActiveBlockData((prev: any) => ({ ...prev, data: { ...prev.data, ...data } }));
        }
    };

    const handleRemoveBlock = (id: string) => {
        editorRef.current?.removeBlock(id);
        if (selectedBlockId === id) setSelectedBlockId(null);
        if (activeBlockData?.id === id) setActiveBlockData(null);
    };




    // Load access logs when settings tab is opened
    useEffect(() => {
        if (showSettingsOverlay && settingsTab === 'access' && savedPlanId) {
            const fetchLogs = async () => {
                setIsLoadingLogs(true);
                try {
                    const logs = await dbService.getStudyAccessLogs(savedPlanId);
                    setAccessLogs(logs);
                } catch (e) {
                    console.error("Erro ao carregar logs:", e);
                } finally {
                    setIsLoadingLogs(false);
                }
            };
            fetchLogs();
        }
    }, [showSettingsOverlay, settingsTab, savedPlanId]);


    const handleSavePlan = async (targetStatus: 'draft' | 'published') => {
        if (!currentUser) { openLogin(); return; }
        if (!plan.title) { showNotification("Título obrigatório.", "error"); return; }

        if (targetStatus === 'published') setIsPublishing(true);
        else setIsSaving(true);

        try {
            const planData: any = {
                ...plan,
                authorId: currentUser.uid,
                authorName: userProfile?.displayName || 'Pastor',
                churchId: userProfile?.churchData?.churchId,
                updatedAt: new Date().toISOString(),
                status: targetStatus,
                isPublic: targetStatus === 'published' && (plan.privacyLevel ?? plan.privacyType) === 'public',
                teams: plan.isRanked ? pastorTeams : []
            };

            let newId = savedPlanId;
            if (savedPlanId) {
                await dbService.updateCustomPlan(savedPlanId, planData);
            } else {
                planData.createdAt = new Date().toISOString();
                planData.subscribersCount = 0;
                const ref = await dbService.createCustomPlan(planData);
                newId = ref.id;
            }
            setSavedPlanId(newId);
            setPlan(prev => ({ ...prev, status: targetStatus }));

            if (targetStatus === 'published') setShowSaveSuccessModal(true);
            else showNotification("Rascunho salvo.", "success");

        } catch (e) {
            showNotification("Erro ao salvar.", "error");
        } finally {
            setIsSaving(false);
            setIsPublishing(false);
        }
    };

    const handleSaveEvaluation = async (data: any) => {
        if (!savedPlanId || !currentUser) return;
        setIsSavingEval(true);
        try {
            const evalRef = await dbService.createEvaluation({ ...data, planId: savedPlanId, authorId: currentUser.uid, createdAt: new Date().toISOString() });
            await dbService.updateCustomPlan(savedPlanId, { hasEvaluation: true, evaluationId: evalRef.id });
            setPlan(prev => ({ ...prev, hasEvaluation: true, evaluationId: evalRef.id }));
            setEvaluationData({ id: evalRef.id, ...data });
            showNotification("Prova salva!", "success");
        } catch (e) { console.error(e); }
        finally { setIsSavingEval(false); }
    };

    const isPlanPublished = plan.status === 'published';
    const headerTitle = editingDayId
        ? (
            <div className="flex items-center gap-3">
                <button 
                    onClick={() => setEditingDayId(null)}
                    className="p-2 -ml-2 text-gray-400 hover:text-bible-gold hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all"
                    title="Voltar para a Lista de Aulas"
                >
                    <ArrowLeft size={18} />
                </button>
                <div className="flex flex-col">
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Editando Aula</span>
                    <span className="text-sm font-black text-gray-900 dark:text-white truncate max-w-[200px]">{editingDayTitle || 'Nova Aula'}</span>
                </div>
            </div>
        )
        : (
            <div className="flex items-center gap-2">
                <span className="font-black text-gray-900 dark:text-white">{isPlanPublished ? "Gestão da Sala" : "Sala de Estudos"}</span>
            </div>
        );

    const activeUnit = plan.weeks?.find((unit) => unit.id === activeWeekId);
    const activeLessonIndex = activeUnit?.days.findIndex((day) => day.id === editingDayId) ?? -1;
    const activeLessonNumber = activeLessonIndex >= 0 ? activeLessonIndex + 1 : (activeUnit?.days.length || 0) + 1;
    const editingDisplayTitle = getLessonDisplayTitle(plan.planningFrequency, activeLessonNumber, dayTitle || editingDayTitle);
    const displayEditorBlocks = editorBlocks.map((block, index) => {
        if (index > 0 || !['hero', 'hero-split'].includes(block.type)) return block;
        return {
            ...block,
            data: {
                ...block.data,
                title: editingDisplayTitle,
            },
        };
    });

    return (
        <div className={editingDayId ? "h-[100dvh] bg-bible-paper dark:bg-black overflow-hidden flex flex-col" : "h-full bg-bible-paper dark:bg-black overflow-y-auto flex flex-col"}>
            <SEO title="Sala de Estudos" />

            {/* HEADER — hidden while editing a lesson */}
            {!editingDayId && (
            <div className="sticky top-0 z-40 bg-white/80 dark:bg-[#0a0a0a]/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 px-4 md:px-8 py-2 flex flex-col md:flex-row justify-between items-center shadow-sm gap-2 h-auto md:h-20 shrink-0">
                <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
                    <button 
                        onClick={() => navigate('/workspace-pastoral')}
                        className="flex items-center gap-2 p-2 pr-4 text-gray-500 hover:text-bible-gold hover:bg-gray-50 dark:hover:bg-gray-900 rounded-xl transition-all"
                    >
                        <ArrowLeft size={18} />
                        <span className="text-xs font-bold uppercase tracking-widest hidden md:inline">Voltar</span>
                    </button>
                    {!editingDayId && isPlanPublished && <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse hidden md:block" title="Sala Ativa"></div>}
                </div>

                {!editingDayId && (
                    <div className="flex bg-gray-100 dark:bg-gray-900 p-1 rounded-xl mx-auto w-full md:w-auto overflow-x-auto no-scrollbar custom-scrollbar justify-start md:justify-center">
                        {steps.map((step) => (
                            <button
                                key={step.id}
                                onClick={() => setCurrentStep(step.id)}
                                className={`flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 px-3 py-1 md:px-6 md:py-2 rounded-lg text-[9px] md:text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap min-w-max md:min-w-0 ${currentStep === step.id ? 'bg-white dark:bg-gray-700 text-bible-gold shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                            >
                                <step.icon size={14} className="" />
                                <span className="md:inline">{step.title}</span>
                            </button>
                        ))}
                    </div>
                )}

                <div className="flex items-center gap-2 w-full md:w-auto justify-end py-1 md:py-0">
                    {isPlanPublished ? (
                        <button
                            onClick={() => handleSavePlan('published')}
                            disabled={isSaving || isPublishing}
                            className="px-4 py-2 bg-green-600 text-white rounded-xl shadow-sm active:scale-95 text-xs font-bold uppercase tracking-widest flex items-center gap-2 w-full md:w-auto justify-center"
                        >
                            {isPublishing ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />} Salvar
                        </button>
                    ) : (
                        <>
                            <button
                                onClick={() => handleSavePlan('draft')}
                                disabled={isSaving}
                                className="flex-1 md:flex-none flex items-center justify-center px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-bible-gold hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors text-xs font-bold uppercase tracking-widest border border-gray-200 dark:border-gray-700 md:border-transparent"
                            >
                                {isSaving ? <Loader2 className="animate-spin" size={16} /> : "Salvar Rascunho"}
                            </button>
                            <button
                                onClick={() => handleSavePlan('published')}
                                disabled={isPublishing}
                                className="flex-1 md:flex-none px-4 py-2 bg-bible-gold text-white rounded-xl shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest"
                            >
                                {isPublishing ? <Loader2 className="animate-spin" size={16} /> : <Globe size={16} />} Publicar
                            </button>
                        </>
                    )}
                </div>
            </div>
            )}

            <div className={editingDayId ? "flex-1 min-w-0 overflow-hidden flex flex-col" : "flex-1 p-4 md:p-8 max-w-6xl mx-auto w-full"}>

                {/* STEPS NAVIGATION - REMOVED FROM HERE */}

                {!editingDayId ? (
                    // --- VIEW: PLAN CONFIGURATION (ROOT) ---
                    <div className="space-y-6">

                        {currentStep === 1 && (
                            <div className="bg-white dark:bg-bible-darkPaper p-4 md:p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 space-y-4 md:space-y-6 animate-in fade-in max-w-4xl mx-auto">
                                <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 mb-4">
                                    <Calendar size={16} /> Planejamento da Sala
                                </h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 block mb-1">Título da Jornada</label>
                                        <input type="text" value={plan.title} onChange={e => setPlan({ ...plan, title: e.target.value })} className="w-full p-3 md:p-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl font-bold text-sm md:text-base outline-none focus:ring-2 ring-bible-gold" placeholder="Ex: Vida de Oração" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 block mb-1">Descrição</label>
                                        <textarea value={plan.description} onChange={e => setPlan({ ...plan, description: e.target.value })} className="w-full p-3 md:p-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium outline-none focus:ring-2 ring-bible-gold resize-none h-20" placeholder="Breve resumo..." />
                                    </div>
                                </div>

                                {/* Frequency */}
                                <div>
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 block mb-2">Tempo de Estudo</label>
                                    <div className="flex bg-gray-100 dark:bg-gray-900 p-1.5 rounded-xl">
                                        {['daily', 'weekly', 'monthly'].map(f => (
                                            <button
                                                key={f}
                                                onClick={() => handleFrequencyChange(f as any)}
                                                className={`flex-1 py-3 text-xs font-bold uppercase rounded-lg transition-all ${plan.planningFrequency === f ? 'bg-white dark:bg-gray-800 text-bible-gold shadow-sm' : 'text-gray-400'}`}
                                            >
                                                {f === 'daily' ? 'Diário' : f === 'weekly' ? 'Semanal' : 'Mensal'}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Dates */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 block mb-1">Data de Início</label>
                                        <input type="date" value={plan.startDate || ''} onChange={e => setPlan({ ...plan, startDate: e.target.value })} className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl font-bold text-sm outline-none focus:ring-2 ring-bible-gold" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 block mb-1">Data de Fim (Opcional)</label>
                                        <input type="date" value={plan.endDate || ''} onChange={e => setPlan({ ...plan, endDate: e.target.value })} className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl font-bold text-sm outline-none focus:ring-2 ring-bible-gold" />
                                    </div>
                                </div>
                                <p className="text-xs text-gray-500 italic ml-1">Deixe a data de fim em branco para um curso contínuo (sem data definida).</p>

                                <div className="pt-4 flex justify-end">
                                    <button
                                        onClick={() => setCurrentStep(2)}
                                        className="px-6 py-3 bg-bible-gold text-white rounded-xl font-bold shadow-lg hover:scale-105 transition-transform flex items-center gap-2"
                                    >
                                        Próximo: Conteúdo <ArrowLeft size={18} className="rotate-180" />
                                    </button>
                                </div>
                            </div>
                        )}

                        {currentStep === 2 && (
                            <div className="bg-white dark:bg-bible-darkPaper p-4 md:p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 space-y-6 animate-in fade-in max-w-4xl mx-auto">
                                <div className="flex justify-between items-center px-2">
                                    <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                        <Layers size={16} /> Cronograma de Aulas
                                    </h3>
                                    <button onClick={() => setPlan(p => ({ ...p, weeks: [...(p.weeks || []), { id: Date.now().toString(), title: getUnitLabel(p.planningFrequency || 'weekly', (p.weeks?.length || 0) + 1), days: [] }] }))} className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                                        <Plus size={14} /> Nova Unidade
                                    </button>
                                </div>

                                <DragDropContext onDragEnd={onDragEnd}>
                                    {plan.weeks?.map((unit, uIdx) => (
                                        <div key={unit.id} className="bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm">
                                            <div className="p-4 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                                                <div className="flex items-center gap-4 flex-1">
                                                    <div className="w-8 h-8 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center text-xs font-bold text-gray-500 shadow-sm border border-gray-100 dark:border-gray-700">{uIdx + 1}</div>
                                                    <input
                                                        type="text"
                                                        value={unit.title}
                                                        onChange={e => setPlan(prev => ({ ...prev, weeks: prev.weeks?.map(w => w.id === unit.id ? { ...w, title: e.target.value } : w) }))}
                                                        className="bg-transparent font-bold text-sm text-gray-900 dark:text-white outline-none w-full"
                                                    />
                                                </div>
                                                <button onClick={() => setPlan(p => ({ ...p, weeks: p.weeks?.filter(w => w.id !== unit.id) }))} className="text-gray-300 hover:text-red-500 p-2"><Trash2 size={16} /></button>
                                            </div>
                                            
                                            <Droppable droppableId={unit.id}>
                                                {(provided) => (
                                                    <div 
                                                        {...provided.droppableProps}
                                                        ref={provided.innerRef}
                                                        className="p-4 space-y-3 min-h-[50px]"
                                                    >
                                                        {unit.days.length === 0 && (
                                                            <p className="text-center text-xs text-gray-400 py-4 italic">Nenhuma aula nesta unidade.</p>
                                                        )}
                                                        {unit.days.map((day, index) => (
                                                            <Draggable key={day.id} draggableId={day.id} index={index}>
                                                                {(provided, snapshot) => (
                                                                    <div
                                                                        ref={provided.innerRef}
                                                                        {...provided.draggableProps}
                                                                        {...provided.dragHandleProps}
                                                                        onClick={() => openEditor(unit.id, day)}
                                                                        className={`flex items-center gap-4 p-3 bg-white dark:bg-bible-darkPaper rounded-xl border border-gray-100 dark:border-gray-800 hover:border-bible-gold/50 cursor-pointer group transition-all ${snapshot.isDragging ? 'shadow-2xl ring-2 ring-bible-gold border-transparent z-50' : ''}`}
                                                                    >
                                                                        <div className="p-2 bg-bible-gold/10 text-bible-gold rounded-lg"><FileText size={18} /></div>
                                                                        <div className="flex-1 min-w-0">
                                                                            <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                                                                                {getLessonDisplayTitle(plan.planningFrequency, index + 1, day.title)}
                                                                            </p>
                                                                            <p className="text-[10px] text-gray-500 truncate">{day.description || 'Sem referência definida'}</p>
                                                                        </div>
                                                                        <div className="flex items-center gap-2">
                                                                            <button 
                                                                                onClick={(e) => { e.stopPropagation(); handleDeleteDay(unit.id, day.id); }}
                                                                                className="p-2 text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                                                            >
                                                                                <Trash2 size={14} />
                                                                            </button>
                                                                            <ChevronDown size={16} className="-rotate-90 text-gray-300 group-hover:text-bible-gold transition-colors" />
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </Draggable>
                                                        ))}
                                                        {provided.placeholder}
                                                        <button onClick={() => openEditor(unit.id)} className="w-full py-4 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold text-gray-400 hover:text-bible-gold hover:border-bible-gold transition-colors flex items-center justify-center gap-2">
                                                            <Plus size={14} /> Adicionar Aula
                                                        </button>
                                                    </div>
                                                )}
                                            </Droppable>
                                        </div>
                                    ))}
                                </DragDropContext>


                                <div className="pt-4 flex justify-end">
                                    <button
                                        onClick={() => setCurrentStep(3)}
                                        className="px-6 py-3 bg-bible-gold text-white rounded-xl font-bold shadow-lg hover:scale-105 transition-transform flex items-center gap-2"
                                    >
                                        Próximo: Configurações <ArrowLeft size={18} className="rotate-180" />
                                    </button>
                                </div>
                            </div>
                        )}

                        {currentStep === 3 && (
                            <div className="bg-white dark:bg-bible-darkPaper p-4 md:p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 space-y-6 animate-in fade-in max-w-4xl mx-auto">
                                <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 mb-4">
                                    <Settings size={16} /> Configurações da Sala
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 block mb-2">Visibilidade</label>
                                        <select value={plan.privacyType} onChange={e => setPlan({ ...plan, privacyType: e.target.value as any })} className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl font-bold text-sm outline-none">
                                            <option value="public">Público (Todos)</option>
                                            <option value="followers">Privado com convite</option>
                                            <option value="group">Membros da Célula</option>
                                            <option value="church">Membros da Igreja</option>
                                        </select>
                                    </div>
                                    <div className="flex items-end">
                                        <button onClick={() => setPlan({ ...plan, isRanked: !plan.isRanked })} className={`w-full py-3 rounded-xl text-xs font-black uppercase transition-all flex items-center justify-center gap-2 border-2 ${plan.isRanked ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20 text-orange-600' : 'border-gray-200 dark:border-gray-700 text-gray-400 bg-transparent'}`}>
                                            <Trophy size={16} /> {plan.isRanked ? 'Modo Rankeado Ativo' : 'Ativar Ranking'}
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                                    <div className="flex flex-col gap-3">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 block">Visual da Sala (Capa)</label>

                                        <div className="flex flex-col md:flex-row gap-4 items-start">
                                            <div className="w-full md:w-48 h-28 bg-gray-100 dark:bg-gray-800 rounded-2xl overflow-hidden shrink-0 border border-gray-200 dark:border-gray-700 flex items-center justify-center relative group">
                                                {plan.coverUrl ? (
                                                    <>
                                                        <img src={plan.coverUrl} className="w-full h-full object-cover" />
                                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                            <button onClick={() => fileInputRef.current?.click()} className="p-2 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/40"><Camera size={18} /></button>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <ImageIcon className="text-gray-300" size={32} />
                                                )}
                                            </div>

                                            <div className="flex-1 space-y-3 w-full">
                                                <div className="flex flex-col gap-2">
                                                    <div className="flex justify-between items-center">
                                                        <label className="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-widest ml-1">Prompt para IA</label>
                                                        <button
                                                            onClick={handleSuggestPrompt}
                                                            disabled={isSuggestingPrompt}
                                                            className="text-[10px] font-bold text-gray-400 hover:text-bible-gold flex items-center gap-1 transition-colors"
                                                        >
                                                            {isSuggestingPrompt ? <Loader2 size={10} className="animate-spin" /> : <Sparkles size={10} />} Sugerir baseado na descrição
                                                        </button>
                                                    </div>
                                                    <textarea
                                                        value={coverPrompt}
                                                        onChange={e => setCoverPrompt(e.target.value)}
                                                        placeholder="Descreva o estilo visual desejado... (Ex: Arte épica, luz divina, tons de ouro)"
                                                        className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-medium outline-none focus:ring-2 ring-purple-400 h-20 resize-none"
                                                    />
                                                </div>

                                                <div className="flex flex-wrap gap-2">
                                                    <button
                                                        onClick={handleGenerateCover}
                                                        disabled={isGeneratingCover}
                                                        className="flex-1 min-w-[140px] py-2.5 bg-purple-600 text-white rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg hover:bg-purple-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                                    >
                                                        {isGeneratingCover ? <Loader2 size={14} className="animate-spin" /> : <Wand2 size={14} />} Gerar com IA
                                                    </button>
                                                    <button
                                                        onClick={() => fileInputRef.current?.click()}
                                                        className="flex-1 min-w-[140px] py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-xl font-black uppercase text-[10px] tracking-widest border border-gray-200 dark:border-gray-700 hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
                                                    >
                                                        <Camera size={14} /> Anexar Arquivo
                                                    </button>
                                                </div>
                                                <div className="flex items-center gap-1 text-[9px] text-gray-400 font-bold uppercase tracking-tighter">
                                                    <Info size={10} /> Recomendado: 1200x630px ou 16:9 • Máx 2MB
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleFileChange}
                                        className="hidden"
                                        accept="image/*"
                                    />
                                </div>

                                <div className="pt-4 flex justify-end">
                                    <button
                                        onClick={() => setCurrentStep(4)}
                                        className="px-6 py-3 bg-bible-gold text-white rounded-xl font-bold shadow-lg hover:scale-105 transition-transform flex items-center gap-2"
                                    >
                                        Próximo: Avaliação <ArrowLeft size={18} className="rotate-180" />
                                    </button>
                                </div>
                            </div>
                        )}

                        {currentStep === 4 && (
                            <div className="bg-white dark:bg-bible-darkPaper p-4 md:p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 space-y-6 animate-in fade-in text-center max-w-4xl mx-auto">
                                <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <GraduationCap size={32} />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Avaliação da Sala</h3>
                                <p className="text-sm text-gray-500 max-w-md mx-auto mb-6">
                                    Crie uma prova final para testar o conhecimento dos alunos. Você pode adicionar perguntas manualmente ou usar a IA para gerar com base no conteúdo das aulas.
                                </p>

                                {evaluationData ? (
                                    <div className="max-w-md mx-auto bg-gray-50 dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-700 mb-6 text-left">
                                        <h4 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-2">
                                            <CheckCircle2 size={16} className="text-green-500" /> Prova Criada
                                        </h4>
                                        <p className="text-xs text-gray-500 mb-1">Total de Questões: <span className="font-bold text-gray-900 dark:text-white">{evaluationData.questions?.length || 0}</span></p>
                                        <p className="text-xs text-gray-500">Nota Mínima: <span className="font-bold text-gray-900 dark:text-white">{evaluationData.passingScore || 70}%</span></p>
                                    </div>
                                ) : null}

                                <div className="flex justify-center gap-3">
                                    <button onClick={() => savedPlanId ? setShowEvalModal(true) : showNotification("Salve a sala primeiro para criar a prova", "warning")} className="px-6 py-3 bg-bible-gold text-white rounded-xl font-bold shadow-lg hover:scale-105 transition-transform inline-flex items-center gap-2">
                                        <Plus size={18} /> {evaluationData ? 'Editar Prova' : 'Criar Prova Final'}
                                    </button>
                                </div>

                                <div className="pt-8 border-t border-gray-100 dark:border-gray-800 flex flex-col md:flex-row justify-center gap-4">
                                    <button
                                        onClick={() => handleSavePlan('draft')}
                                        disabled={isSaving}
                                        className="w-full md:w-auto max-w-xs mx-auto md:mx-0 py-4 px-6 md:px-8 border-2 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 rounded-xl hover:border-bible-gold hover:text-bible-gold transition-colors font-black uppercase tracking-widest flex items-center justify-center gap-2"
                                    >
                                        {isSaving ? <Loader2 className="animate-spin" size={18} /> : (savedPlanId ? <Check size={18} className="text-bible-gold" /> : <Save size={18} />)}
                                        {savedPlanId ? "Rascunho Atualizado" : "Salvar Rascunho"}
                                    </button>

                                    {savedPlanId && (
                                        <button
                                            onClick={() => navigate(`/jornada/${savedPlanId}`, { state: { fromEditor: true } })}
                                            className="w-full md:w-auto max-w-xs mx-auto md:mx-0 py-4 px-6 md:px-8 bg-bible-gold text-white rounded-xl hover:scale-105 transition-all font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-bible-gold/20"
                                        >
                                            <Eye size={18} />
                                            Visualizar Sala
                                        </button>
                                    )}
                                    <button
                                        onClick={() => handleSavePlan('published')}
                                        disabled={isPublishing}
                                        className="w-full md:w-auto max-w-xs mx-auto md:mx-0 py-4 px-8 bg-green-600 text-white rounded-xl shadow-lg hover:scale-105 transition-transform font-black uppercase tracking-widest flex items-center justify-center gap-2"
                                    >
                                        {isPublishing ? <Loader2 className="animate-spin" size={18} /> : <Globe size={18} />}
                                        Publicar Sala
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex flex-col h-full min-w-0 animate-in fade-in relative z-50">
                        <CreateContentV3Page 
                            embeddedContext={{
                                initialContent: {
                                     id: editingDayId,
                                     title: editingDisplayTitle,
                                     type: 'article',
                                     status: 'draft',
                                     blocks: displayEditorBlocks,
                                     meta: { title: editingDisplayTitle, description: dayRef, tags: dayTags, category: dayCategory }
                                 },
                                 onSave: async (content, status) => {
                                     // Sincroniza o estado do PlanBuilderPage com os dados salvos no CreateLandingPage
                                     const cleanTitle = stripLessonDisplayPrefix(content.meta.title || '');
                                     setDayTitle(cleanTitle);
                                     setDayRef(content.meta.description || '');
                                     setDayTags(content.meta.tags || []);
                                     setDayCategory(content.meta.category || 'Geral');
                                    setEditorBlocks(content.blocks || []);
                                    
                                     const newDay: PlanDayContent = {
                                         id: editingDayId,
                                         title: cleanTitle || dayTitle || 'Nova Aula',
                                        description: content.meta.description || dayRef,
                                        htmlContent: '<p>Conteúdo em construção...</p>',
                                        blocksConfig: content.blocks,
                                        isCompleted: false,
                                        tags: content.meta.tags || dayTags,
                                        category: content.meta.category || dayCategory
                                    };

                                    setPlan(prev => ({
                                        ...prev,
                                        weeks: prev.weeks?.map(w => {
                                            if (w.id !== activeWeekId) return w;
                                            const exists = w.days.find(d => d.id === editingDayId);
                                            if (exists) {
                                                return { ...w, days: w.days.map(d => d.id === editingDayId ? newDay : d) };
                                            } else {
                                                return { ...w, days: [...w.days, newDay] };
                                            }
                                        })
                                    }));
                                    showNotification("Aula salva com sucesso!", "success");
                                    setEditingDayId(null);
                                 },
                                 onClose: () => setEditingDayId(null),
                                 isEmbedded: true,
                                 displayTitle: editingDisplayTitle
                             }}
                        />
                    </div>
                )}

            <ConfirmationModal isOpen={showSaveSuccessModal} onClose={() => setShowSaveSuccessModal(false)} onConfirm={() => savedPlanId && navigate(`/jornada/${savedPlanId}`)} title="Sucesso!" message="Sua sala foi publicada. Abra a preview para copiar o link, editar o acesso ou compartilhar no Reino." confirmText="Ver Preview" variant="success" />
            <ConfirmationModal
                isOpen={showFreqConfirm}
                onClose={() => { setShowFreqConfirm(false); setPendingFrequency(null); }}
                onConfirm={() => { if (pendingFrequency) applyFrequencyChange(pendingFrequency); setShowFreqConfirm(false); setPendingFrequency(null); }}
                title="Alterar frequência?"
                message="Alterar a frequência pode renomear suas unidades. Deseja continuar?"
                confirmText="Sim, alterar"
                cancelText="Cancelar"
                variant="warning"
            />
            <ConfirmationModal
                isOpen={showDeleteDayConfirm}
                onClose={() => { setShowDeleteDayConfirm(false); setPendingDeleteDay(null); }}
                onConfirm={confirmDeleteDay}
                title="Excluir aula?"
                message="Deseja realmente excluir esta aula? Esta ação não pode ser desfeita."
                confirmText="Sim, excluir"
                cancelText="Cancelar"
                variant="danger"
            />
            <EvaluationBuilderModal isOpen={showEvalModal} onClose={() => setShowEvalModal(false)} onSave={handleSaveEvaluation} initialData={evaluationData || undefined} />
            <ObreiroIAChatbot />
        </div>
        </div>
    );
};

export default PlanBuilderPage;
