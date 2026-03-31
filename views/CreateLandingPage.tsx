'use client';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from '../utils/router';
import { useAuth } from '../contexts/AuthContext';
import { useHeader } from '../contexts/HeaderContext';
import { dbService } from '../services/supabase';
import { bibleService } from '../services/bibleService';
import { generateDailyDevotional, generateStructuredStudy, generateAIOnePage } from '../services/pastorAgent';
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
  Baseline, Maximize, Move, Palette, Sliders, Type as TextIcon
} from 'lucide-react';
import SEO from '../components/SEO';
import SocialNavigation from '../components/SocialNavigation';
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
  buildStudyGuideHtml
} from '../components/Builder';
import { ImageUploadButton } from '../components/Builder/ImageUploadButton';
import ObreiroIAChatbot from '../components/ObreiroIAChatbot';

// Tipos locais
type ContentType = 'article' | 'devotional' | 'series';
type ContentStatus = 'draft' | 'preview' | 'published';
type CreationMode = 'manual' | 'ai';

interface ContentData {
  id?: string;
  type: ContentType;
  status: ContentStatus;
  slug: string;
  blocks: Block[];
  meta: {
    title: string;
    description: string;
    coverImage?: string;
    visibility?: 'public' | 'invitation';
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

// Template de estrutura por tipo
const coreOnePageBlocks: BlockType[] = ['hero', 'biblical', 'study-content', 'authority', 'footer'];

const contentTemplates: Record<ContentType, BlockType[]> = {
  article: coreOnePageBlocks,
  devotional: coreOnePageBlocks,
  series: coreOnePageBlocks
};

// Template padrão para novo estudo bíblico
const orderedBlockTypes: BlockType[] = ['hero', 'biblical', 'study-content', 'video', 'slide', 'authority', 'footer'];

const typeLabels: Record<string, { singular: string; plural: string; description: string }> = {
  article: { singular: 'Artigo', plural: 'Artigos', description: 'Conteúdo reflexivo para blog' },
  devotional: { singular: 'Devocional', plural: 'Devocionais', description: 'Meditação diária com versículo' },
  series: { singular: 'Série', plural: 'Séries', description: 'Coleção de mensagens/pregações' }
};

// Todos os blocos são livres
const isCoreBlock = (_type: BlockType) => false;

const getOrderedBlocks = (blocks: Block[]) => blocks;


const CreateLandingPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, earnMana, showNotification } = useAuth();
  const { setTitle, setBreadcrumbs, resetHeader, setIsHeaderHidden } = useHeader();

  const [currentStep, setCurrentStep] = useState<'type' | 'create' | 'preview' | 'publish'>('create');
  const [contentType, setContentType] = useState<ContentType>('article');
  const [creationMode, setCreationMode] = useState<CreationMode>('manual');
  const [pendingAutoGenerate, setPendingAutoGenerate] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
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
  
  // UI State
  const [selectedBlock, setSelectedBlock] = useState<string | null>(null);
  const [showMobilePreview, setShowMobilePreview] = useState(false);
  const [copiedSlug, setCopiedSlug] = useState(false);
  // Proporção do canvas: 'mobile' | 'tablet' | 'desktop' | 'full'
  const [canvasWidth, setCanvasWidth] = useState<'mobile' | 'tablet' | 'desktop' | 'full'>('desktop');
  const [isMobilePropertiesOpen, setIsMobilePropertiesOpen] = useState(false);
  const [isMobileAddMenuOpen, setIsMobileAddMenuOpen] = useState(false);
  const [showSettingsOverlay, setShowSettingsOverlay] = useState(false);
  const [settingsTab, setSettingsTab] = useState<'config' | 'access'>('config');
  const [accessLogs, setAccessLogs] = useState<any[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);

  // Histórico (Undo/Redo)
  const [history, setHistory] = useState<Block[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isUndoing, setIsUndoing] = useState(false);

