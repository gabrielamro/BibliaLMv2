import React from 'react';
import { Sparkles, Image as ImageIcon } from 'lucide-react';

interface HeroBlockProps {
  data: any;
  onUpdate?: (data: any) => void;
  isEditing: boolean;
  authorName?: string;
}

export const HeroBlock: React.FC<HeroBlockProps> = ({ data, onUpdate, isEditing, authorName }) => {
  return (
    <div className="relative min-h-[300px] md:min-h-[400px] flex items-center justify-center py-16 px-4">
      <div className={`w-full relative z-10 ${data.alignment === 'left' ? 'text-left' : data.alignment === 'right' ? 'text-right' : 'text-center'}`}>
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
            className="text-xl md:text-2xl lg:text-3xl font-bold mb-3"
            style={{ color: data.textColor || '#ffffff' }}
            contentEditable={isEditing}
            onBlur={(e) => onUpdate?.({ ...data, title: e.currentTarget.textContent || '' })}
          >
            {data.title || 'Título do Estudo'}
          </h1>
          
          {/* Subtítulo */}
          {(data.showSubtitle !== false) && data.subtitle && (
            <p 
              className="text-sm md:text-base mb-6 max-w-2xl"
              style={{ color: data.textColor ? `${data.textColor}cc` : 'rgba(255,255,255,0.9)' }}
              contentEditable={isEditing}
              onBlur={(e) => onUpdate?.({ ...data, subtitle: e.currentTarget.textContent || '' })}
            >
              {data.subtitle}
            </p>
          )}
          
          {/* CTA */}
          {(data.showCta !== false) && data.ctaText && (
            <button 
              className="px-8 py-3 bg-bible-gold text-white font-bold rounded-xl shadow-lg hover:bg-bible-gold/90 transition-all hover:scale-105"
              style={{ 
                backgroundColor: data.ctaColor || 'var(--bible-gold)',
                color: data.ctaTextColor || '#ffffff'
              }}
              contentEditable={isEditing}
              onBlur={(e) => onUpdate?.({ ...data, ctaText: e.currentTarget.textContent || '' })}
            >
              {data.ctaText}
            </button>
          )}

          {/* Autor */}
          {data.showAuthor && authorName && (
            <div 
              className="mt-6 flex items-center gap-2 opacity-70 text-sm font-medium"
              style={{ color: data.textColor || '#ffffff' }}
            >
              <div className="w-1 h-1 bg-bible-gold rounded-full" />
              Por {authorName}
            </div>
          )}
        </div>
      </div>

      {/* Background/Overlay */}
      {data.backgroundImage && (
        <div className="absolute inset-0 overflow-hidden">
          <img 
            src={data.backgroundImage} 
            alt="Hero Background" 
            className="w-full h-full object-cover"
          />
          <div 
            className="absolute inset-0" 
            style={{ 
              backgroundColor: data.overlayColor || '#000000',
              opacity: data.overlayOpacity || 0.5 
            }} 
          />
          
          {isEditing && (
             <div className="absolute bottom-4 right-4 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur p-2 rounded-xl shadow-2xl flex items-center gap-2">
                  <ImageIcon size={16} className="text-bible-gold" />
                  <input 
                    type="text" 
                    value={data.backgroundImage || ''} 
                    onChange={(e) => onUpdate?.({ ...data, backgroundImage: e.target.value })}
                    placeholder="URL da imagem..."
                    className="w-48 px-3 py-1 bg-gray-100 dark:bg-gray-800 border-none rounded-lg text-xs outline-none"
                  />
                </div>
             </div>
          )}
        </div>
      )}
    </div>
  );
};
