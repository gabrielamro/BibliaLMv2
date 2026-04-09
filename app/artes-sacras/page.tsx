"use client";
import React, { useEffect, useState } from 'react';
import { useNavigate } from '../../utils/router';
import { useAuth } from '../../contexts/AuthContext';
import { useHeader } from '../../contexts/HeaderContext';
import { dbService } from '../../services/supabase';
import {
  ArrowLeft,
  BookOpen,
  Check,
  Copy,
  Download,
  Image as ImageIcon,
  Lightbulb,
  Share2,
  Sparkles,
} from 'lucide-react';

const imageIdeas = [
  { prompt: '"Criacao do mundo" - estilo realista', verse: 'Genesis 1:1' },
  { prompt: '"Mar Vermelho se abrindo" - cinematografico', verse: 'Exodo 14:21' },
  { prompt: '"David contra Golias" - heroico', verse: '1 Samuel 17:45' },
  { prompt: '"Jesus no Getsemani" - dramatico', verse: 'Mateus 26:39' },
  { prompt: '"Pentecostes" - luz dourada', verse: 'Atos 2:3' },
  { prompt: '"Apocalipse - Nova Jerusalem" - futurista', verse: 'Apocalipse 21:2' },
];

export default function ArtesSacrasPage() {
  const navigate = useNavigate();
  const { showNotification, currentUser } = useAuth();
  const { setTitle, setBreadcrumbs, resetHeader } = useHeader();

  const [gallery, setGallery] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedVerse, setCopiedVerse] = useState<string | null>(null);

  useEffect(() => {
    setTitle('Arte Sacra');
    setBreadcrumbs([
      { label: 'Inicio', path: '/' },
      { label: 'Criar', path: '/' },
      { label: 'Arte Sacra' },
    ]);

    const loadGallery = async () => {
      try {
        setLoading(true);
        const userGallery = currentUser ? await dbService.getSacredArtGallery(currentUser.uid) : [];
        const freeGallery = await dbService.getImageBank(20);
        
        const mappedFree = freeGallery.map(img => ({
            ...img,
            url: img.image_url || img.url,
            prompt: img.prompt || img.label || 'Arte Sacra'
        }));

        // Merge or replace depending on user data
        if (userGallery.length === 0) {
            setGallery(mappedFree);
        } else {
            setGallery([...userGallery, ...mappedFree]);
        }
      } catch (e) {
        console.error("Failed to load gallery", e);
      } finally {
        setLoading(false);
      }
    };

    loadGallery();

    return () => resetHeader();
  }, [resetHeader, setBreadcrumbs, setTitle, currentUser]);

  const handleCreateImage = (verse?: string, prompt?: string) => {
    navigate('/criar-arte-sacra', {
      state: {
        verseRef: verse,
        initialPrompt: prompt || '',
      },
    });
  };

  const copyPrompt = (idea: (typeof imageIdeas)[0]) => {
    navigator.clipboard.writeText(idea.prompt);
    setCopiedVerse(idea.verse);
    setTimeout(() => setCopiedVerse(null), 2000);
    showNotification('Prompt copiado!', 'success');
  };

  return (
    <div className="min-h-screen bg-[#F6F3EE] text-[#111111] dark:bg-[#0E0E0E] dark:text-white transition-colors">
      <header className="sticky top-0 z-50 border-b border-[#E7E2D7] bg-[#F6F3EE]/90 backdrop-blur-lg transition-colors dark:border-[#2A2A2A] dark:bg-[#0E0E0E]/90">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between px-4 py-4 lg:px-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/')}
              className="rounded-xl p-2 transition-colors hover:bg-[#EDE7DA] dark:hover:bg-[#1A1A1A]"
            >
              <ArrowLeft size={20} className="text-gray-500 dark:text-gray-400" />
            </button>
            <div>
              <h1 className="text-xl font-bold">Arte Sacra</h1>
              <p className="text-xs text-gray-500">Crie imagens inspiradas na Palavra</p>
            </div>
          </div>
          <button
            onClick={() => handleCreateImage()}
            className="flex items-center gap-2 rounded-xl bg-[#c5a059] px-5 py-3 font-bold text-black transition-colors hover:bg-[#d4b06a]"
          >
            <Sparkles size={18} />
            Nova Imagem
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-[1200px] space-y-6 px-4 py-6 pb-24 lg:px-6">
        <div className="rounded-2xl border border-[#E7E2D7] bg-white p-5 transition-colors dark:border-[#2A2A2A] dark:bg-[#141414]">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-bold text-[#111111] dark:text-white">
              <ImageIcon size={18} className="text-green-500" />
              Minhas Artes
            </h2>
            <span className="text-xs text-gray-500">{gallery.length} imagens</span>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="aspect-square rounded-xl bg-[#F2EEE5] animate-pulse dark:bg-[#1A1A1A]" />
              ))}
            </div>
          ) : gallery.length === 0 ? (
            <div className="py-12 text-center">
              <ImageIcon size={48} className="mx-auto mb-4 text-gray-400 dark:text-gray-600" />
              <p className="text-gray-500 dark:text-gray-400">Voce ainda nao criou nenhuma imagem</p>
              <button
                onClick={() => handleCreateImage()}
                className="mt-4 rounded-xl bg-[#c5a059] px-6 py-3 font-bold text-black"
              >
                Criar Primeira Imagem
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {gallery.map((img) => (
                <div key={img.id} className="group relative aspect-square overflow-hidden rounded-xl bg-[#F2EEE5] transition-colors dark:bg-[#1A1A1A]">
                  <img
                    src={img.url}
                    alt={img.prompt || 'Arte Sacra'}
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent opacity-0 transition-opacity group-hover:opacity-100">
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <p className="text-sm font-bold text-white">{img.prompt || 'Arte Sacra'}</p>
                      <div className="mt-2 flex gap-2">
                        <button className="rounded-lg bg-white/20 p-2 hover:bg-white/30">
                          <Share2 size={12} />
                        </button>
                        <button className="rounded-lg bg-white/20 p-2 hover:bg-white/30">
                          <Download size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-[#E7E2D7] bg-white p-5 transition-colors dark:border-[#2A2A2A] dark:bg-[#141414]">
          <div className="mb-5 flex items-center gap-2">
            <Lightbulb size={18} className="text-[#c5a059]" />
            <h2 className="font-bold text-[#111111] dark:text-white">Ideias para Criar</h2>
          </div>

          <div className="space-y-3">
            {imageIdeas.map((idea, i) => (
              <div
                key={i}
                className="flex items-center gap-4 rounded-xl bg-[#F8F4EA] p-4 transition-colors hover:bg-[#EFE8D6] dark:bg-[#1A1A1A] dark:hover:bg-[#252525]"
              >
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-[#c5a059]/20">
                  <BookOpen size={18} className="text-[#c5a059]" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-[#111111] dark:text-white">{idea.prompt}</p>
                  <p className="mt-1 text-[11px] text-gray-500">{idea.verse}</p>
                </div>
                <div className="flex flex-shrink-0 gap-2">
                  <button
                    onClick={() => copyPrompt(idea)}
                    className="rounded-lg border border-[#E7E2D7] bg-white p-2 transition-colors hover:bg-[#F2EEE5] dark:border-transparent dark:bg-[#2A2A2A] dark:hover:bg-[#3A3A3A]"
                  >
                    {copiedVerse === idea.verse ? (
                      <Check size={14} className="text-green-500" />
                    ) : (
                      <Copy size={14} className="text-gray-400" />
                    )}
                  </button>
                  <button
                    onClick={() => handleCreateImage(idea.verse, idea.prompt)}
                    className="flex items-center gap-1 rounded-lg bg-[#c5a059] px-3 py-2 text-xs font-bold text-black transition-colors hover:bg-[#d4b06a]"
                  >
                    <Sparkles size={12} />
                    Criar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