  // AI Auto-Builder (Fase 3)
  const [showAIBuilderModal, setShowAIBuilderModal] = useState(false);
  const [aiBuilderPrompt, setAIBuilderPrompt] = useState('');
  const [isAIBuilding, setIsAIBuilding] = useState(false);
  const aiBuilderTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Campos Bíblicos
  const [mainVerse, setMainVerse] = useState('');
  const [verseText, setVerseText] = useState('');
  const [verseRef, setVerseRef] = useState('');
  const [isSearchingVerse, setIsSearchingVerse] = useState(false);
  const [category, setCategory] = useState('Geral');
  const searchTimeoutRef = useRef<any>(null);

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

  // Header
  useEffect(() => {
    const titles: Record<string, string> = {
      type: 'Novo Conteúdo',
      create: content.meta.title || 'Editando',
      preview: 'Preview',
      publish: 'Publicar'
    };
    setIsHeaderHidden(true);
    setTitle(titles[currentStep]);
    setBreadcrumbs([
      { label: 'Estúdio Criativo', path: '/estudio-criativo' },
      { label: 'Conteúdo', path: '/criar-conteudo' },
      { label: titles[currentStep] }
    ]);
    return () => resetHeader();
  }, [currentStep, content.meta.title, setTitle, setBreadcrumbs, resetHeader]);

  // Inicialização
  useEffect(() => {
    const loadContent = async () => {
      const state = location.state as any;
      const urlParams = new URLSearchParams(location.search);
      const targetId = state?.contentId || urlParams.get('id');
      
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
        return;
      }
      
      // Carregar conteúdo existente
      setIsLoading(true);
      try {
        const data = targetId ? await dbService.getPublicStudyById(targetId) : null;
        if (data) {
          const parsedBlocks = typeof data.blocks === 'string' ? JSON.parse(data.blocks) : (data.blocks || []);
          const parsedMeta = typeof data.meta === 'string' ? JSON.parse(data.meta) : (data.meta || { title: '', description: '', tags: [], visibility: 'public' });
          if (!parsedMeta.visibility) parsedMeta.visibility = 'public';
          
          setContent({
            ...data,
            blocks: parsedBlocks,
            meta: parsedMeta
          });
          setContentType(data.type || 'article');
          setCurrentStep('create');
        } else if (state?.studyData) {
          // Fallback para estudo legado ou draft da tabela studies
          const legacyData = state.studyData;
          const parsedBlocks = typeof legacyData.blocks === 'string' ? JSON.parse(legacyData.blocks) : (legacyData.blocks || []);
          const parsedMeta = typeof legacyData.meta === 'string' ? JSON.parse(legacyData.meta) : (legacyData.meta || { visibility: 'public' });
          if (!parsedMeta.visibility) parsedMeta.visibility = 'public';
          
          let blocks = parsedBlocks;
          
          // Se não tem blocos estruturados mas tem conteudo (analysis), cria base blocks
          if (blocks.length === 0 && legacyData.analysis) {
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
          setCurrentStep('create');
        }
      } catch (e) {
        console.error('Erro ao carregar conteúdo:', e);
      }
      setIsLoading(false);
    };
    loadContent();
  }, [location.state, location.search]);

  // Busca automática de versículo
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
      setContent(prev => {
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
  }, [verseRef, verseText]);

