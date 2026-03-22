'use client';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from '../utils/router';
import { useAuth } from '../contexts/AuthContext';
import { useHeader } from '../contexts/HeaderContext';
import { dbService } from '../services/supabase';
import { bibleService } from '../services/bibleService';
import { generateDailyDevotional, generateStructuredStudy } from '../services/pastorAgent';
import { 
  Save, ArrowLeft, Loader2, Sparkles, Eye, Send, Plus, Trash2, 
  GripVertical, Settings, Smartphone, Monitor, X, ChevronRight, 
  ChevronLeft, Image as ImageIcon, Type, User, Video, BookOpen,
  MessageSquare, Share2, Clock, Globe, Lock, Check, Copy,
  Sun, MessageCircle, LayoutTemplate, Wand2, Layers, Bold, Italic,
  AlignLeft, AlignCenter, AlignRight, Link, Mail, ExternalLink, Search, Sparkle,
  Play, Pause, ImagePlus, Wand, FolderOpen, Maximize2, Minimize2, Square
} from 'lucide-react';
import SEO from '../components/SEO';
import SocialNavigation from '../components/SocialNavigation';
import RichTextEditor from '../components/RichTextEditor';
import { BIBLE_BOOKS_LIST } from '../constants';

type ContentType = 'article' | 'devotional' | 'series';
type ContentStatus = 'draft' | 'preview' | 'published';
type BlockType = 'hero' | 'authority' | 'biblical' | 'video' | 'footer' | 'study-content' | 'slide';
type CreationMode = 'manual' | 'ai';

interface Block {
  id: string;
  type: BlockType;
  data: Record<string, any>;
}

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

const typeLabels: Record<ContentType, { singular: string; plural: string; description: string }> = {
  article: { singular: 'Artigo', plural: 'Artigos', description: 'Conteúdo reflexivo para blog' },
  devotional: { singular: 'Devocional', plural: 'Devocionais', description: 'Meditação diária com versículo' },
  series: { singular: 'Série', plural: 'Séries', description: 'Coleção de mensagens/pregações' }
};

const blockLabels: Record<BlockType, { label: string; description: string; color: string }> = {
  hero: { label: 'Hero Banner', description: 'Título, subtítulo e CTA', color: 'bg-blue-100 text-blue-600' },
  authority: { label: 'Autor/Bio', description: 'Bloco de autor (legacy)', color: 'bg-purple-100 text-purple-600' },
  biblical: { label: 'Bloco Bíblico', description: 'Versículo em destaque', color: 'bg-amber-100 text-amber-600' },
  video: { label: 'Vídeo', description: 'Embed YouTube/Vimeo', color: 'bg-red-100 text-red-600' },
  footer: { label: 'Footer', description: 'Rodapé com links', color: 'bg-gray-100 text-gray-600' },
  'study-content': { label: 'Guia de Estudo', description: 'Orientações (não visível)', color: 'bg-emerald-100 text-emerald-600' },
  slide: { label: 'Slides', description: 'Carousel de slides', color: 'bg-indigo-100 text-indigo-600' }
};

const defaultBlockData: Record<BlockType, Record<string, any>> = {
  hero: {
    title: 'Título do Conteúdo',
    subtitle: 'Um subtítulo inspirador',
    ctaText: '',
    ctaLink: '',
    backgroundImage: '',
    backgroundColor: '#1e3a5f',
    textColor: '#ffffff',
    alignment: 'center',
    width: 'full', // full | contained
    showBackground: true,
    showCta: false,
    showSubtitle: true,
    authorName: ''
  },
  authority: {
    name: 'Nome do Autor',
    photo: '',
    bio: 'Uma breve descrição sobre o autor e sua autoridade no tema.',
    badges: [],
    socials: { instagram: '', youtube: '', website: '' }
  },
  biblical: {
    verse: 'João 3:16',
    text: 'Porque Deus amou o mundo de tal maneira que deu o seu Filho unigênito, para que todo aquele que nele crê não pereça, mas tenha a vida eterna.',
    reference: 'João 3:16',
    style: 'elegant',
    showImage: true,
    imageStyle: 'realistic'
  },
  video: {
    url: '',
    title: 'Vídeo Introdutório',
    description: '',
    thumbnail: ''
  },
  footer: {
    logo: '',
    tagline: 'Transformando vidas através da Palavra',
    links: [],
    copyright: `© ${new Date().getFullYear()} Todos os direitos reservados`,
    showSocial: true
  },
  'study-content': {
    content: '',
    introduction: '',
    context: '',
    application: '',
    prayer: '',
    conclusion: ''
  },
  slide: {
    slides: [
      {
        id: `slide-1-${Date.now()}`,
        backgroundImage: '',
        content: '<h2>Título do Slide</h2><p>Adicione seu conteúdo aqui...</p>',
        overlayOpacity: 0.3
      }
    ],
    height: 'medium',
    autoplay: false,
    autoplayInterval: 5000,
    showNavigation: true
  }
};

const isCoreBlock = (type: BlockType) => coreOnePageBlocks.includes(type);

const getOrderedBlocks = (blocks: Block[]) =>
  [...blocks].sort((a, b) => orderedBlockTypes.indexOf(a.type) - orderedBlockTypes.indexOf(b.type));

