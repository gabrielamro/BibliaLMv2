'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { 
  ArrowLeft, Share2, MessageCircle, Heart, Eye, Clock, User,
  BookOpen, Share, Copy, Check, ExternalLink, Loader2
} from 'lucide-react';
import { supabase } from '../../../services/supabase';

interface Block {
  id: string;
  type: 'hero' | 'authority' | 'biblical' | 'video' | 'footer';
  data: Record<string, any>;
}

interface PublicContent {
  id: string;
  type: 'article' | 'devotional' | 'series';
  title: string;
  description: string;
  slug: string;
  blocks: Block[];
  meta: {
    title: string;
    description: string;
    tags: string[];
  };
  user_name: string;
  user_photo: string;
  published_at: string;
  views_count: number;
  shares_count: number;
}

// Blocos para renderização pública
const PublicBlock: React.FC<{ block: Block }> = ({ block }) => {
  switch (block.type) {
    case 'hero':
      return (
        <div 
          className="relative min-h-[400px] md:min-h-[500px] flex items-center justify-center p-12 text-center"
          style={{ 
            background: block.data.backgroundImage 
              ? `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url(${block.data.backgroundImage}) center/cover` 
              : block.data.backgroundColor || '#1e3a5f'
          }}
        >
          <div className={`relative z-10 max-w-3xl mx-auto ${block.data.alignment === 'left' ? 'text-left' : block.data.alignment === 'right' ? 'text-right' : 'text-center'}`}>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-white leading-tight">
              {block.data.title}
            </h1>
            {block.data.subtitle && (
              <p className="text-xl md:text-2xl text-white/90 mb-8">
                {block.data.subtitle}
              </p>
            )}
            {block.data.ctaText && (
              <a 
                href={block.data.ctaLink || '#'}
                className="inline-block px-8 py-4 bg-bible-gold text-white rounded-xl font-bold text-lg hover:bg-bible-gold/90 transition-colors shadow-lg"
              >
                {block.data.ctaText}
              </a>
            )}
          </div>
        </div>
      );

    case 'authority':
      return (
        <div className="p-10 md:p-16 bg-gray-50 dark:bg-gray-900">
          <div className="max-w-xl mx-auto text-center">
            <div className="w-28 h-28 md:w-32 md:h-32 rounded-full bg-gray-200 mx-auto mb-6 overflow-hidden ring-4 ring-bible-gold/20">
              {block.data.photo ? (
                <img src={block.data.photo} alt={block.data.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-bible-gold/10">
                  <User size={48} className="text-bible-gold" />
                </div>
              )}
            </div>
            <h3 className="text-2xl font-bold text-bible-ink dark:text-white mb-3">
              {block.data.name}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-lg leading-relaxed">
              {block.data.bio}
            </p>
          </div>
        </div>
      );

    case 'biblical':
      return (
        <div className="p-10 md:p-16 bg-amber-50 dark:bg-amber-900/10">
          <div className="max-w-3xl mx-auto text-center">
            {block.data.showImage && (
              <div className="w-full h-64 md:h-80 rounded-2xl overflow-hidden mb-8 shadow-lg">
                <img 
                  src={block.data.imageUrl || 'https://images.unsplash.com/photo-1507692049790-de58290a4334?w=1200'} 
                  alt="Inspiração bíblica"
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <blockquote className="text-2xl md:text-3xl lg:text-4xl font-serif italic text-bible-ink dark:text-white mb-6 leading-relaxed">
              "{block.data.text}"
            </blockquote>
            <cite className="text-bible-gold font-bold text-xl">
              — {block.data.reference}
            </cite>
          </div>
        </div>
      );

    case 'video':
      return (
        <div className="p-10 md:p-16">
          <div className="max-w-4xl mx-auto">
            {block.data.url ? (
              <div className="aspect-video bg-gray-900 rounded-2xl overflow-hidden shadow-xl">
                <iframe
                  src={block.data.url.replace('watch?v=', 'embed/').replace('vimeo.com/', 'player.vimeo.com/video/')}
                  title={block.data.title}
                  className="w-full h-full"
                  allowFullScreen
                />
              </div>
            ) : (
              <div className="aspect-video bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center">
                <div className="text-center text-gray-400">
                  <BookOpen size={64} className="mx-auto mb-4 opacity-50" />
                  <p>Vídeo não disponível</p>
                </div>
              </div>
            )}
            {block.data.title && (
              <h3 className="text-2xl font-bold text-bible-ink dark:text-white mt-6 text-center">
                {block.data.title}
              </h3>
            )}
            {block.data.description && (
              <p className="text-gray-600 dark:text-gray-400 mt-3 text-center">
                {block.data.description}
              </p>
            )}
          </div>
        </div>
      );

    case 'footer':
      return (
        <div className="p-10 md:p-16 bg-bible-ink text-white">
          <div className="max-w-2xl mx-auto text-center">
            {block.data.tagline && (
              <p className="text-bible-gold font-medium text-lg mb-6">
                {block.data.tagline}
              </p>
            )}
            <div className="flex justify-center gap-4 mb-8">
              <a href="#" className="p-3 bg-white/10 rounded-full hover:bg-white/20 transition-colors">
                <MessageCircle size={24} />
              </a>
              <a href="#" className="p-3 bg-white/10 rounded-full hover:bg-white/20 transition-colors">
                <Share2 size={24} />
              </a>
            </div>
            <p className="text-sm text-white/60">
              {block.data.copyright}
            </p>
          </div>
        </div>
      );

    default:
      return null;
  }
};

export default function PublicContentPage({ params }: { params: { slug: string } }) {
  const { slug } = params;
  const [content, setContent] = useState<PublicContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [liked, setLiked] = useState(false);
  const [showComments, setShowComments] = useState(false);

  useEffect(() => {
    const loadContent = async () => {
      setLoading(true);
      try {
        // Buscar por slug
        const { data } = await supabase
          .from('public_studies')
          .select('*')
          .eq('slug', slug)
          .eq('status', 'published')
          .single();
        
        if (data) {
          // Incrementar visualizações
          await supabase
            .from('public_studies')
            .update({ views_count: (data.views_count || 0) + 1 })
            .eq('id', data.id);
          
          // Parsear blocks
          let blocks: Block[] = [];
          try {
            blocks = typeof data.blocks === 'string' ? JSON.parse(data.blocks) : data.blocks || [];
          } catch (e) {}
          
          setContent({
            id: data.id,
            type: data.type || 'article',
            title: data.title || data.meta?.title || '',
            description: data.description || data.meta?.description || '',
            slug: data.slug,
            blocks,
            meta: typeof data.meta === 'string' ? JSON.parse(data.meta) : data.meta || {},
            user_name: data.user_name || '',
            user_photo: data.user_photo || '',
            published_at: data.published_at,
            views_count: (data.views_count || 0) + 1,
            shares_count: data.shares_count || 0
          });
        }
      } catch (e) {
        console.error('Erro ao carregar conteúdo:', e);
      }
      setLoading(false);
    };
    
    loadContent();
  }, [slug]);

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: content?.title,
          text: content?.description,
          url
        });
        if (content?.id) {
          await supabase
            .from('public_studies')
            .update({ shares_count: (content.shares_count || 0) + 1 })
            .eq('id', content.id);
        }
      } catch (e) {
        // User cancelled
      }
    } else {
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-bible-darkPaper flex items-center justify-center">
        <Loader2 size={48} className="animate-spin text-bible-gold" />
      </div>
    );
  }

  if (!content) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-bible-darkPaper flex flex-col items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-300 mb-4">404</h1>
          <p className="text-gray-500 mb-8">Conteúdo não encontrado</p>
          <Link 
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-bible-gold text-white rounded-xl font-bold hover:bg-bible-gold/90 transition-colors"
          >
            <ArrowLeft size={18} />
            Voltar ao início
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-bible-darkPaper">
      {/* Header Fixo */}
      <header className="sticky top-0 z-50 bg-white/95 dark:bg-bible-darkPaper/95 backdrop-blur-lg border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Link 
              href="/"
              className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-bible-gold transition-colors"
            >
              <ArrowLeft size={20} />
              <span className="hidden sm:inline">Voltar</span>
            </Link>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setLiked(!liked)}
                className={`p-2 rounded-full transition-colors ${
                  liked ? 'bg-red-100 text-red-500' : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500'
                }`}
              >
                <Heart size={20} fill={liked ? 'currentColor' : 'none'} />
              </button>
              <button
                onClick={handleShare}
                className="flex items-center gap-2 px-4 py-2 bg-bible-gold text-white rounded-full font-medium text-sm hover:bg-bible-gold/90 transition-colors"
              >
                {copied ? <Check size={16} /> : <Share2 size={16} />}
                {copied ? 'Copiado!' : 'Compartilhar'}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main>
        {/* Blocos */}
        {content.blocks.map(block => (
          <PublicBlock key={block.id} block={block} />
        ))}

        {/* Meta Footer */}
        <div className="bg-gray-50 dark:bg-gray-900 py-8">
          <div className="max-w-3xl mx-auto px-4">
            {/* Stats */}
            <div className="flex items-center justify-center gap-6 mb-6 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <Eye size={14} />
                {content.views_count.toLocaleString()} visualizações
              </span>
              <span className="flex items-center gap-1">
                <Clock size={14} />
                {new Date(content.published_at).toLocaleDateString('pt-BR')}
              </span>
            </div>

            {/* Tags */}
            {content.meta?.tags?.length > 0 && (
              <div className="flex flex-wrap justify-center gap-2 mb-8">
                {content.meta.tags.map(tag => (
                  <span 
                    key={tag}
                    className="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full text-xs font-medium text-gray-600 dark:text-gray-300"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* Comentários Toggle */}
            <div className="text-center">
              <button
                onClick={() => setShowComments(!showComments)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gray-100 dark:bg-gray-800 rounded-xl text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                <MessageCircle size={18} />
                {showComments ? 'Ocultar comentários' : 'Ver comentários'}
              </button>
            </div>

            {/* Comentários (placeholder) */}
            {showComments && (
              <div className="mt-8 max-w-xl mx-auto">
                <div className="bg-white dark:bg-bible-darkPaper rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
                  <h3 className="font-bold text-bible-ink dark:text-white mb-4">
                    Comentários
                  </h3>
                  <div className="text-center py-8 text-gray-400">
                    <MessageCircle size={32} className="mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Nenhum comentário ainda</p>
                    <p className="text-xs mt-1">Seja o primeiro a comentar!</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer BiblesLM */}
      <footer className="py-8 text-center text-sm text-gray-400 border-t border-gray-100 dark:border-gray-800">
        <p>Powered by</p>
        <Link href="/" className="font-bold text-bible-gold hover:underline">
          BíbliaLM
        </Link>
      </footer>
    </div>
  );
}
