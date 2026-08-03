'use client';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from '../utils/router';
import { useAuth } from '../contexts/AuthContext';
import { useHeader } from '../contexts/HeaderContext';
import { useSettings } from '../contexts/SettingsContext';
import { dbService } from '../services/supabase';
import { kingdomPublishingService } from '../services/kingdomPublishingService';
import { bibleService } from '../services/bibleService';
import { MobileToolbar } from '../components/Builder/MobileToolbar';
import { MobilePropertiesSheet } from '../components/Builder/MobilePropertiesSheet';
import { MobileAddBlockMenu } from '../components/Builder/MobileAddBlockMenu';
import {
  Save, ArrowLeft, Loader2, Sparkles, Eye, Send, Plus, Trash2,
  GripVertical, Settings, Smartphone, Tablet, Monitor, X, ChevronRight,
  ChevronLeft, Image as ImageIcon, Type, User, Video, BookOpen,
  MessageSquare, Share2, Clock, Globe, Lock, Check, Copy,
  Sun, MessageCircle, LayoutTemplate, Wand2, Layers, Bold, Italic,
  AlignLeft, AlignCenter, AlignRight, AlignJustify, Link, Mail, ExternalLink, Search, Sparkle,
  Play, Pause, ImagePlus, Wand, FolderOpen, Maximize2, Minimize2, Square, Undo2, Redo2,
  Baseline, Maximize, Move, Palette, Sliders, Type as TextIcon, FileDown
} from 'lucide-react';
import { UnifiedEditor } from '../components/UnifiedEditor';
import {
  StudyDocumentRenderer,
  AIProposalReview,
  StudioAssistantPanel,
  StudioToolRail,
  type StudyAIProposal,
} from '../components/study-studio';
import SEO from '../components/SEO';
import RichTextEditor from '../components/RichTextEditor';
import { BIBLE_BOOKS_LIST } from '../constants';
import {
  ContentBuilder,
  BlockRenderer,
  BlockProperties,
  Block,
  BlockType,
  blockLabels,
  createBlock,
  buildBaseBlocks,
  buildWrittenContentHtml,
  buildStudyGuideHtml,
  normalizeAIBuildBlocks
} from '../components/Builder';
import { ImageUploadButton } from '../components/Builder/ImageUploadButton';
import type { ContentPrivacyLevel, StudyStudioConfig } from '../types';
import {
  buildContentSharePostContent,
  getContentShareUrl,
  normalizeContentShareSettings,
} from '../utils/contentSharing';
import { normalizeStudyBlocks, parseStudyBlocks } from '../utils/studyDocument';
import { studioAIService } from '../services/studyStudio/studioAIService';
import { createStudyStudioConfig } from '../services/studyStudio/studioCapabilities';
import { useStudyDirtyState } from '../hooks/studyStudio/useStudyDirtyState';
import { useStudyDraftRecovery } from '../hooks/studyStudio/useStudyDraftRecovery';
import { useStudyAutosave } from '../hooks/studyStudio/useStudyAutosave';
import {
  studyDocumentService,
  StudyRevisionConflictError,
} from '../services/studyStudio/studyDocumentService';
import { createStudyDocumentV2 } from '../utils/studyDocument';

// Tipos locais
type ContentType = 'article' | 'devotional' | 'series';
type ContentStatus = 'draft' | 'preview' | 'published';
type CreationMode = 'manual' | 'ai';

interface ContentData {
  id?: string;
  revision?: number;
  type: ContentType;
  status: ContentStatus;
  slug: string;
  blocks: Block[];
  meta: {
    title: string;
    description: string;
    coverImage?: string;
    visibility?: ContentPrivacyLevel;
    allowPdfDownload?: boolean;
    inviteRequired?: boolean;
    allowedUserIds?: string[];
    allowedGroupIds?: string[];
    churchId?: string;
    groupId?: string;
    tags: string[];
  };
  stats: {
    views: number;
    comments: number;
    shares: number;
  };
  createdAt: string;
  updatedAt: string;
}

// Template de estrutura por tipo (Roadmap V2)
const coreOnePageBlocks: BlockType[] = ['hero-split', 'biblical', 'study-outline', 'rich-text', 'related-verses', 'slide', 'reflection-question', 'authority', 'footer'];

const initialOnePageLayout: { type: BlockType; layoutWidth?: NonNullable<Block['layoutWidth']> }[] = [
  { type: 'hero-split', layoutWidth: '1/1' },
  { type: 'biblical', layoutWidth: '2/3' },
  { type: 'study-outline', layoutWidth: '1/3' },
  { type: 'rich-text', layoutWidth: '1/1' },
  { type: 'slide', layoutWidth: '1/1' },
  { type: 'related-verses', layoutWidth: '1/1' },
  { type: 'authority', layoutWidth: '1/1' },
  { type: 'footer', layoutWidth: '1/1' },
  { type: 'reflection-question', layoutWidth: '1/1' },
];

const aiOnePageLayoutWidths: Partial<Record<BlockType, NonNullable<Block['layoutWidth']>>> = {
  'hero-split': '1/1',
  biblical: '2/3',
  'study-outline': '1/3',
  'rich-text': '1/1',
  slide: '1/1',
  'related-verses': '1/1',
  authority: '1/1',
  footer: '1/1',
  'reflection-question': '1/1',
};

type BlockLibraryGroup = 'all' | 'text' | 'bible' | 'media' | 'interaction' | 'layout';

const blockLibraryGroups: Record<Exclude<BlockLibraryGroup, 'all'>, BlockType[]> = {
  text: ['rich-text', 'study-content', 'authority', 'footer'],
  bible: ['biblical', 'related-verses', 'references-chain', 'study-outline'],
  media: ['hero', 'hero-split', 'video', 'slide'],
  interaction: ['reflection-question', 'cta'],
  layout: ['spacer'],
};

const getBlockLibraryGroup = (type: BlockType) =>
  (Object.entries(blockLibraryGroups).find(([, types]) => types.includes(type))?.[0] || 'layout') as Exclude<BlockLibraryGroup, 'all'>;

const contentTemplates: Record<ContentType, any[]> = {
  article: initialOnePageLayout,
  devotional: initialOnePageLayout,
  series: initialOnePageLayout
};

// Template padrão para novo estudo bíblico
const orderedBlockTypes: BlockType[] = ['hero', 'biblical', 'slide', 'rich-text', 'authority', 'footer'];

const typeLabels: Record<string, { singular: string; plural: string; description: string }> = {
  article: { singular: 'Artigo', plural: 'Artigos', description: 'Conteúdo reflexivo para blog' },
  devotional: { singular: 'Devocional', plural: 'Devocionais', description: 'Meditação diária com versículo' },
  series: { singular: 'Série', plural: 'Séries', description: 'Coleção de mensagens/pregações' }
};

// Todos os blocos são livres
const isCoreBlock = (_type: BlockType) => false;

// Interface para uso embutido (ex: dentro do Criador de Jornadas)
export interface EmbeddedContext {
  initialContent: any;
  onSave: (content: any, status: ContentStatus) => Promise<void> | void;
  onClose: () => void;
  isEmbedded: boolean;
  displayTitle?: string;
}

// Componente principal para criação de Landing Pages e Estudos Bíblicos
interface CreateLandingPageProps {
  embeddedContext?: EmbeddedContext;
  studioConfig?: StudyStudioConfig;
}

