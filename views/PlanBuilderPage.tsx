"use client";
import { useNavigate, useLocation, useSearchParams } from '../utils/router';


import React, { useState, useEffect, useRef } from 'react';

import { useAuth } from '../contexts/AuthContext';
import { useHeader } from '../contexts/HeaderContext';
import { dbService, uploadBlob } from '../services/supabase';
import { bibleService } from '../services/bibleService';
import { generateImagePromptForPlan, generateVerseImage, generateStructuredStudy } from '../services/geminiService';
import { useSettings } from '../contexts/SettingsContext';
import {
    ArrowLeft, Plus, Save, Trash2, Loader2, Search, Check,
    Calendar, Layout, Sparkles, Clock, BookOpen, ChevronDown,
    X, CheckCircle2, GraduationCap, Edit2, Wand2, FileText, Camera, ImageIcon,
    Trophy, Eye, EyeOff, PlayCircle, PenTool, Target, Layers, Zap, Brain, AlignLeft, Globe, Info, Quote, Settings
} from 'lucide-react';
import { CustomPlan, PlanDayContent, PlanningFrequency, StudyEvaluation, PlanTeam } from '../types';
import SEO from '../components/SEO';
import ConfirmationModal from '../components/ConfirmationModal';
import EvaluationBuilderModal from '../components/EvaluationBuilderModal';
import RichTextEditor from '../components/RichTextEditor';
import { base64ToBlob } from '../utils/imageOptimizer';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';


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
    const { setTitle: setGlobalTitle, setBreadcrumbs, resetHeader } = useHeader();
    const { setIsFocusMode } = useSettings();

    const state = location.state as { planId?: string, planData?: CustomPlan };
    const urlPlanId = searchParams.get('id');

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
    const [htmlContent, setHtmlContent] = useState('');

    // AI Inputs
    const [aiTheme, setAiTheme] = useState('');
    const [aiAudience, setAiAudience] = useState('');
    const [isGeneratingAI, setIsGeneratingAI] = useState(false);
    const [isFetchingBible, setIsFetchingBible] = useState(false);
    
    // Auxiliar para evitar que a busca automática da bíblia sobrescreva dados salvos ao abrir o editor
    const isLoadingItemRef = useRef(false);

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

    // --- GLOBAL HEADER DATA ---
    useEffect(() => {
        const titleText = plan.title || (plan.status === 'published' ? 'Gestão da Sala' : 'Nova Sala de Estudo');
        setGlobalTitle(titleText);
        setBreadcrumbs([
            { label: 'Workspace', path: '/workspace-pastoral' },
            { label: titleText }
        ]);
    }, [plan.title, plan.status, setGlobalTitle, setBreadcrumbs]);

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
                    // Independente de ser a 1ª busca ou n-ésima busca
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
        if (dayItem) {
            // IMPORTANTE: Seta o conteúdo ANTES de mudar o editingDayId
            // Assim quando o key={editingDayId} muda no RichTextEditor,
            // o htmlContent já está correto no estado do React
            isLoadingItemRef.current = true; // Bloqueia a busca automática
            setDayTitle(dayItem.title);
            setEditingDayTitle(dayItem.title);
            setDayRef(dayItem.description || '');
            setDayVerseText('');
            setHtmlContent(dayItem.htmlContent || '<p></p>');
            // Seta o ID por último para que o key do RichTextEditor mude com dados prontos
            setEditingDayId(dayItem.id);
        } else {
            isLoadingItemRef.current = false;
            setEditingDayId(Date.now().toString());
            setDayTitle('');
            setEditingDayTitle('Nova Aula');
            setDayRef('');
            setDayVerseText('');
            setHtmlContent(`
<div style="font-family: sans-serif; max-width: 800px; margin: auto;">
  <h1 style="text-align: center; color: #111;">Nova Aula</h1>
  <p style="text-align: center; color: #888; font-style: italic; font-size: 1.1em; margin-bottom: 30px;">Referência Bíblica Base</p>
  
  <h2 style="color: #c5a059; border-bottom: 2px solid #eee; padding-bottom: 10px; margin-top: 40px;">📖 Introdução</h2>
  <p style="font-size: 1.1em; line-height: 1.6; color: #444;">Escreva aqui de forma cativante. Qual a grande ideia desta aula e por que ela importa para o leitor?</p>
  
  <h2 style="color: #c5a059; border-bottom: 2px solid #eee; padding-bottom: 10px; margin-top: 40px;">💡 Exposição Bíblica</h2>
  <p style="font-size: 1.1em; line-height: 1.6; color: #444;">Desenvolva os princípios divinos encontrados na Palavra.</p>
  
  <blockquote style="border-left: 4px solid #c5a059; background: #fdfaf5; padding: 20px; text-align: left; margin: 30px 0; font-size: 1.2em; font-style: italic; color: #555; border-radius: 8px;">
    "O texto bíblico aparecerá aqui ou cole-o manualmente..."
  </blockquote>
  
  <h2 style="color: #c5a059; border-bottom: 2px solid #eee; padding-bottom: 10px; margin-top: 40px;">🛠️ Como Aplicar Praticamente</h2>
  <p style="font-size: 1.1em; line-height: 1.6; color: #444;">Qual o desafio desta semana para o aluno aplicara isso na prática?</p>
  <ul style="font-size: 1.1em; line-height: 1.6; color: #444; margin-bottom: 30px;">
    <li><strong>Passo 1:</strong> Ação Imediata</li>
    <li><strong>Passo 2:</strong> Ação Contínua</li>
  </ul>
  
  <h2 style="color: #c5a059; border-bottom: 2px solid #eee; padding-bottom: 10px; margin-top: 40px;">🙏 Conclusão</h2>
  <p style="font-size: 1.1em; line-height: 1.6; color: #444;">Finalize a jornada de hoje engajando o aluno com propósito. Deixe uma oração.</p>
</div>`);
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
            showNotification("Erro na IA.", "error");
        } finally {
            setIsGeneratingAI(false);
        }
    };

    const saveDayContent = () => {
        if (!activeWeekId || !editingDayId) return;
        if (!dayTitle) { showNotification("Dê um título para a aula.", "error"); return; }

        const newDay: PlanDayContent = {
            id: editingDayId,
            title: dayTitle,
            description: dayRef,
            htmlContent: htmlContent || '<p>Conteúdo em construção...</p>',
            isCompleted: false
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
            <div className="flex flex-col">
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Editando Aula</span>
                <span className="text-sm font-bold text-gray-900 dark:text-white truncate max-w-[200px]">{editingDayTitle || 'Nova Aula'}</span>
            </div>
        )
        : (isPlanPublished ? "Gestão da Sala" : "Sala de Estudos");

    return (
        <div className="h-full bg-bible-paper dark:bg-black overflow-y-auto flex flex-col">
            <SEO title="Sala de Estudos" />

            {/* HEADER */}
            <div className="sticky top-[85px] md:top-0 z-40 bg-white/80 dark:bg-[#0a0a0a]/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 px-4 md:px-8 py-2 flex flex-col md:flex-row justify-between items-center shadow-sm gap-2 h-auto md:h-20 shrink-0">
                <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
                    {/* Redundant back button and title removed to prevent duplication with global header */}
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
                    {editingDayId ? (
                        <button onClick={saveDayContent} className="px-4 py-2 bg-bible-gold text-white rounded-xl shadow-lg active:scale-95 flex items-center gap-2 text-xs font-bold uppercase tracking-widest w-full md:w-auto justify-center">
                            <Check size={16} /> Salvar Aula
                        </button>
                    ) : (
                        <>
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
                        </>
                    )}
                </div>
            </div>

            <div className="flex-1 p-4 md:p-8 max-w-6xl mx-auto w-full">

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
                                                                            <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{day.title}</p>
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
                                        {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                                        Salvar Rascunho
                                    </button>
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
                    // --- VIEW: EDITOR STUDIO (NOVA UI REFORMULADA UNIFICADA) ---
                    <div className="flex flex-col gap-4 h-full pb-20 animate-in fade-in">

                        {/* NAVBAR / PAINEL COMPACTO DE CONFIGURAÇÃO */}
                        <div className="bg-white dark:bg-bible-darkPaper p-4 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 w-full flex flex-col md:flex-row gap-4 items-center shrink-0">
                            <div className="flex-1 w-full relative">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Título (Módulo/Aula)</label>
                                <input
                                    type="text"
                                    value={dayTitle}
                                    onChange={e => {
                                        setDayTitle(e.target.value);
                                        setEditingDayTitle(e.target.value);
                                        setHtmlContent(prev => prev.replace(/<h1[^>]*>.*?<\/h1>/i, `<h1 style="text-align: center; color: #111;">${e.target.value || 'Título da Aula'}</h1>`));
                                    }}
                                    className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl font-bold text-sm outline-none focus:ring-2 ring-bible-gold"
                                    placeholder="Ex: O Poder da Oração"
                                />
                            </div>

                            <div className="flex-1 w-full relative">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Referência Bíblica Base</label>
                                <div className="relative group">
                                    <input
                                        type="text"
                                        value={dayRef}
                                        onChange={e => { setDayRef(e.target.value); }}
                                        onKeyDown={e => { if (e.key === 'Enter') handleSearchBible(); }}
                                        className="w-full p-3 pr-16 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl font-medium text-sm outline-none focus:ring-2 ring-bible-gold transition-all"
                                        placeholder="Ex: João 3:16 (Aperte Enter)"
                                    />
                                    <button
                                        onClick={handleSearchBible}
                                        disabled={isFetchingBible || !dayRef.trim()}
                                        title="Buscar Versículo"
                                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-bible-gold text-white p-2 rounded-lg hover:scale-105 active:scale-95 transition-transform disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center shrink-0 w-8 h-8 focus:outline-none focus:ring-2 focus:ring-bible-gold"
                                    >
                                        {isFetchingBible ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* AI TOOLBAR COMPACT - HORIZONTAL */}
                        <div className="bg-white dark:bg-bible-darkPaper p-4 rounded-3xl shadow-sm border border-purple-100 dark:border-purple-800/30 flex flex-col xl:flex-row items-center gap-4 bg-gradient-to-r from-purple-50 to-white dark:from-purple-900/10 dark:to-transparent shrink-0">
                            <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 font-black text-sm uppercase tracking-widest min-w-max">
                                <Sparkles size={18} fill="currentColor" /> Obreiro IA
                            </div>
                            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3 w-full">
                                <input type="text" value={aiTheme} onChange={e => setAiTheme(e.target.value)} placeholder="Tema Central (ex: O Poder do Foco)" className="w-full p-2.5 bg-white dark:bg-gray-900 border border-purple-100 dark:border-purple-800/50 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-purple-400 shadow-sm" />
                                <input type="text" value={aiAudience} onChange={e => setAiAudience(e.target.value)} placeholder="Público Alvo (ex: Jovens Adultos)" className="w-full p-2.5 bg-white dark:bg-gray-900 border border-purple-100 dark:border-purple-800/50 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-purple-400 shadow-sm" />
                            </div>
                            <button
                                onClick={handleAiFill}
                                disabled={isGeneratingAI}
                                className="w-full xl:w-auto px-6 py-3 bg-purple-600 text-white rounded-xl font-black uppercase text-xs tracking-widest shadow-lg hover:bg-purple-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50 whitespace-nowrap active:scale-95"
                            >
                                {isGeneratingAI ? <Loader2 className="animate-spin" size={16} /> : <Wand2 size={16} />}
                                Gerar Conteúdo IA
                            </button>
                        </div>

                        {/* O EDITOR DE TEXTO (CANVAS FULL WIDTH, TOMA TODO RESTO DO ESPAÇO) */}
                        <div className="flex-1 bg-white dark:bg-bible-darkPaper rounded-[2rem] shadow-sm border border-border overflow-hidden flex flex-col min-h-[600px] relative">
                            <div className="flex-1 overflow-hidden relative auto-focus">
                                <div className="absolute top-4 right-6 opacity-30 pointer-events-none select-none">
                                    <FileText size={100} className="text-gray-100 dark:text-gray-800" />
                                </div>
                                <RichTextEditor
                                    key={editingDayId}
                                    content={htmlContent}
                                    onChange={setHtmlContent}
                                    placeholder="Comece a digitar sua incrível aula aqui..."
                                    className="h-full"
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <ConfirmationModal isOpen={showSaveSuccessModal} onClose={() => setShowSaveSuccessModal(false)} onConfirm={() => savedPlanId && navigate(`/jornada/${savedPlanId}`)} title="Sucesso!" message="Seu plano foi publicado." confirmText="Ver Plano" variant="success" />
            <EvaluationBuilderModal isOpen={showEvalModal} onClose={() => setShowEvalModal(false)} onSave={handleSaveEvaluation} initialData={evaluationData || undefined} />
        </div>
    );
};

export default PlanBuilderPage;
