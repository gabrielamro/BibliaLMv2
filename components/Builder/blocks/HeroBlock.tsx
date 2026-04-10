import React from 'react';
import { Sparkles, Image as ImageIcon, X } from 'lucide-react';
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
            style={{ 
              color: data.textColor || '#ffffff',
              fontFamily: data.fontFamily || 'inherit',
              fontSize: data.fontSize ? `${data.fontSize * 2}px` : undefined
            }}
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
              style={{ 
                color: data.textColor ? `${data.textColor}cc` : 'rgba(255,255,255,0.9)',
                fontFamily: data.fontFamily || 'inherit',
                fontSize: data.fontSize ? `${data.fontSize}px` : undefined,
                lineHeight: data.lineHeight || 'inherit'
              }}
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
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onUpdate?.({ ...data, showCta: true, ctaText: 'Garanta sua Vaga', ctaStyle: 'solid' });
              }}
              className="mt-4 px-6 py-2 border-2 border-dashed border-bible-gold/40 text-bible-gold/60 text-xs font-bold rounded-xl hover:border-bible-gold hover:text-bible-gold transition-all active:scale-95 z-30"
            >
              + Adicionar Botão (CTA)
            </button>
          ) : (data.showCta !== false && data.ctaText) && (
            <div className="relative group/cta mt-4 flex justify-center">
              <button 
               className={`px-8 py-3 font-bold rounded-xl shadow-lg transition-all hover:scale-105 outline-none focus:ring-2 focus:ring-bible-gold/50 ${
                 data.ctaStyle === 'outline' ? 'border-2 border-bible-gold text-bible-gold bg-transparent hover:bg-bible-gold/5'
                 : data.ctaStyle === 'subtle' ? 'bg-bible-gold/10 text-bible-gold hover:bg-bible-gold/20'
                 : data.ctaStyle === 'glass' ? 'bg-white/20 backdrop-blur-md border border-white/30 text-white hover:bg-white/30'
                 : data.ctaStyle === 'dark' ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900 shadow-xl'
                 : 'bg-bible-gold text-white hover:bg-bible-gold/90' // solid default
               }`}
                contentEditable={isEditing}
                suppressContentEditableWarning={true}
                onBlur={(e) => onUpdate?.({ ...data, ctaText: e.currentTarget.textContent || '' })}
              >
                {data.ctaText}
              </button>

             {isEditing && (
               <div className="absolute top-full left-1/2 -translate-x-1/2 pt-2 opacity-0 group-hover/cta:opacity-100 transition-opacity z-50 pointer-events-none group-hover/cta:pointer-events-auto hidden md:flex justify-center">
                 <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-1.5 rounded-2xl shadow-2xl flex gap-1.5 items-center">
                    <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
                       <button onClick={() => onUpdate?.({...data, ctaStyle: 'solid'})} className={`p-1.5 rounded-lg text-[10px] uppercase font-bold px-3 transition-colors ${(!data.ctaStyle || data.ctaStyle === 'solid') ? 'bg-white dark:bg-gray-700 shadow-sm text-bible-gold' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>Sólido</button>
                       <button onClick={() => onUpdate?.({...data, ctaStyle: 'outline'})} className={`p-1.5 rounded-lg text-[10px] uppercase font-bold px-3 transition-colors ${data.ctaStyle === 'outline' ? 'bg-white dark:bg-gray-700 shadow-sm text-bible-gold' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>Contorno</button>
                       <button onClick={() => onUpdate?.({...data, ctaStyle: 'subtle'})} className={`p-1.5 rounded-lg text-[10px] uppercase font-bold px-3 transition-colors ${data.ctaStyle === 'subtle' ? 'bg-white dark:bg-gray-700 shadow-sm text-bible-gold' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>Suave</button>
                       <button onClick={() => onUpdate?.({...data, ctaStyle: 'glass'})} className={`p-1.5 rounded-lg text-[10px] uppercase font-bold px-3 transition-colors ${data.ctaStyle === 'glass' ? 'bg-white dark:bg-gray-700 shadow-sm text-bible-gold' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>Glass</button>
                    </div>
                   <div className="w-px h-6 bg-gray-200 dark:bg-gray-800 mx-0.5"></div>
                   <button 
                     onClick={() => onUpdate?.({ ...data, showCta: false })}
                     className="w-8 h-8 bg-red-50 hover:bg-red-500 text-red-500 hover:text-white rounded-xl flex items-center justify-center transition-colors"
                     title="Remover botão"
                   >
                     <X size={16} />
                   </button>
                 </div>
               </div>
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
             <div className="absolute bottom-4 right-4 z-[60] opacity-0 group-hover:opacity-100 transition-opacity">
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
