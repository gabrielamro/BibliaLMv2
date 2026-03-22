"use client";
import React, { useState, useEffect } from 'react';
import { useNavigate } from '../../utils/router';
import { useAuth } from '../../contexts/AuthContext';
import { useHeader } from '../../contexts/HeaderContext';
import { 
  Mic, Sparkles, Plus, Play, Share2, Download,
  Heart, Lightbulb, Copy, Check, ChevronRight, 
  BookOpen, Clock, Headphones, ArrowLeft, FileText
} from 'lucide-react';

const templates = [
  { 
    id: 'devotional',
    title: 'Devocional', 
    desc: 'Reflexão curta para o dia',
    icon: '🌅',
    duration: '3-5 min'
  },
  { 
    id: 'study',
    title: 'Estudo Bíblico', 
    desc: 'Análise detalhada de um tema',
    icon: '📖',
    duration: '15-20 min'
  },
  { 
    id: 'sermon',
    title: 'Pregação', 
    desc: 'Mensagem para domingo',
    icon: '🎙️',
    duration: '25-30 min'
  },
];

const podcastIdeas = [
  { title: 'Devocional de Segunda', desc: 'Comece a semana com uma reflexão', type: 'devotional' },
  { title: 'Estudo em Salmos', desc: 'Explore os salmos de louvor', type: 'study' },
  { title: 'Pregação sobre Fé', desc: 'Mensagem edificante', type: 'sermon' },
];

export default function EstudioCriativoPage() {
  const navigate = useNavigate();
  const { showNotification } = useAuth();
  const { setTitle, setBreadcrumbs, resetHeader } = useHeader();
  
  const [episodes, setEpisodes] = useState<any[]>([]);
  const [loading] = useState(true);

  useEffect(() => {
    setTitle('Podcast Devocional');
    setBreadcrumbs([
      { label: 'Início', path: '/' },
      { label: 'Criar', path: '/' },
      { label: 'Podcast' }
    ]);
    setEpisodes([
      { id: '1', title: 'Devocional - João 3:16', duration: '4:32', status: 'completed', plays: 24 },
      { id: '2', title: 'Estudo em Salmos', duration: '18:15', status: 'completed', plays: 42 },
      { id: '3', title: 'Oração da Manhã', duration: '3:45', status: 'completed', plays: 67 },
    ]);
    return () => resetHeader();
  }, []);

  const handleCreatePodcast = (templateId?: string) => {
    navigate('/estudio-criativo', { state: { tool: 'podcast', template: templateId } });
  };

  const formatDuration = (duration: string) => {
    const [min, sec] = duration.split(':');
    return `${min}min${parseInt(sec) > 0 ? ` ${sec}s` : ''}`;
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
              <h1 className="text-xl font-bold">Podcast Devocional</h1>
              <p className="text-gray-500 text-xs">Crie episódios com narração IA</p>
            </div>
          </div>
          <button 
            onClick={() => handleCreatePodcast()}
            className="flex items-center gap-2 bg-[#c5a059] text-black font-bold px-5 py-3 rounded-xl hover:bg-[#d4b06a] transition-colors"
          >
            <Mic size={18} />
            Novo Podcast
          </button>
        </div>
      </header>

      <main className="max-w-[1200px] mx-auto px-4 lg:px-6 py-6 space-y-6 pb-24">
        
        {/* Templates Rápidos */}
        <div className="bg-[#141414] rounded-2xl p-5 border border-[#2A2A2A]">
          <div className="flex items-center gap-2 mb-5">
            <Sparkles size={18} className="text-[#c5a059]" />
            <h2 className="text-white font-bold">Templates Rápidos</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {templates.map(template => (
              <button
                key={template.id}
                onClick={() => handleCreatePodcast(template.id)}
                className="p-5 bg-[#1A1A1A] rounded-xl border border-[#2A2A2A] hover:border-[#c5a059]/50 transition-colors text-left group"
              >
                <div className="flex items-start gap-3">
                  <span className="text-3xl">{template.icon}</span>
                  <div className="flex-1">
                    <h3 className="text-white font-bold group-hover:text-[#c5a059] transition-colors">{template.title}</h3>
                    <p className="text-gray-500 text-[11px] mt-1">{template.desc}</p>
                    <span className="inline-flex items-center gap-1 mt-3 text-[10px] text-gray-400">
                      <Clock size={10} /> {template.duration}
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Meus Episódios */}
        <div className="bg-[#141414] rounded-2xl p-5 border border-[#2A2A2A]">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-white font-bold flex items-center gap-2">
              <Headphones size={18} className="text-pink-500" />
              Meus Episódios
            </h2>
            <span className="text-gray-500 text-xs">{episodes.length} episódios</span>
          </div>
          
          {loading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => (
                <div key={i} className="h-20 bg-[#1A1A1A] rounded-xl animate-pulse" />
              ))}
            </div>
          ) : episodes.length === 0 ? (
            <div className="text-center py-12">
              <Mic size={48} className="mx-auto text-gray-600 mb-4" />
              <p className="text-gray-400">Você ainda não criou nenhum podcast</p>
              <button 
                onClick={() => handleCreatePodcast()}
                className="mt-4 px-6 py-3 bg-[#c5a059] text-black font-bold rounded-xl"
              >
                Criar Primeiro Podcast
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {episodes.map(ep => (
                <div key={ep.id} className="flex items-center gap-4 p-4 bg-[#1A1A1A] rounded-xl hover:bg-[#252525] transition-colors group">
                  <button className="w-12 h-12 rounded-full bg-[#c5a059] flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                    <Play size={20} className="text-black ml-0.5" />
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-bold text-sm truncate">{ep.title}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-gray-500 text-[11px] flex items-center gap-1">
                        <Clock size={10} />
                        {formatDuration(ep.duration)}
                      </span>
                      <span className="text-gray-500 text-[11px] flex items-center gap-1">
                        <Headphones size={10} />
                        {ep.plays} plays
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="p-2 bg-[#2A2A2A] rounded-lg hover:bg-[#3A3A3A]">
                      <Share2 size={14} className="text-gray-400" />
                    </button>
                    <button className="p-2 bg-[#2A2A2A] rounded-lg hover:bg-[#3A3A3A]">
                      <Download size={14} className="text-gray-400" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Ideias para Podcasts */}
        <div className="bg-[#141414] rounded-2xl p-5 border border-[#2A2A2A]">
          <div className="flex items-center gap-2 mb-5">
            <Lightbulb size={18} className="text-[#c5a059]" />
            <h2 className="text-white font-bold">Ideias para Podcasts</h2>
          </div>
          
          <div className="space-y-3">
            {podcastIdeas.map((idea, i) => (
              <div key={i} className="flex items-center gap-4 p-4 bg-[#1A1A1A] rounded-xl hover:bg-[#252525] transition-colors">
                <div className="w-10 h-10 rounded-lg bg-pink-500/20 flex items-center justify-center flex-shrink-0">
                  <Mic size={18} className="text-pink-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium">{idea.title}</p>
                  <p className="text-gray-500 text-[11px] mt-1">{idea.desc}</p>
                </div>
                <button 
                  onClick={() => handleCreatePodcast(idea.type)}
                  className="flex items-center gap-1 px-3 py-2 bg-[#c5a059] text-black font-bold text-xs rounded-lg hover:bg-[#d4b06a] transition-colors"
                >
                  <Sparkles size={12} />
                  Criar
                </button>
              </div>
            ))}
          </div>
        </div>

      </main>
    </div>
  );
}