const buildStudyGuideHtml = (sections?: Partial<Record<'introduction' | 'context' | 'application' | 'prayer' | 'conclusion', string>>) => `
<p><span style="color:#C9A227;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;">Guia de estudo</span></p>
<h2><strong>1. Introdução</strong></h2>
${sections?.introduction || '<p><strong>Comece com uma abertura clara e envolvente</strong>, apresentando o tema central e por que essa mensagem importa para quem vai ler.</p>'}
<h2><strong>2. Contexto bíblico</strong></h2>
${sections?.context || '<p>Explique o pano de fundo do texto, destacando <strong>contexto histórico, espiritual e pastoral</strong> para dar profundidade à leitura.</p>'}
<h2><strong>3. Aplicação prática</strong></h2>
${sections?.application || '<p>Mostre como essa verdade pode ser vivida hoje com passos objetivos, linguagem simples e trechos de destaque para facilitar a leitura.</p>'}
<h2><strong>4. Oração</strong></h2>
${sections?.prayer || '<p><span style="color:#1E7A5F;font-weight:700;">Ore</span> conectando a mensagem à vida diária, com tom pastoral e sensível.</p>'}
<h2><strong>5. Conclusão</strong></h2>
${sections?.conclusion || '<p>Feche com uma síntese memorável, reforçando o chamado à ação e o ponto principal do estudo.</p>'}
`.trim();

const buildWrittenContentHtml = (sections?: Partial<Record<'introduction' | 'context' | 'application' | 'prayer' | 'conclusion', string>>) => `
<p><span style="color:#C9A227;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;">Conteudo escrito</span></p>
<h2><strong>1. Introducao</strong></h2>
${sections?.introduction || '<p><strong>1.1 - Texto introducao</strong></p><p>Apresente o tema, situe o leitor e explique por que esta mensagem importa logo na abertura.</p>'}
<h2><strong>2. Contexto biblico</strong></h2>
${sections?.context || '<p><strong>2.1 - Texto contexto biblico</strong></p><p>Explique o pano de fundo do texto e destaque o contexto historico, espiritual e pastoral.</p>'}
<h2><strong>3. Aplicacao pratica</strong></h2>
${sections?.application || '<p><strong>3.1 - Texto aplicacao pratica</strong></p><p>Mostre como a mensagem pode ser vivida no dia a dia com orientacoes objetivas.</p>'}
<h2><strong>4. Oracao</strong></h2>
${sections?.prayer || '<p><strong>4.1 - Texto oracao</strong></p><p>Escreva uma oracao conectada ao tema, com tom pastoral e direto.</p>'}
<h2><strong>5. Conclusao</strong></h2>
${sections?.conclusion || '<p><strong>5.1 - Texto conclusao</strong></p><p>Feche com uma sintese clara, reforcando a principal aplicacao do conteudo.</p>'}
`.trim();

