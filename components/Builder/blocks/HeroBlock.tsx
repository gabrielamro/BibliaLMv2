import React from 'react';
import { Sparkles, Image as ImageIcon } from 'lucide-react';
import { ImageUploadButton } from '../ImageUploadButton';

interface HeroBlockProps {
  data: any;
  onUpdate?: (data: any) => void;
  isEditing: boolean;
  authorName?: string;
}

export const HeroBlock: React.FC<HeroBlockProps> = ({ data, onUpdate, isEditing, authorName }) => {
  return (
    <div className="relative min-h-[100px] md:min-h-[150px] flex items-center justify-center py-4 px-4 child:w-full">
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
            suppressContentEditableWarning={true}
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
              suppressContentEditableWarning={true}
              onBlur={(e) => onUpdate?.({ ...data, subtitle: e.currentTarget.textContent || '' })}
            >
              {data.subtitle}
            </p>
          )}
          
          {/* CTA */}
          {isEditing && (data.showCta === false || !data.ctaText) ? (
            <button 
              onClick={() => onUpdate?.({ ...data, showCta: true, ctaText: 'Garanta sua Vaga' })}
              className="mt-4 px-6 py-2 border-2 border-dashed border-bible-gold/40 text-bible-gold/60 text-xs font-bold rounded-xl hover:border-bible-gold hover:text-bible-gold transition-all"
            >
              + Adicionar Botão (CTA)
            </button>
          ) : (data.showCta !== false && data.ctaText) && (
            <div className="relative group/cta mt-4">
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
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover/cta:opacity-100 transition-opacity shadow-lg hover:scale-110 active:scale-90 z-20"
                  title="Excluir botão"
                >
                  <span className="text-sm">×</span>
                </button>
              )}
            </div>
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
        <div className="absolute inset-0 overflow-hidden group">
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
                <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur p-3 rounded-2xl shadow-2xl flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <ImageIcon size={16} className="text-bible-gold" />
                    <input 
                      type="text" 
                      value={data.backgroundImage || ''} 
                      onChange={(e) => onUpdate?.({ ...data, backgroundImage: e.target.value })}
                      placeholder="URL da imagem..."
                      className="w-48 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 border-none rounded-lg text-[10px] outline-none"
                    />
                  </div>
                  <ImageUploadButton 
                    onUpload={(url: string) => onUpdate?.({ ...data, backgroundImage: url })} 
                    label="Fazer Upload"
                    className="w-full"
                  />
                </div>
             </div>
          )}
        </div>
      )}
    </div>
  );
};
