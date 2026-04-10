import React from 'react';
import { ImageIcon, X, Quote, Type, Palette, Layout, Settings2 } from 'lucide-react';
import { ImageUploadButton } from '../ImageUploadButton';

interface BiblicalBlockProps {
  data: any;
  onUpdate?: (data: any) => void;
  isEditing: boolean;
}

export const BiblicalBlock: React.FC<BiblicalBlockProps> = ({ data, onUpdate, isEditing }) => {
  const containerStyle = data.style || 'classic';
  
  const handleTextChange = (e: React.FocusEvent<HTMLElement>) => {
    onUpdate?.({ ...data, text: e.currentTarget.textContent || '' });
  };

  const handleRefChange = (e: React.FocusEvent<HTMLElement>) => {
    onUpdate?.({ ...data, reference: e.currentTarget.textContent || '' });
  };

  const styles: Record<string, string> = {
    classic: "bg-white dark:bg-gray-900 border-2 border-bible-gold/20 p-6 md:p-10 rounded-[2.5rem] shadow-xl",
    modern: "bg-gradient-to-br from-bible-gold/5 to-transparent backdrop-blur-sm border border-bible-gold/10 p-6 md:p-8 rounded-3xl shadow-2xl",
    royal: "bg-gray-900 text-white border-t-4 border-b-4 border-bible-gold p-8 md:p-12 relative overflow-hidden shadow-2xl",
    minimal: "border-l-4 border-bible-gold pl-6 py-4 text-left",
    card: "bg-white dark:bg-gray-800 p-6 md:p-12 rounded-[3rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] border border-gray-100 dark:border-gray-700"
  };

  const textStyles: Record<string, string> = {
    classic: "text-2xl md:text-3xl font-serif italic text-bible-ink dark:text-gray-100",
    modern: "text-3xl md:text-4xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-bible-gold to-amber-700",
    royal: "text-2xl md:text-4xl font-serif italic text-white drop-shadow-md",
    minimal: "text-xl md:text-3xl font-medium text-gray-700 dark:text-gray-200",
    card: "text-2xl md:text-4xl font-serif text-bible-ink dark:text-white leading-tight"
  };

  return (
    <div className="w-full py-6 px-4 flex justify-center">
      <div className={`w-full max-w-4xl text-center relative transition-all duration-500 ${styles[containerStyle] || styles.classic}`}>
        
        {/* Style Selection Toolbar (Visible when editing) */}
        {isEditing && (
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 z-50 hidden md:flex items-center gap-1.5 p-1.5 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-2xl">
              <div className="flex bg-gray-50 dark:bg-gray-800 p-1 rounded-xl gap-0.5">
                {[
                  { id: 'classic', label: 'Clássico', icon: Quote },
                  { id: 'modern', label: 'Moderno', icon: Palette },
                  { id: 'royal', label: 'Realeza', icon: Type },
                  { id: 'minimal', label: 'Minimal', icon: Layout },
                  { id: 'card', label: 'Card Pro', icon: Settings2 },
                ].map(s => (
                  <button
                    key={s.id}
                    onClick={() => onUpdate?.({ ...data, style: s.id })}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${containerStyle === s.id ? 'bg-bible-gold text-white shadow-lg' : 'text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                  >
                    <s.icon size={12} /> {s.label}
                  </button>
                ))}
              </div>
              <div className="w-[1px] h-4 bg-gray-200 dark:bg-gray-800 mx-1" />
              <button 
                onClick={() => onUpdate?.({ ...data, showImage: !data.showImage })}
                className={`p-2 rounded-xl transition-all ${data.showImage ? 'text-bible-gold bg-bible-gold/10' : 'text-gray-400 hover:text-bible-gold hover:bg-bible-gold/5'}`}
                title="Habilitar/Desabilitar Imagem"
              >
                <ImageIcon size={16} />
              </button>
          </div>
        )}

        {/* Optional Image */}
        {data.showImage && (
          <div className="w-full aspect-[21/9] rounded-2xl overflow-hidden mb-10 shadow-2xl border-4 border-white dark:border-gray-800 rotate-1 relative group">
            <img 
              src={data.imageUrl || 'https://images.unsplash.com/photo-1504052434139-44b419d2826e?q=80&w=1000'} 
              alt="Biblical"
              className="w-full h-full object-cover"
            />
            {isEditing && (
              <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity p-6">
                <ImageUploadButton 
                   onUpload={(url) => onUpdate?.({ ...data, imageUrl: url })}
                   label="Mudar Imagem"
                   className="mb-2"
                />
                <button onClick={() => onUpdate?.({ ...data, showImage: false })} className="text-[10px] text-white/60 hover:text-red-400 font-bold uppercase tracking-widest">Remover Imagem</button>
              </div>
            )}
          </div>
        )}

        {/* Decorative elements for specific styles */}
        {containerStyle === 'classic' && (
          <div className="mb-6 text-bible-gold/20 flex justify-center">
            <Quote size={48} />
          </div>
        )}
        {containerStyle === 'royal' && (
           <div className="absolute inset-0 opacity-10 pointer-events-none">
              <div className="absolute top-0 left-0 w-32 h-32 border-l-2 border-t-2 border-bible-gold"></div>
              <div className="absolute bottom-0 right-0 w-32 h-32 border-r-2 border-b-2 border-bible-gold"></div>
           </div>
        )}

        <blockquote 
          className={`relative z-10 italic leading-relaxed outline-none transition-all ${textStyles[containerStyle] || textStyles.classic} ${isEditing ? 'cursor-text focus:bg-bible-gold/5 rounded-xl px-4' : ''}`}
          style={{ 
            fontFamily: data.fontFamily || 'inherit',
            fontSize: data.fontSize ? (containerStyle === 'minimal' ? `${data.fontSize}px` : `${data.fontSize * 1.5}px`) : 'inherit',
            lineHeight: data.lineHeight || 'inherit'
          }}
          contentEditable={isEditing}
          onBlur={handleTextChange}
          suppressContentEditableWarning
        >
          "{data.text || 'Digite o versículo bíblico aqui...'}"
        </blockquote>

        <div className={`mt-8 flex items-center gap-3 transition-all ${containerStyle === 'minimal' ? 'justify-start' : 'justify-center font-bold'}`}>
          <div className="w-12 h-px bg-bible-gold/30"></div>
          <cite 
            contentEditable={isEditing}
            onBlur={handleRefChange}
            suppressContentEditableWarning
            className={`text-bible-gold font-black uppercase tracking-[0.2em] text-sm outline-none ${isEditing ? 'cursor-text focus:bg-bible-gold/5 px-2 rounded-lg' : ''}`}
          >
            {data.reference || 'Referência Bíblica'}
          </cite>
          <div className="w-12 h-px bg-bible-gold/30"></div>
        </div>

        {/* CTA Button */}
        {(data.showCta || isEditing) && (
          <div className="mt-12 flex flex-col items-center gap-4">
            {isEditing && !data.showCta ? (
              <button 
                onClick={() => onUpdate?.({ ...data, showCta: true, ctaText: 'Saber Mais', ctaStyle: 'solid' })}
                className="text-[10px] font-black uppercase tracking-widest text-bible-gold/60 border-2 border-dashed border-bible-gold/20 px-8 py-3 rounded-2xl hover:border-bible-gold/40 transition-all hover:bg-bible-gold/5"
              >
                + Adicionar Botão de Ação
              </button>
            ) : data.showCta && (
              <div className="relative group/cta">
                <button 
                  className={`px-10 py-4 font-black uppercase tracking-widest text-xs rounded-2xl shadow-xl transition-all hover:scale-105 active:scale-95 outline-none ${
                    data.ctaStyle === 'outline' ? 'border-2 border-bible-gold text-bible-gold bg-transparent hover:bg-bible-gold/5 shadow-none'
                    : data.ctaStyle === 'royal' ? 'bg-gradient-to-r from-bible-gold to-amber-600 text-white shadow-bible-gold/30'
                    : data.ctaStyle === 'dark' ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900 shadow-xl'
                    : 'bg-bible-gold text-white' // default solid
                  }`}
                  contentEditable={isEditing}
                  suppressContentEditableWarning={true}
                  onBlur={(e) => onUpdate?.({ ...data, ctaText: e.currentTarget.textContent || '' })}
                >
                  {data.ctaText || 'Botão de Ação'}
                </button>
                {isEditing && (
                  <div className="absolute top-full left-1/2 -translate-x-1/2 pt-3 flex items-center gap-1.5 opacity-0 group-hover/cta:opacity-100 transition-all">
                     <div className="bg-white dark:bg-gray-900 p-1.5 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 flex items-center gap-1">
                        <button onClick={() => onUpdate?.({...data, ctaStyle: 'solid'})} className="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-lg text-[10px] font-bold">Solid</button>
                        <button onClick={() => onUpdate?.({...data, ctaStyle: 'outline'})} className="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-lg text-[10px] font-bold">Outline</button>
                        <button onClick={() => onUpdate?.({...data, ctaStyle: 'royal'})} className="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-lg text-[10px] font-bold text-bible-gold">Royal</button>
                        <div className="w-px h-6 bg-gray-200 dark:bg-gray-800 mx-1"></div>
                        <button onClick={() => onUpdate?.({...data, showCta: false})} className="p-1 text-red-500 hover:bg-red-50 rounded-lg"><X size={16} /></button>
                     </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