const CreateLandingPage: React.FC<CreateLandingPageProps> = ({ embeddedContext, studioConfig }) => {
  const resolvedStudioConfig = studioConfig ?? createStudyStudioConfig(
    embeddedContext ? 'roomLesson' : 'standalone',
    embeddedContext?.initialContent?.id || 'new',
  );
  // Hooks de navegação, autenticação e cabeçalho global
  const navigate = useNavigate();
  const location = useLocation();
  const {
    currentUser,
    userProfile,
    earnMana,
    showNotification,
    recordActivity,
    checkFeatureAccess,
    incrementUsage,
    openSubscription,
  } = useAuth();
  const { setTitle, setBreadcrumbs, resetHeader, setIsHeaderHidden } = useHeader();
  const { setIsFocusMode } = useSettings();

  // Estados principais de controle do fluxo (Criação, Preview, Publicação)
  const [currentStep, setCurrentStep] = useState<'create' | 'preview' | 'publish'>('create');
  const [contentType, setContentType] = useState<ContentType>('article');
  const [creationMode, setCreationMode] = useState<CreationMode>('manual');
  const [pendingAutoGenerate, setPendingAutoGenerate] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  // Dados do conteúdo (blocos, metadados, stats)
  const [content, setContent] = useState<ContentData>({
    type: 'article',
    status: 'draft',
    slug: '',
    blocks: [],
    meta: { title: '', description: '', tags: [], visibility: 'public' },
    stats: { views: 0, comments: 0, shares: 0 },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });
  const [isContentReady, setIsContentReady] = useState(false);
  const [category, setCategory] = useState('Geral');
  const [draftOwnerId, setDraftOwnerId] = useState<string | null>(null);
  const baselineKeyRef = useRef<string | null>(null);
  const { isDirty, markSaved } = useStudyDirtyState(content);
  const draftStorageKey = draftOwnerId && isContentReady
    ? `cultoplus:study-studio:v2:${draftOwnerId}:${resolvedStudioConfig.mode}:${content.id || resolvedStudioConfig.draftId}`
    : null;
  const contentIsDirty = isContentReady && isDirty(content);
  const {
    recoverableDraft,
    consumeDraft,
    discardDraft,
  } = useStudyDraftRecovery({
    storageKey: draftStorageKey,
    value: content,
    enabled: contentIsDirty,
  });

  const persistExistingStudy = useCallback(async (nextContent: ContentData) => {
    if (!nextContent.id || embeddedContext) return;
    const document = createStudyDocumentV2({
      id: nextContent.id,
      revision: nextContent.revision || 0,
      context: 'standalone',
      title: nextContent.meta.title,
      description: nextContent.meta.description,
      category: category || 'Geral',
      tags: nextContent.meta.tags || [],
      blocks: normalizeStudyBlocks(nextContent.blocks),
      status: nextContent.status === 'published' ? 'published' : 'draft',
      updatedAt: new Date().toISOString(),
    });
    const persisted = await studyDocumentService.save(
      nextContent.id,
      document,
      nextContent.revision || 0,
    );
    setContent((current) => {
      if (current.id !== persisted.id || (current.revision || 0) !== (nextContent.revision || 0)) {
        return current;
      }
      const currentSnapshot = JSON.stringify({ ...current, revision: nextContent.revision || 0 });
      const savedSnapshot = JSON.stringify({ ...nextContent, revision: nextContent.revision || 0 });
      const saved = {
        ...current,
        revision: persisted.revision,
        updatedAt: persisted.updatedAt,
      };
      if (currentSnapshot === savedSnapshot) markSaved(saved);
      return saved;
    });
    discardDraft();
  }, [category, discardDraft, embeddedContext, markSaved]);

  const autosaveStatus = useStudyAutosave({
    value: content,
    enabled: Boolean(
      currentUser
      && content.id
      && isContentReady
      && contentIsDirty
      && !embeddedContext
      && content.status !== 'published'
    ),
    onSave: persistExistingStudy,
  });

  useEffect(() => {
    if (currentUser?.uid) {
      setDraftOwnerId(currentUser.uid);
      return;
    }
    const sessionKey = 'cultoplus:study-studio:guest-session';
    const existing = window.sessionStorage.getItem(sessionKey);
    const guestId = existing || `guest-${crypto.randomUUID()}`;
    if (!existing) window.sessionStorage.setItem(sessionKey, guestId);
    setDraftOwnerId(guestId);
  }, [currentUser?.uid]);

  // Estados de interface (bloco selecionado, largura do canvas, etc)
  const [selectedBlock, setSelectedBlock] = useState<string | null>(null);
  const [activeBlockData, setActiveBlockData] = useState<any>(null); // Guardar dados do Tiptap Node
  const [copiedSlug, setCopiedSlug] = useState(false);
  const [showShareSettings, setShowShareSettings] = useState(false);
  const [isSharingToFeed, setIsSharingToFeed] = useState(false);
  const [shareVisibility, setShareVisibility] = useState<ContentPrivacyLevel>('public');
  const [shareAllowPdf, setShareAllowPdf] = useState(false);
  const [shareUserIds, setShareUserIds] = useState('');
  const [shareGroupIds, setShareGroupIds] = useState('');
  const [shareFeedDescription, setShareFeedDescription] = useState('');
  // Ref do Editor para comandos imperativos (TipTap)
  const editorRef = useRef<any>(null);
  const [canvasWidth, setCanvasWidth] = useState<'mobile' | 'tablet' | 'desktop' | 'full'>('desktop');

  // Ajuste inicial inteligente para mobile (responsividade automática)
  useEffect(() => {

    if (typeof window !== 'undefined') {
      if (window.innerWidth < 768) {
        setCanvasWidth('mobile');
      } else if (window.innerWidth < 1024) {
        setCanvasWidth('tablet');
      }
    }
  }, []);
  // Estados para modais e overlays (Configurações, IA, Mobile)
  const [isMobilePropertiesOpen, setIsMobilePropertiesOpen] = useState(false);
  const [isMobileAddMenuOpen, setIsMobileAddMenuOpen] = useState(false);
  const [showSettingsOverlay, setShowSettingsOverlay] = useState(false);
  const [settingsTab, setSettingsTab] = useState<'config' | 'access'>('config');
  const [accessLogs, setAccessLogs] = useState<any[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);

  // Histórico de alterações (Desfazer/Refazer)
  const [history, setHistory] = useState<Block[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isUndoing, setIsUndoing] = useState(false);

  const [showCreationInfo, setShowCreationInfo] = useState(true);
  const [showCreationHelper, setShowCreationHelper] = useState(false);
  const [activeStudioPanel, setActiveStudioPanel] = useState<'structure' | 'insert' | 'models' | 'bible' | 'ai'>('insert');
  const [rightPanelMode, setRightPanelMode] = useState<'properties' | 'ai'>('ai');
  const [blockSearch, setBlockSearch] = useState('');
  const [blockGroup, setBlockGroup] = useState<BlockLibraryGroup>('all');
  const [recentBlockTypes, setRecentBlockTypes] = useState<BlockType[]>([]);

  // Estados e Refs para o Construtor com IA (Fase 3)
  const [showAIBuilderModal, setShowAIBuilderModal] = useState(false);
  const [aiProposal, setAIProposal] = useState<StudyAIProposal | null>(null);
  const [aiBuilderPrompt, setAIBuilderPrompt] = useState('');
  const [isAIBuilding, setIsAIBuilding] = useState(false);
  const aiBuilderTextareaRef = useRef<HTMLTextAreaElement>(null);


  // Campos Bíblicos
  // Estados para busca e integração com referências bíblicas
  const [mainVerse, setMainVerse] = useState('');
  const [verseText, setVerseText] = useState('');
  const [verseRef, setVerseRef] = useState('');
  const [isSearchingVerse, setIsSearchingVerse] = useState(false);
  const searchTimeoutRef = useRef<any>(null);


  // Scroll handling logic removed to stabilize layout
  const handleMainScroll = (e: React.UIEvent<HTMLDivElement>) => {
    // Scroll handling logic removed to stabilize layout
  };


  // Carregar Logs de Acesso quando abrir a aba de acessos
  useEffect(() => {
    if (showSettingsOverlay && settingsTab === 'access' && content.id) {
      const fetchLogs = async () => {
        setIsLoadingLogs(true);
        try {
          const logs = await dbService.getStudyAccessLogs(content.id as string);
          setAccessLogs(logs);
        } catch (e) {
          console.error("Erro ao carregar logs:", e);
        } finally {
          setIsLoadingLogs(false);
        }
      };
      fetchLogs();
    }
  }, [showSettingsOverlay, settingsTab, content.id]);

  // Atualiza o título e o breadcrumb do cabeçalho global conforme o passo atual
  useEffect(() => {
    const titles: Record<string, string> = {
      create: content.meta.title || 'Editando',
      preview: 'Preview',
      publish: 'Publicar'
    };
    setIsHeaderHidden(true);
    setTitle(titles[currentStep]);
    setBreadcrumbs([
      { label: 'Estúdio Criativo', path: '/?tab=criar' },
      { label: 'Conteúdo', path: '/criar-conteudo' },
      { label: titles[currentStep] }
    ]);
    return () => resetHeader();
  }, [currentStep, content.meta.title, setTitle, setBreadcrumbs, resetHeader]);

  useEffect(() => {
    setIsFocusMode(true);
    return () => {
      setIsFocusMode(false);
      setIsHeaderHidden(false);
    };
  }, [setIsFocusMode, setIsHeaderHidden]);

  useEffect(() => {
    if (!isContentReady || !draftStorageKey) return;
    if (baselineKeyRef.current === draftStorageKey) return;
    baselineKeyRef.current = draftStorageKey;
    markSaved(content);
  }, [content, draftStorageKey, isContentReady, markSaved]);

  useEffect(() => {
    if (!contentIsDirty) return;
    const preventAccidentalExit = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', preventAccidentalExit);
    return () => window.removeEventListener('beforeunload', preventAccidentalExit);
  }, [contentIsDirty]);

  // Função principal de inicialização: carrega estudo existente ou inicializa um novo
  useEffect(() => {

    const loadContent = async () => {
      setIsContentReady(false);
      const state = location.state as any;
      const urlParams = new URLSearchParams(location.search);
      const targetId = state?.contentId || urlParams.get('id');

      // Se estiver em modo embutido, pular lógica de URL e DB
      if (embeddedContext) {
        const data = embeddedContext.initialContent;
        const parsedBlocks = parseStudyBlocks(data.blocks);
        const parsedMeta = typeof data.meta === 'string' ? JSON.parse(data.meta) : (data.meta || { title: '', description: '', tags: [], visibility: 'public' });
        setContent({
          ...data,
          blocks: parsedBlocks,
          meta: parsedMeta
        });
        setContentType(data.type || 'article');
        setCurrentStep('create');
        setIsLoading(false);
        setIsContentReady(true);
        return;
      }

      // Se vier de "Meus Estudos" ou criar novo, inicializar com template de estudo
      if (!targetId && !state?.studyData) {
        const blocks = buildBaseBlocks(contentTemplates.article);
        setContent(prev => ({
          ...prev,
          type: 'article',
          blocks,
          meta: { ...prev.meta, title: 'Novo Estudo Bíblico' }
        }));
        setCurrentStep('create');
        setIsContentReady(true);
        return;
      }

      // Carregar conteúdo existente
      setIsLoading(true);
      try {
        const data = targetId ? await dbService.getPublicStudyById(targetId) : null;
        if (data) {
          const parsedBlocks = parseStudyBlocks(data.blocks);
          const parsedMeta = typeof data.meta === 'string' ? JSON.parse(data.meta) : (data.meta || { title: '', description: '', tags: [], visibility: 'public' });
          if (!parsedMeta.visibility) parsedMeta.visibility = 'public';

          setContent({
            ...data,
            revision: Number(data.revision || data.document?.revision || 0),
            blocks: parsedBlocks,
            meta: parsedMeta
          });
          setContentType(data.type || 'article');
        } else if (state?.studyData) {
          // Fallback para estudo legado ou draft da tabela studies
          const legacyData = state.studyData;
          const parsedBlocks = parseStudyBlocks(legacyData.blocks);
          const parsedMeta = typeof legacyData.meta === 'string' ? JSON.parse(legacyData.meta) : (legacyData.meta || { visibility: 'public' });
          if (!parsedMeta.visibility) parsedMeta.visibility = 'public';

          let blocks = parsedBlocks;

          // Se não tem blocos estruturados mas tem conteudo (analysis), cria base blocks
          if ((!blocks || blocks.length === 0) && legacyData.analysis) {
            blocks = buildBaseBlocks(contentTemplates.article).map(b => {
              if (b.type === 'hero') {
                return { ...b, data: { ...b.data, title: legacyData.title || 'Estudo', subtitle: legacyData.sourceText?.substring(0, 120) } };
              }
              if (b.type === 'study-content') {
                return { ...b, data: { ...b.data, content: legacyData.analysis } };
              }
              return b;
            });
          } else if (blocks.length === 0) {
            blocks = buildBaseBlocks(contentTemplates.article);
          }

          setContent(prev => ({
            ...prev,
            id: legacyData.id,
            type: 'article',
            status: legacyData.status || 'draft',
            meta: {
              ...prev.meta,
              ...parsedMeta,
              title: legacyData.title || parsedMeta.title || 'Novo Estudo',
              description: legacyData.sourceText?.substring(0, 150) || parsedMeta.description || ''
            },
            blocks
          }));
          setContentType(legacyData.type || 'article');
        }

        // Se houver um parâmetro 'step' na URL, utiliza-o (Preview)
        const targetStep = urlParams.get('step');
        if (targetStep === 'preview') {
          setCurrentStep('preview');
        } else if (targetId || state?.studyData) {
          setCurrentStep('create');
        }
      } catch (e) {
        console.error('Erro ao carregar conteúdo:', e);
      }
      setIsLoading(false);
      setIsContentReady(true);
    };
    loadContent();
  }, [location.state, location.search]);

  // Lógica de busca automática de texto bíblico ao digitar uma referência (debounce)
  useEffect(() => {
    const ref = mainVerse.trim();
    if (ref.length > 2) {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

      searchTimeoutRef.current = setTimeout(async () => {
        setIsSearchingVerse(true);
        try {
          const verseMatch = ref.match(/^([1-3]?\s?[a-zà-úçãõ\s]+)\s+(\d+)[:\.;\s](\d+)$/i);
          const chapterMatch = ref.match(/^([1-3]?\s?[a-zà-úçãõ\s]+)\s+(\d+)$/i);

          if (verseMatch) {
            const result = await bibleService.getVerseText(ref);
            if (result) {
              setVerseText(result.text);
              setVerseRef(result.formattedRef);
              // Atualizar o título se estiver vazio
              if (!content.meta.title) {
                setContent(prev => ({
                  ...prev,
                  meta: { ...prev.meta, title: `Estudo em ${result.formattedRef}` }
                }));
              }
            }
          } else if (chapterMatch) {
            const chapterRes = await bibleService.getTextByReference(ref);
            if (chapterRes) {
              setVerseText(chapterRes.text);
              setVerseRef(chapterRes.formattedRef);
              if (!content.meta.title) {
                setContent(prev => ({
                  ...prev,
                  meta: { ...prev.meta, title: `Estudo em ${chapterRes.formattedRef}` }
                }));
              }
            }
          }
        } catch (e) {
          console.error(e);
        } finally {
          setIsSearchingVerse(false);
        }
      }, 1000);
    }
    return () => { if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current); };
  }, [mainVerse]);


  // Quando a referência for encontrada, atualizar o bloco bíblico
  useEffect(() => {
    if (verseRef && verseText) {
      if (editorRef.current?.updateBlock) {
        // Se o editor estiver montado (TipTap), usamos a ref imperativa
        editorRef.current.updateFirstBlockByType('biblical', { reference: verseRef, text: verseText, verse: verseRef });
      } else {
        // Caso contrário (estado inicial legível como array), atualizamos o estado
        setContent(prev => {
          if (!Array.isArray(prev.blocks)) return prev;
          const biblicalBlock = prev.blocks.find(b => b.type === 'biblical');
          if (biblicalBlock) {
            return {
              ...prev,
              blocks: prev.blocks.map(b =>
                b.type === 'biblical'
                  ? { ...b, data: { ...b.data, reference: verseRef, text: verseText, verse: verseRef } }
                  : b
              )
            };
          }
          return prev;
        });
      }
    }
  }, [verseRef, verseText]);

  // Registra alterações no histórico para permitir Desfazer/Refazer (Debounce de 500ms)
  useEffect(() => {
    if (isUndoing) {
      setIsUndoing(false);
      return;
    }
    const timer = setTimeout(() => {
      setHistory(prev => {
        const lastBlocks = prev[historyIndex];
        const currentBlocksStr = JSON.stringify(content.blocks);
        const lastBlocksStr = JSON.stringify(lastBlocks || []);
        if (currentBlocksStr === lastBlocksStr) return prev;

        const newHistory = prev.slice(0, historyIndex + 1);
        newHistory.push(content.blocks);
        if (newHistory.length > 50) newHistory.shift();
        setHistoryIndex(newHistory.length - 1);
        return newHistory;
      });
    }, 500);
    return () => clearTimeout(timer);
  }, [content.blocks, historyIndex, isUndoing]);


  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      setIsUndoing(true);
      const prevIndex = historyIndex - 1;
      setHistoryIndex(prevIndex);
      setContent(curr => ({ ...curr, blocks: history[prevIndex] }));
    }
  }, [history, historyIndex]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setIsUndoing(true);
      const nextIndex = historyIndex + 1;
      setHistoryIndex(nextIndex);
      setContent(curr => ({ ...curr, blocks: history[nextIndex] }));
    }
  }, [history, historyIndex]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable ||
        target.closest('[contenteditable="true"]');

      if (isInput) return; // Permite o undo/redo nativo do navegador para o texto.

      // Ctrl+Z or Cmd+Z
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      }
      // Ctrl+Y or Cmd+Y
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
      }
    };
    const handleMobileOpenProp = () => setIsMobilePropertiesOpen(true);
    window.addEventListener('open-mobile-properties', handleMobileOpenProp);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('open-mobile-properties', handleMobileOpenProp);
    };
  }, [handleUndo, handleRedo]);


  // Função para adicionar um bloco ao final do conteúdo ou na posição atual do cursor
  const addBlock = (type: BlockType) => {
    if (editorRef.current) {
      editorRef.current.insertBlock(type);
    }
  };

  // Remove um bloco específico pelo ID
  const removeBlock = (id: string) => {
    if (editorRef.current?.removeBlock) {
      editorRef.current.removeBlock(id);
    }
  };

  // Atualiza os dados de um bloco específico
  const updateBlock = (id: string, data: Record<string, any>) => {
    if (editorRef.current?.updateBlock) {
      editorRef.current.updateBlock(id, data);
      setActiveBlockData((prev: any) => prev?.id === id ? { ...prev, data: { ...prev.data, ...data } } : prev);
    }
  };


  const moveBlock = (fromIndex: number, toIndex: number) => { return; }; // Reduzido

  const addBlockAt = (type: BlockType, index: number) => {
    if (editorRef.current?.insertBlock) {
      editorRef.current.insertBlock(type);
      return;
    }
    const newBlock = createBlock(type);
    setContent(prev => {
      if (!Array.isArray(prev.blocks)) return prev;
      const newBlocks = [...prev.blocks];
      newBlocks.splice(index, 0, newBlock);
      return { ...prev, blocks: newBlocks };
    });
    setSelectedBlock(newBlock.id);
  };

  const duplicateBlock = (id: string, index: number) => {
    const block = Array.isArray(content.blocks)
      ? content.blocks.find(b => b.id === id)
      : (activeBlockData?.id === id ? activeBlockData : null);

    if (!block || isCoreBlock(block.type)) {
      showNotification('Este bloco básico não pode ser duplicado.', 'info');
      return;
    }

    if (editorRef.current?.insertBlock) {
      // No Tiptap, apenas inserimos um novo do mesmo tipo por enquanto
      // TODO: Implementar clonagem real no Tiptap
      editorRef.current.insertBlock(block.type);
      return;
    }

    const newBlock = { ...block, id: `block-${Date.now()}` };
    setContent(prev => {
      if (!Array.isArray(prev.blocks)) return prev;
      const newBlocks = [...prev.blocks];
      newBlocks.splice(index + 1, 0, newBlock);
      return { ...prev, blocks: newBlocks };
    });
    setSelectedBlock(newBlock.id);
  };

  // Atualiza metadados do documento (título, descrição, capa, etc)
  const updateMeta = (field: string, value: any) => {
    setContent(prev => ({
      ...prev,
      meta: { ...prev.meta, [field]: value }
    }));
  };


  const stripHtml = (text: string) => text.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();

  const extractSectionHtml = (html: string, heading: string) => {
    const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`<h2[^>]*>\\s*${escaped}\\s*<\\/h2>([\\s\\S]*?)(?=<h2[^>]*>|$)`, 'i');
    const match = html.match(regex);
    return match?.[1]?.trim() || '';
  };

  const extractStudyPayload = (html: string) => {
    const cleanHtml = (html || '').trim();
    const titleMatch = cleanHtml.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
    const subtitleMatch = cleanHtml.match(/<p[^>]*class=["']bible-subtitle["'][^>]*>([\s\S]*?)<\/p>/i);
    const blockquoteMatch = cleanHtml.match(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/i);

    return {
      rawHtml: cleanHtml,
      title: titleMatch ? stripHtml(titleMatch[1]) : '',
      subtitle: subtitleMatch ? stripHtml(subtitleMatch[1]) : '',
      quote: blockquoteMatch ? stripHtml(blockquoteMatch[1]) : '',
      introduction: extractSectionHtml(cleanHtml, '1. Introdução') || extractSectionHtml(cleanHtml, 'Introdução'),
      context: extractSectionHtml(cleanHtml, '2. Contextualização') || extractSectionHtml(cleanHtml, '2. Mergulho nas Escrituras'),
      application: extractSectionHtml(cleanHtml, '3. Aplicação Prática') || extractSectionHtml(cleanHtml, '4. Aplicação Prática'),
      conclusion: extractSectionHtml(cleanHtml, '5. Conclusão') || extractSectionHtml(cleanHtml, '3. Pontos de Transformação'),
      prayer: extractSectionHtml(cleanHtml, '4. Oração') || extractSectionHtml(cleanHtml, 'Oração Final')
    };
  };
  // Aciona a Inteligência Artificial para gerar toda a estrutura da página com base no prompt do usuário
  const normalizeAIProposalBlocks = (blocks: unknown): Block[] =>
    normalizeAIBuildBlocks(blocks).map((block: any, blockIndex: number) => {
      const enforcedWidth = aiOnePageLayoutWidths[block.type as BlockType]
        || block.layoutWidth
        || block.data?.layoutWidth
        || '1/1';
      const slides = block.type === 'slide' && Array.isArray(block.data?.slides)
        ? block.data.slides.map((slide: any, slideIndex: number) => ({
          ...slide,
          id: slide.id || `slide-${Date.now()}-${blockIndex}-${slideIndex}`,
        }))
        : block.data?.slides;
      return {
        ...block,
        id: block.id || `ai-block-${Date.now()}-${blockIndex}`,
        layoutWidth: enforcedWidth,
        data: {
          ...(block.data || {}),
          ...(slides ? { slides } : {}),
          layoutWidth: enforcedWidth,
        },
      } as Block;
    });

  const applyAIBlocks = (
    proposal: StudyAIProposal,
    blockIds: string[],
    mode: 'replace-all' | 'merge' | 'append',
  ) => {
    const selected = proposal.blocks.filter((block) => blockIds.includes(block.id));
    setContent((current) => {
      const currentBlocks = parseStudyBlocks(current.blocks) as Block[];
      let nextBlocks: Block[];
      if (mode === 'replace-all') {
        nextBlocks = selected;
      } else if (mode === 'append') {
        nextBlocks = [...currentBlocks, ...selected.map((block, index) => ({
          ...block,
          id: `${block.id}-copy-${Date.now()}-${index}`,
        }))];
      } else {
        const replacements = new Map(selected.map((block) => [block.type, block]));
        const replacedTypes = new Set<BlockType>();
        nextBlocks = currentBlocks.map((block) => {
          const replacement = replacements.get(block.type);
          if (!replacement || replacedTypes.has(block.type)) return block;
          replacedTypes.add(block.type);
          return { ...replacement, id: block.id };
        });
        selected.forEach((block) => {
          if (!replacedTypes.has(block.type)) nextBlocks.push(block);
        });
      }
      const nextContent = {
        ...current,
        meta: {
          ...current.meta,
          title: proposal.title || current.meta.title,
          description: proposal.description || current.meta.description,
        },
        slug: proposal.slug || current.slug,
        blocks: normalizeStudyBlocks(nextBlocks),
      };
      window.setTimeout(() => editorRef.current?.setContent(nextContent.blocks), 50);
      return nextContent;
    });
    setAIProposal(null);
    showNotification(
      mode === 'append' ? 'Blocos da IA adicionados ao estudo.' : 'Sugestões da IA aplicadas.',
      'success',
    );
  };

  const handleAIAutoBuilder = async () => {
    if (!currentUser) {
      showNotification('Entre na sua conta para usar o Obreiro IA.', 'warning');
      return;
    }
    if (!checkFeatureAccess('aiDeepAnalysis')) {
      openSubscription();
      return;
    }
    const userPrompt = aiBuilderPrompt.trim();
    if (!userPrompt && !verseRef) {
      showNotification('Escreva o que a IA deve criar ou adicione uma referência bíblica', 'warning');
      return;
    }
    setIsAIBuilding(true);
    try {
      // Monta prompt enriquecido com referência bíblica se disponível
      const enrichedPrompt = [
        verseRef ? `REFERÊNCIA BÍBLICA PRINCIPAL: ${verseRef}${verseText ? ` — "${verseText}"` : ''}` : '',
        userPrompt ? `TEMA / COMPLEMENTO: ${userPrompt}` : ''
      ].filter(Boolean).join('\n');

      const result = await studioAIService.generateOnePage({
        prompt: enrichedPrompt,
        authorName: currentUser.displayName || undefined,
      });
      const proposedBlocks = normalizeAIProposalBlocks(result?.blocks);
      if (!proposedBlocks.length) throw new Error('A IA retornou uma estrutura sem blocos editaveis.');
      setAIProposal({
        title: result.meta?.title,
        description: result.meta?.description,
        slug: result.slug,
        blocks: proposedBlocks,
      });
      await incrementUsage('analysis').catch((usageError) => {
        console.warn('Estudo gerado, mas o uso de IA nao foi atualizado.', usageError);
      });
      setShowAIBuilderModal(false);
      setAIBuilderPrompt('');
      return;
      if (!result?.blocks) throw new Error('Estrutura inválida retornada pela IA');

      setContent(prev => {
        const aiBlocks = normalizeAIBuildBlocks(result.blocks);

        // Mapa de larguras do Roadmap V2: garante o layout correto mesmo se a IA ignorar as instruções
        // Sequência exata de layoutWidths do Roadmap V3 (9 blocos)

        // Se a IA retornar blocos em formato de array (Roadmap V2)
        if (aiBlocks.length > 0) {
          const finalBlocks = aiBlocks.map((b: any) => {
            // Garantir que slides tenham IDs únicos para evitar erro de "key"
            if (b.type === 'slide' && b.data?.slides) {
              b.data.slides = b.data.slides.map((s: any, sIdx: number) => ({
                ...s,
                id: s.id || `slide-${Date.now()}-${sIdx}-${Math.random().toString(36).substring(2, 5)}`
              }));
            }

            // Forçar layoutWidth: 1) valor do Roadmap por índice, 2) valor por tipo, 3) valor da IA, 4) fallback 1/1
            const enforcedWidth = aiOnePageLayoutWidths[b.type as BlockType] || b.layoutWidth || b.data?.layoutWidth || '1/1';

            // Lógica dinâmica para Related Verses: Ajusta largura baseada na quantidade (1=1/3, 2=1/2, 3+=1/1)

            return {
              id: b.id,
              type: b.type,
              layoutWidth: enforcedWidth,
              data: { ...(b.data || {}), layoutWidth: enforcedWidth }
            };
          });

          const isTipTapFormat = !Array.isArray(prev.blocks) && (prev.blocks as any)?.type === 'doc';

          const newState: any = {
            ...prev,
            meta: {
              ...prev.meta,
              title: result.meta?.title || prev.meta.title,
              description: result.meta?.description || prev.meta.description
            },
            slug: result.slug || prev.slug,
            blocks: isTipTapFormat
              ? {
                type: 'doc',
                content: finalBlocks.map((b: any) => ({
                  type: 'customBlock',
                  attrs: {
                    blockData: b,
                    layoutWidth: b.layoutWidth || '1/1'
                  }
                }))
              }
              : finalBlocks
          };

          setTimeout(() => {
            editorRef.current?.setContent(newState.blocks);
          }, 100);

          return newState;
        }

        // Fallback para mapeamento antigo se necessário (segurança)
        const currentBlocks = Array.isArray(prev.blocks)
          ? [...prev.blocks]
          : ((prev.blocks as any)?.content?.filter((n: any) => n.type === 'customBlock').map((n: any) => n.attrs.blockData) || []);

        // ... (resto da lógica de merge se necessário, mas a IA V2 sempre manda array)
        throw new Error('A IA retornou uma estrutura sem blocos editáveis.');
      });

      showNotification('✨ One-page criada com sucesso pela IA!', 'success');
      await incrementUsage('analysis').catch((usageError) => {
        console.warn('Estudo gerado, mas o uso de IA não foi atualizado.', usageError);
      });
      setShowAIBuilderModal(false);
      setAIBuilderPrompt('');
    } catch (e: any) {
      console.error('AI Auto-Builder:', e);
      showNotification(`Erro ao construir com IA: ${e.message}`, 'error');
    } finally {
      setIsAIBuilding(false);
    }
  };


  const restoreRecoveredDraft = () => {
    const recovered = consumeDraft();
    if (!recovered) return;
    setContent({
      ...recovered,
      blocks: parseStudyBlocks(recovered.blocks),
      meta: {
        ...content.meta,
        ...(recovered.meta || {}),
      },
    });
    showNotification('Rascunho local recuperado.', 'success');
  };

  const discardRecoveredDraft = () => {
    discardDraft();
    showNotification('Rascunho local descartado.', 'success');
  };

  const handleExitStudio = () => {
    if (
      contentIsDirty
      && !window.confirm('Existem alterações ainda não salvas no servidor. Deseja sair mesmo assim?')
    ) {
      return;
    }
    if (embeddedContext) embeddedContext.onClose();
    else navigate(-1);
  };

  // Salva o estado atual do estudo no banco de dados como rascunho
  const handleSave = async (asStatus?: ContentStatus) => {
    if (!currentUser) return;

    // Validação: Não permitir salvar/preview se não houver modificações no template base (apenas para novos estudos)
    const isNew = !content.id;
    const hasNoChanges = history.length <= 1;
    const hasNoTitle = !content.meta?.title?.trim();

    if (isNew && hasNoChanges && hasNoTitle) {
      showNotification('Faça alguma modificação no template ou use a IA antes de prosseguir.', 'warning');
      return;
    }

    if (hasNoTitle) {
      showNotification('Adicione um título antes de salvar', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const dataToSave = {
        ...content,
        blocks: Array.isArray(content.blocks) ? normalizeStudyBlocks(content.blocks) : content.blocks,
        status: asStatus || 'draft',
        updatedAt: new Date().toISOString()
      };

      if (embeddedContext) {
        await embeddedContext.onSave(dataToSave, asStatus || 'draft');
        markSaved(dataToSave);
        discardDraft();
        showNotification('Aula salva no plano!', 'success');
        setIsSaving(false);
        return;
      }

      if (content.id) {
        if (!embeddedContext) {
          await persistExistingStudy(dataToSave);
        } else {
          await dbService.updatePublicStudy(content.id, dataToSave);
          markSaved(dataToSave);
        }
      } else {
        const result = await dbService.createPublicStudy({
          ...dataToSave,
          authorId: currentUser.uid,
          authorName: currentUser.displayName,
          authorPhoto: currentUser.photoURL
        });
        const persistedContent = { ...dataToSave, id: result.id };
        setContent(persistedContent);
        markSaved(persistedContent);
      }
      discardDraft();

      showNotification(asStatus === 'preview' ? 'Preview gerado!' : 'Salvo como rascunho', 'success');
      if (asStatus === 'preview') setCurrentStep('preview');
    } catch (e: any) {
      const errMsg = e?.message || e?.details || (typeof e === 'object' ? JSON.stringify(e) : String(e));
      console.error('Erro ao salvar:', errMsg, e);
      showNotification(
        e instanceof StudyRevisionConflictError
          ? 'Este estudo mudou em outra sessão. Reabra-o para evitar sobrescrever alterações.'
          : `Erro ao salvar: ${errMsg}`,
        'error',
      );
    } finally {
      setIsSaving(false);
    }
  };

  // Publica o estudo, gerando o slug (URL amigável) se necessário
  const handlePublish = async () => {
    // Validação de modificação antes de publicar
    if (!content.id && history.length <= 1 && !content.meta?.title?.trim()) {
      showNotification('Você não pode publicar o template base sem modificações.', 'warning');
      return;
    }

    let finalSlug = content.slug;

    // Se não tiver slug, gera a partir do título
    if (!finalSlug) {
      if (!content.meta?.title?.trim()) {
        showNotification('Adicione um título para gerar o link de compartilhamento', 'error');
        return;
      }

      finalSlug = content.meta.title
        .toLowerCase()
        .normalize('NFD') // Remove acentos
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^\w\s-]/g, '') // Remove caracteres especiais
        .trim()
        .replace(/[\s_-]+/g, '-') // Espaços para hifens
        .replace(/^-+|-+$/g, ''); // Remove hifens no início/fim

      // Garante que o slug não fique vazio
      if (!finalSlug) {
        finalSlug = `estudo-${Math.random().toString(36).substring(2, 8)}`;
      } else {
        // Adiciona um sufixo curto para evitar colisões
        finalSlug += `-${Math.random().toString(36).substring(2, 6)}`;
      }

      setContent(prev => ({ ...prev, slug: finalSlug }));
    }

    setIsSaving(true);
    try {
      await dbService.publishPublicStudy(content.id || '', finalSlug);
      setContent(prev => ({ ...prev, status: 'published', slug: finalSlug }));
      await earnMana('create_study');
      showNotification('Publicado com sucesso!', 'success');
      setCurrentStep('publish');
    } catch (e) {
      console.error('Erro ao publicar:', e);
      showNotification('Erro ao publicar: O link gerado pode já estar em uso. Tente outro no painel lateral.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Copia o link público de compartilhamento para a área de transferência
  const copyShareLink = () => {
    const url = getPreviewShareUrl();
    navigator.clipboard.writeText(url);
    setCopiedSlug(true);
    setTimeout(() => setCopiedSlug(false), 2000);
    showNotification('Link copiado!', 'success');
  };

  const getPreviewShareUrl = () => getContentShareUrl(
    { id: content.id, slug: content.slug },
    typeof window !== 'undefined' ? window.location.origin : undefined,
  );

  const openShareSettings = () => {
    setShareVisibility(content.meta.visibility || 'public');
    setShareAllowPdf(Boolean(content.meta.allowPdfDownload));
    setShareUserIds((content.meta.allowedUserIds || []).join(', '));
    setShareGroupIds((content.meta.allowedGroupIds || (content.meta.groupId ? [content.meta.groupId] : [])).join(', '));
    setShareFeedDescription('');
    setShowShareSettings(true);
  };

  const copyPreviewShareLink = async () => {
    await navigator.clipboard.writeText(getPreviewShareUrl());
    setCopiedSlug(true);
    setTimeout(() => setCopiedSlug(false), 2000);
    showNotification('Link copiado!', 'success');
  };

  const savePreviewShareSettings = async () => {
    if (!content.id) {
      showNotification('Gere o preview antes de salvar as configurações de compartilhamento.', 'warning');
      return;
    }

    const selectedUserIds = shareUserIds.split(',').map(id => id.trim()).filter(Boolean);
    const selectedGroupIds = shareGroupIds.split(',').map(id => id.trim()).filter(Boolean);
    const needsUsers = shareVisibility === 'invite_only' || shareVisibility === 'private';
    const needsGroups = shareVisibility === 'group' || shareVisibility === 'church_groups';

    if ((needsUsers && selectedUserIds.length === 0) || (needsGroups && selectedGroupIds.length === 0)) {
      showNotification('Defina quem podera acessar antes de salvar o acesso privado.', 'warning');
      return;
    }

    const settings = normalizeContentShareSettings({
      visibility: shareVisibility,
      allowPdfDownload: shareAllowPdf,
      selectedUserIds,
      selectedGroupIds,
    });
    const nextContent = {
      ...content,
      meta: {
        ...content.meta,
        ...settings,
        churchId: shareVisibility === 'church' ? userProfile?.churchData?.churchId : content.meta.churchId,
      },
      updatedAt: new Date().toISOString(),
    };

    setIsSaving(true);
    try {
      await dbService.updatePublicStudy(content.id, nextContent);
      setContent(nextContent);
      showNotification('Configuracoes de compartilhamento salvas.', 'success');
    } catch (error) {
      console.error('Erro ao salvar compartilhamento:', error);
      showNotification('Erro ao salvar configurações de compartilhamento.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const sharePreviewToFeed = async () => {
    if (!currentUser || !content.id) return;
    if ((content.meta.visibility || 'public') !== 'public') {
      showNotification('Somente conteúdos públicos podem ser compartilhados no Feed do Reino.', 'warning');
      return;
    }

    setIsSharingToFeed(true);
    try {
      const post = await kingdomPublishingService.publish({
        publisher: {
          userId: currentUser.uid,
          displayName: userProfile?.displayName || currentUser.displayName || 'Autor',
          username: userProfile?.username || currentUser.email || 'autor',
          photoURL: userProfile?.photoURL || currentUser.photoURL,
        },
        type: 'study',
        imageUrl: content.meta.coverImage,
        content: buildContentSharePostContent(
          {
            id: content.id,
            slug: content.slug,
            title: content.meta.title,
            coverImage: content.meta.coverImage,
          },
          getPreviewShareUrl(),
          shareFeedDescription,
        ),
        sourceType: 'published_content',
        sourceId: content.id,
        metadata: { title: content.meta.title, slug: content.slug },
      });
      try {
        await recordActivity?.('social_post', `Compartilhou o estudo ${content.meta.title || 'sem titulo'} no Reino`);
      } catch (activityError) {
        console.warn('Conteúdo compartilhado, mas a atividade não foi registrada.', activityError);
      }
      showNotification('Conteúdo compartilhado no Feed do Reino.', 'success');
      setShowShareSettings(false);
      navigate('/social', { state: { refreshFeed: true, highlightPostId: post.id } });
    } catch (error) {
      console.error('Erro ao compartilhar no feed:', error);
      showNotification('Erro ao compartilhar no Feed do Reino.', 'error');
    } finally {
      setIsSharingToFeed(false);
    }
  };


  const selectedBlockData = activeBlockData || (Array.isArray(content.blocks) ? content.blocks.find((b: any) => b.id === selectedBlock) : null);
  const openStudioAI = (prompt?: string) => {
    if (prompt) setAIBuilderPrompt(prompt);
    setRightPanelMode('ai');
    setShowAIBuilderModal(true);
    setTimeout(() => aiBuilderTextareaRef.current?.focus(), 100);
  };

  // RENDER: Helper Functions

  // Função de renderização principal que alterna entre as telas do fluxo (Criação, Preview, Publicação)
  const renderStepContent = () => {

    switch (currentStep) {
      case 'create':
        return (
          <>
            <div
              data-testid="study-studio-shell"
              className="min-h-screen md:h-screen w-full max-w-[100vw] flex flex-col bg-[#f3f1ec] dark:bg-gray-950 overflow-y-auto overflow-x-clip md:overflow-hidden"
            >
              <SEO title="Estúdio da Palavra" />
              <h1 className="sr-only">Novo Estudo Bíblico</h1>

              {/* Barra de Ferramentas Superior (Header do Editor) - Contém ações globais como Undo, Redo, Preview e Botão de IA */}
              <header className="z-30 w-full border-b border-[#e8e4dc] bg-[#fffefa] px-3 py-2.5 dark:border-gray-800 dark:bg-bible-darkPaper md:px-4">

                <div className="flex flex-col lg:flex-row justify-between w-full mx-auto gap-3">

                  {/* Top row mobile / Left desktop */}
                  <div className="flex items-center justify-between w-full lg:w-auto gap-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <img
                        src="/brand/culto-plus-logo.png"
                        alt="Culto+"
                        className="hidden h-10 w-auto object-contain sm:block"
                      />
                      <div className="hidden h-8 w-px bg-gray-200 sm:block dark:bg-gray-700" />
                      <button
                        onClick={handleExitStudio}
                        className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                        aria-label="Voltar"
                      >
                        <ArrowLeft size={20} />
                      </button>
                      <div className="flex-1 min-w-0 pr-2">
                        <p className="truncate text-sm font-bold text-bible-ink dark:text-white sm:text-base">
                          Estúdio da Palavra
                        </p>
                        <p className="mt-0.5 truncate text-[9px] font-bold uppercase tracking-widest text-emerald-700 dark:text-emerald-400">
                          {embeddedContext ? 'Sala · Aula' : `${typeLabels[content.type].singular} · Rascunho`}
                        </p>
                      </div>
                    </div>

                    {/* Quick Actions (Undo/Redo, Settings, Save) */}
                    <div className="flex items-center bg-gray-50 dark:bg-gray-800/80 rounded-xl p-0.5 sm:p-1 gap-0.5 sm:gap-1 flex-shrink-0">
                      <button
                        onClick={handleUndo}
                        disabled={historyIndex <= 0}
                        className="p-1.5 sm:p-2 hover:bg-white dark:hover:bg-gray-700 rounded-lg text-gray-500 hover:text-gray-800 dark:hover:text-gray-300 transition-colors disabled:opacity-30"
                        title="Desfazer"
                      >
                        <Undo2 size={16} />
                      </button>
                      <button
                        onClick={handleRedo}
                        disabled={historyIndex >= history.length - 1}
                        className="p-1.5 sm:p-2 hover:bg-white dark:hover:bg-gray-700 rounded-lg text-gray-500 hover:text-gray-800 dark:hover:text-gray-300 transition-colors disabled:opacity-30"
                        title="Refazer"
                      >
                        <Redo2 size={16} />
                      </button>

                      <div className="w-px h-4 bg-gray-200 dark:bg-gray-700 mx-1"></div>

                      {resolvedStudioConfig.capabilities.canConfigureAudience && (
                        <button
                          onClick={() => setShowSettingsOverlay(true)}
                          className="p-1.5 sm:p-2 hover:bg-white dark:hover:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-300 transition-colors"
                          title="Configurações"
                        >
                          <Settings size={18} />
                        </button>
                      )}
                      <button
                        onClick={() => handleSave('draft')}
                        disabled={isSaving}
                        className="p-1.5 sm:p-2 hover:bg-white dark:hover:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-300 transition-colors disabled:opacity-50"
                        title="Salvar Rascunho"
                      >
                        <Save size={18} />
                      </button>
                    </div>
                  </div>

                  {/* Bottom row mobile / Right desktop shrink */}
                  <div className="flex items-center gap-2 w-full lg:w-auto">
                    <div className="hidden items-center gap-1.5 whitespace-nowrap px-2 text-[10px] font-bold text-emerald-700 xl:flex dark:text-emerald-400" aria-live="polite">
                      {(isSaving || autosaveStatus === 'saving') ? <Loader2 size={14} className="animate-spin" /> : contentIsDirty ? <Clock size={14} /> : <Check size={14} />}
                      {isSaving || autosaveStatus === 'saving'
                        ? 'Salvando...'
                        : autosaveStatus === 'conflict'
                          ? 'Conflito de versão'
                          : autosaveStatus === 'error'
                            ? 'Falha no autosave'
                            : contentIsDirty
                              ? 'Alterações não salvas'
                              : 'Salvo'}
                    </div>

                    {/* Responsive layout preview buttons (hidden on mobile) */}
                    {!embeddedContext && (
                      <div className="hidden lg:flex items-center bg-gray-50 dark:bg-gray-800 rounded-xl p-1 gap-0.5 mr-2">
                        {([
                          { key: 'mobile' as const, icon: <Minimize2 size={14} />, label: 'Mobile (375px)' },
                          { key: 'tablet' as const, icon: <Square size={14} />, label: 'Tablet (768px)' },
                          { key: 'desktop' as const, icon: <Monitor size={14} />, label: 'Desktop (900px)' },
                          { key: 'full' as const, icon: <Maximize2 size={14} />, label: 'Largura total' },
                        ]).map(opt => (
                          <button
                            key={opt.key}
                            title={opt.label}
                            onClick={() => setCanvasWidth(opt.key)}
                            className={`p-1.5 rounded-lg transition-colors ${canvasWidth === opt.key
                              ? 'bg-white dark:bg-gray-700 text-bible-gold shadow-sm'
                              : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                              }`}
                          >
                            {opt.icon}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Big Buttons */}
                    <div className="flex flex-1 items-center gap-2">
                      {resolvedStudioConfig.capabilities.canUseAI && (
                        <button
                          onClick={() => openStudioAI()}
                          className="flex min-h-11 flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-violet-200 bg-violet-50 px-3 py-2.5 text-xs font-bold text-violet-700 transition-colors hover:bg-violet-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600 lg:flex-none dark:border-violet-900 dark:bg-violet-950/40 dark:text-violet-300"
                        >
                          <Sparkles size={18} />
                          <span>Obreiro IA</span>
                        </button>
                      )}

                      {embeddedContext ? (
                        <button
                          onClick={() => handleSave('draft')}
                          disabled={isSaving}
                          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-emerald-800 lg:flex-none disabled:opacity-50"
                        >
                          {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                          <span>{resolvedStudioConfig.capabilities.finalActionLabel}</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleSave('preview')}
                          disabled={isSaving}
                          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-emerald-800 lg:flex-none disabled:opacity-50"
                        >
                          {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Eye size={18} />}
                          <span>Pré-visualizar</span>
                        </button>
                      )}
                    </div>
                  </div>

                </div>
              </header>

              {/* Editor Body */}
              <div className="flex-1 flex overflow-x-clip md:overflow-hidden">
                <StudioToolRail
                  active={activeStudioPanel}
                  onChange={(panel) => {
                    setActiveStudioPanel(panel);
                    if (panel === 'ai') setRightPanelMode('ai');
                  }}
                />
                {/* Barra Lateral Esquerda - Painel de controle de referências e menu de adição de blocos por clique/arrasto */}
                <aside className="hidden w-[286px] flex-shrink-0 overflow-y-auto border-r border-[#e8e4dc] bg-white lg:block dark:border-gray-800 dark:bg-bible-darkPaper">

                  <div className="p-4">
                    <div className="mb-5">
                      <p className="text-[9px] font-black uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-400">
                        {activeStudioPanel === 'insert' ? 'Biblioteca completa' : 'Estúdio da Palavra'}
                      </p>
                      <h2 className="mt-1 text-lg font-bold text-bible-ink dark:text-white">
                        {activeStudioPanel === 'structure' && 'Estrutura do estudo'}
                        {activeStudioPanel === 'insert' && 'Inserir bloco'}
                        {activeStudioPanel === 'models' && 'Modelos de estudo'}
                        {activeStudioPanel === 'bible' && 'Bíblia e referência'}
                        {activeStudioPanel === 'ai' && 'Obreiro IA'}
                      </h2>
                    </div>

                    {/* Referência Bíblica */}
                    {activeStudioPanel === 'bible' && (
                    <div className="mb-6 p-4 bg-gradient-to-br from-bible-gold/10 to-amber-50 dark:to-amber-900/10 rounded-2xl border border-bible-gold/20">
                      <h3 className="text-xs font-bold text-bible-gold uppercase tracking-wider mb-3 flex items-center gap-2">
                        <BookOpen size={14} />
                        Referência Bíblica
                      </h3>
                      <div className="space-y-3">
                        <div className="relative">
                          <input
                            type="text"
                            value={mainVerse}
                            onChange={(e) => setMainVerse(e.target.value)}
                            placeholder="Ex: João 3:16"
                            className="w-full pl-9 pr-10 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none focus:border-bible-gold transition-colors"
                          />
                          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                          {isSearchingVerse && (
                            <Loader2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-bible-gold animate-spin" />
                          )}
                        </div>

                        {verseText && (
                          <div className="p-3 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700">
                            <p className="text-[10px] text-bible-gold font-bold mb-1">{verseRef}</p>
                            <p className="text-xs italic text-gray-600 dark:text-gray-300 line-clamp-4">"{verseText}"</p>
                          </div>
                        )}
                      </div>
                    </div>
                    )}

                    {/* Título e Categoria */}
                    {activeStudioPanel === 'structure' && (
                    <div className="mb-6">
                      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                        Informações
                      </h3>
                      <div className="space-y-3">
                        <div>
                          <label htmlFor="study-studio-title" className="text-xs text-gray-500 block mb-1">Título</label>
                          <input
                            id="study-studio-title"
                            type="text"
                            value={content.meta.title}
                            onChange={(e) => updateMeta('title', e.target.value)}
                            placeholder="Título do estudo"
                            className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none focus:border-bible-gold"
                          />
                        </div>
                        <div>
                          <label htmlFor="study-studio-category" className="text-xs text-gray-500 block mb-1">Categoria</label>
                          <select
                            id="study-studio-category"
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none focus:border-bible-gold"
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
                    )}

                    {/* Blocos Disponíveis */}
                    {activeStudioPanel === 'insert' && (
                    <div>
                      <label htmlFor="study-block-search" className="sr-only">Buscar bloco</label>
                      <div className="relative mb-3">
                        <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          id="study-block-search"
                          type="search"
                          value={blockSearch}
                          onChange={(event) => setBlockSearch(event.target.value)}
                          placeholder="Buscar bloco..."
                          className="min-h-11 w-full rounded-xl border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-sm outline-none focus:border-bible-gold focus:ring-2 focus:ring-bible-gold/20 dark:border-gray-700 dark:bg-gray-900"
                        />
                      </div>
                      <div className="mb-4 flex gap-1.5 overflow-x-auto pb-1" aria-label="Categorias de blocos">
                        {([
                          ['all', 'Todos'],
                          ['text', 'Texto'],
                          ['bible', 'Bíblia'],
                          ['media', 'Mídia'],
                          ['interaction', 'Interação'],
                          ['layout', 'Layout'],
                        ] as const).map(([value, label]) => (
                          <button
                            key={value}
                            type="button"
                            aria-pressed={blockGroup === value}
                            onClick={() => setBlockGroup(value)}
                            className={`min-h-9 whitespace-nowrap rounded-full px-3 text-[10px] font-bold transition-colors ${blockGroup === value ? 'bg-emerald-700 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300'}`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                      {recentBlockTypes.length > 0 && !blockSearch && blockGroup === 'all' && (
                        <p className="mb-2 px-1 text-[9px] font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-400">
                          Recentes: {recentBlockTypes.slice(0, 3).map((type) => blockLabels[type].label).join(' · ')}
                        </p>
                      )}
                      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 px-1">
                        Conteúdo da Página
                      </h3>
                      <div className="space-y-3 pr-2">
                        {(Object.keys(blockLabels) as BlockType[])
                          .filter((type) => type !== 'study-content')
                          .filter((type) => blockGroup === 'all' || getBlockLibraryGroup(type) === blockGroup)
                          .filter((type) => {
                            const query = blockSearch.trim().toLocaleLowerCase('pt-BR');
                            if (!query) return true;
                            const item = blockLabels[type];
                            return `${item.label} ${item.description}`.toLocaleLowerCase('pt-BR').includes(query);
                          })
                          .map((type, idx) => {
                          const isLockedBase = isCoreBlock(type);
                          const count = content.blocks?.filter?.((b: any) => b.type === type)?.length || 0;
                          return (
                            <div
                              key={`palette-${type}`}
                              draggable={!isLockedBase}
                              onDragStart={(e) => {
                                e.dataTransfer.setData('application/x-tiptap-block', type);
                              }}
                              role="button"
                              tabIndex={0}
                              aria-label={`Adicionar bloco ${blockLabels[type].label}`}
                              onKeyDown={(event) => {
                                if (event.key === 'Enter' || event.key === ' ') {
                                  event.preventDefault();
                                  addBlock(type);
                                  setRecentBlockTypes((current) => [type, ...current.filter((item) => item !== type)].slice(0, 5));
                                }
                              }}
                              onClick={() => {
                                addBlock(type);
                                setRecentBlockTypes((current) => [type, ...current.filter((item) => item !== type)].slice(0, 5));
                              }}
                              className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left group ${isLockedBase
                                ? 'bg-gray-100 dark:bg-gray-800/50 opacity-50 cursor-not-allowed'
                                : 'bg-gray-50 dark:bg-gray-900 hover:bg-bible-gold/10 active:scale-[0.98] cursor-grab active:cursor-grabbing'
                                }`}
                            >
                              <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${blockLabels[type].color}`}>
                                {type === 'hero' && <LayoutTemplate size={20} />}
                                {type === 'authority' && <User size={20} />}
                                {type === 'biblical' && <BookOpen size={20} />}
                                {type === 'video' && <Video size={20} />}
                                {type === 'footer' && <Layers size={20} />}
                                {type === 'slide' && <Play size={20} />}
                                {type === 'hero-split' && <LayoutTemplate size={20} />}
                                {type === 'study-outline' && <Layers size={20} />}
                                {type === 'rich-text' && <Type size={20} />}
                                {type === 'spacer' && <Maximize2 size={20} />}
                                {type === 'related-verses' && <Sparkle size={20} />}
                                {type === 'reflection-question' && <MessageCircle size={20} />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm text-bible-ink dark:text-white">
                                  {blockLabels[type].label}
                                </p>
                                <p className="text-[10px] text-gray-500">
                                  {isLockedBase ? 'Bloco fixo' : blockLabels[type].description}
                                </p>
                              </div>
                              <Plus size={16} className="ml-auto text-gray-400 flex-shrink-0 group-hover:rotate-90 transition-transform" />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    )}

                    {/* Tags */}
                    {activeStudioPanel === 'structure' && (
                    <div className="mt-6">
                      <label className="text-xs text-gray-500 block mb-1">Tags (separadas por vírgula)</label>
                      <input
                        type="text"
                        value={content.meta.tags?.join(', ') || ''}
                        onChange={(e) => updateMeta('tags', e.target.value.split(',').map(t => t.trim()).filter(Boolean))}
                        placeholder="fé, oração, amor"
                        className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none focus:border-bible-gold"
                      />
                    </div>
                    )}

                    {activeStudioPanel === 'models' && (
                      <div className="space-y-3">
                        {[
                          ['Estudo profundo', '9 blocos · Bíblia, reflexão e aplicação', initialOnePageLayout],
                          ['Mensagem objetiva', 'Capa, texto bíblico, reflexão e ação', initialOnePageLayout.filter((_, index) => [0, 1, 3, 8].includes(index))],
                          ['Aula com slides', 'Estrutura visual para sala e discipulado', initialOnePageLayout.filter((_, index) => [0, 1, 2, 4, 6].includes(index))],
                          ['Devocional guiado', 'Palavra, meditacao, pergunta e oracao', initialOnePageLayout.filter((_, index) => [0, 1, 3, 5, 8].includes(index))],
                          ['Esboco de mensagem', 'Texto-base, pontos, referencias e apelo', initialOnePageLayout.filter((_, index) => [0, 1, 2, 3, 5, 7].includes(index))],
                        ].map(([title, description, layout]) => (
                          <button
                            key={title as string}
                            type="button"
                            onClick={() => {
                              const blocks = buildBaseBlocks(layout as typeof initialOnePageLayout);
                              setContent((current) => ({ ...current, blocks: normalizeStudyBlocks(blocks) }));
                              showNotification(`Modelo ${title} aplicado.`, 'success');
                            }}
                            className="w-full rounded-2xl border border-gray-200 bg-[#fffefa] p-4 text-left transition-colors hover:border-bible-gold/40 hover:bg-bible-gold/5 dark:border-gray-800 dark:bg-gray-900"
                          >
                            <span className="block text-sm font-bold text-bible-ink dark:text-white">{title as string}</span>
                            <span className="mt-1 block text-[11px] leading-relaxed text-gray-500">{description as string}</span>
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={() => {
                            setContent((current) => ({ ...current, blocks: [] }));
                            showNotification('Documento em branco criado.', 'success');
                          }}
                          className="w-full rounded-2xl border border-dashed border-gray-300 bg-transparent p-4 text-left transition-colors hover:border-bible-gold/60 hover:bg-bible-gold/5 dark:border-gray-700"
                        >
                          <span className="block text-sm font-bold text-bible-ink dark:text-white">Comecar em branco</span>
                          <span className="mt-1 block text-[11px] leading-relaxed text-gray-500">Monte livremente com blocos em ate tres colunas.</span>
                        </button>
                      </div>
                    )}

                    {activeStudioPanel === 'ai' && (
                      <StudioAssistantPanel
                        verseReference={verseRef}
                        selectedBlockLabel={selectedBlockData ? blockLabels[selectedBlockData.type as BlockType]?.label : undefined}
                        onOpenBuilder={openStudioAI}
                      />
                    )}
                  </div>
                </aside>

                {/* Área Central de Edição (Canvas) - Onde o documento é visualizado e editado via TipTap */}
                {/* Área Central de Edição (Canvas) - Onde o documento é visualizado e editado via TipTap */}
                <main className="flex-1 overflow-x-clip overflow-y-auto w-full max-w-[100vw] text-break-words bg-[#f3f1ec] p-3 pb-28 sm:p-4 lg:p-6 dark:bg-gray-950" onScroll={handleMainScroll}>

                  {recoverableDraft && (
                    <section
                      role="status"
                      aria-label="Rascunho local disponível"
                      data-testid="study-draft-recovery"
                      className="mx-auto mb-4 flex max-w-7xl flex-col gap-3 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-amber-950 shadow-sm sm:flex-row sm:items-center sm:justify-between dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-100"
                    >
                      <div>
                        <p className="text-sm font-bold">Encontramos alterações não salvas</p>
                        <p className="mt-0.5 text-xs opacity-75">
                          Recuperação local de {new Date(recoverableDraft.savedAt).toLocaleString('pt-BR')}.
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={discardRecoveredDraft}
                          className="min-h-11 rounded-xl border border-amber-300 px-4 text-xs font-bold transition-colors hover:bg-amber-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-700 dark:border-amber-800 dark:hover:bg-amber-900"
                        >
                          Descartar
                        </button>
                        <button
                          type="button"
                          onClick={restoreRecoveredDraft}
                          className="min-h-11 rounded-xl bg-amber-800 px-4 text-xs font-bold text-white transition-colors hover:bg-amber-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-800"
                        >
                          Recuperar
                        </button>
                      </div>
                    </section>
                  )}

                  {(autosaveStatus === 'conflict' || autosaveStatus === 'error') && (
                    <section
                      role="alert"
                      className="mx-auto mb-4 flex max-w-7xl flex-col gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-red-900 sm:flex-row sm:items-center sm:justify-between dark:border-red-900 dark:bg-red-950/40 dark:text-red-100"
                    >
                      <div>
                        <p className="text-sm font-bold">
                          {autosaveStatus === 'conflict' ? 'Este estudo mudou em outra sessão' : 'Não foi possível salvar automaticamente'}
                        </p>
                        <p className="mt-0.5 text-xs opacity-75">
                          {autosaveStatus === 'conflict'
                            ? 'Reabra o estudo para comparar a versão mais recente antes de continuar.'
                            : 'Suas alterações continuam protegidas neste dispositivo. Tente salvar novamente.'}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => window.location.reload()}
                        className="min-h-11 rounded-xl bg-red-700 px-4 text-xs font-bold text-white hover:bg-red-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700"
                      >
                        Recarregar versão
                      </button>
                    </section>
                  )}

                  {showCreationHelper && (
                    <div className="max-w-3xl mx-auto mb-3 sm:mb-4 animate-in fade-in slide-in-from-top-4 duration-500">
                      <div className="relative rounded-2xl sm:rounded-3xl border border-bible-gold/20 bg-white/60 dark:bg-black/40 backdrop-blur-md px-5 py-4 sm:px-6 text-sm text-gray-700 dark:text-gray-300 shadow-xl shadow-bible-gold/5 flex items-center justify-between">
                        <div className="flex-1 pr-8">
                          <strong className="text-bible-gold font-black uppercase tracking-widest text-[10px] block mb-1">
                            {creationMode === 'ai' ? 'Fluxo com IA' : 'Fluxo manual'}
                          </strong>
                          <p className="leading-relaxed">
                            {creationMode === 'ai'
                              ? 'A IA monta a estrutura da one page com os blocos principais, e depois você edita texto, fonte, imagem e destaques.'
                              : 'A estrutura da one page já está pronta. Você só precisa preencher e editar o conteúdo dos blocos.'}
                          </p>
                        </div>
                        <button
                          onClick={() => setShowCreationHelper(false)}
                          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors text-gray-400 hover:text-red-500 absolute top-3 right-3"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    </div>
                  )}
                  <div className={`mx-auto bg-bible-paper dark:bg-bible-darkPaper rounded-2xl shadow-[0_18px_48px_-18px_rgba(45,42,38,0.22)] border border-[#ded8cd] transition-all duration-300 canvas-${canvasWidth} ${canvasWidth === 'mobile' ? 'w-full max-w-[390px] rounded-[1.75rem] border border-bible-gold/20 shadow-[0_14px_34px_-18px_rgba(0,0,0,0.35)]'
                    : canvasWidth === 'tablet' ? 'w-full max-w-[768px]'
                      : canvasWidth === 'full' ? 'w-full max-w-full'
                        : 'w-full max-w-7xl'
                    }`}>
                    <div className={`w-full h-full ${canvasWidth === 'mobile' ? 'p-2' : 'p-4 md:p-6 lg:p-8'}`}>
                    <UnifiedEditor
                      ref={editorRef}
                      content={content.blocks || ''}
                      onChange={(json) => setContent(prev => ({
                        ...prev,
                        blocks: Array.isArray(json) ? normalizeStudyBlocks(json) : json,
                      }))}
                      onBlockSelect={(blockData) => {
                        setSelectedBlock(blockData?.id || null);
                        setActiveBlockData(blockData || null);
                        if (blockData) setRightPanelMode('properties');
                      }}
                      readOnly={currentStep !== 'create'}
                      canvasWidth={canvasWidth}
                      studyId={content.id || content.slug}
                      studyTitle={content.meta.title}
                    />
                    </div>
                  </div>
                </main>

                {/* Barra Lateral Direita - Configurações detalhadas do bloco selecionado no momento */}
                <aside className="hidden w-[336px] flex-shrink-0 overflow-y-auto border-l border-[#e8e4dc] bg-white 2xl:block dark:border-gray-800 dark:bg-bible-darkPaper">
                  <div className="sticky top-0 z-10 grid grid-cols-2 gap-1 border-b border-gray-100 bg-white p-2 dark:border-gray-800 dark:bg-bible-darkPaper">
                    <button
                      type="button"
                      disabled={!selectedBlockData}
                      onClick={() => setRightPanelMode('properties')}
                      className={`min-h-9 rounded-lg text-[10px] font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                        rightPanelMode === 'properties'
                          ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-900'
                      }`}
                    >
                      Propriedades
                    </button>
                    <button
                      type="button"
                      onClick={() => setRightPanelMode('ai')}
                      className={`min-h-9 rounded-lg text-[10px] font-bold transition-colors ${
                        rightPanelMode === 'ai'
                          ? 'bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-300'
                          : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-900'
                      }`}
                    >
                      Obreiro IA
                    </button>
                  </div>

                  {rightPanelMode === 'properties' && selectedBlockData ? (
                    <div className="p-4">
                      <div className="mb-4 flex items-center justify-between">
                        <div>
                          <p className="text-[9px] font-black uppercase tracking-widest text-emerald-700">Bloco selecionado</p>
                          <h3 className="mt-1 font-bold text-bible-ink dark:text-white">
                            {blockLabels[selectedBlockData.type as keyof typeof blockLabels]?.label || 'Bloco'}
                          </h3>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedBlock(null);
                            setActiveBlockData(null);
                            setRightPanelMode('ai');
                          }}
                          className="flex h-9 w-9 items-center justify-center rounded-xl text-gray-400 hover:bg-gray-100 hover:text-red-500 dark:hover:bg-gray-800"
                          aria-label="Fechar propriedades"
                        >
                          <X size={16} />
                        </button>
                      </div>
                      <BlockProperties
                        block={selectedBlockData}
                        onUpdate={(data) => updateBlock(selectedBlockData.id, data)}
                        onClose={() => {
                          setSelectedBlock(null);
                          setActiveBlockData(null);
                          setRightPanelMode('ai');
                        }}
                        isEditing={currentStep === 'create'}
                      />
                    </div>
                  ) : (
                    <StudioAssistantPanel
                      verseReference={verseRef}
                      selectedBlockLabel={selectedBlockData ? blockLabels[selectedBlockData.type as BlockType]?.label : undefined}
                      onOpenBuilder={openStudioAI}
                    />
                  )}
                </aside>
              </div>

              {/* Mobile Editing Tools */}
              {selectedBlockData && currentStep === 'create' && (
                <>

                  <MobilePropertiesSheet
                    isOpen={isMobilePropertiesOpen}
                    onClose={() => setIsMobilePropertiesOpen(false)}
                    block={selectedBlockData}
                    onUpdate={(data) => updateBlock(selectedBlockData.id, data)}
                    isEditing={currentStep === 'create'}
                  />
                </>
              )}

              {/* Mobile Fixed Add Button (Phase 4) */}
              {!selectedBlockData && currentStep === 'create' && (
                <>
                  <div className="fixed bottom-6 left-6 z-[110] xl:hidden flex gap-2">
                    <button
                      onClick={handleUndo}
                      disabled={historyIndex <= 0}
                      className="w-12 h-12 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-xl flex items-center justify-center text-gray-600 dark:text-gray-300 disabled:opacity-30 transition-all active:scale-95"
                      title="Desfazer"
                    >
                      <Undo2 size={20} />
                    </button>
                    <button
                      onClick={handleRedo}
                      disabled={historyIndex >= history.length - 1}
                      className="w-12 h-12 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-xl flex items-center justify-center text-gray-600 dark:text-gray-300 disabled:opacity-30 transition-all active:scale-95"
                      title="Refazer"
                    >
                      <Redo2 size={20} />
                    </button>
                  </div>

                  {/* Botão Central de Adicionar Bloco */}
                  <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[110] xl:hidden flex flex-col items-center pb-[env(safe-area-inset-bottom)]">
                    <button
                      onClick={() => setIsMobileAddMenuOpen(true)}
                      className="w-14 h-14 bg-gradient-to-br from-indigo-600 to-violet-700 text-white rounded-2xl shadow-[0_10px_24px_-8px_rgba(79,70,229,0.55)] flex items-center justify-center active:scale-90 transition-all hover:scale-105 border-2 border-white dark:border-gray-900 group"
                      aria-label="Adicionar Bloco"
                    >
                      <div className="relative">
                        <Plus size={26} className="group-hover:rotate-90 transition-transform duration-500" />
                        <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-white rounded-full animate-ping" />
                      </div>
                    </button>
                    <span className="text-[9px] font-black uppercase tracking-widest mt-1.5 text-bible-gold drop-shadow-sm">Novo Bloco</span>
                  </div>
                </>
              )}

              <MobileAddBlockMenu
                isOpen={isMobileAddMenuOpen}
                onClose={() => setIsMobileAddMenuOpen(false)}
                onSelect={(type) => {
                  addBlock(type);
                  setIsMobileAddMenuOpen(false);
                }}
                onAIBuild={() => setShowAIBuilderModal(true)}
              />

              {/* ======== ESTUDIO SETTINGS OVERLAY (CAPA / THUMBNAIL) ======== */}
              {showSettingsOverlay && (
                <div className="fixed inset-0 z-[100] flex items-center justify-end" onClick={() => setShowSettingsOverlay(false)}>
                  {/* Backdrop */}
                  <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" />

                  {/* Panel */}
                  <div
                    className="relative w-full max-w-md h-full bg-white dark:bg-gray-900 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300"
                    onClick={e => e.stopPropagation()}
                  >
                    {/* Header */}
                    <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                      <div>
                        <h2 className="text-xl font-bold text-bible-ink dark:text-white flex items-center gap-2">
                          <Settings className="text-bible-gold" size={20} />
                          Ajustes do Estudo
                        </h2>
                      </div>
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

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-6">

                      {settingsTab === 'config' ? (
                        <div className="space-y-8">
                          {/* Capa do Estudo */}
                          <div className="space-y-3">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2 px-1">Capa do Estudo (Thumbnail)</label>
                            <div className="relative group aspect-video rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-800 border-2 border-dashed border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center transition-all hover:border-bible-gold/50">
                              {content.meta.coverImage ? (
                                <>
                                  <img src={content.meta.coverImage} className="w-full h-full object-cover transition-transform group-hover:scale-105" alt="Capa" />
                                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                    <ImageUploadButton
                                      onUpload={(url) => updateMeta('coverImage', url)}
                                      label="Trocar"
                                      className="bg-white/20 hover:bg-white/40 text-white border-white/60"
                                    />
                                    <button
                                      onClick={() => updateMeta('coverImage', '')}
                                      className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/40 text-red-100 rounded-lg text-xs font-bold border border-red-500/40 transition-colors"
                                    >
                                      Remover
                                    </button>
                                  </div>
                                </>
                              ) : (
                                <div className="flex flex-col items-center gap-3 p-6 text-center">
                                  <div className="w-12 h-12 rounded-2xl bg-bible-gold/10 flex items-center justify-center text-bible-gold">
                                    <ImageIcon size={24} />
                                  </div>
                                  <div>
                                    <p className="text-sm font-bold text-gray-700 dark:text-gray-200">Nenhuma capa definida</p>
                                    <p className="text-[10px] text-gray-500 mt-1">Essa imagem aparecerá nos cards de estudo.</p>
                                  </div>
                                  <ImageUploadButton onUpload={(url) => updateMeta('coverImage', url)} label="Escolher Capa" />
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Metadados Básicos */}
                          <div className="space-y-4">
                            <div>
                              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5 px-1">Título do Estudo</label>
                              <input
                                type="text"
                                value={content.meta.title}
                                onChange={(e) => updateMeta('title', e.target.value)}
                                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-none rounded-2xl text-sm font-bold placeholder:text-gray-400 focus:ring-2 ring-bible-gold/30 transition-all"
                                placeholder="Título Principal"
                              />
                            </div>

                            <div>
                              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5 px-1">Descrição SEO / Resumo</label>
                              <textarea
                                value={content.meta.description}
                                onChange={(e) => updateMeta('description', e.target.value)}
                                rows={3}
                                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-none rounded-2xl text-sm font-medium placeholder:text-gray-400 focus:ring-2 ring-bible-gold/30 transition-all resize-none"
                                placeholder="Breve descrição do conteúdo..."
                              />
                            </div>

                            <div>
                              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5 px-1">Link Personalizado (Slug)</label>
                              <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-transparent focus-within:border-bible-gold/30 transition-all">
                                <Globe size={14} className="text-gray-400" />
                                <span className="text-xs text-gray-400">/l/</span>
                                <input
                                  type="text"
                                  value={content.slug}
                                  onChange={(e) => setContent(prev => ({ ...prev, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') }))}
                                  className="flex-1 bg-transparent border-none p-0 text-sm font-mono focus:ring-0"
                                  placeholder="link-do-estudo"
                                />
                              </div>
                              <p className="text-[10px] text-gray-500 mt-2 px-1">
                                Deixe vazio para gerar automaticamente na publicação.
                              </p>
                            </div>

                            <div>
                              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2 px-1">Privacidade / Visibilidade</label>
                              <div className="grid grid-cols-2 gap-2">
                                <button
                                  onClick={() => updateMeta('visibility', 'public')}
                                  className={`flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all ${content.meta.visibility === 'public' || !content.meta.visibility ? 'border-bible-gold bg-bible-gold/5 text-bible-gold' : 'border-gray-100 dark:border-gray-800 text-gray-500 bg-white dark:bg-gray-800/50 hover:bg-gray-50'}`}
                                >
                                  <Globe size={18} />
                                  <span className="text-[11px] font-bold">Público</span>
                                </button>
                                <button
                                  onClick={() => updateMeta('visibility', 'invite_only')}
                                  className={`flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all ${content.meta.visibility === 'invite_only' ? 'border-bible-gold bg-bible-gold/5 text-bible-gold' : 'border-gray-100 dark:border-gray-800 text-gray-500 bg-white dark:bg-gray-800/50 hover:bg-gray-50'}`}
                                >
                                  <Lock size={18} />
                                  <span className="text-[11px] font-bold">Por Convite</span>
                                </button>
                              </div>
                            </div>
                          </div>

                          <button
                            onClick={() => {
                              handleSave('draft');
                              setShowSettingsOverlay(false);
                            }}
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
                                      <User size={20} className="text-bible-gold" />
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{log.user_name}</p>
                                    <p className="text-[10px] text-gray-500 flex items-center gap-1">
                                      <Clock size={10} />
                                      {new Date(log.accessed_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                  </div>
                                  {log.user_id && (
                                    <div className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[8px] font-bold rounded-full uppercase">
                                      Membro
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="py-12 flex flex-col items-center justify-center text-gray-400 gap-4 text-center px-4">
                              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                                <User size={32} className="opacity-20" />
                              </div>
                              <div>
                                <p className="text-sm font-bold">Nenhum acesso detalhado</p>
                                <p className="text-[10px] mt-1 italic">Compartilhe o link de convite para começar a receber alunos!</p>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* ======== AI AUTO-BUILDER MODAL (Fase 3) ======== */}
              {aiProposal && (
                <AIProposalReview
                  proposal={aiProposal}
                  onDiscard={() => setAIProposal(null)}
                  onApplyAll={() => applyAIBlocks(aiProposal, aiProposal.blocks.map((block) => block.id), 'replace-all')}
                  onApplySelected={(blockIds) => applyAIBlocks(aiProposal, blockIds, 'merge')}
                  onInsertSelected={(blockIds) => applyAIBlocks(aiProposal, blockIds, 'append')}
                />
              )}

              {showAIBuilderModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowAIBuilderModal(false)}>
                  {/* Backdrop */}
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

                  {/* Modal */}
                  <div
                    className="relative w-full max-w-2xl max-h-[90vh] bg-white dark:bg-gray-900 rounded-3xl shadow-2xl overflow-y-auto"
                    onClick={e => e.stopPropagation()}
                  >
                    {/* Gradient header */}
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
                          <p className="text-violet-200 text-sm mt-1">Descreva sua mensagem e a IA constrói toda a one-page</p>
                        </div>
                      </div>
                    </div>

                    {/* Body */}
                    <div className="p-8 space-y-6">

                      {/* Referência Bíblica detectada ou busca */}
                      {verseRef ? (
                        <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl">
                          <div className="w-8 h-8 bg-bible-gold/20 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                            <BookOpen size={16} className="text-bible-gold" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start">
                              <p className="text-xs font-bold text-bible-gold uppercase tracking-wider mb-0.5">Referência bíblica detectada</p>
                              <button onClick={() => { setMainVerse(''); setVerseRef(''); setVerseText(''); }} className="text-gray-400 hover:text-red-500">
                                <X size={14} />
                              </button>
                            </div>
                            <p className="text-sm font-bold text-gray-800 dark:text-gray-100">{verseRef}</p>
                            {verseText && (
                              <p className="text-xs text-gray-500 dark:text-gray-400 italic mt-1 line-clamp-2">"{verseText}"</p>
                            )}
                            <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-1.5">A IA vai usar esta referência como base principal da one-page.</p>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-2">
                            Referência Bíblica (Opcional, mas recomendado)
                          </label>
                          <div className="relative">
                            <BookOpen className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                              type="text"
                              value={mainVerse}
                              onChange={e => setMainVerse(e.target.value)}
                              placeholder="Ex: João 3:16 ou Romanos 12"
                              className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl text-sm outline-none focus:border-bible-gold focus:ring-2 focus:ring-bible-gold/20 transition-all font-medium placeholder-gray-400"
                            />
                            {isSearchingVerse && (
                              <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-bible-gold" size={16} />
                            )}
                          </div>
                          {mainVerse && !isSearchingVerse && !verseRef && mainVerse.length > 2 && (
                            <p className="text-xs text-gray-400 mt-2 ml-1">Procurando referência... Padrão: Livro X:Y.</p>
                          )}
                        </div>
                      )}

                      {/* Prompt field */}
                      <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-2">
                          {verseRef ? 'Complemento / Tema adicional (opcional)' : 'O que você quer criar?'}
                        </label>
                        <textarea
                          ref={aiBuilderTextareaRef}
                          value={aiBuilderPrompt}
                          onChange={e => setAIBuilderPrompt(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleAIAutoBuilder(); }}
                          placeholder={verseRef
                            ? `Ex: Para jovens, tom inspirador, foco na aplicação prática ao dia a dia...`
                            : `Ex: Um estudo sobre fé e perseverança baseado em Hebreus 11, para jovens adultos que enfrentam dificuldades. Use tom inspirador e prático.`
                          }
                          rows={verseRef ? 3 : 5}
                          className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl text-sm resize-none outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-200 dark:focus:ring-violet-900 transition-all"
                        />
                        <p className="text-xs text-gray-400 mt-1.5">Dica: Quanto mais detalhes, melhor o resultado. <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-[10px] font-mono">Ctrl+Enter</kbd> para gerar.</p>
                      </div>

                      {/* Quick prompts */}
                      <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Sugestões rápidas</p>
                        <div className="flex flex-wrap gap-2">
                          {[
                            'Estudo sobre esperança em tempos difíceis',
                            'Devocional sobre gratidão e fé',
                            'Mensagem de encorajamento para jovens',
                            'Pregação sobre o amor de Deus em João 3:16',
                            'Estudo de oração com Filipenses 4:6'
                          ].map(s => (
                            <button
                              key={s}
                              onClick={() => setAIBuilderPrompt(s)}
                              className="px-3 py-1.5 bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300 rounded-lg text-xs font-medium hover:bg-violet-100 dark:hover:bg-violet-900/40 transition-colors border border-violet-100 dark:border-violet-800"
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* O que a IA vai gerar */}
                      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-4">
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">A IA vai preencher automaticamente</p>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { icon: '🎯', label: 'Hero Banner', desc: 'Título e subtítulo' },
                            { icon: '📖', label: 'Bloco Bíblico', desc: 'Versículo escolhido' },
                            { icon: '✍️', label: 'Guia de Estudo', desc: '5 seções completas' },
                            { icon: '👤', label: 'Bloco de Autor', desc: 'Bio personalizada' },
                            { icon: '🔗', label: 'Footer', desc: 'Tagline e links' },
                            { icon: '🎨', label: 'Design', desc: 'Cores e estilos' },
                          ].map(item => (
                            <div key={item.label} className="flex items-center gap-2 p-2 rounded-xl bg-white dark:bg-gray-800">
                              <span className="text-lg">{item.icon}</span>
                              <div>
                                <p className="text-xs font-bold text-gray-700 dark:text-gray-200">{item.label}</p>
                                <p className="text-[10px] text-gray-400">{item.desc}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-3">
                        <button
                          onClick={() => setShowAIBuilderModal(false)}
                          className="flex-1 py-3 border border-gray-200 dark:border-gray-700 rounded-2xl font-medium text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={handleAIAutoBuilder}
                          disabled={isAIBuilding || (!aiBuilderPrompt.trim() && !verseRef)}
                          className="flex-1 py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-2xl font-bold text-sm hover:from-violet-700 hover:to-purple-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-purple-200 dark:shadow-purple-900/30"
                        >
                          {isAIBuilding ? (
                            <><Loader2 size={16} className="animate-spin" /> Criando sua one-page...</>
                          ) : (
                            <><Sparkles size={16} /> Criar com IA</>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        );

      case 'preview':
        return (
          <>
            <div className="min-h-screen bg-gray-100 dark:bg-bible-darkPaper">
              <SEO title="Preview" />

              {/* Header */}
              <header className="sticky top-0 z-50 bg-white dark:bg-bible-darkPaper border-b border-gray-200 dark:border-gray-800 px-4 py-3">
                <div className="flex items-center justify-between max-w-6xl mx-auto">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setCurrentStep('create')}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                    >
                      <ArrowLeft size={20} />
                    </button>
                    <div>
                      <h1 className="font-bold text-bible-ink dark:text-white">Preview</h1>
                      <p className="text-xs text-gray-500">Veja como ficará seu conteúdo</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
                    <button onClick={() => setCanvasWidth('mobile')} className={`p-2 rounded-lg transition-all ${canvasWidth === 'mobile' ? 'bg-white dark:bg-gray-700 text-bible-gold shadow-sm' : 'text-gray-400'}`} title="Mobile"><Smartphone size={16} /></button>
                    <button onClick={() => setCanvasWidth('tablet')} className={`p-2 rounded-lg transition-all ${canvasWidth === 'tablet' ? 'bg-white dark:bg-gray-700 text-bible-gold shadow-sm' : 'text-gray-400'}`} title="Tablet"><Tablet size={16} /></button>
                    <button onClick={() => setCanvasWidth('desktop')} className={`p-2 rounded-lg transition-all ${canvasWidth === 'desktop' ? 'bg-white dark:bg-gray-700 text-bible-gold shadow-sm' : 'text-gray-400'}`} title="Desktop"><Monitor size={16} /></button>
                    <button onClick={() => setCanvasWidth('full')} className={`p-2 rounded-lg transition-all ${canvasWidth === 'full' ? 'bg-white dark:bg-gray-700 text-bible-gold shadow-sm' : 'text-gray-400'}`} title="Full Width"><Maximize2 size={16} /></button>
                  </div>
                  <div className="flex items-center gap-2">
                    {content.meta.allowPdfDownload && (
                      <button
                        onClick={() => window.print()}
                        className="hidden md:flex items-center gap-2 px-3 py-2.5 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 rounded-xl font-bold text-xs uppercase tracking-widest hover:border-bible-gold hover:text-bible-gold transition-colors"
                      >
                        <FileDown size={16} />
                        PDF
                      </button>
                    )}
                    <button
                      onClick={() => setCurrentStep('create')}
                      className="hidden md:flex items-center gap-2 px-3 py-2.5 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 rounded-xl font-bold text-xs uppercase tracking-widest hover:border-bible-gold hover:text-bible-gold transition-colors"
                    >
                      <Settings size={16} />
                      Editar
                    </button>
                    <button
                      onClick={openShareSettings}
                      data-testid="content-preview-share-button"
                      className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-900 border border-bible-gold/40 text-bible-gold rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-bible-gold/10 transition-colors"
                    >
                      <Share2 size={16} />
                      Compartilhar
                    </button>
                    <button
                      onClick={handlePublish}
                      disabled={isSaving}
                      className="flex items-center gap-2 px-4 md:px-6 py-2.5 bg-bible-gold text-white rounded-xl font-bold hover:bg-bible-gold/90 transition-colors disabled:opacity-50"
                    >
                      {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                      Publicar
                    </button>
                  </div>
                </div>
              </header>

              {/* Preview Content */}
              <main className="py-8 min-h-screen bg-gray-100 dark:bg-black/90 flex justify-center">
                <div className={`w-full bg-white dark:bg-bible-darkPaper shadow-2xl transition-all duration-300 canvas-${canvasWidth} ${canvasWidth === 'mobile' ? 'max-w-[375px] min-h-[667px] rounded-[3rem] border-[12px] border-gray-800'
                  : canvasWidth === 'tablet' ? 'max-w-[768px] min-h-[1024px] rounded-2xl border-8 border-gray-800'
                    : canvasWidth === 'full' ? 'w-full'
                      : 'max-w-7xl rounded-2xl'
                  }`}>
                  <div className="w-full h-full p-6 md:p-12 lg:px-20">
                    <StudyDocumentRenderer
                      blocks={content.blocks}
                      canvasWidth={canvasWidth}
                      studyId={content.id || content.slug}
                      studyTitle={content.meta.title}
                    />
                  </div>
                </div>
              </main>

              {showShareSettings && (
                <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 px-3 py-4 backdrop-blur-sm md:items-center print:hidden" role="dialog" aria-modal="true">
                  <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl dark:bg-bible-darkPaper">
                    <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white p-4 dark:border-gray-800 dark:bg-bible-darkPaper">
                      <div>
                        <h2 className="font-black text-gray-900 dark:text-white">Compartilhar preview</h2>
                        <p className="mt-1 text-xs text-gray-500">Controle o link, o acesso, PDF e Feed do Reino.</p>
                      </div>
                      <button onClick={() => setShowShareSettings(false)} className="flex h-10 w-10 items-center justify-center rounded-xl text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800" aria-label="Fechar">
                        <X size={18} />
                      </button>
                    </div>

                    <div className="space-y-5 p-4 md:p-6">
                      <section className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Link para compartilhar</label>
                        <div className="flex flex-col gap-2 sm:flex-row">
                          <input value={getPreviewShareUrl()} readOnly className="min-h-11 flex-1 rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm font-semibold dark:border-gray-700 dark:bg-gray-900" />
                          <button onClick={copyPreviewShareLink} className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 text-xs font-black uppercase tracking-widest text-gray-600 hover:border-bible-gold hover:text-bible-gold dark:border-gray-700">
                            {copiedSlug ? <Check size={15} /> : <Copy size={15} />} {copiedSlug ? 'Copiado' : 'Copiar'}
                          </button>
                        </div>
                      </section>

                      <section className="grid gap-3 md:grid-cols-2">
                        {[
                          { id: 'public', label: 'Publico', text: 'Qualquer pessoa com o link pode acessar.', icon: Globe },
                          { id: 'invite_only', label: 'Privado', text: 'Somente usuarios definidos acessam.', icon: Lock },
                          { id: 'church', label: 'Igreja', text: 'Membros da igreja do autor.', icon: User },
                          { id: 'group', label: 'Grupo', text: 'Um grupo especifico da igreja.', icon: User },
                        ].map(option => {
                          const Icon = option.icon;
                          const active = shareVisibility === option.id;
                          return (
                            <button
                              key={option.id}
                              type="button"
                              onClick={() => setShareVisibility(option.id as ContentPrivacyLevel)}
                              className={`min-h-[76px] rounded-xl border p-3 text-left transition-colors ${active ? 'border-bible-gold bg-bible-gold/10 text-bible-gold' : 'border-gray-200 text-gray-600 hover:border-gray-300 dark:border-gray-700 dark:text-gray-300'}`}
                            >
                              <span className="flex items-center gap-2 text-xs font-black uppercase tracking-widest"><Icon size={15} /> {option.label}</span>
                              <span className="mt-2 block text-xs font-medium text-gray-500">{option.text}</span>
                            </button>
                          );
                        })}
                      </section>

                      {(shareVisibility === 'invite_only' || shareVisibility === 'private') && (
                        <section className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Quem ira acessar</label>
                          <input value={shareUserIds} onChange={event => setShareUserIds(event.target.value)} placeholder="IDs de usuarios separados por virgula" className="min-h-11 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-bible-gold/30 dark:border-gray-700 dark:bg-gray-900" />
                        </section>
                      )}

                      {(shareVisibility === 'group' || shareVisibility === 'church_groups') && (
                        <section className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Grupos permitidos</label>
                          <input value={shareGroupIds} onChange={event => setShareGroupIds(event.target.value)} placeholder={userProfile?.churchData?.groupId || 'IDs de grupos separados por virgula'} className="min-h-11 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-bible-gold/30 dark:border-gray-700 dark:bg-gray-900" />
                        </section>
                      )}

                      <section className="flex items-center justify-between gap-4 rounded-xl border border-gray-200 p-3 dark:border-gray-700">
                        <div>
                          <p className="text-sm font-black text-gray-800 dark:text-white">Permitir download em PDF</p>
                          <p className="text-xs text-gray-500">Visitantes autorizados verao o botao de PDF.</p>
                        </div>
                        <button type="button" onClick={() => setShareAllowPdf(value => !value)} className={`relative h-7 w-12 rounded-full transition-colors ${shareAllowPdf ? 'bg-bible-gold' : 'bg-gray-300 dark:bg-gray-700'}`} aria-pressed={shareAllowPdf}>
                          <span className={`absolute left-0 top-1 h-5 w-5 rounded-full bg-white shadow transition-transform ${shareAllowPdf ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                      </section>

                      <section className="space-y-3 rounded-xl border border-bible-gold/20 bg-bible-gold/5 p-3">
                        <label className="text-[10px] font-black uppercase tracking-widest text-bible-gold">Feed do Reino</label>
                        <textarea value={shareFeedDescription} onChange={event => setShareFeedDescription(event.target.value)} placeholder="Escreva uma descrição breve para edificar quem verá no Feed do Reino..." className="min-h-20 w-full resize-none rounded-xl border border-bible-gold/20 bg-white px-3 py-2 text-sm font-medium outline-none focus:ring-2 focus:ring-bible-gold/30 dark:bg-gray-900" />
                        <button onClick={sharePreviewToFeed} disabled={isSharingToFeed || (content.meta.visibility || 'public') !== 'public'} className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-bible-leather px-4 text-xs font-black uppercase tracking-widest text-white disabled:cursor-not-allowed disabled:opacity-50 dark:bg-bible-gold dark:text-black">
                          {isSharingToFeed ? <Loader2 className="animate-spin" size={15} /> : <Send size={15} />}
                          Compartilhar no Feed do Reino
                        </button>
                        {(content.meta.visibility || 'public') !== 'public' && <p className="text-xs font-medium text-gray-500">Para evitar link inacessível, publique no feed apenas conteúdos públicos.</p>}
                      </section>
                    </div>

                    <div className="sticky bottom-0 flex flex-col-reverse gap-2 border-t border-gray-100 bg-white p-4 dark:border-gray-800 dark:bg-bible-darkPaper sm:flex-row sm:justify-end">
                      <button onClick={() => setShowShareSettings(false)} className="min-h-11 rounded-xl px-4 text-xs font-black uppercase tracking-widest text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800">Cancelar</button>
                      <button onClick={savePreviewShareSettings} disabled={isSaving} className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-bible-gold px-5 text-xs font-black uppercase tracking-widest text-white shadow-md disabled:opacity-50">
                        {isSaving ? <Loader2 className="animate-spin" size={15} /> : <Check size={15} />}
                        Salvar configurações
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        );

      case 'publish':
        return (
          <>
            <div className="min-h-screen bg-gradient-to-br from-bible-gold/20 to-purple-500/10 flex items-center justify-center p-4 print:hidden">
              <SEO title="Publicado!" />

              <div className="max-w-md w-full bg-white dark:bg-bible-darkPaper rounded-3xl shadow-2xl p-8 text-center">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Check size={40} className="text-green-600" />
                </div>

                <h1 className="text-2xl font-bold text-bible-ink dark:text-white mb-2">
                  {content.meta.title}
                </h1>
                <p className="text-gray-500 mb-8">
                  Seu conteúdo foi publicado com sucesso!
                </p>

                <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 mb-6">
                  <p className="text-xs text-gray-400 mb-2">Link para compartilhar</p>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={getPreviewShareUrl()}
                      readOnly
                      className="flex-1 px-3 py-2 bg-white dark:bg-black/30 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
                    />
                    <button
                      onClick={copyShareLink}
                      className="p-2 bg-bible-gold text-white rounded-lg hover:bg-bible-gold/90"
                    >
                      {copiedSlug ? <Check size={18} /> : <Copy size={18} />}
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <a
                    href={`/l/${content.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-bible-gold text-white rounded-xl font-bold hover:bg-bible-gold/90 transition-all active:scale-95"
                  >
                    <ExternalLink size={18} />
                    Ver Página Pública
                  </a>

                  <button
                    onClick={() => window.print()}
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-white dark:bg-bible-darkPaper text-gray-700 dark:text-gray-200 rounded-xl font-bold hover:bg-gray-50 dark:hover:bg-gray-800 transition-all border-2 border-gray-200 dark:border-gray-700 active:scale-95"
                  >
                    <FileDown size={18} />
                    Baixar PDF / Salvar
                  </button>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => {
                        setContent({
                          type: 'article',
                          status: 'draft',
                          slug: '',
                          blocks: [],
                          meta: { title: '', description: '', tags: [] },
                          stats: { views: 0, comments: 0, shares: 0 },
                          createdAt: new Date().toISOString(),
                          updatedAt: new Date().toISOString()
                        });
                        setCurrentStep('create');
                      }}
                      className="px-4 py-3 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-100 dark:hover:bg-gray-700 transition-all border border-gray-200 dark:border-gray-700 text-sm"
                    >
                      Novo Conteúdo
                    </button>
                    <button
                      onClick={() => navigate('/estudos')}
                      className="px-4 py-3 bg-white dark:bg-bible-darkPaper text-bible-gold rounded-xl font-bold hover:bg-bible-gold/5 transition-all border-2 border-bible-gold text-sm flex items-center justify-center gap-2"
                    >
                      <ArrowLeft size={16} />
                      Meus Estudos
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div className="hidden print:block w-full bg-white">
              <StudyDocumentRenderer
                blocks={content.blocks}
                studyId={content.id || content.slug}
                studyTitle={content.meta.title}
              />
            </div>

            {/* Ícone flutuante do Obreiro IA */}
            <div className="print:hidden">
            </div>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <>
      {renderStepContent()}
    </>
  );
};


// Fim do componente CreateLandingPage
export default CreateLandingPage;