  // --- UNDO / REDO ---
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
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo]);

  // Seletor de tipo
  const handleSelectType = (type: ContentType, mode: CreationMode) => {
    setContentType(type);
    setCreationMode(mode);
    setPendingAutoGenerate(mode === 'ai');
    const initialBlocks = buildBaseBlocks(contentTemplates[type]).map((block) => {
      if (block.type === 'authority') {
        return {
          ...block,
          data: {
            ...block.data,
            name: currentUser?.displayName || block.data.name,
            photo: currentUser?.photoURL || block.data.photo
          }
        };
      }

      if (block.type === 'hero') {
        return {
          ...block,
          data: {
            ...block.data,
            authorName: currentUser?.displayName || ''
          }
        };
      }

      return block;
    });
    setContent(prev => ({
      ...prev,
      type,
      blocks: initialBlocks,
      meta: { ...prev.meta, title: `Novo ${typeLabels[type].singular}` }
    }));
    setCurrentStep('create');
  };

  // Blocos
  const addBlock = (type: BlockType) => {
    const newBlock: Block = createBlock(type);
    setContent(prev => ({
      ...prev,
      blocks: getOrderedBlocks([...prev.blocks, newBlock])
    }));
    setSelectedBlock(newBlock.id);
  };

  const removeBlock = (id: string) => {
    const block = content.blocks.find(b => b.id === id);
    if (block && isCoreBlock(block.type)) {
      showNotification('Esse bloco faz parte da estrutura base da one page.', 'info');
      return;
    }
    setContent(prev => ({
      ...prev,
      blocks: prev.blocks.filter(b => b.id !== id)
    }));
    if (selectedBlock === id) setSelectedBlock(null);
  };

  const updateBlock = (id: string, data: Record<string, any>) => {
    setContent(prev => ({
      ...prev,
      blocks: prev.blocks.map(b => b.id === id ? { ...b, data: { ...b.data, ...data } } : b)
    }));
  };

  const moveBlock = (fromIndex: number, toIndex: number) => {
    const movingBlock = content.blocks[fromIndex];
    if (!movingBlock || isCoreBlock(movingBlock.type)) {
      return;
    }
    setContent(prev => {
      const newBlocks = [...prev.blocks];
      const [removed] = newBlocks.splice(fromIndex, 1);
      newBlocks.splice(toIndex, 0, removed);
      return { ...prev, blocks: getOrderedBlocks(newBlocks) };
    });
  };

  const duplicateBlock = (id: string, index: number) => {
    const block = content.blocks.find(b => b.id === id);
    if (!block || isCoreBlock(block.type)) {
      showNotification('Este bloco básico não pode ser duplicado.', 'info');
      return;
    }
    const newBlock = { ...block, id: `block-${Date.now()}` };
    setContent(prev => {
      const newBlocks = [...prev.blocks];
      newBlocks.splice(index + 1, 0, newBlock);
      return { ...prev, blocks: getOrderedBlocks(newBlocks) };
    });
    setSelectedBlock(newBlock.id);
  };

  // Meta
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
  // AI Auto-Builder: Gera TODA a estrutura da one-page via prompt livre
  const handleAIAutoBuilder = async () => {
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

      const result = await generateAIOnePage(enrichedPrompt, currentUser?.displayName || undefined);
      if (!result?.blocks) throw new Error('Estrutura inválida retornada pela IA');

      const { meta, slug, blocks: aiBlocks } = result;

      setContent(prev => {
        const newBlocks = [...prev.blocks];
        const aiBlocks = result.blocks;

        // Se a lista de blocos estiver vazia, cria a estrutura base
        if (newBlocks.length === 0) {
          const baseTypes: BlockType[] = ['hero', 'biblical', 'study-content', 'authority', 'footer'];
          baseTypes.forEach(type => {
            const blockId = `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
            let data = {};
            if (type === 'hero') data = aiBlocks.hero || {};
            if (type === 'biblical') data = aiBlocks.biblical || {};
            if (type === 'study-content') data = aiBlocks.studyContent || {};
            if (type === 'authority') data = aiBlocks.authority || {};
            if (type === 'footer') data = aiBlocks.footer || {};
            
            newBlocks.push({ id: blockId, type, data });
          });
        } else {
          // Caso contrário, atualiza os blocos existentes
          newBlocks.forEach((b, idx) => {
            if (b.type === 'hero' && aiBlocks.hero) newBlocks[idx] = { ...b, data: { ...b.data, ...aiBlocks.hero } };
            if (b.type === 'biblical' && aiBlocks.biblical) newBlocks[idx] = { ...b, data: { ...b.data, ...aiBlocks.biblical } };
            if (b.type === 'study-content' && aiBlocks.studyContent) newBlocks[idx] = { ...b, data: { ...b.data, ...aiBlocks.studyContent } };
            if (b.type === 'authority' && aiBlocks.authority) newBlocks[idx] = { ...b, data: { ...b.data, ...aiBlocks.authority } };
            if (b.type === 'footer' && aiBlocks.footer) newBlocks[idx] = { ...b, data: { ...b.data, ...aiBlocks.footer } };
          });
        }

        return {
          ...prev,
          meta: {
            ...prev.meta,
            title: result.meta?.title || prev.meta.title,
            description: result.meta?.description || prev.meta.description
          },
          slug: result.slug || prev.slug,
          blocks: newBlocks
        };
      });

      showNotification('✨ One-page criada com sucesso pela IA!', 'success');
      setShowAIBuilderModal(false);
      setAIBuilderPrompt('');
    } catch (e: any) {
      console.error('AI Auto-Builder:', e);
      showNotification(`Erro ao construir com IA: ${e.message}`, 'error');
    } finally {
      setIsAIBuilding(false);
    }
  };

  // Salvar alterações
  const handleSave = async (asStatus?: ContentStatus) => {
    if (!currentUser) return;

    if (!content.meta?.title?.trim()) {
      showNotification('Adicione um título antes de salvar', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const dataToSave = {
        ...content,
        status: asStatus || 'draft',
        updatedAt: new Date().toISOString()
      };
      
      if (content.id) {
        await dbService.updatePublicStudy(content.id, dataToSave);
      } else {
        const result = await dbService.createPublicStudy({
          ...dataToSave,
          authorId: currentUser.uid,
          authorName: currentUser.displayName,
          authorPhoto: currentUser.photoURL
        });
        setContent(prev => ({ ...prev, id: result.id }));
      }
      
      showNotification(asStatus === 'preview' ? 'Preview gerado!' : 'Salvo como rascunho', 'success');
      if (asStatus === 'preview') setCurrentStep('preview');
    } catch (e: any) {
      const errMsg = e?.message || e?.details || (typeof e === 'object' ? JSON.stringify(e) : String(e));
      console.error('Erro ao salvar:', errMsg, e);
      showNotification(`Erro ao salvar: ${errMsg}`, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Publicar
  const handlePublish = async () => {
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

  // Copiar link
  const copyShareLink = () => {
    const url = `${window.location.origin}/p/${content.slug}`;
    navigator.clipboard.writeText(url);
    setCopiedSlug(true);
    setTimeout(() => setCopiedSlug(false), 2000);
    showNotification('Link copiado!', 'success');
  };

  const selectedBlockData = content.blocks.find(b => b.id === selectedBlock);



  // RENDER: Editor
  if (currentStep === 'create') {
    return (
      <>
      <div className="h-screen flex flex-col bg-gray-100 dark:bg-bible-darkPaper overflow-hidden">
        <SEO title="Editor de Conteúdo" />
        
        {/* Header do Editor */}
        <header className="flex-shrink-0 bg-white dark:bg-bible-darkPaper border-b border-gray-200 dark:border-gray-800 px-4 py-3">
          <div className="flex items-center justify-between max-w-screen-2xl mx-auto">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
              >
                <ArrowLeft size={20} className="text-gray-600 dark:text-gray-300" />
              </button>
              <div>
                <h1 className="font-bold text-bible-ink dark:text-white">
                  {content.meta.title || `Novo ${typeLabels[content.type].singular}`}
                </h1>
                <p className="text-xs text-gray-500">
                  {typeLabels[content.type].singular} • Rascunho
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* AI Auto-Builder button (Phase 3) */}
              <button
                onClick={() => { setShowAIBuilderModal(true); setTimeout(() => aiBuilderTextareaRef.current?.focus(), 100); }}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-lg font-bold text-sm hover:from-violet-700 hover:to-purple-700 transition-all shadow-md shadow-purple-200 dark:shadow-purple-900/30"
              >
                <Sparkles size={16} />
                <span className="hidden sm:inline">IA Auto-Builder</span>
              </button>
              <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1 gap-0.5">
                <button
                  onClick={handleUndo}
                  disabled={historyIndex <= 0}
                  className="p-1.5 hover:bg-white dark:hover:bg-gray-700 rounded-md text-gray-500 hover:text-gray-800 dark:hover:text-gray-300 transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                  title="Desfazer (Ctrl+Z)"
                >
                  <Undo2 size={16} />
                </button>
                <button
                  onClick={handleRedo}
                  disabled={historyIndex >= history.length - 1}
                  className="p-1.5 hover:bg-white dark:hover:bg-gray-700 rounded-md text-gray-500 hover:text-gray-800 dark:hover:text-gray-300 transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                  title="Refazer (Ctrl+Shift+Z)"
                >
                  <Redo2 size={16} />
                </button>
              </div>

              <div className="hidden lg:flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1 gap-0.5">
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
                onClick={() => setShowSettingsOverlay(true)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-600 dark:text-gray-300 transition-colors"
                title="Configurações do Estudo"
              >
                <Settings size={20} />
              </button>

              <button
                onClick={() => handleSave('draft')}
                disabled={isSaving}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg font-medium text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                <Save size={16} />
                <span className="hidden sm:inline">Salvar</span>
              </button>

              <button
                onClick={() => handleSave('preview')}
                disabled={isSaving}
                className="flex items-center gap-2 px-4 py-2 bg-bible-gold text-white rounded-lg font-bold text-sm hover:bg-bible-gold/90 transition-colors disabled:opacity-50"
              >
                {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Eye size={16} />}
                Preview
              </button>
            </div>
          </div>
        </header>

        {/* Editor Body */}
        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar - Campos Bíblicos e Blocos */}
          <aside className="w-72 flex-shrink-0 bg-white dark:bg-bible-darkPaper border-r border-gray-200 dark:border-gray-800 overflow-y-auto hidden lg:block">
            <div className="p-4">
              
              {/* Referência Bíblica */}
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

              {/* Título e Categoria */}
              <div className="mb-6">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                  Informações
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">Título</label>
                    <input
                      type="text"
                      value={content.meta.title}
                      onChange={(e) => updateMeta('title', e.target.value)}
                      placeholder="Título do estudo"
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none focus:border-bible-gold"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">Categoria</label>
                    <select
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

              {/* Blocos Disponíveis */}
              <div>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                  Blocos
                </h3>
                <div className="space-y-2">
                  {(Object.keys(blockLabels) as BlockType[]).map(type => {
                    const isLockedBase = isCoreBlock(type);
                    const count = content.blocks.filter(b => b.type === type).length;
                    return (
                      <button
                        key={type}
                        onClick={() => addBlock(type)}
                        disabled={isLockedBase}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors text-left ${
                          isLockedBase
                            ? 'bg-gray-100 dark:bg-gray-800/50 opacity-50 cursor-not-allowed' 
                            : 'bg-gray-50 dark:bg-gray-900 hover:bg-bible-gold/10 active:scale-[0.98]'
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${blockLabels[type].color}`}>
                          {type === 'hero' && <LayoutTemplate size={20} />}
                          {type === 'authority' && <User size={20} />}
                          {type === 'biblical' && <BookOpen size={20} />}
                          {type === 'video' && <Video size={20} />}
                          {type === 'footer' && <Layers size={20} />}
                          {type === 'study-content' && <Sparkle size={20} />}
                          {type === 'slide' && <Play size={20} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-bible-ink dark:text-white">
                            {blockLabels[type].label}
                          </p>
                          <p className="text-[10px] text-gray-500">
                            {isLockedBase ? 'Bloco fixo' : blockLabels[type].description}
                          </p>
                        </div>
                        {count > 0 && !isLockedBase ? (
                          <span className="text-[10px] font-bold bg-bible-gold/10 text-bible-gold rounded-full px-2 py-0.5 flex-shrink-0">
                            ×{count}
                          </span>
                        ) : (
                          <Plus size={16} className="ml-auto text-gray-400 flex-shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Tags */}
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
            </div>
          </aside>

          {/* Canvas Principal */}
          <main className="flex-1 overflow-y-auto p-4 lg:p-8">
            <div className="max-w-3xl mx-auto mb-4">
              <div className="rounded-2xl border border-bible-gold/20 bg-white/80 dark:bg-black/20 px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                <strong className="text-bible-gold">
                  {creationMode === 'ai' ? 'Fluxo com IA' : 'Fluxo manual'}
                </strong>{' '}
                {creationMode === 'ai'
                  ? 'A IA monta a estrutura da one page com os blocos principais, e depois você edita texto, fonte, imagem e destaques.'
                  : 'A estrutura da one page já está pronta. Você só precisa preencher e editar o conteúdo dos blocos.'}
              </div>
            </div>
            <div className={`mx-auto bg-white dark:bg-bible-darkPaper rounded-2xl shadow-xl overflow-hidden transition-all duration-300 canvas-${canvasWidth} ${
              canvasWidth === 'mobile' ? 'max-w-[375px] border-4 border-bible-gold'
              : canvasWidth === 'tablet' ? 'max-w-[768px]'
              : canvasWidth === 'full' ? 'w-full'
              : 'max-w-7xl'
            }`}>
              <ContentBuilder
                blocks={content.blocks}
                selectedBlockId={selectedBlock}
                onSelectBlock={setSelectedBlock}
                onUpdateBlock={updateBlock}
                onMoveBlock={moveBlock}
                onDuplicateBlock={duplicateBlock}
                onRemoveBlock={removeBlock}
                onAddBlock={(type, index) => {
                  const newBlock = createBlock(type);
                  setContent(prev => {
                    const newBlocks = [...prev.blocks];
                    if (index !== undefined) {
                      newBlocks.splice(index + 1, 0, newBlock);
                    } else {
                      newBlocks.push(newBlock);
                    }
                    return { ...prev, blocks: newBlocks };
                  });
                  setSelectedBlock(newBlock.id);
                }}
                isEditing={currentStep === 'create'}
                canvasWidth={canvasWidth as any}
                authorName={currentUser?.displayName || undefined}
              />
            </div>
          </main>

          {/* Painel de Propriedades (Desktop) */}
          {selectedBlockData && (
            <aside className="w-80 flex-shrink-0 bg-white dark:bg-bible-darkPaper border-l border-gray-200 dark:border-gray-800 overflow-y-auto hidden xl:block">
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-bible-ink dark:text-white">
                    {blockLabels[selectedBlockData.type].label}
                  </h3>
                  <button
                    onClick={() => setSelectedBlock(null)}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                  >
                    <X size={16} />
                  </button>
                </div>
                
                {selectedBlockData && (
                  <BlockProperties
                    block={selectedBlockData}
                    onUpdate={(data) => updateBlock(selectedBlockData.id, data)}
                    isEditing={currentStep === 'create'}
                  />
                )}
              </div>
            </aside>
          )}
        </div>

        {/* Mobile Editing Tools */}
        {selectedBlockData && currentStep === 'create' && (
          <>
            <MobileToolbar
              blockType={selectedBlockData.type}
              onMoveUp={() => {
                const idx = content.blocks.findIndex(b => b.id === selectedBlockData.id);
                if (idx > 0) moveBlock(idx, idx - 1);
              }}
              onMoveDown={() => {
                const idx = content.blocks.findIndex(b => b.id === selectedBlockData.id);
                if (idx < content.blocks.length - 1) moveBlock(idx, idx + 1);
              }}
              onDuplicate={() => {
                const idx = content.blocks.findIndex(b => b.id === selectedBlockData.id);
                duplicateBlock(selectedBlockData.id, idx);
              }}
              onRemove={() => removeBlock(selectedBlockData.id)}
              onOpenProperties={() => setIsMobilePropertiesOpen(true)}
              onClose={() => setSelectedBlock(null)}
              canMoveUp={content.blocks.findIndex(b => b.id === selectedBlockData.id) > 0}
              canMoveDown={content.blocks.findIndex(b => b.id === selectedBlockData.id) < content.blocks.length - 1}
            />

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
          <div className="fixed bottom-6 right-6 z-[110] xl:hidden">
            <button
              onClick={() => setIsMobileAddMenuOpen(true)}
              className="w-16 h-16 bg-bible-gold text-white rounded-2xl shadow-2xl flex items-center justify-center active:scale-95 transition-transform hover:bg-bible-gold/90 border-4 border-white dark:border-gray-900 group"
              aria-label="Adicionar Bloco"
            >
              <div className="relative">
                <Plus size={32} className="group-hover:rotate-90 transition-transform duration-300" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full animate-ping" />
              </div>
            </button>
          </div>
        )}

        <MobileAddBlockMenu
          isOpen={isMobileAddMenuOpen}
          onClose={() => setIsMobileAddMenuOpen(false)}
          onSelect={(type) => {
            const newBlock = createBlock(type);
            setContent(prev => ({ ...prev, blocks: [...prev.blocks, newBlock] }));
            setSelectedBlock(newBlock.id);
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
                      <span className="text-xs text-gray-400">/p/</span>
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
                            onClick={() => updateMeta('visibility', 'invitation')}
                            className={`flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all ${content.meta.visibility === 'invitation' ? 'border-bible-gold bg-bible-gold/5 text-bible-gold' : 'border-gray-100 dark:border-gray-800 text-gray-500 bg-white dark:bg-gray-800/50 hover:bg-gray-50'}`}
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
                    disabled={isAIBuilding || !aiBuilderPrompt.trim()}
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
      <ObreiroIAChatbot />
      </>
    );
  }

  // RENDER: Preview
  if (currentStep === 'preview') {
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
            <button
              onClick={handlePublish}
              disabled={isSaving}
              className="flex items-center gap-2 px-6 py-2.5 bg-bible-gold text-white rounded-xl font-bold hover:bg-bible-gold/90 transition-colors disabled:opacity-50"
            >
              {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
              Publicar
            </button>
          </div>
        </header>

        {/* Preview Content */}
        <main className="py-8 min-h-screen bg-gray-100 dark:bg-black/90 flex justify-center">
          <div className={`w-full bg-white dark:bg-bible-darkPaper shadow-2xl transition-all duration-300 overflow-hidden canvas-${canvasWidth} ${
            canvasWidth === 'mobile' ? 'max-w-[375px] min-h-[667px] rounded-[3rem] border-[12px] border-gray-800'
            : canvasWidth === 'tablet' ? 'max-w-[768px] min-h-[1024px] rounded-2xl border-8 border-gray-800'
            : canvasWidth === 'full' ? 'w-full'
            : 'max-w-7xl rounded-2xl'
          }`}>
             {content.blocks.map(block => (
              <BlockRenderer key={block.id} block={block} isEditing={false} authorName={currentUser?.displayName} canvasWidth={canvasWidth} />
            ))}
          </div>
        </main>
      </div>
      <ObreiroIAChatbot />
      </>
    );
  }

  // RENDER: Publish Success
  return (
    <>
    <div className="min-h-screen bg-gradient-to-br from-bible-gold/20 to-purple-500/10 flex items-center justify-center p-4">
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
              value={`${typeof window !== 'undefined' ? window.location.origin : ''}/p/${content.slug}`}
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
    {/* Ícone flutuante do Obreiro IA */}
    <ObreiroIAChatbot />
    </>
  );
};


// Fim do componente CreateLandingPage
export default CreateLandingPage;




