import React, { useState, useEffect, useRef } from 'react';
import { Stage, Layer, Image as KonvaImage, Rect } from 'react-konva';
import { Html } from 'react-konva-utils';
import useImage from 'use-image';
import {
  ChevronLeft,
  ChevronRight,
  Trash2,
  X,
  ImageIcon,
  Edit3,
  Plus,
  BookOpen,
  Video,
  Type,
  Layout,
  Upload,
  Settings2
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { ImageUploadButton } from '../ImageUploadButton';

interface SlideBlockProps {
  data: any;
  onUpdate?: (data: any) => void;
  isEditing: boolean;
  authorName?: string;
}

export const SlideBlock: React.FC<SlideBlockProps> = ({ data, onUpdate, isEditing, authorName }) => {
  const { showNotification } = useAuth();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(data.autoplay || false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  const slides = data.slides || [];
  const currentSlideData = slides[currentSlide] || {};
  const intervalRef = useRef<any>(null);

  const heightClasses: Record<string, string> = {
    small: 'h-64',
    medium: 'h-80 md:h-96',
    large: 'h-[500px] md:h-[600px]'
  };

  const [bgImage] = useImage(currentSlideData.backgroundImage || '');
  const [contentImage] = useImage(currentSlideData.mediaUrl || '');
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const node = containerRef.current;
    if (!node || typeof ResizeObserver === 'undefined') return;

    const updateSize = () => {
      const rect = node.getBoundingClientRect();
      setDimensions({ width: rect.width, height: rect.height });
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

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
    if (isPlaying) setIsPlaying(false);
  };

  const addSlide = () => {
    const newSlide = {
      id: `slide-${Date.now()}`,
      backgroundImage: 'https://images.unsplash.com/photo-1509021436665-8f07dbf5bf1d',
      type: 'image',
      title: 'A Palavra de Deus',
      description: 'Pois a palavra de Deus é viva, e eficaz, e mais cortante que qualquer espada de dois gumes, e que penetra até a divisão de alma e espírito, e de juntas e medulas, e pronta para discernir as disposições e pensamentos do coração. Hebreus 4:12',
      mediaUrl: 'https://images.unsplash.com/photo-1509021436665-8f07dbf5bf1d',
      overlayOpacity: 0.6,
      layout: 'image-right'
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
    showNotification('Slide removido', 'info');
  };

  const updateSlide = (id: string, updates: any) => {
    const newSlides = slides.map((s: any) => s.id === id ? { ...s, ...updates } : s);
    onUpdate?.({ ...data, slides: newSlides });
  };

  return (
    <div className="relative group/slide-main">
      {/* Slide Canvas Container */}
      <div
        ref={containerRef}
        className={`relative ${heightClasses[data.height] || 'h-80 md:h-96'} overflow-hidden rounded-3xl group bg-gray-900 shadow-2xl transition-all duration-500`}
      >
        <Stage width={dimensions.width} height={dimensions.height}>
          <Layer>
            {bgImage && (
              <KonvaImage
                image={bgImage}
                width={bgImage.width}
                height={bgImage.height}
                scaleX={Math.max(dimensions.width / (bgImage.width || 1), dimensions.height / (bgImage.height || 1))}
                scaleY={Math.max(dimensions.width / (bgImage.width || 1), dimensions.height / (bgImage.height || 1))}
                offsetX={(bgImage.width || 0) / 2}
                offsetY={(bgImage.height || 0) / 2}
                x={dimensions.width / 2}
                y={dimensions.height / 2}
                opacity={1}
              />
            )}
          </Layer>
          <Layer listening={false}>
            <Rect
              x={0}
              y={0}
              width={dimensions.width}
              height={dimensions.height}
              fill={`rgba(0, 0, 0, ${currentSlideData.overlayOpacity || 0.4})`}
            />
          </Layer>
          <Layer>
            {dimensions.width > 0 && dimensions.height > 0 && (
              <Html divProps={{ style: { position: 'absolute', inset: 0, width: '100%', height: '100%' } }}>
                <div className="relative z-10 h-full flex items-center justify-center p-8 md:p-12 text-white">
                  <div className={`w-full max-w-5xl flex flex-col md:flex-row items-center gap-8 ${currentSlideData.layout === 'image-left' ? 'md:flex-row-reverse' : ''}`}>

                    {/* Content Section */}
                    <div className="flex-1 text-center md:text-left space-y-4">
                      <h2
                        contentEditable={isEditing}
                        suppressContentEditableWarning={true}
                        onBlur={(e) => updateSlide(currentSlideData.id, { title: e.currentTarget.innerText })}
                        className={`text-3xl md:text-5xl font-black drop-shadow-lg leading-tight outline-none ${isEditing ? 'cursor-text hover:bg-white/10 rounded-lg px-2 -mx-2 transition-colors' : ''}`}
                      >
                        {currentSlideData.title || ''}
                      </h2>
                      <div
                        contentEditable={isEditing}
                        suppressContentEditableWarning={true}
                        onBlur={(e) => updateSlide(currentSlideData.id, { description: e.currentTarget.innerText })}
                        className={`text-base md:text-lg text-white/80 max-w-2xl mx-auto md:mx-0 leading-relaxed font-medium outline-none ${isEditing ? 'cursor-text hover:bg-white/10 rounded-lg px-2 -mx-2 transition-colors' : ''}`}
                      >
                        {currentSlideData.description || ''}
                      </div>
                    </div>

                    {/* Media Section */}
                    {(currentSlideData.type !== 'text' || currentSlideData.mediaUrl) && (
                      <div className="flex-1 w-full flex justify-center">
                        {currentSlideData.type === 'video' ? (
                          <div className="w-full aspect-video bg-black/40 rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
                            <iframe
                              src={currentSlideData.mediaUrl?.replace('watch?v=', 'embed/')}
                              className="w-full h-full"
                              allowFullScreen
                            />
                          </div>
                        ) : currentSlideData.mediaUrl ? (
                          <div className="relative group/media max-w-md w-full">
                            <img
                              src={currentSlideData.mediaUrl}
                              alt="Slide Content"
                              onError={(e) => {
                                e.currentTarget.src = 'https://images.unsplash.com/photo-1509021436665-8f07dbf5bf1d?q=80&w=1000';
                              }}
                              className="w-full h-auto rounded-2xl shadow-2xl border border-white/20 transform group-hover/media:scale-[1.02] transition-transform duration-500"
                            />
                          </div>
                        ) : null}
                      </div>
                    )}
                  </div>
                </div>
              </Html>
            )}
          </Layer>
        </Stage>

        {/* Floating Quick Controls */}
        {isEditing && (
          <div className="absolute bottom-6 right-6 z-[60] flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0 duration-300">
            <button
              onClick={() => setIsEditorOpen(true)}
              className="bg-bible-gold text-white px-4 py-2.5 rounded-2xl font-black uppercase tracking-widest flex items-center gap-2 shadow-xl hover:scale-105 active:scale-95 transition-all text-[10px]"
            >
              <Edit3 size={14} /> Editar Slide
            </button>
          </div>
        )}

        {/* Global Nav Arrows */}
        <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 z-20 flex justify-between pointer-events-none">
          <button onClick={() => goToSlide((currentSlide - 1 + slides.length) % slides.length)} className="p-3 bg-black/20 hover:bg-black/50 text-white rounded-full transition-all hover:scale-110 active:scale-90 pointer-events-auto backdrop-blur-sm group/nav">
            <ChevronLeft size={24} className="group-hover/nav:-translate-x-1 transition-transform" />
          </button>
          <button onClick={() => goToSlide((currentSlide + 1) % slides.length)} className="p-3 bg-black/20 hover:bg-black/50 text-white rounded-full transition-all hover:scale-110 active:scale-90 pointer-events-auto backdrop-blur-sm group/nav">
            <ChevronRight size={24} className="group-hover/nav:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* Indicators */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-1.5 p-1.5 bg-black/20 backdrop-blur-md rounded-full">
          {slides.map((_: any, idx: number) => (
            <button
              key={idx}
              onClick={() => goToSlide(idx)}
              className={`w-1.5 h-1.5 rounded-full transition-all duration-500 ${idx === currentSlide ? 'bg-bible-gold w-6' : 'bg-white/40 hover:bg-white/60'}`}
            />
          ))}
        </div>
      </div>

      {/* Footer Editor UI */}
      {isEditing && (
        <div className="mt-8 relative z-[60]">
          <div className="flex items-center justify-between mb-4 px-2">
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Gerenciador de Slides ({slides.length})</h4>
            <button
              onClick={addSlide}
              className="flex items-center gap-1.5 text-xs font-bold text-bible-gold hover:bg-bible-gold/10 px-3 py-1.5 rounded-xl transition-all"
            >
              <Plus size={14} /> Novo Slide
            </button>
          </div>

          <div className="flex flex-wrap gap-3">
            {slides.map((s: any, idx: number) => (
              <div
                key={s.id}
                className={`group/item flex items-center gap-1 p-1.5 pr-2.5 rounded-2xl border-2 transition-all ${idx === currentSlide ? 'border-bible-gold bg-bible-gold/5 shadow-lg shadow-bible-gold/5 scale-105' : 'border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700 bg-white dark:bg-gray-900/50'}`}
              >
                <button
                  onClick={() => goToSlide(idx)}
                  className="flex items-center gap-2"
                >
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs ${idx === currentSlide ? 'bg-bible-gold text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 group-hover/item:bg-bible-gold/10 group-hover/item:text-bible-gold'}`}>
                    {idx + 1}
                  </div>
                  <div className="text-left">
                    <p className={`text-[10px] font-bold truncate max-w-[80px] ${idx === currentSlide ? 'text-bible-gold' : 'text-gray-600 dark:text-gray-400'}`}>
                      {s.title || 'Sem título'}
                    </p>
                  </div>
                </button>

                {slides.length > 1 && (
                  <button
                    onClick={(e) => removeSlide(s.id, e)}
                    className="w-6 h-6 flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all ml-1"
                    title="Excluir Slide"
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Slide Editor Modal */}
      {isEditorOpen && currentSlideData && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsEditorOpen(false)} />
          <div className="relative w-full max-w-2xl bg-white dark:bg-gray-900 rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">

            {/* Header */}
            <div className="bg-bible-gold/5 p-8 flex items-center justify-between border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-bible-gold rounded-2xl flex items-center justify-center text-white shadow-lg">
                  <Layout size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-bible-ink dark:text-white uppercase tracking-tight">Editar Slide {currentSlide + 1}</h3>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Configurações de conteúdo e mídia</p>
                </div>
              </div>
              <button onClick={() => setIsEditorOpen(false)} className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 rounded-xl transition-all">
                <X size={24} />
              </button>
            </div>

            {/* Content */}
            <div className="p-8 space-y-6 max-h-[60vh] overflow-y-auto custom-scrollbar">

              {/* Type Selection */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'text', label: 'Apenas Texto', icon: Type },
                  { id: 'image', label: 'Texto + Imagem', icon: ImageIcon },
                  { id: 'video', label: 'Texto + Vídeo', icon: Video },
                ].map(t => (
                  <button
                    key={t.id}
                    onClick={() => updateSlide(currentSlideData.id, { type: t.id })}
                    className={`p-4 rounded-3xl border-2 flex flex-col items-center gap-2 transition-all ${currentSlideData.type === t.id ? 'border-bible-gold bg-bible-gold/5 text-bible-gold shadow-lg shadow-bible-gold/5' : 'border-gray-100 dark:border-gray-800 text-gray-400 hover:border-gray-200 active:scale-95'}`}
                  >
                    <t.icon size={20} />
                    <span className="text-[10px] font-black uppercase tracking-wider">{t.label}</span>
                  </button>
                ))}
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Left Side: Basic Info */}
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-2 px-1">Título do Slide</label>
                    <input
                      type="text"
                      value={currentSlideData.title}
                      onChange={(e) => updateSlide(currentSlideData.id, { title: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-none rounded-2xl text-sm font-bold focus:ring-2 ring-bible-gold/30 transition-all font-sans"
                      placeholder="Título Principal"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-2 px-1">Descrição</label>
                    <textarea
                      rows={4}
                      value={currentSlideData.description}
                      onChange={(e) => updateSlide(currentSlideData.id, { description: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-none rounded-2xl text-sm font-medium focus:ring-2 ring-bible-gold/30 transition-all resize-none font-sans"
                      placeholder="Conteúdo detalhado do slide..."
                    />
                  </div>
                </div>

                {/* Right Side: Media & Style */}
                <div className="space-y-4">
                  {currentSlideData.type !== 'text' && (
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-2 px-1">
                        {currentSlideData.type === 'video' ? 'URL do Vídeo (YouTube)' : 'Imagem de Conteúdo'}
                      </label>
                      <div className="space-y-2">
                        <div className="relative">
                          {currentSlideData.type === 'video' ? <Video size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-bible-gold" /> : <ImageIcon size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-bible-gold" />}
                          <input
                            type="text"
                            value={currentSlideData.mediaUrl}
                            onChange={(e) => updateSlide(currentSlideData.id, { mediaUrl: e.target.value })}
                            className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border-none rounded-2xl text-xs font-bold focus:ring-2 ring-bible-gold/30 transition-all"
                            placeholder="Cole o link aqui..."
                          />
                        </div>
                        {currentSlideData.type === 'image' && (
                          <ImageUploadButton
                            onUpload={(url) => updateSlide(currentSlideData.id, { mediaUrl: url })}
                            label="Fazer Upload da Imagem"
                            className="w-full py-3"
                          />
                        )}
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-2 px-1">Background do Slide</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={currentSlideData.backgroundImage}
                        onChange={(e) => updateSlide(currentSlideData.id, { backgroundImage: e.target.value })}
                        className="flex-1 px-4 py-3 bg-gray-50 dark:bg-gray-800 border-none rounded-2xl text-[10px] font-bold focus:ring-2 ring-bible-gold/30"
                        placeholder="URL do fundo..."
                      />
                      <ImageUploadButton
                        onUpload={(url) => updateSlide(currentSlideData.id, { backgroundImage: url })}
                        label="Upload"
                        className="px-4"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-2 px-1">Opacidade Overlay</label>
                      <input
                        type="range" min="0" max="1" step="0.1"
                        value={currentSlideData.overlayOpacity}
                        onChange={(e) => updateSlide(currentSlideData.id, { overlayOpacity: parseFloat(e.target.value) })}
                        className="w-full accent-bible-gold"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-2 px-1">Layout</label>
                      <button
                        onClick={() => updateSlide(currentSlideData.id, { layout: currentSlideData.layout === 'image-left' ? 'image-right' : 'image-left' })}
                        className="w-full py-2.5 bg-gray-50 dark:bg-gray-800 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-gray-100 transition-all"
                      >
                        <Settings2 size={12} /> Inverter Lados
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="p-8 pt-0 flex gap-3">
              <button
                onClick={() => setIsEditorOpen(false)}
                className="flex-1 py-4 bg-gray-100 dark:bg-gray-800 text-gray-500 rounded-3xl font-black uppercase tracking-widest text-xs hover:bg-gray-200 transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={() => setIsEditorOpen(false)}
                className="flex-[2] py-4 bg-bible-gold text-white rounded-3xl font-black uppercase tracking-widest text-xs shadow-xl shadow-bible-gold/20 hover:scale-[1.02] active:scale-95 transition-all"
              >
                Salvar Slide
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
