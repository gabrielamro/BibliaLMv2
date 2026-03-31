import React from 'react';
import { Video, Edit2 } from 'lucide-react';

interface VideoBlockProps {
  data: any;
  onUpdate?: (data: any) => void;
  isEditing: boolean;
}

export const VideoBlock: React.FC<VideoBlockProps> = ({ data, onUpdate, isEditing }) => {
  const handleTitleChange = (e: React.FocusEvent<HTMLElement>) => {
    onUpdate?.({ ...data, title: e.currentTarget.textContent || '' });
  };

  return (
    <div className="w-full py-4 px-6">
      <div className="w-full relative group">
        {data.url ? (
          <div className="aspect-video bg-gray-900 rounded-2xl overflow-hidden shadow-2xl relative">
            <iframe
              src={data.url.replace('watch?v=', 'embed/')}
              title={data.title}
              className="w-full h-full"
              allowFullScreen
            />
            {isEditing && (
              <div className="absolute top-4 right-4 z-20">
                <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur p-3 rounded-2xl shadow-2xl flex items-center gap-2">
                  <Video size={16} className="text-bible-gold" />
                  <input 
                    type="text" 
                    value={data.url || ''} 
                    onChange={(e) => onUpdate?.({ ...data, url: e.target.value })}
                    placeholder="URL do Vídeo (YouTube)"
                    className="w-48 px-3 py-1 bg-gray-100 dark:bg-gray-800 border-none rounded-lg text-xs outline-none"
                  />
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="aspect-video bg-gray-100 dark:bg-gray-800 rounded-2xl flex flex-col items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-700 p-8">
            <Video size={48} className="text-gray-400 mb-4 opacity-20" />
            <p className="font-bold text-gray-500 mb-4">Adicione um vídeo do YouTube</p>
            <input 
              type="text" 
              value={data.url || ''} 
              onChange={(e) => onUpdate?.({ ...data, url: e.target.value })}
              placeholder="Cole a URL aqui..."
              className="w-full max-w-md px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-bible-gold/20"
            />
          </div>
        )}
        
        <h3 
          className={`text-xl md:text-2xl font-bold text-bible-ink dark:text-white mt-6 text-center outline-none transition-all ${isEditing ? 'hover:bg-bible-gold/5 focus:bg-bible-gold/5 rounded-xl px-4 py-2 ring-1 ring-transparent focus:ring-bible-gold/20' : ''}`}
          contentEditable={isEditing}
          onBlur={handleTitleChange}
          suppressContentEditableWarning
        >
          {data.title || 'Título do Vídeo'}
        </h3>

        {/* CTA Button */}
        {isEditing && (data.showCta === false || !data.ctaText) ? (
          <div className="mt-8 flex justify-center">
            <button 
              onClick={() => onUpdate?.({ ...data, showCta: true, ctaText: 'Quero Assistir Mais' })}
              className="px-6 py-2 border-2 border-dashed border-bible-gold/40 text-bible-gold/60 text-xs font-bold rounded-xl hover:border-bible-gold hover:text-bible-gold transition-all"
            >
              + Adicionar Botão (CTA)
            </button>
          </div>
        ) : (data.showCta !== false && data.ctaText) && (
          <div className="relative group/cta mt-8 flex justify-center">
             <button 
               className="px-8 py-3 bg-bible-gold text-white font-bold rounded-xl shadow-lg hover:bg-bible-gold/90 transition-all hover:scale-105"
               style={{ 
                 backgroundColor: data.ctaColor || 'var(--bible-gold)',
                 color: data.ctaTextColor || '#ffffff'
               }}
               contentEditable={isEditing}
               suppressContentEditableWarning={true}
               onBlur={(e) => onUpdate?.({ ...data, ctaText: e.currentTarget.textContent || '' })}
             >
               {data.ctaText}
             </button>
             {isEditing && (
                <button 
                  onClick={() => onUpdate?.({ ...data, showCta: false })}
                  className="absolute -top-2 translate-x-[60px] w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover/cta:opacity-100 transition-opacity shadow-lg text-[10px] z-20"
                  title="Remover botão"
                >
                  ×
                </button>
             )}
          </div>
        )}
      </div>
    </div>
  );
};
