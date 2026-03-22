"use client";
import React, { useState, useEffect } from 'react';
import { useNavigate } from '../../utils/router';
import { useAuth } from '../../contexts/AuthContext';
import { useHeader } from '../../contexts/HeaderContext';
import { 
  Image as ImageIcon, Sparkles, Plus, Share2, Download, 
  Trash2, Heart, Wand2, Lightbulb, Copy,
  Check, ChevronRight, BookOpen, ArrowLeft
} from 'lucide-react';

const imageIdeas = [
  { prompt: '"Creação do mundo" - estilo realista', verse: 'Gênesis 1:1' },
  { prompt: '"Mar Vermelho se abrindo" - cinematográfico', verse: 'Êxodo 14:21' },
  { prompt: '"David contra Golias" - heroico', verse: '1 Samuel 17:45' },
  { prompt: '"Jesus no Getsêmani" - dramático', verse: 'Mateus 26:39' },
  { prompt: '"Pentecostes" - luz dourada', verse: 'Atos 2:3' },
  { prompt: '"Apocalipse - Nova Jerusalém" - futurista', verse: 'Apocalipse 21:2' },
];

export default function ArtesSacrasPage() {
  const navigate = useNavigate();
  const { showNotification } = useAuth();
  const { setTitle, setBreadcrumbs, resetHeader } = useHeader();
  
  const [gallery, setGallery] = useState<any[]>([]);
  const [loading] = useState(true);
  const [copiedVerse, setCopiedVerse] = useState<string | null>(null);

  useEffect(() => {
    setTitle('Arte Sacra');
    setBreadcrumbs([
      { label: 'Início', path: '/' },
      { label: 'Criar', path: '/' },
      { label: 'Arte Sacra' }
    ]);
    setGallery([
      { id: '1', url: 'https://images.unsplash.com/photo-1507692049790-de58290a4334?w=400', title: 'Criação' },
      { id: '2', url: 'https://images.unsplash.com/photo-1508672019048-805c876b67e2?w=400', title: 'Mar Vermelho' },
      { id: '3', url: 'https://images.unsplash.com/photo-1489549132488-d00b7eee80f1?w=400', title: 'Jerusalém' },
      { id: '4', url: 'https://images.unsplash.com/photo-1438232992991-995b7058bbb3?w=400', title: 'Daniel' },
    ]);
    return () => resetHeader();
  }, []);

  const handleCreateImage = (verse?: string) => {
    navigate('/estudio-criativo', { state: { tool: 'image', verse } });
  };

  const copyPrompt = (idea: typeof imageIdeas[0]) => {
    navigator.clipboard.writeText(idea.prompt);
    setCopiedVerse(idea.verse);
    setTimeout(() => setCopiedVerse(null), 2000);
    showNotification('Prompt copiado!', 'success');
  };

  return (
    <div className="min-h-screen bg-[#0E0E0E] text-white">
      <header className="sticky top-0 z-50 bg-[#0E0E0E]/90 backdrop-blur-lg border-b border-[#2A2A2A]">
        <div className="max-w-[1200px] mx-auto px-4 lg:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/')}
              className="p-2 hover:bg-[#1A1A1A] rounded-xl transition-colors"
            >
              <ArrowLeft size={20} className="text-gray-400" />
            </button>
            <div>
              <h1 className="text-xl font-bold">Arte Sacra</h1>
              <p className="text-gray-500 text-xs">Crie imagens inspiradas na Palavra</p>
            </div>
          </div>
          <button 
            onClick={() => handleCreateImage()}
            className="flex items-center gap-2 bg-[#c5a059] text-black font-bold px-5 py-3 rounded-xl hover:bg-[#d4b06a] transition-colors"
          >
            <Sparkles size={18} />
            Nova Imagem
          </button>
        </div>
      </header>

      <main className="max-w-[1200px] mx-auto px-4 lg:px-6 py-6 space-y-6 pb-24">
        
        {/* Minhas Artes */}
        <div className="bg-[#141414] rounded-2xl p-5 border border-[#2A2A2A]">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-white font-bold flex items-center gap-2">
              <ImageIcon size={18} className="text-green-500" />
              Minhas Artes
            </h2>
            <span className="text-gray-500 text-xs">{gallery.length} imagens</span>
          </div>
          
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[1,2,3,4].map(i => (
                <div key={i} className="aspect-square bg-[#1A1A1A] rounded-xl animate-pulse" />
              ))}
            </div>
          ) : gallery.length === 0 ? (
            <div className="text-center py-12">
              <ImageIcon size={48} className="mx-auto text-gray-600 mb-4" />
              <p className="text-gray-400">Você ainda não criou nenhuma imagem</p>
              <button 
                onClick={() => handleCreateImage()}
                className="mt-4 px-6 py-3 bg-[#c5a059] text-black font-bold rounded-xl"
              >
                Criar Primeira Imagem
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {gallery.map(img => (
                <div key={img.id} className="group relative aspect-square rounded-xl overflow-hidden bg-[#1A1A1A]">
                  <img 
                    src={img.url} 
                    alt={img.title}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <p className="text-white font-bold text-sm">{img.title}</p>
                      <div className="flex gap-2 mt-2">
                        <button className="p-2 bg-white/20 rounded-lg hover:bg-white/30">
                          <Share2 size={12} />
                        </button>
                        <button className="p-2 bg-white/20 rounded-lg hover:bg-white/30">
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

        {/* Ideias para Criar */}
        <div className="bg-[#141414] rounded-2xl p-5 border border-[#2A2A2A]">
          <div className="flex items-center gap-2 mb-5">
            <Lightbulb size={18} className="text-[#c5a059]" />
            <h2 className="text-white font-bold">Ideias para Criar</h2>
          </div>
          
          <div className="space-y-3">
            {imageIdeas.map((idea, i) => (
              <div key={i} className="flex items-center gap-4 p-4 bg-[#1A1A1A] rounded-xl hover:bg-[#252525] transition-colors">
                <div className="w-10 h-10 rounded-lg bg-[#c5a059]/20 flex items-center justify-center flex-shrink-0">
                  <BookOpen size={18} className="text-[#c5a059]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm">{idea.prompt}</p>
                  <p className="text-gray-500 text-[11px] mt-1">{idea.verse}</p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button 
                    onClick={() => copyPrompt(idea)}
                    className="p-2 bg-[#2A2A2A] rounded-lg hover:bg-[#3A3A3A] transition-colors"
                  >
                    {copiedVerse === idea.verse ? (
                      <Check size={14} className="text-green-500" />
                    ) : (
                      <Copy size={14} className="text-gray-400" />
                    )}
                  </button>
                  <button 
                    onClick={() => handleCreateImage(idea.verse)}
                    className="flex items-center gap-1 px-3 py-2 bg-[#c5a059] text-black font-bold text-xs rounded-lg hover:bg-[#d4b06a] transition-colors"
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
