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
  Play, Pause, ImagePlus, Wand, FolderOpen, Maximize2, Minimize2, Square,
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
  const { setTitle, setBreadcrumbs, resetHeader } = useHeader();

  const [currentStep, setCurrentStep] = useState<'type' | 'create' | 'preview' | 'publish'>('type');
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
    meta: { title: '', description: '', tags: [] },
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

  // Header
  useEffect(() => {
    const titles: Record<string, string> = {
      type: 'Novo Conteúdo',
      create: content.meta.title || 'Editando',
      preview: 'Preview',
      publish: 'Publicar'
    };
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
      
      // Se vier de "Meus Estudos" ou criar novo, inicializar com template de estudo
      if (!state?.contentId) {
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
        const data = await dbService.getPublicStudyById(state.contentId);
        if (data) {
          setContent({
            ...data,
            blocks: data.blocks || []
          });
          setContentType(data.type || 'article');
        }
      } catch (e) {
        console.error('Erro ao carregar conteúdo:', e);
      }
      setIsLoading(false);
    };
    loadContent();
  }, [location.state]);

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

  // Gerar com IA
  const handleGenerateWithAI = async () => {
    if (!currentUser) {
      showNotification('Faça login para usar a IA', 'error');
      return;
    }
    setIsGeneratingAI(true);
    try {
      let generatedHtml = '';
      let devotionalData: any = null;
      const requestedReference = (mainVerse || verseRef || '').trim();

      if (content.type === 'devotional') {
        devotionalData = await generateDailyDevotional(true);
        if (!devotionalData) {
          throw new Error('Devocional não retornou conteúdo');
        }
        generatedHtml = `
<h2>1. Introdução</h2>
<p>${devotionalData.content || ''}</p>
<h2>4. Oração</h2>
<p class="bible-prayer">${devotionalData.prayer || ''}</p>
<h2>5. Conclusão</h2>
<p>Permaneça firme na Palavra e viva este versículo ao longo do dia.</p>
`.trim();
      } else {
        const aiTheme = content.meta.title?.trim() || category || 'Estudo Bíblico';
        const aiAudience = category || 'Geral';
        generatedHtml = await generateStructuredStudy(aiTheme, requestedReference || 'João 3:16', aiAudience, 'deep');
      }

      if (!generatedHtml?.trim()) {
        throw new Error('IA não retornou conteúdo válido');
      }

      const parsed = extractStudyPayload(generatedHtml);
      const aiTitle = devotionalData?.title || parsed.title || content.meta.title || `Estudo em ${requestedReference || 'João 3:16'}`;
      const aiSubtitle = devotionalData?.verseReference || parsed.subtitle || `Reflexão em ${requestedReference || 'João 3:16'}`;
      const aiVerseRef = devotionalData?.verseReference || verseRef || requestedReference || parsed.subtitle || 'João 3:16';
      const aiVerseText = devotionalData?.verseText || verseText || parsed.quote || '';
      const studyGuideHtml = buildWrittenContentHtml({
        introduction: parsed.introduction || undefined,
        context: parsed.context || undefined,
        application: parsed.application || undefined,
        prayer: parsed.prayer || undefined,
        conclusion: parsed.conclusion || undefined
      });
      const slug = `${aiTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'content'}-${Date.now().toString(36)}`;

      if (aiVerseRef) setVerseRef(aiVerseRef);
      if (aiVerseText) setVerseText(aiVerseText);

      setContent(prev => ({
        ...prev,
        meta: { ...prev.meta, title: aiTitle, description: aiSubtitle },
        slug,
        blocks: prev.blocks.map((b) => {
          if (b.type === 'hero') {
            return {
              ...b,
              data: {
                ...b.data,
                title: aiTitle,
                subtitle: aiSubtitle,
                authorName: currentUser.displayName || b.data.authorName || ''
              }
            };
          }
          if (b.type === 'biblical') {
            return {
              ...b,
              data: {
                ...b.data,
                reference: aiVerseRef,
                verse: aiVerseRef,
                text: aiVerseText || b.data.text
              }
            };
          }
          if (b.type === 'study-content') {
            return {
              ...b,
              data: {
                ...b.data,
                content: studyGuideHtml,
                introduction: parsed.introduction || b.data.introduction || '',
                context: parsed.context || b.data.context || '',
                application: parsed.application || b.data.application || '',
                prayer: parsed.prayer || b.data.prayer || '',
                conclusion: parsed.conclusion || b.data.conclusion || ''
              }
            };
          }
          if (b.type === 'authority' && currentUser) {
            return {
              ...b,
              data: {
                ...b.data,
                name: currentUser.displayName || 'Autor',
                photo: currentUser.photoURL || '',
                bio: b.data.bio || 'Conteúdo gerado com auxílio da IA pastoral e pronto para edição.'
              }
            };
          }
          if (b.type === 'footer') {
            return {
              ...b,
              data: {
                ...b.data,
                tagline: content.type === 'devotional'
                  ? 'Uma leitura devocional pronta para tocar e orientar'
                  : 'Uma one page pronta para editar, publicar e compartilhar'
              }
            };
          }
          return b;
        })
      }));
      
      showNotification('Conteúdo gerado pela IA e aplicado aos blocos!', 'success');
    } catch (e) {
      console.error('Erro IA:', e);
      showNotification('Erro ao gerar com IA no Pastor Agent', 'error');
    } finally {
      setIsGeneratingAI(false);
    }
  };

  useEffect(() => {
    if (currentStep !== 'create' || !pendingAutoGenerate || isGeneratingAI) {
      return;
    }

    setPendingAutoGenerate(false);
    handleGenerateWithAI();
  }, [currentStep, pendingAutoGenerate, isGeneratingAI]);

  // Salvar
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
    if (!content.slug) {
      showNotification('Gere um slug primeiro', 'error');
      return;
    }
    setIsSaving(true);
    try {
      await dbService.publishPublicStudy(content.id || '', content.slug);
      setContent(prev => ({ ...prev, status: 'published' }));
      await earnMana('create_study');
      showNotification('Publicado com sucesso!', 'success');
      setCurrentStep('publish');
    } catch (e) {
      console.error('Erro ao publicar:', e);
      showNotification('Erro ao publicar', 'error');
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

  // RENDER: Seletor de tipo
  if (currentStep === 'type') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-bible-darkPaper">
        <SEO title="Criar Conteúdo" />
        <SocialNavigation activeTab="explore" />
        
        <div className="max-w-4xl mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold text-bible-ink dark:text-white mb-2">
            Criar Novo Conteúdo
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mb-8">
            Escolha o tipo de conteúdo que deseja criar
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {(Object.keys(typeLabels) as ContentType[]).map(type => (
              <div
                key={type}
                className="group p-8 bg-white dark:bg-bible-darkPaper rounded-2xl border-2 border-gray-100 dark:border-gray-800 hover:border-bible-gold transition-all text-left"
              >
                <div className="w-16 h-16 bg-bible-gold/10 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  {type === 'article' && <Type size={32} className="text-bible-gold" />}
                  {type === 'devotional' && <Sun size={32} className="text-bible-gold" />}
                  {type === 'series' && <Layers size={32} className="text-bible-gold" />}
                </div>
                <h3 className="text-xl font-bold text-bible-ink dark:text-white mb-2">
                  {typeLabels[type].singular}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {typeLabels[type].description}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {contentTemplates[type].map(t => (
                    <span key={t} className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-[10px] font-medium text-gray-600 dark:text-gray-300">
                      {blockLabels[t].label}
                    </span>
                  ))}
                </div>
                <div className="mt-6 grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleSelectType(type, 'manual')}
                    className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-bible-ink dark:text-white hover:border-bible-gold hover:bg-bible-gold/5 transition-colors"
                  >
                    Manual
                  </button>
                  <button
                    onClick={() => handleSelectType(type, 'ai')}
                    className="px-4 py-2.5 rounded-xl bg-bible-gold text-white text-sm font-bold hover:bg-bible-gold/90 transition-colors"
                  >
                    Gerar com IA
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // RENDER: Editor
  if (currentStep === 'create') {
    return (
      <div className="h-screen flex flex-col bg-gray-100 dark:bg-bible-darkPaper overflow-hidden">
        <SEO title="Editor de Conteúdo" />
        
        {/* Header do Editor */}
        <header className="flex-shrink-0 bg-white dark:bg-bible-darkPaper border-b border-gray-200 dark:border-gray-800 px-4 py-3">
          <div className="flex items-center justify-between max-w-screen-2xl mx-auto">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setCurrentStep('type')}
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
              <button
                onClick={handleGenerateWithAI}
                disabled={isGeneratingAI}
                className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg font-medium text-sm hover:bg-purple-600 transition-colors disabled:opacity-50"
              >
                {isGeneratingAI ? <Loader2 size={16} className="animate-spin" /> : <Wand2 size={16} />}
                <span className="hidden sm:inline">Gerar com IA</span>
              </button>
              
              {/* Canvas Width Controls */}
              <div className="hidden sm:flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1 gap-0.5">
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

        {/* ======== AI AUTO-BUILDER MODAL (Fase 3) ======== */}
        {showAIBuilderModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowAIBuilderModal(false)}>
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

            {/* Modal */}
            <div
              className="relative w-full max-w-2xl bg-white dark:bg-gray-900 rounded-3xl shadow-2xl overflow-hidden"
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

                {/* Referência Bíblica detectada */}
                {verseRef && (
                  <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl">
                    <div className="w-8 h-8 bg-bible-gold/20 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                      <BookOpen size={16} className="text-bible-gold" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-bible-gold uppercase tracking-wider mb-0.5">Referência bíblica detectada</p>
                      <p className="text-sm font-bold text-gray-800 dark:text-gray-100">{verseRef}</p>
                      {verseText && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 italic mt-1 line-clamp-2">"{verseText}"</p>
                      )}
                      <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-1.5">A IA vai usar esta referência como base principal da one-page.</p>
                    </div>
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
    );
  }

  // RENDER: Preview
  if (currentStep === 'preview') {
    return (
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
    );
  }

  // RENDER: Publish Success
  return (
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
            className="flex items-center justify-center gap-2 px-6 py-3 bg-bible-gold text-white rounded-xl font-bold hover:bg-bible-gold/90 transition-colors"
          >
            <ExternalLink size={18} />
            Ver Página Pública
          </a>
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
              setCurrentStep('type');
            }}
            className="px-6 py-3 border border-gray-300 dark:border-gray-700 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Criar Novo Conteúdo
          </button>
        </div>
      </div>
    </div>
  );
};


// Fim do componente CreateLandingPage
export default CreateLandingPage;




