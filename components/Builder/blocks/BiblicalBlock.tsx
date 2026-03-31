import React from 'react';
import { ImageIcon } from 'lucide-react';
import { ImageUploadButton } from '../ImageUploadButton';

interface BiblicalBlockProps {
  data: any;
  onUpdate?: (data: any) => void;
  isEditing: boolean;
}

export const BiblicalBlock: React.FC<BiblicalBlockProps> = ({ data, onUpdate, isEditing }) => {
  const handleTextChange = (e: React.FocusEvent<HTMLElement>) => {
    onUpdate?.({ ...data, text: e.currentTarget.textContent || '' });
  };

  const handleRefChange = (e: React.FocusEvent<HTMLElement>) => {
    onUpdate?.({ ...data, reference: e.currentTarget.textContent || '' });
  };

  return (
    <div className="w-full py-4 px-6">
      <div className="text-center relative">
        {data.showImage !== false && (
          <div className="w-full h-64 md:h-96 rounded-2xl overflow-hidden mb-8 shadow-xl relative group">
            <img 
              src={data.imageUrl || 'https://images.unsplash.com/photo-1507692049790-de58290a4334?w=800'} 
              alt="Biblical artwork"
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            {isEditing && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur p-4 rounded-2xl shadow-2xl text-center">
                  <ImageIcon size={24} className="mx-auto mb-2 text-bible-gold" />
                  <p className="text-xs font-bold uppercase tracking-widest mb-2">Imagem de Fundo</p>
                  <div className="flex flex-col gap-2">
                    <input 
                      type="text" 
                      value={data.imageUrl || ''} 
                      onChange={(e) => onUpdate?.({ ...data, imageUrl: e.target.value })}
                      placeholder="URL da imagem (Unsplash, etc)"
                      className="w-48 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 border-none rounded-lg text-[10px] outline-none focus:ring-1 focus:ring-bible-gold"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <ImageUploadButton 
                      onUpload={(url: string) => onUpdate?.({ ...data, imageUrl: url })} 
                      label="Fazer Upload"
                      className="w-full"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        <blockquote 
          className={`text-base md:text-lg lg:text-xl font-serif italic text-bible-ink dark:text-white mb-6 leading-relaxed outline-none transition-all ${isEditing ? 'hover:bg-bible-gold/5 focus:bg-bible-gold/5 rounded-xl px-4 py-2 ring-1 ring-transparent focus:ring-bible-gold/20' : ''}`}
          contentEditable={isEditing}
          onBlur={handleTextChange}
          suppressContentEditableWarning
        >
          "{data.text || 'Digite o versículo bíblico aqui...'}"
        </blockquote>
        <cite className="text-bible-gold font-bold text-sm flex items-center justify-center gap-1">
          — 
          <span
            contentEditable={isEditing}
            onBlur={handleRefChange}
            suppressContentEditableWarning
            className={`min-w-[50px] outline-none transition-all ${isEditing ? 'hover:bg-bible-gold/5 focus:bg-bible-gold/5 rounded-lg px-2 py-1 ring-1 ring-transparent focus:ring-bible-gold/20' : ''}`}
          >
            {data.reference || 'Referência Bíblica'}
          </span>
        </cite>

        {/* CTA Button */}
        {isEditing && (data.showCta === false || !data.ctaText) ? (
          <div className="mt-8 flex justify-center">
            <button 
              onClick={() => onUpdate?.({ ...data, showCta: true, ctaText: 'Quero Prosperar' })}
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
