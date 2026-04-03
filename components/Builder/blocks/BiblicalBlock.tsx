import React from 'react';
import { ImageIcon, X } from 'lucide-react';
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
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-50">
                <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur p-4 rounded-2xl shadow-2xl text-center relative">
                  <ImageIcon size={24} className="mx-auto mb-2 text-bible-gold" />
                  <p className="text-xs font-bold uppercase tracking-widest mb-2">Imagem de Fundo</p>
                  <div className="flex flex-col gap-2">
                    <input 
                      type="text" 
                      value={data.imageUrl || ''} 
                      onChange={(e) => onUpdate?.({ ...data, imageUrl: e.target.value })}
                      placeholder="URL da imagem (Unsplash, etc)"
                      className="w-48 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 border-none rounded-lg text-[10px] outline-none focus:ring-1 focus:ring-bible-gold"
                    />
                    <ImageUploadButton 
                      onUpload={(url: string) => onUpdate?.({ ...data, imageUrl: url })} 
                      label="Fazer Upload"
                      className="w-full"
                    />
                  </div>
                </div>

                {/* Botão X realocado para dentro do overlay interativo */}
                <button 
                  onClick={() => onUpdate?.({ ...data, showImage: false, imageUrl: '' })}
                  className="absolute top-4 right-4 w-12 h-12 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all border-4 border-white z-[60]"
                  title="Remover imagem"
                >
                  <X size={28} />
                </button>
              </div>
            )}
          </div>
        )}
        {isEditing && data.showImage === false && (
          <div className="mb-8 flex justify-center">
            <button 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onUpdate?.({ ...data, showImage: true });
              }}
              className="px-6 py-2 border-2 border-dashed border-bible-gold/40 text-bible-gold/60 text-xs font-bold rounded-xl hover:border-bible-gold hover:text-bible-gold transition-all flex items-center gap-2 active:scale-95 z-30"
            >
              <ImageIcon size={16} />
              + Adicionar Imagem
            </button>
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
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onUpdate?.({ ...data, showCta: true, ctaText: 'Quero Prosperar', ctaStyle: 'solid' });
              }}
              className="px-8 py-3 border-2 border-dashed border-bible-gold/40 text-bible-gold/60 text-sm font-bold rounded-xl hover:border-bible-gold hover:text-bible-gold transition-all active:scale-95 z-30"
            >
              + Adicionar Botão (CTA)
            </button>
          </div>
        ) : (data.showCta !== false && data.ctaText) && (
          <div className="relative group/cta mt-8 flex justify-center">
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
               <div className="absolute top-full left-1/2 -translate-x-1/2 pt-2 opacity-0 group-hover/cta:opacity-100 transition-opacity z-50 pointer-events-none group-hover/cta:pointer-events-auto flex justify-center">
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
      </div>
    </div>
  );
};