const createBlock = (type: BlockType): Block => ({
  id: `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  type,
  data: {
    ...defaultBlockData[type],
    ...(type === 'study-content' ? { content: buildWrittenContentHtml() } : {})
  }
});

const buildBaseBlocks = (type: ContentType) =>
  getOrderedBlocks(contentTemplates[type].map((blockType) => createBlock(blockType)));

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
        const blocks = buildBaseBlocks('article');
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
    const blocks = buildBaseBlocks(type).map((block) => {
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
      blocks,
      meta: { ...prev.meta, title: `Novo ${typeLabels[type].singular}` }
    }));
    setCurrentStep('create');
  };

  // Blocos
  const addBlock = (type: BlockType) => {
    const exists = content.blocks.some(b => b.type === type);
    if (exists) {
      showNotification(`Você já tem um bloco ${blockLabels[type].label}`, 'warning');
      return;
    }
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
                bio: b.data.bio || 'ConteÃºdo gerado com auxÃ­lio da IA pastoral e pronto para ediÃ§Ã£o.'
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
    } catch (e) {
      console.error('Erro ao salvar:', e);
      showNotification('Erro ao salvar', 'error');
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
              <button
                onClick={handleGenerateWithAI}
                disabled={isGeneratingAI}
                className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg font-medium text-sm hover:bg-purple-600 transition-colors disabled:opacity-50"
              >
                {isGeneratingAI ? <Loader2 size={16} className="animate-spin" /> : <Wand2 size={16} />}
                <span className="hidden sm:inline">{creationMode === 'ai' ? 'Gerar One Page com IA' : 'Gerar com IA'}</span>
              </button>
              
              <button
                onClick={() => setShowMobilePreview(!showMobilePreview)}
                className={`p-2 rounded-lg transition-colors ${showMobilePreview ? 'bg-bible-gold text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300'}`}
              >
                <Smartphone size={20} />
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
                    const exists = content.blocks.some(b => b.type === type);
                    const isLockedBase = isCoreBlock(type);
                    return (
                      <button
                        key={type}
                        onClick={() => addBlock(type)}
                        disabled={exists || isLockedBase}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors text-left ${
                          exists || isLockedBase
                            ? 'bg-gray-100 dark:bg-gray-800/50 opacity-50 cursor-not-allowed' 
                            : 'bg-gray-50 dark:bg-gray-900 hover:bg-bible-gold/10'
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
                        <div>
                          <p className="font-medium text-sm text-bible-ink dark:text-white">
                            {blockLabels[type].label}
                          </p>
                          <p className="text-[10px] text-gray-500">
                            {exists ? 'Já adicionado' : blockLabels[type].description}
                          </p>
                        </div>
                        {exists ? (
                          <Check size={16} className="ml-auto text-green-500" />
                        ) : (
                          <Plus size={16} className="ml-auto text-gray-400" />
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
                  ? 'A IA monta a estrutura da one page com os blocos principais, e depois vocÃª edita texto, fonte, imagem e destaques.'
                  : 'A estrutura da one page jÃ¡ estÃ¡ pronta. VocÃª sÃ³ precisa preencher e editar o conteÃºdo dos blocos.'}
              </div>
            </div>
            <div className={`mx-auto bg-white dark:bg-bible-darkPaper rounded-2xl shadow-xl overflow-hidden transition-all duration-300 ${
              showMobilePreview ? 'max-w-[375px] border-4 border-bible-gold' : 'max-w-3xl'
            }`}>
              {content.blocks.length === 0 ? (
                <div className="p-16 text-center">
                  <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Plus size={32} className="text-gray-400" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-600 dark:text-gray-300 mb-2">
                    Adicione blocos para começar
                  </h3>
                  <p className="text-sm text-gray-400 mb-6">
                    Use a paleta à esquerda ou clique no botão + para adicionar seções
                  </p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {(Object.keys(blockLabels) as BlockType[]).map(type => {
                      const exists = content.blocks.some(b => b.type === type);
                      return (
                        <button
                          key={type}
                          onClick={() => addBlock(type)}
                          disabled={exists}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            exists
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              : 'bg-bible-gold/10 text-bible-gold hover:bg-bible-gold/20'
                          }`}
                        >
                          + {blockLabels[type].label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="relative">
                  {content.blocks.map((block, index) => (
                    <div 
                      key={block.id}
                      className={`relative group cursor-pointer transition-all ${
                        selectedBlock === block.id 
                          ? 'ring-2 ring-bible-gold' 
                          : 'hover:ring-2 hover:ring-bible-gold/30'
                      }`}
                      onClick={() => setSelectedBlock(block.id)}
                    >
                      {/* Block Controls */}
                      <div className={`absolute top-2 right-2 flex gap-1 z-10 transition-opacity ${
                        selectedBlock === block.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                      }`}>
                        <button
                          onClick={(e) => { e.stopPropagation(); moveBlock(index, Math.max(0, index - 1)); }}
                          disabled={index === 0 || isCoreBlock(block.type)}
                          className="p-1.5 bg-white dark:bg-gray-800 rounded-lg shadow hover:bg-gray-50 disabled:opacity-30"
                        >
                          <ChevronLeft size={14} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); moveBlock(index, Math.min(content.blocks.length - 1, index + 1)); }}
                          disabled={index === content.blocks.length - 1 || isCoreBlock(block.type)}
                          className="p-1.5 bg-white dark:bg-gray-800 rounded-lg shadow hover:bg-gray-50 disabled:opacity-30"
                        >
                          <ChevronRight size={14} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); removeBlock(block.id); }}
                          disabled={isCoreBlock(block.type)}
                          className="p-1.5 bg-red-100 text-red-600 rounded-lg shadow hover:bg-red-200 disabled:opacity-30"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>

                      {/* Block Content */}
                      <BlockRenderer 
                        block={block} 
                        onUpdate={(data) => updateBlock(block.id, data)}
                        isEditing={selectedBlock === block.id}
                        authorName={currentUser?.displayName}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </main>

          {/* Painel de Propriedades */}
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
                
                <BlockProperties
                  block={selectedBlockData}
                  onUpdate={(data) => updateBlock(selectedBlockData.id, data)}
                />
              </div>
            </aside>
          )}
        </div>
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
        <main className="py-8">
          <div className="max-w-2xl mx-auto bg-white dark:bg-bible-darkPaper rounded-2xl shadow-xl overflow-hidden">
            {content.blocks.map(block => (
              <BlockRenderer key={block.id} block={block} isEditing={false} authorName={currentUser?.displayName} />
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

// Bloco: Hero
const HeroBlock: React.FC<{ data: any; onUpdate?: (data: any) => void; isEditing: boolean; authorName?: string }> = ({ data, onUpdate, isEditing, authorName }) => {
  const showBg = data.showBackground !== false && data.backgroundImage;
  const bgStyle = showBg 
    ? { 
        background: `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url(${data.backgroundImage}) center/cover no-repeat`,
        backgroundColor: data.backgroundColor || '#1e3a5f'
      }
    : { backgroundColor: data.backgroundColor || '#1e3a5f' };
  
  const containerClass = data.width === 'contained' 
    ? 'max-w-4xl mx-auto px-4 sm:px-8' 
    : 'w-full';

  return (
    <div 
      className="relative min-h-[300px] md:min-h-[400px] flex items-center justify-center py-16 px-4"
      style={bgStyle}
    >
      <div className={`${containerClass} relative z-10 ${data.alignment === 'left' ? 'text-left' : data.alignment === 'right' ? 'text-right' : 'text-center'}`}>
        <div className={`inline-flex flex-col ${data.alignment === 'left' ? 'items-start' : data.alignment === 'right' ? 'items-end' : 'items-center'}`}>
          {isEditing && onUpdate && (
            <div className="absolute -top-2 -right-2 flex gap-1">
              <button
                onClick={() => onUpdate({ ...data, showBackground: !data.showBackground })}
                className={`p-2 rounded-lg text-xs font-medium transition-colors ${
                  data.showBackground ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'
                }`}
                title={data.showBackground ? 'Fundo ativado' : 'Fundo desativado'}
              >
                {data.showBackground ? '✓' : '○'}
              </button>
            </div>
          )}
          
          {/* Título */}
          <h1 
            className="text-3xl md:text-4xl lg:text-5xl font-bold mb-3"
            style={{ color: data.textColor || '#ffffff' }}
            contentEditable={isEditing}
            onBlur={(e) => onUpdate?.({ ...data, title: e.currentTarget.textContent })}
          >
            {data.title || 'Título do Estudo'}
          </h1>
          
          {/* Subtítulo */}
          {(data.showSubtitle !== false) && data.subtitle && (
            <p 
              className="text-lg md:text-xl mb-6 max-w-2xl"
              style={{ color: data.textColor ? `${data.textColor}cc` : 'rgba(255,255,255,0.9)' }}
              contentEditable={isEditing}
              onBlur={(e) => onUpdate?.({ ...data, subtitle: e.currentTarget.textContent })}
            >
              {data.subtitle}
            </p>
          )}
          
          {/* CTA */}
          {(data.showCta !== false) && data.ctaText && (
            <button 
              className="px-8 py-3 bg-bible-gold text-white rounded-xl font-bold text-lg hover:bg-bible-gold/90 transition-colors shadow-lg"
              onClick={() => data.ctaLink && window.open(data.ctaLink, '_blank')}
            >
              {data.ctaText}
            </button>
          )}
          
          {/* Nome do Autor */}
          {(data.showAuthor !== false) && (data.authorName || authorName) && (
            <div 
              className="mt-6 text-sm font-medium"
              style={{ color: data.textColor ? `${data.textColor}99` : 'rgba(255,255,255,0.7)' }}
            >
              Por {data.authorName || authorName}
            </div>
          )}
        </div>
      </div>
      
      {/* Overlay para edição */}
      {isEditing && onUpdate && (
        <div className="absolute inset-0 bg-black/10 pointer-events-none" />
      )}
    </div>
  );
};

// Bloco: Authority
const AuthorityBlock: React.FC<{ data: any; isEditing: boolean }> = ({ data }) => (
  <div className="p-8 bg-gray-50 dark:bg-gray-900">
    <div className="max-w-xl mx-auto text-center">
      <div className="w-24 h-24 rounded-full bg-gray-200 mx-auto mb-4 overflow-hidden">
        {data.photo ? (
          <img src={data.photo} alt={data.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <User size={40} />
          </div>
        )}
      </div>
      <h3 className="text-xl font-bold text-bible-ink dark:text-white mb-2">{data.name}</h3>
      <p className="text-gray-600 dark:text-gray-400">{data.bio}</p>
    </div>
  </div>
);

// Bloco: Bíblico
const BiblicalBlock: React.FC<{ data: any; isEditing: boolean }> = ({ data }) => (
  <div className="p-8 bg-amber-50 dark:bg-amber-900/20">
    <div className="max-w-2xl mx-auto text-center">
      {data.showImage && (
        <div className="w-full h-64 rounded-2xl overflow-hidden mb-6 bg-gray-200">
          <img 
            src={data.imageUrl || 'https://images.unsplash.com/photo-1507692049790-de58290a4334?w=800'} 
            alt="Biblical artwork"
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <blockquote className="text-2xl md:text-3xl font-serif italic text-bible-ink dark:text-white mb-4 leading-relaxed">
        "{data.text}"
      </blockquote>
      <cite className="text-bible-gold font-bold text-lg">— {data.reference}</cite>
    </div>
  </div>
);

// Bloco: Vídeo
const VideoBlock: React.FC<{ data: any; isEditing: boolean }> = ({ data }) => (
  <div className="p-8">
    <div className="max-w-3xl mx-auto">
      {data.url ? (
        <div className="aspect-video bg-gray-900 rounded-2xl overflow-hidden">
          <iframe
            src={data.url.replace('watch?v=', 'embed/')}
            title={data.title}
            className="w-full h-full"
            allowFullScreen
          />
        </div>
      ) : (
        <div className="aspect-video bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center">
          <div className="text-center text-gray-400">
            <Video size={48} className="mx-auto mb-2" />
            <p>Adicione uma URL de vídeo</p>
          </div>
        </div>
      )}
      {data.title && (
        <h3 className="text-xl font-bold text-bible-ink dark:text-white mt-4 text-center">{data.title}</h3>
      )}
    </div>
  </div>
);

// Bloco: Footer
const FooterBlock: React.FC<{ data: any; isEditing: boolean }> = ({ data }) => (
  <div className="p-8 bg-bible-ink text-white">
    <div className="max-w-2xl mx-auto text-center">
      {data.tagline && (
        <p className="text-bible-gold font-medium mb-4">{data.tagline}</p>
      )}
      {data.showSocial && (
        <div className="flex justify-center gap-4 mb-6">
          <a href="#" className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors">
            <MessageCircle size={20} />
          </a>
          <a href="#" className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors">
            <Share2 size={20} />
          </a>
        </div>
      )}
      <p className="text-sm text-white/60">{data.copyright}</p>
    </div>
  </div>
);

// Bloco: Conteúdo do Estudo
const StudyContentBlock: React.FC<{ data: any; onUpdate?: (data: any) => void; isEditing: boolean; authorName?: string }> = ({ data, onUpdate, isEditing, authorName }) => {
  const [editorContent, setEditorContent] = useState(data.content || '');

  const studyTemplate = buildWrittenContentHtml();/*
<h2>1. Introdução</h2>
<p>Apresente o tema, seu contexto e o objetivo da mensagem. Por que este versículo é relevante para o público-alvo?</p>

<h2>2. Contextualização</h2>
<p>Forneça o contexto histórico, cultural e teológico do texto bíblico.</p>

<h2>3. Aplicação Prática</h2>
<p>Como podemos aplicar esta verdade em nossa vida hoje? Liste pontos práticos.</p>

<h2>4. Oração</h2>
<p class="bible-prayer">Uma oração relacionada ao tema abordado.</p>

<h2>5. Conclusão</h2>
<p>Resumo e encerramento. Qual é o chamado à decisão?</p>
*/;

  useEffect(() => {
    if (!data.content && isEditing) {
      setEditorContent(studyTemplate);
      onUpdate?.({ ...data, content: studyTemplate });
    } else if (data.content) {
      setEditorContent(data.content);
    }
  }, []);

  const handleEditorChange = (html: string) => {
    setEditorContent(html);
    onUpdate?.({ ...data, content: html });
  };

  return (
    <div className="bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="p-6 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl">
              <Sparkle size={20} className="text-emerald-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-bible-ink dark:text-white">ConteÃºdo Escrito</h3>
              <p className="text-xs text-gray-500">A IA usa esse modelo como ponto de partida, mas voce pode alterar livremente depois</p>
            </div>
          </div>
          <div className="text-xs text-gray-400">
            Por {authorName || 'Autor'}
          </div>
        </div>
      </div>

      {/* Editor */}
      {isEditing ? (
        <div className="h-[600px]">
          <RichTextEditor
            content={editorContent}
            onChange={handleEditorChange}
            placeholder="Comece a escrever seu estudo..."
          />
        </div>
      ) : (
        <div 
          className="p-8 rich-editor-content"
          dangerouslySetInnerHTML={{ __html: data.content || studyTemplate }}
        />
      )}
    </div>
  );
};

// Bloco: Slides
const SlideBlock: React.FC<{ data: any; onUpdate?: (data: any) => void; isEditing: boolean; authorName?: string }> = ({ data, onUpdate, isEditing, authorName }) => {
  const { showNotification } = useAuth();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(data.autoplay || false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [editingSlideId, setEditingSlideId] = useState<string | null>(null);
  const [editorContent, setEditorContent] = useState('');
  const intervalRef = useRef<any>(null);

  const slides = data.slides || [];
  const currentSlideData = slides[currentSlide] || {};

  const heightClasses: Record<string, string> = {
    small: 'h-64',
    medium: 'h-80 md:h-96',
    large: 'h-[500px] md:h-[600px]'
  };

  useEffect(() => {
    if (isPlaying && slides.length > 1) {
      intervalRef.current = setInterval(() => {
        setCurrentSlide(prev => (prev + 1) % slides.length);
      }, data.autoplayInterval || 5000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying, slides.length, data.autoplayInterval]);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
    if (isPlaying) {
      setIsPlaying(false);
    }
  };

  const nextSlide = () => {
    setCurrentSlide(prev => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide(prev => (prev - 1 + slides.length) % slides.length);
  };

  const addSlide = () => {
    const newSlide = {
      id: `slide-${Date.now()}`,
      backgroundImage: '',
      content: '<h2>Novo Slide</h2><p>Adicione seu conteúdo aqui...</p>',
      overlayOpacity: 0.3
    };
    onUpdate?.({
      ...data,
      slides: [...slides, newSlide]
    });
    setCurrentSlide(slides.length);
  };

  const removeSlide = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (slides.length <= 1) return;
    const newSlides = slides.filter((s: any) => s.id !== id);
    onUpdate?.({ ...data, slides: newSlides });
    if (currentSlide >= newSlides.length) {
      setCurrentSlide(newSlides.length - 1);
    }
  };

  const updateSlide = (id: string, updates: any) => {
    const newSlides = slides.map((s: any) => s.id === id ? { ...s, ...updates } : s);
    onUpdate?.({ ...data, slides: newSlides });
  };

  const openEditor = (slideId: string) => {
    setEditingSlideId(slideId);
    const slide = slides.find((s: any) => s.id === slideId);
    if (slide) {
      setEditorContent(slide.content || '');
    }
  };

  const saveEditorContent = () => {
    if (editingSlideId) {
      updateSlide(editingSlideId, { content: editorContent });
      setEditingSlideId(null);
    }
  };

  const handleImageSelect = (type: 'url' | 'ai' | 'gallery', value?: string) => {
    if (editingSlideId) {
      updateSlide(editingSlideId, { backgroundImage: value || '' });
    } else if (currentSlideData.id) {
      updateSlide(currentSlideData.id, { backgroundImage: value || '' });
    }
    setShowImageModal(false);
  };

  const bgStyle = currentSlideData.backgroundImage
    ? {
        backgroundImage: `url(${currentSlideData.backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }
    : { backgroundColor: '#1a1a2e' };

  const overlayStyle = {
    backgroundColor: `rgba(0, 0, 0, ${currentSlideData.overlayOpacity || 0.3})`
  };

  return (
    <div className="relative">
      {/* Slide Container */}
      <div className={`relative ${heightClasses[data.height] || 'h-80 md:h-96'} overflow-hidden rounded-lg`} style={bgStyle}>
        {/* Overlay */}
        <div className="absolute inset-0" style={overlayStyle} />

        {/* Content */}
        <div className="relative z-10 h-full flex items-center justify-center p-8 text-white text-center">
          {isEditing ? (
            <div className="w-full max-w-2xl">
              <div
                className="prose prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: currentSlideData.content || '<p>Clique para editar</p>' }}
                onClick={() => openEditor(currentSlideData.id)}
              />
              {!currentSlideData.backgroundImage && (
                <button
                  onClick={() => setShowImageModal(true)}
                  className="mt-4 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm flex items-center gap-2 mx-auto"
                >
                  <ImagePlus size={16} />
                  Adicionar imagem de fundo
                </button>
              )}
            </div>
          ) : (
            <div
              className="prose prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: currentSlideData.content || '' }}
            />
          )}
        </div>

        {/* Navigation Arrows */}
        {slides.length > 1 && data.showNavigation && (
          <>
            <button
              onClick={prevSlide}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-black/30 hover:bg-black/50 rounded-full text-white transition-colors z-20"
            >
              <ChevronLeft size={24} />
            </button>
            <button
              onClick={nextSlide}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-black/30 hover:bg-black/50 rounded-full text-white transition-colors z-20"
            >
              <ChevronRight size={24} />
            </button>
          </>
        )}

        {/* Dots */}
        {slides.length > 1 && data.showNavigation && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
            {slides.map((_: any, index: number) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentSlide ? 'bg-white' : 'bg-white/40'
                }`}
              />
            ))}
          </div>
        )}

        {/* Autoplay Control */}
        {isEditing && (
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="absolute top-4 right-4 p-2 bg-black/30 hover:bg-black/50 rounded-full text-white transition-colors z-20"
          >
            {isPlaying ? <Pause size={20} /> : <Play size={20} />}
          </button>
        )}

        {/* Slide Counter */}
        {isEditing && (
          <div className="absolute top-4 left-4 px-3 py-1 bg-black/30 rounded-full text-white text-xs z-20">
            {currentSlide + 1} / {slides.length}
          </div>
        )}
      </div>

      {/* Image Modal */}
      {showImageModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg">Selecionar Imagem</h3>
              <button onClick={() => setShowImageModal(false)} className="p-1 hover:bg-gray-100 rounded">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-3">
              <button
                onClick={() => {
                  const url = prompt('Cole a URL da imagem:');
                  if (url) handleImageSelect('url', url);
                }}
                className="w-full flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <Link size={20} className="text-blue-500" />
                <span className="font-medium">Usar URL</span>
              </button>
              <button
                onClick={() => handleImageSelect('gallery')}
                className="w-full flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <FolderOpen size={20} className="text-purple-500" />
                <span className="font-medium">Acervo de Imagens</span>
              </button>
              <button
                onClick={() => {
                  const prompt_text = prompt('Descreva a imagem que deseja gerar:');
                  if (prompt_text) {
                    showNotification('Gerando imagem...', 'info');
                    setTimeout(() => {
                      handleImageSelect('ai', 'https://images.unsplash.com/photo-1507692049790-de58290a4334?w=800');
                      showNotification('Imagem gerada!', 'success');
                    }, 2000);
                  }
                }}
                className="w-full flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl hover:bg-amber-100 dark:hover:bg-amber-900/30 border border-amber-200 dark:border-amber-800"
              >
                <Wand size={20} className="text-amber-600" />
                <span className="font-medium">Gerar com IA</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Text Editor Modal */}
      {editingSlideId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex flex-col items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-4xl h-[80vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
              <h3 className="font-bold">
                Editando Slide {slides.findIndex((slide: any) => slide.id === editingSlideId) + 1}
              </h3>
              <button onClick={saveEditorContent} className="px-4 py-2 bg-bible-gold text-white rounded-lg font-medium">
                Salvar
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <RichTextEditor
                content={editorContent}
                onChange={setEditorContent}
                placeholder="Escreva o conteúdo do slide..."
              />
            </div>
          </div>
        </div>
      )}

      {/* Edit Controls */}
      {isEditing && (
        <div className="p-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <button
                onClick={addSlide}
                className="flex items-center gap-2 px-3 py-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg text-sm font-medium hover:bg-indigo-200 dark:hover:bg-indigo-900/50"
              >
                <Plus size={16} />
                Novo Slide
              </button>
              <button
                onClick={() => {
                  if (currentSlideData.id) {
                    setShowImageModal(true);
                  }
                }}
                className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm hover:bg-gray-200 dark:hover:bg-gray-700"
              >
                <ImagePlus size={16} />
                Imagem
              </button>
            </div>
            <div className="flex items-center gap-2">
              {slides.map((slide: any, index: number) => (
                <button
                  key={slide.id}
                  onClick={() => setCurrentSlide(index)}
                  className={`w-8 h-8 rounded text-xs font-medium ${
                    index === currentSlide
                      ? 'bg-indigo-500 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  {index + 1}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Renderizador de blocos
const BlockRenderer: React.FC<{ block: Block; onUpdate?: (data: any) => void; isEditing: boolean; authorName?: string }> = ({ block, onUpdate, isEditing, authorName }) => {
  const props = { data: block.data, onUpdate, isEditing };
  
  switch (block.type) {
    case 'hero': return <HeroBlock {...props} authorName={authorName} />;
    case 'authority': return <AuthorityBlock {...props} />;
    case 'biblical': return <BiblicalBlock {...props} />;
    case 'video': return <VideoBlock {...props} />;
    case 'footer': return <FooterBlock {...props} />;
    case 'study-content': return <StudyContentBlock {...props} />;
    case 'slide': return <SlideBlock {...props} />;
    default: return null;
  }
};

// Editor de propriedades
const BlockProperties: React.FC<{ block: Block; onUpdate: (data: any) => void }> = ({ block, onUpdate }) => {
  const [localData, setLocalData] = useState(block.data);

  useEffect(() => {
    setLocalData(block.data);
  }, [block.id, block.data]);

  const handleChange = (key: string, value: any) => {
    const newData = { ...localData, [key]: value };
    setLocalData(newData);
    onUpdate(newData);
  };

  return (
    <div className="space-y-4">
      {/* Hero Properties */}
      {block.type === 'hero' && (
        <>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Título</label>
            <input
              type="text"
              value={localData.title || ''}
              onChange={(e) => handleChange('title', e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Subtítulo</label>
            <textarea
              value={localData.subtitle || ''}
              onChange={(e) => handleChange('subtitle', e.target.value)}
              rows={2}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm resize-none"
            />
          </div>
          
          {/* Toggles */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs text-gray-500">Mostrar Subtítulo</label>
              <button
                onClick={() => handleChange('showSubtitle', !localData.showSubtitle)}
                className={`w-10 h-6 rounded-full transition-colors ${localData.showSubtitle !== false ? 'bg-bible-gold' : 'bg-gray-300'}`}
              >
                <div className={`w-4 h-4 bg-white rounded-full transition-transform ${localData.showSubtitle !== false ? 'translate-x-5' : 'translate-x-1'}`} />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <label className="text-xs text-gray-500">Mostrar Fundo</label>
              <button
                onClick={() => handleChange('showBackground', !localData.showBackground)}
                className={`w-10 h-6 rounded-full transition-colors ${localData.showBackground !== false ? 'bg-bible-gold' : 'bg-gray-300'}`}
              >
                <div className={`w-4 h-4 bg-white rounded-full transition-transform ${localData.showBackground !== false ? 'translate-x-5' : 'translate-x-1'}`} />
              </button>
            </div>
          </div>

          {/* Background Image */}
          {localData.showBackground !== false && (
            <>
              <div>
                <label className="text-xs text-gray-500 block mb-1">URL da Imagem de Fundo</label>
                <input
                  type="text"
                  value={localData.backgroundImage || ''}
                  onChange={(e) => handleChange('backgroundImage', e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Cor de Fundo</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={localData.backgroundColor || '#1e3a5f'}
                    onChange={(e) => handleChange('backgroundColor', e.target.value)}
                    className="w-12 h-10 rounded border border-gray-200"
                  />
                  <input
                    type="text"
                    value={localData.backgroundColor || ''}
                    onChange={(e) => handleChange('backgroundColor', e.target.value)}
                    className="flex-1 px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
                  />
                </div>
              </div>
            </>
          )}

          {/* CTA */}
          <div className="flex items-center justify-between">
            <label className="text-xs text-gray-500">Mostrar Botão CTA</label>
            <button
              onClick={() => handleChange('showCta', !localData.showCta)}
              className={`w-10 h-6 rounded-full transition-colors ${localData.showCta ? 'bg-bible-gold' : 'bg-gray-300'}`}
            >
              <div className={`w-4 h-4 bg-white rounded-full transition-transform ${localData.showCta ? 'translate-x-5' : 'translate-x-1'}`} />
            </button>
          </div>
          {localData.showCta && (
            <>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Texto do CTA</label>
                <input
                  type="text"
                  value={localData.ctaText || ''}
                  onChange={(e) => handleChange('ctaText', e.target.value)}
                  placeholder="Clique aqui"
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Link do CTA</label>
                <input
                  type="text"
                  value={localData.ctaLink || ''}
                  onChange={(e) => handleChange('ctaLink', e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
                />
              </div>
            </>
          )}

          {/* Layout */}
          <div>
            <label className="text-xs text-gray-500 block mb-1">Largura</label>
            <div className="flex gap-1">
              <button
                onClick={() => handleChange('width', 'full')}
                className={`flex-1 py-2 rounded-lg text-xs font-medium ${
                  localData.width === 'full' 
                    ? 'bg-bible-gold text-white' 
                    : 'bg-gray-100 dark:bg-gray-800'
                }`}
              >
                Full
              </button>
              <button
                onClick={() => handleChange('width', 'contained')}
                className={`flex-1 py-2 rounded-lg text-xs font-medium ${
                  localData.width === 'contained' 
                    ? 'bg-bible-gold text-white' 
                    : 'bg-gray-100 dark:bg-gray-800'
                }`}
              >
                Centered
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-500 block mb-1">Alinhamento</label>
            <div className="flex gap-1">
              {(['left', 'center', 'right'] as const).map(align => (
                <button
                  key={align}
                  onClick={() => handleChange('alignment', align)}
                  className={`flex-1 p-2 rounded-lg text-xs font-medium ${
                    localData.alignment === align 
                      ? 'bg-bible-gold text-white' 
                      : 'bg-gray-100 dark:bg-gray-800'
                  }`}
                >
                  {align === 'left' && <AlignLeft size={14} />}
                  {align === 'center' && <AlignCenter size={14} />}
                  {align === 'right' && <AlignRight size={14} />}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Authority Properties */}
      {block.type === 'authority' && (
        <>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Nome</label>
            <input
              type="text"
              value={localData.name || ''}
              onChange={(e) => handleChange('name', e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Bio</label>
            <textarea
              value={localData.bio || ''}
              onChange={(e) => handleChange('bio', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm resize-none"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">URL da Foto</label>
            <input
              type="text"
              value={localData.photo || ''}
              onChange={(e) => handleChange('photo', e.target.value)}
              placeholder="https://..."
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
            />
          </div>
        </>
      )}

      {/* Biblical Properties */}
      {block.type === 'biblical' && (
        <>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Referência</label>
            <input
              type="text"
              value={localData.reference || ''}
              onChange={(e) => handleChange('reference', e.target.value)}
              placeholder="João 3:16"
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Texto do Versículo</label>
            <textarea
              value={localData.text || ''}
              onChange={(e) => handleChange('text', e.target.value)}
              rows={4}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm resize-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="showImage"
              checked={localData.showImage || false}
              onChange={(e) => handleChange('showImage', e.target.checked)}
              className="rounded"
            />
            <label htmlFor="showImage" className="text-sm text-gray-600 dark:text-gray-400">
              Mostrar imagem gerada por IA
            </label>
          </div>
        </>
      )}

      {/* Video Properties */}
      {block.type === 'video' && (
        <>
          <div>
            <label className="text-xs text-gray-500 block mb-1">URL do Vídeo</label>
            <input
              type="text"
              value={localData.url || ''}
              onChange={(e) => handleChange('url', e.target.value)}
              placeholder="https://youtube.com/watch?v=..."
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Título</label>
            <input
              type="text"
              value={localData.title || ''}
              onChange={(e) => handleChange('title', e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
            />
          </div>
        </>
      )}

      {/* Footer Properties */}
      {block.type === 'footer' && (
        <>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Tagline</label>
            <input
              type="text"
              value={localData.tagline || ''}
              onChange={(e) => handleChange('tagline', e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="showSocial"
              checked={localData.showSocial !== false}
              onChange={(e) => handleChange('showSocial', e.target.checked)}
              className="rounded"
            />
            <label htmlFor="showSocial" className="text-sm text-gray-600 dark:text-gray-400">
              Mostrar ícones sociais
            </label>
          </div>
        </>
      )}

      {/* Study Content Properties */}
      {block.type === 'study-content' && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
          <p className="text-sm text-emerald-700 dark:text-emerald-300 font-medium mb-2">
            📖 Edite o conteúdo diretamente no canvas
          </p>
          <p className="text-xs text-gray-500">
            O bloco de estudo contém: Introdução, Contextualização, Aplicação, Oração e Conclusão.
          </p>
        </div>
      )}

      {/* Slide Properties */}
      {block.type === 'slide' && (
        <>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Altura do Slide</label>
            <div className="flex gap-1">
              {(['small', 'medium', 'large'] as const).map(h => (
                <button
                  key={h}
                  onClick={() => handleChange('height', h)}
                  className={`flex-1 py-2 rounded-lg text-xs font-medium ${
                    localData.height === h 
                      ? 'bg-indigo-500 text-white' 
                      : 'bg-gray-100 dark:bg-gray-800'
                  }`}
                >
                  {h === 'small' && <Minimize2 size={14} className="mx-auto" />}
                  {h === 'medium' && <Square size={14} className="mx-auto" />}
                  {h === 'large' && <Maximize2 size={14} className="mx-auto" />}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="autoplay"
              checked={localData.autoplay || false}
              onChange={(e) => handleChange('autoplay', e.target.checked)}
              className="rounded"
            />
            <label htmlFor="autoplay" className="text-sm text-gray-600 dark:text-gray-400">
              Autoplay
            </label>
          </div>
          {localData.autoplay && (
            <div>
              <label className="text-xs text-gray-500 block mb-1">Intervalo (ms)</label>
              <input
                type="number"
                value={localData.autoplayInterval || 5000}
                onChange={(e) => handleChange('autoplayInterval', parseInt(e.target.value))}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
              />
            </div>
          )}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="showNavigation"
              checked={localData.showNavigation !== false}
              onChange={(e) => handleChange('showNavigation', e.target.checked)}
              className="rounded"
            />
            <label htmlFor="showNavigation" className="text-sm text-gray-600 dark:text-gray-400">
              Mostrar navegação
            </label>
          </div>
        </>
      )}
    </div>
  );
};

export default CreateLandingPage;




