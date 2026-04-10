import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  ChevronUp, 
  ChevronDown, 
  Copy, 
  Settings2, 
  Sparkle, 
  Palette, 
  Type as TextIcon, 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  AlignJustify, 
  Image as ImageIcon,
  User,
  BookOpen,
  Video,
  Layers,
  LayoutTemplate,
  Maximize2,
  X,
  Quote,
  Type
} from 'lucide-react';
import { Block, BlockType } from './types';
import { ImageUploadButton } from './ImageUploadButton';

interface BlockPropertiesProps {
  block: Block;
  onUpdate?: (data: any) => void;
  onClose?: () => void;
  isEditing: boolean;
}

export const BlockProperties: React.FC<BlockPropertiesProps> = ({ block, onUpdate, onClose, isEditing }) => {
  const [localData, setLocalData] = useState(block.data);

  useEffect(() => {
    setLocalData(block.data);
  }, [block.id, block.data]);

  const handleChange = (key: string, value: any) => {
    const newData = { ...localData, [key]: value };
    setLocalData(newData);
    onUpdate?.(newData);
  };

  if (!isEditing) return null;

  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Seção de Estilo Visual */}
      {(block.type === 'biblical') && (
        <div className="bg-gray-50/50 dark:bg-gray-800/30 p-4 rounded-[2rem] border border-gray-100 dark:border-gray-800">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 block px-1">Estilo do Versículo</label>
          
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'classic', label: 'Classic', icon: Quote },
              { id: 'modern', label: 'Modern', icon: Palette },
              { id: 'royal', label: 'Royal', icon: Type },
              { id: 'minimal', label: 'Minimal', icon: LayoutTemplate },
              { id: 'card', label: 'Card Pro', icon: Settings2 },
            ].map(s => (
              <button
                key={s.id}
                onClick={() => handleChange('style', s.id)}
                className={`flex flex-col items-center justify-center gap-2 p-3 rounded-2xl border-2 transition-all ${localData.style === s.id || (!localData.style && s.id === 'classic') ? 'border-bible-gold bg-white dark:bg-gray-900 text-bible-gold shadow-lg shadow-bible-gold/10 scale-105' : 'border-transparent text-gray-400 opacity-60 hover:opacity-100'}`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${localData.style === s.id || (!localData.style && s.id === 'classic') ? 'bg-bible-gold/10' : 'bg-gray-100 dark:bg-gray-800'}`}>
                  <s.icon size={16} />
                </div>
                <span className="text-[9px] font-bold uppercase tracking-tight">{s.label}</span>
              </button>
            ))}
          </div>

          <div className="mt-4 flex items-center justify-between bg-white dark:bg-gray-900 p-3 rounded-xl border border-gray-100 dark:border-gray-800">
             <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-bible-gold/5 flex items-center justify-center text-bible-gold">
                  <ImageIcon size={14} />
                </div>
                <span className="text-xs font-bold text-gray-600 dark:text-gray-300">Mostrar Imagem</span>
             </div>
             <input 
                type="checkbox" 
                checked={localData.showImage !== false} 
                onChange={(e) => handleChange('showImage', e.target.checked)} 
                className="w-5 h-5 rounded-md border-gray-200 text-bible-gold focus:ring-bible-gold" 
             />
          </div>
        </div>
      )}

      {/* Hero e Sliders: Config específicas */}
      {(block.type === 'hero' || block.type === 'slide') && (
        <div className="bg-gray-50/50 dark:bg-gray-800/30 p-4 rounded-[2rem] border border-gray-100 dark:border-gray-800 space-y-3">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 block px-1">Configurações</label>
          
          <div className="grid grid-cols-1 gap-2">
            {block.type === 'hero' && (
              <>
                <div className="flex items-center justify-between bg-white dark:bg-gray-900 p-3 rounded-xl border border-gray-100 dark:border-gray-800">
                  <span className="text-xs font-bold text-gray-600">Subtítulo</span>
                  <input type="checkbox" checked={localData.showSubtitle !== false} onChange={(e) => handleChange('showSubtitle', e.target.checked)} className="w-5 h-5 rounded-md border-gray-200" />
                </div>
                <div className="flex items-center justify-between bg-white dark:bg-gray-900 p-3 rounded-xl border border-gray-100 dark:border-gray-800">
                  <span className="text-xs font-bold text-gray-600">Autor</span>
                  <input type="checkbox" checked={localData.showAuthor !== false} onChange={(e) => handleChange('showAuthor', e.target.checked)} className="w-5 h-5 rounded-md border-gray-200" />
                </div>
              </>
            )}
            
            {block.type === 'slide' && (
              <>
                <div className="flex items-center justify-between bg-white dark:bg-gray-900 p-3 rounded-xl border border-gray-100 dark:border-gray-800">
                  <span className="text-xs font-bold text-gray-600">Auto Play</span>
                  <input type="checkbox" checked={localData.autoplay === true} onChange={(e) => handleChange('autoplay', e.target.checked)} className="w-5 h-5 rounded-md border-gray-200" />
                </div>
                <div className="flex items-center justify-between bg-white dark:bg-gray-900 p-3 rounded-xl border border-gray-100 dark:border-gray-800">
                  <span className="text-xs font-bold text-gray-600">Navegação</span>
                  <input type="checkbox" checked={localData.showNavigation !== false} onChange={(e) => handleChange('showNavigation', e.target.checked)} className="w-5 h-5 rounded-md border-gray-200" />
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Editor de Conteúdo */}
      <div className="space-y-4">
        {(block.type === 'biblical' || block.type === 'hero' || block.type === 'slide' || block.type === 'authority' || block.type === 'video') && (
          <div className="space-y-3">
             <div className="group transition-all">
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block px-1">
                  {block.type === 'authority' ? 'Nome do Autor' : block.type === 'video' ? 'Título do Vídeo' : 'Texto Principal'}
                </label>
                {block.type === 'biblical' || block.type === 'hero' || block.type === 'authority' ? (
                  <textarea 
                    value={localData.text || localData.title || localData.name || ''} 
                    onChange={(e) => handleChange(localData.text !== undefined ? 'text' : (localData.title !== undefined ? 'title' : 'name'), e.target.value)} 
                    rows={block.type === 'authority' ? 1 : 3} 
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-transparent focus:border-bible-gold/30 focus:bg-white dark:focus:bg-gray-900 rounded-2xl text-xs transition-all resize-none outline-none" 
                  />
                ) : (
                  <input 
                    type="text"
                    value={localData.title || localData.url || ''} 
                    onChange={(e) => handleChange(localData.title !== undefined ? 'title' : 'url', e.target.value)} 
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-transparent focus:border-bible-gold/30 focus:bg-white dark:focus:bg-gray-900 rounded-2xl text-xs transition-all outline-none" 
                  />
                )}
             </div>
             
             {localData.reference !== undefined && (
               <div className="group transition-all">
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block px-1">Referência</label>
                  <input 
                    type="text" 
                    value={localData.reference || ''} 
                    onChange={(e) => handleChange('reference', e.target.value)} 
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800/50 border border-transparent focus:border-bible-gold/30 focus:bg-white dark:focus:bg-gray-900 rounded-2xl text-xs transition-all outline-none" 
                  />
               </div>
             )}

             {block.type === 'authority' && (
               <div className="group transition-all">
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block px-1">Biografia</label>
                  <textarea 
                    value={localData.bio || ''} 
                    onChange={(e) => handleChange('bio', e.target.value)} 
                    rows={3} 
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-transparent focus:border-bible-gold/30 focus:bg-white dark:focus:bg-gray-900 rounded-2xl text-xs transition-all resize-none outline-none" 
                  />
               </div>
             )}
          </div>
        )}
      </div>

      {/* Botão de Chamada (CTA) */}
      {(localData.showCta !== undefined || block.type === 'biblical' || block.type === 'hero') && (
        <div className="bg-gray-50/50 dark:bg-gray-800/30 p-4 rounded-[1.5rem] border border-gray-100 dark:border-gray-800">
           <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                 <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
                   <Maximize2 size={14} />
                 </div>
                 <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Botão de Ação</span>
              </div>
              <input type="checkbox" checked={localData.showCta === true} onChange={(e) => handleChange('showCta', e.target.checked)} className="w-5 h-5 rounded-md border-gray-200" />
           </div>

           {localData.showCta && (
             <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-gray-800 animate-in fade-in zoom-in-95 duration-300">
                <input 
                  type="text" 
                  value={localData.ctaText || ''} 
                  onChange={(e) => handleChange('ctaText', e.target.value)} 
                  className="w-full px-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl text-xs outline-none" 
                  placeholder="Ex: Saber Mais" 
                />
                <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide py-1">
                  {['solid', 'outline', 'royal', 'glass', 'dark'].map(st => (
                    <button 
                      key={st} 
                      onClick={() => handleChange('ctaStyle', st)} 
                      className={`flex-shrink-0 px-4 py-1.5 rounded-full text-[9px] font-bold uppercase transition-all shadow-sm ${localData.ctaStyle === st || (!localData.ctaStyle && st === 'solid') ? 'bg-bible-gold text-white' : 'bg-white dark:bg-gray-800 text-gray-400'}`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
             </div>
           )}
        </div>
      )}

      {/* Footer */}
      <div className="pt-6 hidden lg:flex">
        <button
          onClick={onClose}
          className="w-full py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-[2rem] text-[10px] font-black uppercase tracking-[0.3em] transition-all hover:scale-[1.02] active:scale-95 shadow-xl flex items-center justify-center gap-2"
        >
          Finalizar Edição
        </button>
      </div>
    </div>
  );
};
