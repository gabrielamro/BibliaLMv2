"use client";
import { useNavigate, useLocation, useSearchParams } from '../utils/router';


import React, { useState, useEffect, useRef, useCallback } from 'react';

import { useAuth } from '../contexts/AuthContext';
import { useHeader } from '../contexts/HeaderContext';
import { dbService, uploadBlob } from '../services/supabase';
import { bibleService } from '../services/bibleService';
import { generateImagePromptForPlan, generateStructuredStudy } from '../services/pastorAgent';
import { generateVerseImage } from '../services/geminiService';
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

import { 
    ContentBuilder, 
    Block, 
    BlockType, 
    createBlock,
    buildBaseBlocks,
    buildWrittenContentHtml,
    blockLabels 
} from '../components/Builder';
import { BlockProperties } from '../components/Builder/BlockProperties';
import ObreiroIAChatbot from '../components/ObreiroIAChatbot';
import { MobileToolbar } from '../components/Builder/MobileToolbar';
import { MobilePropertiesSheet } from '../components/Builder/MobilePropertiesSheet';
import { MobileAddBlockMenu } from '../components/Builder/MobileAddBlockMenu';


const getUnitLabel = (freq: PlanningFrequency, index: number) => {
    switch (freq) {
        case 'daily': return `Dia ${index}`;
        case 'weekly': return `Semana ${index}`;
        case 'monthly': return `Mês ${index}`;
        default: return `Unidade ${index}`;
    }
};

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
    const [dayVerseText, setDayVerseText] = useState('');
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
    const [editorBlocks, setEditorBlocks] = useState<Block[]>([]);
    const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
    const [canvasWidth, setCanvasWidth] = useState<'mobile' | 'tablet' | 'desktop' | 'full'>('desktop');
    const [isMobilePropertiesOpen, setIsMobilePropertiesOpen] = useState(false);
    const [isMobileAddMenuOpen, setIsMobileAddMenuOpen] = useState(false);

    // Undo/Redo History
    const [blockHistory, setBlockHistory] = useState<Block[][]>([]);
    const [blockHistoryIndex, setBlockHistoryIndex] = useState(-1);
    const [isUndoing, setIsUndoing] = useState(false);

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
                { label: planTitle, path: `/criador-jornada?id=${savedPlanId}`, onClick: () => window.location.assign(`/criador-jornada?id=${savedPlanId}`) },
                { label: 'Conteúdo', path: `/criador-jornada?id=${savedPlanId}`, onClick: () => { setEditingDayId(null); setCurrentStep(2); } },
                { label: aulLabel }
            ]);
            return;
        }

        if (currentStep === 2) {
             setGlobalTitle(planTitle);
             setBreadcrumbs([
                 { label: 'Criador de Jornada', path: '/workspace-pastoral' },
                 { label: planTitle, path: `/criador-jornada?id=${savedPlanId}`, onClick: () => window.location.assign(`/criador-jornada?id=${savedPlanId}`) },
                 { label: 'Conteúdo' }
             ]);
             return;
        }

        setGlobalTitle(planTitle);
        setBreadcrumbs([
            { label: 'Criador de Jornada', path: '/workspace-pastoral' },
            { label: planTitle, path: `/criador-jornada?id=${savedPlanId}` }
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

    // Busca automática da Bíblia ao digitar referência (Debounce)
    useEffect(() => {
        // Se estamos carregando um item existente, ignoramos esta mudança automática do dayRef
        // Resetamos o ref indepentemente do tamanho do texto para não travar a próxima busca
        if (isLoadingItemRef.current) {
            isLoadingItemRef.current = false;
            return;
        }

        const ref = dayRef.trim();
        // Otimização: Não busca se for muito curto, se já estiver gerando IA ou se não houver aula ativa
        if (ref.length < 3 || !editingDayId || isGeneratingAI) return;

        if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
        searchTimeoutRef.current = setTimeout(() => {
            handleSearchBible();
        }, 1200); // Aumentado um pouco o delay para otimizar chamadas

        return () => {
            if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
        };
    }, [dayRef, editingDayId, isGeneratingAI]);

    const handleSearchBible = async () => {
        const ref = dayRef.trim();
        if (ref.length < 3 || !editingDayId) return;

        setIsFetchingBible(true);
        try {
            const verseData = await bibleService.getTextByReference(ref);
            if (verseData) {
                setDayVerseText(verseData.text);
                if (!dayTitle || dayTitle === 'Nova Aula') setDayTitle(`Aula: ${verseData.formattedRef}`);

                let htmlBlockquoteContent = `"${verseData.text}"`;

                // Formatação interativa para textos com múltiplos versículos
                const verseMatches = Array.from(verseData.text.matchAll(/\[(\d+)\]\s+([^\[]+)/g));
                if (verseMatches.length > 3) {
                    const first3 = verseMatches.slice(0, 3).map(m => `[${m[1]}] ${m[2].trim()}`).join(' ');
                    const rest = verseMatches.slice(3).map(m => `[${m[1]}] ${m[2].trim()}`).join('<br/><br/>');

                    htmlBlockquoteContent = `"${first3}..." 
<details class="bible-details">
  <summary>&#128065; Ver todo o texto bíblico (${verseMatches.length} versículos)</summary>
  <div class="bible-details-content">
    ${rest}
  </div>
</details>`;
                }

                setHtmlContent(prev => {
                    let newHtml = prev;

                    // Altera título se tiver padrão 'Nova Aula'
                    if (newHtml.includes('Nova Aula') && (!dayTitle || dayTitle === 'Nova Aula')) {
                        newHtml = newHtml.replace('Nova Aula', `Aula: ${verseData.formattedRef}`);
                    }

                    // Altera a Referência (Subtítulo abaixo do H1) de forma robusta com Regex
                    // Independente de ser a 1Ã‚Âª busca ou n-ésima busca
                    if (newHtml.includes('Referência Bíblica Base')) {
                        newHtml = newHtml.replace('Referência Bíblica Base', verseData.formattedRef);
                    } else {
                        newHtml = newHtml.replace(
                            /<p (?:style="text-align: center; color: #888; font-style: italic; font-size: 1.1em; margin-bottom: 30px;"|class="bible-subtitle")>.*?<\/p>/i,
                            `<p class="bible-subtitle">${verseData.formattedRef}</p>`
                        );
                    }

                    // Força a inserção atualizada do bloco de citação completo toda vez!
                    newHtml = newHtml.replace(
                        /<blockquote[^>]*>[\s\S]*?<\/blockquote>/i,
                        `<blockquote>\n    ${htmlBlockquoteContent}\n  </blockquote>`
                    );

                    return newHtml;
                });
            } else {
                showNotification("Referência não encontrada na base.", "warning");
            }
        } catch (e) {
            console.error(e);
            showNotification("Erro ao buscar texto bíblico.", "error");
        } finally {
            setIsFetchingBible(false);
        }
    };

    const handleFrequencyChange = (freq: PlanningFrequency) => {
        if (plan.weeks && plan.weeks.length > 0 && plan.weeks[0].days.length > 0) {
            if (!confirm("Alterar a frequência pode renomear suas unidades. Continuar?")) return;
        }
        setPlan(prev => ({
            ...prev,
            planningFrequency: freq,
            weeks: prev.weeks?.map((w, i) => ({ ...w, title: getUnitLabel(freq, i + 1) }))
        }));
    };

    const handleSuggestPrompt = async () => {
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
            // Template modelo de aula — mesmo padrão do CreateLandingPage
            setEditorBlocks(buildBaseBlocks(['hero', 'biblical', 'study-content', 'authority', 'footer']));
            setHtmlContent('');
        }
    };

    const handleAiFill = async () => {
        if (!dayRef.trim() && !aiTheme.trim()) {
            showNotification("Informe um tema ou uma referência para a IA.", "info");
            return;
        }

        setIsGeneratingAI(true);
        try {
            const referenceToUse = dayRef.trim() ? dayRef : "Indefinida";
            const generatedHtml = await generateStructuredStudy(aiTheme || 'Geral', referenceToUse, aiAudience || 'Geral', studyMode);
            if (generatedHtml) {
                setHtmlContent(generatedHtml);

                // Tenta extrair a Referência Escolhida pela IA de forma robusta
                // Procura por classe bible-subtitle ou qualquer tag P logo após o H1
                const refMatch = generatedHtml.match(/<p[^>]+(?:class=["'][^"']*bible-subtitle[^"']*["']|bible-subtitle)[^>]*>(.*?)<\/p>/i) ||
                    generatedHtml.match(/<h1[^>]*>.*?<\/h1>\s*<p[^>]*>(.*?)<\/p>/i);

                let newlyExtractedRef = dayRef;
                if (refMatch && refMatch[1]) {
                    newlyExtractedRef = refMatch[1].replace(/<[^>]*>?/gm, '').trim();
                    if (!dayRef.trim() || dayRef === 'Indefinida') {
                        setDayRef(newlyExtractedRef);
                    }
                }

                // Tenta extrair o Título Escolhido pela IA (Busca pelo primeiro H1)
                const titleMatch = generatedHtml.match(/<h1[^>]*>(.*?)<\/h1>/i);
                if (titleMatch && titleMatch[1]) {
                    const extractedTitle = titleMatch[1].replace(/<[^>]*>?/gm, '').trim();
                    if (!dayTitle.trim() || dayTitle === 'Nova Aula' || dayTitle.startsWith('Aula: ')) {
                        setDayTitle(extractedTitle);
                        setEditingDayTitle(extractedTitle);
                    }
                } else if (!dayTitle.trim() || dayTitle === 'Nova Aula') {
                    setDayTitle(`Aula: ${newlyExtractedRef}`);
                    setEditingDayTitle(`Aula: ${newlyExtractedRef}`);
                }

                await incrementUsage('analysis');
                showNotification("Roteiro gerado com sucesso!", "success");
            } else {
                showNotification("A IA não gerou conteúdo.", "error");
            }
        } catch (e) {
            console.error("Erro na geração da AI:", e);
        } finally {
            setIsGeneratingAI(false);
        }
    };

    const saveDayContent = () => {
        if (!activeWeekId || !editingDayId) return;
        if (!dayTitle) { showNotification("Dê um título para a aula.", "error"); return; }

        // Gerar HTML final a partir dos blocos para retrocompatibilidade
        const generatedHtml = editorBlocks.map(b => {
             if (b.type === 'study-content') return b.data.content;
             if (b.type === 'hero') return `<h1>${b.data.title}</h1>`;
             return '';
        }).join('\n');

        const newDay: PlanDayContent = {
            id: editingDayId,
            title: dayTitle,
            description: dayRef,
            htmlContent: generatedHtml || '<p>Conteúdo em construção...</p>',
            blocksConfig: editorBlocks,
            isCompleted: false,
            tags: dayTags,
            category: dayCategory
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

        setEditingDayId(null);
        setActiveWeekId(null);
        setSelectedBlockId(null);
        showNotification("Aula salva no plano!", "success");
    };

    const handleDeleteDay = (weekId: string, dayId: string) => {
        if (!confirm("Deseja realmente excluir esta aula?")) return;
        setPlan(prev => ({
            ...prev,
            weeks: prev.weeks?.map(w => {
                if (w.id !== weekId) return w;
                return { ...w, days: w.days.filter(d => d.id !== dayId) };
            })
        }));
        showNotification("Aula removida.", "success");
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

    // --- CONTENT BUILDER HANDLERS ---
    const handleAddBlock = (type: BlockType) => {
        pushToBlockHistory(editorBlocks);
        const newBlock = createBlock(type);
        setEditorBlocks(prev => [...prev, newBlock]);
        setSelectedBlockId(newBlock.id);
        setIsMobileAddMenuOpen(false);
    };

    const handleUpdateBlock = (id: string, data: any) => {
        setEditorBlocks(prev => prev.map(b => b.id === id ? { ...b, data: { ...b.data, ...data } } : b));
    };

    const handleRemoveBlock = (id: string) => {
        pushToBlockHistory(editorBlocks);
        setEditorBlocks(prev => prev.filter(b => b.id !== id));
        if (selectedBlockId === id) setSelectedBlockId(null);
    };

    const handleMoveBlock = (fromIndex: number, toIndex: number) => {
        pushToBlockHistory(editorBlocks);
        setEditorBlocks(prev => {
            const next = [...prev];
            const [moved] = next.splice(fromIndex, 1);
            next.splice(toIndex, 0, moved);
            return next;
        });
    };

    const handleDuplicateBlock = (id: string, index: number) => {
        pushToBlockHistory(editorBlocks);
        const block = editorBlocks.find(b => b.id === id);
        if (block) {
            const newBlock = { ...block, id: `block-${Date.now()}` };
            setEditorBlocks(prev => {
                const next = [...prev];
                next.splice(index + 1, 0, newBlock);
                return next;
            });
            setSelectedBlockId(newBlock.id);
        }
    };

    // Undo/Redo for blocks
    const handleBlockUndo = useCallback(() => {
        if (blockHistoryIndex > 0) {
            setIsUndoing(true);
            const prevIndex = blockHistoryIndex - 1;
            setBlockHistoryIndex(prevIndex);
            setEditorBlocks(blockHistory[prevIndex]);
        }
    }, [blockHistory, blockHistoryIndex]);

    const handleBlockRedo = useCallback(() => {
        if (blockHistoryIndex < blockHistory.length - 1) {
            setIsUndoing(true);
            const nextIndex = blockHistoryIndex + 1;
            setBlockHistoryIndex(nextIndex);
            setEditorBlocks(blockHistory[nextIndex]);
        }
    }, [blockHistory, blockHistoryIndex]);

    // Push current state to history before changes
    const pushToBlockHistory = useCallback((blocks: Block[]) => {
        setBlockHistory(prev => {
            const newHistory = prev.slice(0, blockHistoryIndex + 1);
            newHistory.push(blocks);
            if (newHistory.length > 50) newHistory.shift();
            setBlockHistoryIndex(newHistory.length - 1);
            return newHistory;
        });
    }, [blockHistoryIndex]);

    // Block history tracking effect
    useEffect(() => {
        if (isUndoing) {
            setIsUndoing(false);
            return;
        }
        const timer = setTimeout(() => {
            setBlockHistory(prev => {
                const lastBlocks = prev[blockHistoryIndex];
                const currentBlocksStr = JSON.stringify(editorBlocks);
                const lastBlocksStr = JSON.stringify(lastBlocks || []);
                if (currentBlocksStr === lastBlocksStr) return prev;
                
                const newHistory = prev.slice(0, blockHistoryIndex + 1);
                newHistory.push(editorBlocks);
                if (newHistory.length > 50) newHistory.shift();
                setBlockHistoryIndex(newHistory.length - 1);
                return newHistory;
            });
        }, 500);
        return () => clearTimeout(timer);
    }, [editorBlocks, blockHistoryIndex, isUndoing]);

    // Keyboard shortcuts for undo/redo
    useEffect(() => {
        if (!editingDayId) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            const target = e.target as HTMLElement;
            const isInput = target.tagName === 'INPUT' || 
                            target.tagName === 'TEXTAREA' || 
                            target.isContentEditable || 
                            target.closest('[contenteditable="true"]');
            if (isInput) return;
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
                e.preventDefault();
                if (e.shiftKey) handleBlockRedo();
                else handleBlockUndo();
            }
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
                e.preventDefault();
                handleBlockRedo();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [editingDayId, handleBlockUndo, handleBlockRedo]);

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

    // AI Auto-Builder for lesson content
    const handleAIAutoBuilder = async () => {
        const userPrompt = aiBuilderPrompt.trim();
        if (!userPrompt && !dayRef) {
            showNotification('Escreva o que a IA deve criar ou adicione uma referência bíblica', 'warning');
            return;
        }
        setIsAIBuilding(true);
        try {
            const enrichedPrompt = [
                dayRef ? `REFERÊNCIA BÍBLICA PRINCIPAL: ${dayRef}${dayVerseText ? ` — "${dayVerseText}"` : ''}` : '',
                userPrompt ? `TEMA / COMPLEMENTO: ${userPrompt}` : ''
            ].filter(Boolean).join('\n');

            const result = await generateStructuredStudy(enrichedPrompt, dayRef || 'Indefinida', aiAudience || 'Geral', studyMode);
            if (result) {
                setHtmlContent(result);
                const refMatch = result.match(/<p[^>]+class=["'][^"']*bible-subtitle[^"']*["'][^>]*>(.*?)<\/p>/i) ||
                    result.match(/<h1[^>]*>.*?<\/h1>\s*<p[^>]*>(.*?)<\/p>/i);
                if (refMatch && refMatch[1] && !dayRef.trim()) {
                    setDayRef(refMatch[1].replace(/<[^>]*>?/gm, '').trim());
                }
                const titleMatch = result.match(/<h1[^>]*>(.*?)<\/h1>/i);
                if (titleMatch && titleMatch[1] && !dayTitle.trim()) {
                    setDayTitle(titleMatch[1].replace(/<[^>]*>?/gm, '').trim());
                }
                showNotification('Lição criada com sucesso pela IA!', 'success');
                setShowAIBuilderModal(false);
                setAIBuilderPrompt('');
            }
        } catch (e: any) {
            console.error('AI Auto-Builder:', e);
            showNotification(`Erro ao construir com IA: ${e.message}`, 'error');
        } finally {
            setIsAIBuilding(false);
        }
    };


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
                                                                            <input
                                                                                type="text"
                                                                                value={day.title}
                                                                                onClick={(e) => e.stopPropagation()}
                                                                                onChange={(e) => setPlan(prev => ({
                                                                                    ...prev,
                                                                                    weeks: prev.weeks?.map(w => w.id === unit.id
                                                                                        ? { ...w, days: w.days.map(d => d.id === day.id ? { ...d, title: e.target.value } : d) }
                                                                                        : w
                                                                                    )
                                                                                }))}
                                                                                placeholder="Título da aula"
                                                                                className="text-sm font-bold text-gray-900 dark:text-white bg-transparent outline-none w-full truncate hover:bg-gray-50 dark:hover:bg-gray-800 focus:bg-gray-50 dark:focus:bg-gray-800 rounded px-1 -mx-1 transition-colors"
                                                                            />
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
                    // --- VIEW: EDITOR STUDIO — Layout duas colunas, tela cheia ---
                    <div className="flex flex-col h-full min-w-0 overflow-hidden animate-in fade-in">
                        {/* Header do Editor */}
                        <header className="flex-shrink-0 bg-white dark:bg-bible-darkPaper border-b border-gray-200 dark:border-gray-800 px-4 py-3 z-50">
                          <div className="flex items-center justify-between max-w-screen-2xl mx-auto">
                            <div className="flex items-center gap-4">
                              <button 
                                onClick={() => setEditingDayId(null)}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors group"
                              >
                                <ArrowLeft size={20} className="text-gray-600 dark:text-gray-300 group-hover:text-bible-gold" />
                              </button>
                              <div className="flex items-center gap-3">
                                <div>
                                  <h1 className="font-bold text-bible-ink dark:text-white flex items-center gap-2">
                                    {dayTitle || 'Nova Aula'}
                                  </h1>
                                  <div className="flex items-center gap-2">
                                    <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider ${plan.status === 'published' ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'}`}>
                                      {plan.status === 'published' ? 'Publicado' : 'Rascunho'}
                                    </span>
                                    <span className="text-[10px] text-gray-400 font-medium">• Aula em Edição</span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              {/* Undo/Redo Controls */}
                              <div className="hidden sm:flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1 gap-0.5">
                                <button
                                  onClick={handleBlockUndo}
                                  disabled={blockHistoryIndex <= 0}
                                  className="p-1.5 hover:bg-white dark:hover:bg-gray-700 rounded-md text-gray-500 hover:text-gray-800 dark:hover:text-gray-300 transition-colors disabled:opacity-30"
                                  title="Desfazer (Ctrl+Z)"
                                >
                                  <Undo2 size={16} />
                                </button>
                                <button
                                  onClick={handleBlockRedo}
                                  disabled={blockHistoryIndex >= blockHistory.length - 1}
                                  className="p-1.5 hover:bg-white dark:hover:bg-gray-700 rounded-md text-gray-500 hover:text-gray-800 dark:hover:text-gray-300 transition-colors disabled:opacity-30"
                                  title="Refazer (Ctrl+Shift+Z)"
                                >
                                  <Redo2 size={16} />
                                </button>
                              </div>

                              {/* AI Auto-Builder Button */}
                              <button
                                onClick={() => { setShowAIBuilderModal(true); setTimeout(() => aiBuilderTextareaRef.current?.focus(), 100); }}
                                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-lg font-bold text-sm hover:from-violet-700 hover:to-purple-700 transition-all shadow-md shadow-purple-200 dark:shadow-purple-900/30"
                              >
                                <Sparkles size={16} />
                                <span className="hidden sm:inline">IA Auto-Builder</span>
                              </button>
                              
                              {/* Canvas Width Controls */}
                              <div className="hidden sm:flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1 gap-0.5 ml-2 mr-2">
                                {([
                                  { key: 'mobile' as const, icon: <Minimize2 size={14} />, label: 'Mobile (375px)' },
                                  { key: 'tablet' as const, icon: <Tablet size={14} />, label: 'Tablet (768px)' },
                                  { key: 'desktop' as const, icon: <Monitor size={14} />, label: 'Desktop (900px)' },
                                  { key: 'full' as const, icon: <Maximize2 size={14} />, label: 'Largura total' },
                                ]).map(opt => (
                                  <button
                                    key={opt.key}
                                    title={opt.label}
                                    onClick={() => setCanvasWidth(opt.key)}
                                    className={`p-1.5 rounded-md transition-colors ${
                                      canvasWidth === opt.key
                                        ? 'bg-white dark:bg-gray-900 text-bible-gold shadow-sm'
                                        : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                                    }`}
                                  >
                                    {opt.icon}
                                  </button>
                                ))}
                              </div>

                              <button
                                onClick={saveDayContent}
                                className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg font-medium text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                              >
                                <Save size={16} />
                                <span className="hidden sm:inline">Salvar</span>
                              </button>

                              <button
                                onClick={saveDayContent}
                                className="flex items-center gap-2 px-4 py-2 bg-bible-gold text-white rounded-lg font-bold text-sm hover:bg-bible-gold/90 transition-colors hidden sm:flex"
                              >
                                <Eye size={16} />
                                Preview
                              </button>

                              <button
                                onClick={() => setShowSettingsOverlay(true)}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-600 dark:text-gray-300 transition-colors"
                                title="Configurações da Aula"
                              >
                                <Settings size={20} />
                              </button>
                            </div>
                          </div>
                        </header>

                        {/* Editor Body */}
                        <div className="flex-1 flex overflow-hidden">
                            {/* SIDEBAR ESQUERDA */}
                            <aside className="w-72 flex-shrink-0 bg-white dark:bg-bible-darkPaper border-r border-gray-200 dark:border-gray-800 overflow-y-auto hidden lg:block">

                            <div className="p-4 space-y-5 flex-1 overflow-y-auto">

                                {/* Referência Bíblica */}
                                <div className="p-3 bg-gradient-to-br from-bible-gold/10 dark:from-bible-gold/5 to-amber-50 dark:to-amber-900/10 rounded-2xl border border-bible-gold/20 dark:border-bible-gold/10">
                                    <h3 className="text-[10px] font-bold text-bible-gold uppercase tracking-widest mb-2 flex items-center gap-2">
                                        <BookOpen size={12} /> Referência Bíblica
                                    </h3>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={dayRef}
                                            onChange={e => setDayRef(e.target.value)}
                                            onKeyDown={e => { if (e.key === 'Enter') handleSearchBible(); }}
                                            placeholder="Ex: João 3:16"
                                            className="w-full pl-8 pr-2 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs text-gray-800 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-600 outline-none focus:border-bible-gold transition-colors"
                                        />
                                        <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                                        {isFetchingBible && <Loader2 size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-bible-gold animate-spin" />}
                                    </div>
                                    {dayVerseText && (
                                        <div className="mt-2 p-2 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700">
                                            <p className="text-[9px] text-bible-gold font-bold mb-1">{dayRef}</p>
                                            <p className="text-[10px] italic text-gray-600 dark:text-gray-300 line-clamp-4">"{dayVerseText}"</p>
                                        </div>
                                    )}
                                </div>

                                {/* Informações */}
                                <div>
                                    <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Informações</h3>
                                    <div className="space-y-2">
                                        <div>
                                            <label className="text-[10px] text-gray-500 block mb-1">Título</label>
                                            <input
                                                type="text"
                                                value={dayTitle}
                                                onChange={e => { setDayTitle(e.target.value); setEditingDayTitle(e.target.value); }}
                                                placeholder="Título da aula"
                                                className="w-full px-2.5 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs text-gray-800 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-600 outline-none focus:border-bible-gold font-medium"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] text-gray-500 block mb-1">Categoria</label>
                                            <select
                                                value={dayCategory}
                                                onChange={e => setDayCategory(e.target.value)}
                                                className="w-full px-2.5 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs text-gray-800 dark:text-gray-100 outline-none focus:border-bible-gold"
                                            >
                                                <option value="Geral">Geral</option>
                                                <option value="Evangelismo">Evangelismo</option>
                                                <option value="Discipulado">Discipulado</option>
                                                <option value="Família">Família</option>
                                                <option value="Juventude">Juventude</option>
                                                <option value="Casais">Casais</option>
                                                <option value="Liderança">Liderança</option>
                                                <option value="Oração">Oração</option>
                                                <option value="Teologia">Teologia</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {/* Blocos */}
                                <div>
                                    <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Blocos</h3>
                                    <div className="space-y-1.5">
                                        {(['hero', 'biblical', 'study-content', 'authority', 'video', 'slide', 'footer'] as const).map(type => {
                                            const labels: Record<string, { label: string; description: string; color: string }> = {
                                                hero: { label: 'Capa Impactante', description: 'Título, subtítulo e CTA', color: 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600' },
                                                authority: { label: 'Perfil do Autor', description: 'Foto, nome e bio', color: 'bg-blue-100 dark:bg-blue-900/40 text-blue-600' },
                                                biblical: { label: 'Versículo em Destaque', description: 'Citação da Bíblia', color: 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700' },
                                                'study-content': { label: 'Conteúdo do Estudo', description: 'Texto rico e formatado', color: 'bg-purple-100 dark:bg-purple-900/40 text-purple-600' },
                                                video: { label: 'Vídeo', description: 'YouTube ou url', color: 'bg-red-100 dark:bg-red-900/40 text-red-600' },
                                                slide: { label: 'Slides', description: 'Carrossel de slides', color: 'bg-teal-100 dark:bg-teal-900/40 text-teal-600' },
                                                footer: { label: 'Rodapé', description: 'CTA e assinatura final', color: 'bg-gray-200 dark:bg-gray-800 text-gray-600' },
                                            };
                                            const info = labels[type];
                                            const count = editorBlocks.filter(b => b.type === type).length;
                                            return (
                                                <button
                                                    key={type}
                                                    onClick={() => handleAddBlock(type)}
                                                    className="w-full flex items-center gap-2 p-2.5 rounded-xl bg-gray-50 dark:bg-gray-900 hover:bg-bible-gold/10 active:scale-[0.98] transition-all text-left"
                                                >
                                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${info.color}`}>
                                                        {type === 'hero' && <Layout size={15} />}
                                                        {type === 'authority' && <Brain size={15} />}
                                                        {type === 'biblical' && <BookOpen size={15} />}
                                                        {type === 'study-content' && <FileText size={15} />}
                                                        {type === 'video' && <PlayCircle size={15} />}
                                                        {type === 'slide' && <Layers size={15} />}
                                                        {type === 'footer' && <AlignLeft size={15} />}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-bold text-[11px] text-gray-800 dark:text-white">{info.label}</p>
                                                        <p className="text-[9px] text-gray-500 dark:text-gray-400 truncate">{info.description}</p>
                                                    </div>
                                                    {count > 0 ? (
                                                        <span className="text-[9px] font-bold bg-bible-gold/10 text-bible-gold rounded-full px-1.5 py-0.5 flex-shrink-0">×{count}</span>
                                                    ) : (
                                                        <Plus size={13} className="text-gray-400 flex-shrink-0" />
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Tags */}
                                <div>
                                    <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Tags</h3>
                                    <input
                                        type="text"
                                        value={dayTags.join(', ')}
                                        onChange={e => setDayTags(e.target.value.split(',').map(t => t.trim()).filter(Boolean))}
                                        placeholder="fé, oração, amor"
                                        className="w-full px-2.5 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs text-gray-800 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-600 outline-none focus:border-bible-gold"
                                    />
                                    {dayTags.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mt-2">
                                            {dayTags.map(tag => (
                                                <span key={tag} className="px-2 py-0.5 bg-bible-gold/10 text-bible-gold rounded-full text-[10px] font-bold">{tag}</span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                            </aside>

                        {/* CANVAS PRINCIPAL — sem header, tela cheia */}
                        <main className="flex-1 min-w-0 flex flex-col overflow-hidden bg-gray-100 dark:bg-gray-950">

                            {/* ContentBuilder direto, sem sub-header */}
                            <div className="flex-1 overflow-auto">
                                <div className={`mx-auto h-full w-full px-2 sm:px-4 py-6 sm:py-8 transition-all duration-300 ${
                                    canvasWidth === 'mobile' ? 'max-w-[420px]'
                                    : canvasWidth === 'tablet' ? 'max-w-[820px]'
                                    : canvasWidth === 'full' ? 'w-full h-full p-0'
                                    : 'max-w-5xl'
                                }`}>
                                    <ContentBuilder
                                        blocks={editorBlocks}
                                        selectedBlockId={selectedBlockId}
                                        onSelectBlock={setSelectedBlockId}
                                        onUpdateBlock={handleUpdateBlock}
                                        onMoveBlock={handleMoveBlock}
                                        onDuplicateBlock={handleDuplicateBlock}
                                        onRemoveBlock={handleRemoveBlock}
                                        onAddBlock={handleAddBlock}
                                        isEditing={true}
                                        canvasWidth={canvasWidth}
                                    />
                                </div>
                            </div>
                        </main>

                        {/* Block Properties Sidebar (Desktop) */}
                        {selectedBlockId && editorBlocks.find(b => b.id === selectedBlockId) && (
                            <aside className="hidden xl:block w-80 flex-shrink-0 bg-white dark:bg-bible-darkPaper border-l border-gray-200 dark:border-gray-800 overflow-y-auto fixed right-0 top-[73px] bottom-0 z-40">
                                <div className="p-4">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="font-bold text-bible-ink dark:text-white">
                                            {blockLabels[editorBlocks.find(b => b.id === selectedBlockId)!.type]?.label || 'Bloco'}
                                        </h3>
                                        <button
                                            onClick={() => setSelectedBlockId(null)}
                                            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                    <BlockProperties
                                        block={editorBlocks.find(b => b.id === selectedBlockId)!}
                                        onUpdate={(data) => handleUpdateBlock(selectedBlockId, data)}
                                        isEditing={true}
                                    />
                                </div>
                            </aside>
                        )}
                    </div>
                </div>
            )}
        </div>

        {/* ======== SETTINGS OVERLAY ======== */}
        {showSettingsOverlay && (
            <div className="fixed inset-0 z-[100] flex items-center justify-end" onClick={() => setShowSettingsOverlay(false)}>
                <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" />
                <div 
                    className="relative w-full max-w-md h-full bg-white dark:bg-gray-900 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300"
                    onClick={e => e.stopPropagation()}
                >
                    <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                        <h2 className="text-xl font-bold text-bible-ink dark:text-white flex items-center gap-2">
                            <Settings className="text-bible-gold" size={20} />
                            Ajustes da Aula
                        </h2>
                        <div className="flex items-center gap-2">
                            <div className="bg-gray-100 dark:bg-gray-800 p-1 rounded-xl flex">
                                <button 
                                    onClick={() => setSettingsTab('config')}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${settingsTab === 'config' ? 'bg-white dark:bg-gray-900 text-bible-gold shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    Ajustes
                                </button>
                                <button 
                                    onClick={() => setSettingsTab('access')}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${settingsTab === 'access' ? 'bg-white dark:bg-gray-900 text-bible-gold shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    Acessos
                                </button>
                            </div>
                            <button 
                                onClick={() => setShowSettingsOverlay(false)}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6">
                        {settingsTab === 'config' ? (
                            <div className="space-y-6">
                                <div>
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5 px-1">Título da Aula</label>
                                    <input 
                                        type="text" 
                                        value={dayTitle}
                                        onChange={(e) => { setDayTitle(e.target.value); setEditingDayTitle(e.target.value); }}
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-none rounded-2xl text-sm font-bold placeholder:text-gray-400 focus:ring-2 ring-bible-gold/30 transition-all"
                                        placeholder="Título Principal"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5 px-1">Referência Bíblica</label>
                                    <div className="relative">
                                        <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input 
                                            type="text" 
                                            value={dayRef}
                                            onChange={(e) => setDayRef(e.target.value)}
                                            className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border-none rounded-2xl text-sm focus:ring-2 ring-bible-gold/30 transition-all"
                                            placeholder="Ex: João 3:16"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5 px-1">Categoria</label>
                                    <select
                                        value={dayCategory}
                                        onChange={(e) => setDayCategory(e.target.value)}
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-none rounded-2xl text-sm outline-none focus:ring-2 ring-bible-gold/30"
                                    >
                                        <option value="Geral">Geral</option>
                                        <option value="Evangelismo">Evangelismo</option>
                                        <option value="Discipulado">Discipulado</option>
                                        <option value="Família">Família</option>
                                        <option value="Juventude">Juventude</option>
                                        <option value="Casais">Casais</option>
                                        <option value="Liderança">Liderança</option>
                                        <option value="Oração">Oração</option>
                                        <option value="Teologia">Teologia</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5 px-1">Tags (separadas por vírgula)</label>
                                    <input
                                        type="text"
                                        value={dayTags.join(', ')}
                                        onChange={(e) => setDayTags(e.target.value.split(',').map(t => t.trim()).filter(Boolean))}
                                        placeholder="fé, oração, amor"
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-none rounded-2xl text-sm outline-none focus:ring-2 ring-bible-gold/30"
                                    />
                                </div>
                                <button
                                    onClick={() => { saveDayContent(); setShowSettingsOverlay(false); }}
                                    className="w-full py-4 bg-bible-gold text-white rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-bible-gold/20 active:scale-95 transition-all text-xs"
                                >
                                    Salvar Alterações
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Histórico de Quem Acessou</h3>
                                    <span className="text-[10px] font-bold bg-bible-gold/10 text-bible-gold px-2 py-0.5 rounded-full">
                                        {accessLogs.length} acessos
                                    </span>
                                </div>
                                {isLoadingLogs ? (
                                    <div className="py-12 flex flex-col items-center justify-center text-gray-400 gap-3">
                                        <Loader2 className="animate-spin" size={24} />
                                        <p className="text-xs italic">Carregando nomes...</p>
                                    </div>
                                ) : accessLogs.length > 0 ? (
                                    <div className="space-y-3">
                                        {accessLogs.map((log) => (
                                            <div key={log.id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-transparent hover:border-bible-gold/20 transition-all">
                                                <div className="w-10 h-10 rounded-xl bg-bible-gold/10 flex items-center justify-center overflow-hidden flex-shrink-0 border border-white dark:border-gray-700 shadow-sm">
                                                    {log.user_photo ? (
                                                        <img src={log.user_photo} alt={log.user_name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <Brain size={20} className="text-bible-gold" />
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{log.user_name}</p>
                                                    <p className="text-[10px] text-gray-500 flex items-center gap-1">
                                                        <Clock size={10} />
                                                        {new Date(log.accessed_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="py-12 flex flex-col items-center justify-center text-gray-400 gap-4 text-center px-4">
                                        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                                            <Brain size={32} className="opacity-20" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold">Nenhum acesso detalhado</p>
                                            <p className="text-[10px] mt-1 italic">Publique a sala para começar a receber acessos.</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )}

        {/* ======== AI AUTO-BUILDER MODAL ======== */}
        {showAIBuilderModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowAIBuilderModal(false)}>
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
                <div
                    className="relative w-full max-w-2xl max-h-[90vh] bg-white dark:bg-gray-900 rounded-3xl shadow-2xl overflow-y-auto"
                    onClick={e => e.stopPropagation()}
                >
                    <div className="bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 p-8 text-white relative overflow-hidden">
                        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
                        <button
                            onClick={() => setShowAIBuilderModal(false)}
                            className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-xl transition-colors"
                        >
                            <X size={18} />
                        </button>
                        <div className="flex items-center gap-4 relative">
                            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0">
                                <Sparkles size={28} className="text-white" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black">IA Auto-Builder</h2>
                                <p className="text-violet-200 text-sm mt-1">Descreva sua mensagem e a IA constrói toda a aula</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-8 space-y-6">
                        {dayRef ? (
                            <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl">
                                <div className="w-8 h-8 bg-bible-gold/20 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <BookOpen size={16} className="text-bible-gold" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start">
                                        <p className="text-xs font-bold text-bible-gold uppercase tracking-wider mb-0.5">Referência bíblica detectada</p>
                                        <button onClick={() => setDayRef('')} className="text-gray-400 hover:text-red-500">
                                            <X size={14} />
                                        </button>
                                    </div>
                                    <p className="text-sm font-bold text-gray-800 dark:text-gray-100">{dayRef}</p>
                                    {dayVerseText && (
                                        <p className="text-xs text-gray-500 dark:text-gray-400 italic mt-1 line-clamp-2">"{dayVerseText}"</p>
                                    )}
                                    <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-1.5">A IA vai usar esta referência como base principal da aula.</p>
                                </div>
                            </div>
                        ) : (
                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-2">
                                    Referência Bíblica (Opcional)
                                </label>
                                <div className="relative">
                                    <BookOpen className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input
                                        type="text"
                                        value={dayRef}
                                        onChange={e => setDayRef(e.target.value)}
                                        placeholder="Ex: João 3:16 ou Romanos 12"
                                        className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl text-sm outline-none focus:border-bible-gold focus:ring-2 focus:ring-bible-gold/20 transition-all font-medium placeholder-gray-400"
                                    />
                                </div>
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-2">
                                {dayRef ? 'Complemento / Tema adicional (opcional)' : 'O que você quer criar?'}
                            </label>
                            <textarea
                                ref={aiBuilderTextareaRef}
                                value={aiBuilderPrompt}
                                onChange={e => setAIBuilderPrompt(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleAIAutoBuilder(); }}
                                placeholder={dayRef
                                    ? `Ex: Para jovens, tom inspirador, foco na aplicação prática ao dia a dia...`
                                    : `Ex: Uma aula sobre fé e perseverança baseado em Hebreus 11, para jovens adultos que enfrentam dificuldades. Use tom inspirador e prático.`
                                }
                                rows={dayRef ? 3 : 5}
                                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl text-sm resize-none outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-200 dark:focus:ring-violet-900 transition-all"
                            />
                            <p className="text-xs text-gray-400 mt-1.5">Dica: Quanto mais detalhes, melhor o resultado. <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-[10px] font-mono">Ctrl+Enter</kbd> para gerar.</p>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowAIBuilderModal(false)}
                                className="flex-1 py-3 border border-gray-200 dark:border-gray-700 rounded-2xl font-medium text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleAIAutoBuilder}
                                disabled={isAIBuilding}
                                className="flex-1 py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-2xl font-bold text-sm hover:from-violet-700 hover:to-purple-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-purple-200 dark:shadow-purple-900/30"
                            >
                                {isAIBuilding ? (
                                    <><Loader2 size={16} className="animate-spin" /> Criando sua aula...</>
                                ) : (
                                    <><Sparkles size={16} /> Criar com IA</>  
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )}

            {/* MOBILE CONTROLS */}
            {editingDayId && (
                <>
                    {/* Floating Undo/Redo buttons when no block selected */}
                    {!selectedBlockId && (
                        <>
                            <div className="fixed bottom-6 left-6 z-[110] lg:hidden flex gap-2">
                                <button
                                    onClick={handleBlockUndo}
                                    disabled={blockHistoryIndex <= 0}
                                    className="w-12 h-12 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-xl flex items-center justify-center text-gray-600 dark:text-gray-300 disabled:opacity-30 transition-all active:scale-95"
                                    title="Desfazer"
                                >
                                    <Undo2 size={20} />
                                </button>
                                <button
                                    onClick={handleBlockRedo}
                                    disabled={blockHistoryIndex >= blockHistory.length - 1}
                                    className="w-12 h-12 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-xl flex items-center justify-center text-gray-600 dark:text-gray-300 disabled:opacity-30 transition-all active:scale-95"
                                    title="Refazer"
                                >
                                    <Redo2 size={20} />
                                </button>
                            </div>
                            
                            <button
                                onClick={() => setIsMobileAddMenuOpen(true)}
                                className="fixed bottom-6 right-6 z-[110] w-16 h-16 bg-bible-gold text-white rounded-2xl shadow-2xl flex items-center justify-center hover:scale-110 active:scale-90 transition-all lg:hidden group"
                            >
                                <div className="relative">
                                    <Plus size={32} className="group-hover:rotate-90 transition-transform duration-300" />
                                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full animate-ping" />
                                </div>
                            </button>
                        </>
                    )}

                    {selectedBlockId && editorBlocks.find(b => b.id === selectedBlockId) && (
                        <MobileToolbar
                            blockType={editorBlocks.find(b => b.id === selectedBlockId)!.type}
                            onMoveUp={() => {
                                const index = editorBlocks.findIndex(b => b.id === selectedBlockId);
                                if (index > 0) handleMoveBlock(index, index - 1);
                            }}
                            onMoveDown={() => {
                                const index = editorBlocks.findIndex(b => b.id === selectedBlockId);
                                if (index < editorBlocks.length - 1) handleMoveBlock(index, index + 1);
                            }}
                            onDuplicate={() => {
                                const index = editorBlocks.findIndex(b => b.id === selectedBlockId);
                                handleDuplicateBlock(selectedBlockId, index);
                            }}
                            onRemove={() => handleRemoveBlock(selectedBlockId)}
                            onOpenProperties={() => setIsMobilePropertiesOpen(true)}
                            onClose={() => setSelectedBlockId(null)}
                            canMoveUp={editorBlocks.findIndex(b => b.id === selectedBlockId) > 0}
                            canMoveDown={editorBlocks.findIndex(b => b.id === selectedBlockId) < editorBlocks.length - 1}
                        />
                    )}

                    <MobileAddBlockMenu
                        isOpen={isMobileAddMenuOpen}
                        onClose={() => setIsMobileAddMenuOpen(false)}
                        onSelect={handleAddBlock}
                        onAIBuild={handleAiFill}
                    />

                    {selectedBlockId && editorBlocks.find(b => b.id === selectedBlockId) && (
                        <MobilePropertiesSheet
                            isOpen={isMobilePropertiesOpen}
                            onClose={() => setIsMobilePropertiesOpen(false)}
                            block={editorBlocks.find(b => b.id === selectedBlockId)!}
                            onUpdate={(data) => handleUpdateBlock(selectedBlockId, data)}
                            isEditing={true}
                        />
                    )}
                </>
            )}

            <ConfirmationModal isOpen={showSaveSuccessModal} onClose={() => setShowSaveSuccessModal(false)} onConfirm={() => savedPlanId && navigate(`/jornada/${savedPlanId}`)} title="Sucesso!" message="Seu plano foi publicado." confirmText="Ver Plano" variant="success" />
            <EvaluationBuilderModal isOpen={showEvalModal} onClose={() => setShowEvalModal(false)} onSave={handleSaveEvaluation} initialData={evaluationData || undefined} />
            <ObreiroIAChatbot />
        </div>
    );
};

export default PlanBuilderPage;
