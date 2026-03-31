import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Play, Pause, ImagePlus, X, Minimize2, Square, Maximize2, ImageIcon } from 'lucide-react';
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
    <div className="relative group/slide-main">
      {/* Slide Container */}
      <div className={`relative ${heightClasses[data.height] || 'h-80 md:h-96'} overflow-hidden rounded-lg group`} style={bgStyle}>
        {/* Overlay */}
        <div className="absolute inset-0" style={overlayStyle} />

        {/* Content */}
        <div className="relative z-10 h-full flex items-center justify-center p-8 text-white text-center">
          <div 
            className="prose prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: currentSlideData.content || '<p>Adicione conteúdo ao slide</p>' }}
          />
        </div>

        {isEditing && (
          <div className="absolute top-4 right-4 z-30 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur p-2.5 rounded-2xl shadow-2xl flex flex-col gap-2 scale-90 origin-top-right">
                <div className="flex items-center gap-2">
                  <ImageIcon size={14} className="text-bible-gold" />
                  <input 
                    type="text" 
                    value={currentSlideData.backgroundImage || ''} 
                    onChange={(e) => updateSlide(currentSlideData.id, { backgroundImage: e.target.value })}
                    placeholder="URL fundo slide..."
                    className="w-36 px-2 py-1 bg-gray-100 dark:bg-gray-800 border-none rounded-lg text-[10px] outline-none"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
                <ImageUploadButton 
                  onUpload={(url: string) => updateSlide(currentSlideData.id, { backgroundImage: url })} 
                  label="Mudar Fundo"
                  className="w-full"
                />
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="absolute inset-0 z-20 flex items-center justify-between px-4 opacity-0 hover:opacity-100 transition-opacity">
          <button onClick={prevSlide} className="p-2 bg-black/30 hover:bg-black/50 text-white rounded-full transition-colors">
            <ChevronLeft size={24} />
          </button>
          <button onClick={nextSlide} className="p-2 bg-black/30 hover:bg-black/50 text-white rounded-full transition-colors">
            <ChevronRight size={24} />
          </button>
        </div>

        {/* Indicators */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
          {slides.map((_: any, idx: number) => (
            <button
              key={idx}
              onClick={() => goToSlide(idx)}
              className={`w-2 h-2 rounded-full transition-all ${idx === currentSlide ? 'bg-white w-6' : 'bg-white/40'}`}
            />
          ))}
        </div>
      </div>
      
      {isEditing && (
        <div className="mt-4 flex flex-wrap gap-2">
           <button onClick={addSlide} className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-lg text-xs font-bold hover:bg-bible-gold hover:text-white transition-colors">
             + Adicionar Slide
           </button>
           {slides.map((s: any, idx: number) => (
             <button 
               key={s.id} 
               onClick={() => goToSlide(idx)}
               className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${idx === currentSlide ? 'bg-bible-gold text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-400'}`}
             >
               Slide {idx + 1}
               {slides.length > 1 && (
                 <span onClick={(e) => removeSlide(s.id, e)} className="ml-2 hover:text-red-500">×</span>
               )}
             </button>
           ))}
        </div>
      )}
    </div>
  );
};
