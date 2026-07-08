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
  Type,
  Monitor,
  Smartphone
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

  const handleArrayChange = (key: string, index: number, value: any) => {
    const current = Array.isArray(localData[key]) ? [...localData[key]] : [];
    current[index] = value;
    handleChange(key, current);
  };

  const handleNestedArrayChange = (key: string, index: number, nestedKey: string, value: any) => {
    const current = Array.isArray(localData[key]) ? [...localData[key]] : [];
    current[index] = { ...(current[index] || {}), [nestedKey]: value };
    handleChange(key, current);
  };

  if (!isEditing) return null;

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Seção de Visibilidade */}
      <div className="rounded-2xl border border-gray-100 bg-gray-50/50 p-3 dark:border-gray-800 dark:bg-gray-800/30">
        <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 block px-1">Exibição e Visibilidade</label>
        
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => handleChange('showOnDesktop', localData.showOnDesktop === false)}
            className={`flex min-h-14 items-center gap-2 rounded-2xl border p-2 text-left transition-all ${localData.showOnDesktop !== false ? 'bg-white dark:bg-gray-900 border-bible-gold/20 shadow-sm' : 'bg-gray-100/50 dark:bg-gray-800/20 border-transparent opacity-60'}`}
          >
            <div className={`flex h-8 w-8 flex-none items-center justify-center rounded-lg ${localData.showOnDesktop !== false ? 'bg-bible-gold/10 text-bible-gold' : 'bg-gray-200 dark:bg-gray-700 text-gray-400'}`}>
              <Monitor size={16} />
            </div>
            <div className="flex min-w-0 flex-col items-start">
              <span className={`text-[9px] font-bold uppercase tracking-tight ${localData.showOnDesktop !== false ? 'text-bible-ink dark:text-white' : 'text-gray-400'}`}>Desktop</span>
              <span className="text-[8px] text-gray-400">{localData.showOnDesktop !== false ? 'Ativado' : 'Oculto'}</span>
            </div>
          </button>

          <button
            onClick={() => handleChange('showOnMobile', localData.showOnMobile === false)}
            className={`flex min-h-14 items-center gap-2 rounded-2xl border p-2 text-left transition-all ${localData.showOnMobile !== false ? 'bg-white dark:bg-gray-900 border-bible-gold/20 shadow-sm' : 'bg-gray-100/50 dark:bg-gray-800/20 border-transparent opacity-60'}`}
          >
            <div className={`flex h-8 w-8 flex-none items-center justify-center rounded-lg ${localData.showOnMobile !== false ? 'bg-bible-gold/10 text-bible-gold' : 'bg-gray-200 dark:bg-gray-700 text-gray-400'}`}>
              <Smartphone size={16} />
            </div>
            <div className="flex min-w-0 flex-col items-start">
              <span className={`text-[9px] font-bold uppercase tracking-tight ${localData.showOnMobile !== false ? 'text-bible-ink dark:text-white' : 'text-gray-400'}`}>Mobile</span>
              <span className="text-[8px] text-gray-400">{localData.showOnMobile !== false ? 'Ativado' : 'Oculto'}</span>
            </div>
          </button>
        </div>
      </div>

      {/* Seção de Estilo Visual */}
      {(block.type === 'biblical') && (
        <div className="rounded-2xl border border-gray-100 bg-gray-50/50 p-3 dark:border-gray-800 dark:bg-gray-800/30">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 block px-1">Estilo do Versículo</label>
          
          <div className="grid grid-cols-2 gap-2 min-[360px]:grid-cols-3">
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
                className={`flex min-h-20 flex-col items-center justify-center gap-2 rounded-2xl border-2 p-2 transition-all ${localData.style === s.id || (!localData.style && s.id === 'classic') ? 'border-bible-gold bg-white dark:bg-gray-900 text-bible-gold shadow-lg shadow-bible-gold/10' : 'border-transparent text-gray-400 opacity-60 hover:opacity-100'}`}
              >
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${localData.style === s.id || (!localData.style && s.id === 'classic') ? 'bg-bible-gold/10' : 'bg-gray-100 dark:bg-gray-800'}`}>
                  <s.icon size={16} />
                </div>
                <span className="text-[9px] font-bold uppercase tracking-tight">{s.label}</span>
              </button>
            ))}
          </div>

          <div className="mt-4 flex min-h-14 items-center justify-between gap-3 rounded-xl border border-gray-100 bg-white p-3 dark:border-gray-800 dark:bg-gray-900">
             <div className="flex min-w-0 items-center gap-2">
                <div className="flex h-8 w-8 flex-none items-center justify-center rounded-lg bg-bible-gold/5 text-bible-gold">
                  <ImageIcon size={14} />
                </div>
                <span className="truncate text-xs font-bold text-gray-600 dark:text-gray-300">Mostrar Imagem</span>
             </div>
             <input 
                type="checkbox" 
                checked={localData.showImage !== false} 
                onChange={(e) => handleChange('showImage', e.target.checked)} 
                className="h-5 w-5 flex-none rounded-md border-gray-200 text-bible-gold focus:ring-bible-gold" 
             />
          </div>
        </div>
      )}

      {/* Hero e Sliders: Config específicas */}
      {(block.type === 'hero' || block.type === 'slide') && (
        <div className="space-y-3 rounded-2xl border border-gray-100 bg-gray-50/50 p-3 dark:border-gray-800 dark:bg-gray-800/30">
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
        {(block.type === 'hero-split' || block.type === 'study-outline' || block.type === 'related-verses' || block.type === 'reflection-question') && (
          <div className="space-y-3">
            {(block.type === 'hero-split' || block.type === 'study-outline' || block.type === 'related-verses' || block.type === 'reflection-question') && (
              <div className="group transition-all">
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block px-1">Titulo</label>
                <input
                  type="text"
                  aria-label="Titulo"
                  value={localData.title || ''}
                  onChange={(e) => handleChange('title', e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-transparent focus:border-bible-gold/30 focus:bg-white dark:focus:bg-gray-900 rounded-2xl text-xs transition-all outline-none"
                />
              </div>
            )}

            {block.type === 'hero-split' && (
              <>
                <div className="group transition-all">
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block px-1">Eyebrow</label>
                  <input
                    type="text"
                    value={localData.eyebrow || ''}
                    onChange={(e) => handleChange('eyebrow', e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-transparent focus:border-bible-gold/30 focus:bg-white dark:focus:bg-gray-900 rounded-2xl text-xs transition-all outline-none"
                  />
                </div>
                <div className="group transition-all">
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block px-1">Imagem URL</label>
                  <input
                    type="text"
                    value={localData.imageUrl || ''}
                    onChange={(e) => handleChange('imageUrl', e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-transparent focus:border-bible-gold/30 focus:bg-white dark:focus:bg-gray-900 rounded-2xl text-xs transition-all outline-none"
                  />
                </div>
              </>
            )}

            {block.type === 'study-outline' && (
              <>
                <div className="group transition-all">
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block px-1">Descricao</label>
                  <textarea
                    value={localData.description || ''}
                    onChange={(e) => handleChange('description', e.target.value)}
                    rows={2}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-transparent focus:border-bible-gold/30 focus:bg-white dark:focus:bg-gray-900 rounded-2xl text-xs transition-all resize-none outline-none"
                  />
                </div>
                <div className="bg-amber-50 dark:bg-amber-900/10 p-3 rounded-xl border border-amber-100 dark:border-amber-800 mb-2">
                  <p className="text-[10px] text-amber-600 dark:text-amber-400 font-bold uppercase tracking-wider mb-1">💡 Dica de Automação</p>
                  <p className="text-[10px] text-amber-700/70 dark:text-amber-400/70 leading-relaxed">
                    Este bloco é inteligente! Ele captura automaticamente todos os <strong>Subtítulos (H2)</strong> que você criar no texto do estudo.
                  </p>
                </div>
                {(localData.items || []).map((item: string, index: number) => (
                  <div key={`${block.id}-outline-${index}`} className="group transition-all opacity-80">
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block px-1">Item {index + 1} (Automático)</label>
                    <div className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800/80 border border-transparent rounded-2xl text-xs text-gray-500 italic">
                      {item || 'Sem título'}
                    </div>
                  </div>
                ))}
                {(!localData.items || localData.items.length === 0) && (
                  <p className="text-[10px] text-gray-400 italic text-center py-4 px-2">
                    Nenhum subtítulo (H2) detectado no texto ainda.
                  </p>
                )}
              </>
            )}

            {block.type === 'related-verses' && (
              <>
                <div className="group transition-all">
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block px-1">Descricao</label>
                  <textarea
                    value={localData.description || ''}
                    onChange={(e) => handleChange('description', e.target.value)}
                    rows={2}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-transparent focus:border-bible-gold/30 focus:bg-white dark:focus:bg-gray-900 rounded-2xl text-xs transition-all resize-none outline-none"
                  />
                </div>
                {(localData.verses || []).map((verse: any, index: number) => (
                  <div key={`${block.id}-verse-${index}`} className="rounded-2xl border border-gray-100 dark:border-gray-800 p-4 space-y-3 bg-white dark:bg-gray-900/50 relative group">
                    <button 
                      onClick={() => {
                        const current = [...(localData.verses || [])];
                        current.splice(index, 1);
                        handleChange('verses', current);
                      }}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-100 text-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-sm"
                    >
                      <Trash2 size={12} />
                    </button>
                    
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-1">Referência {index + 1}</label>
                      <input
                        type="text"
                        value={verse?.reference || ''}
                        onChange={(e) => handleNestedArrayChange('verses', index, 'reference', e.target.value)}
                        placeholder="Ex: João 3:16"
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-transparent focus:border-bible-gold/30 focus:bg-white dark:focus:bg-gray-900 rounded-xl text-xs transition-all outline-none"
                      />
                    </div>
                    
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-1">Resumo / Comentário</label>
                      <textarea
                        value={verse?.summary || ''}
                        onChange={(e) => handleNestedArrayChange('verses', index, 'summary', e.target.value)}
                        rows={2}
                        placeholder="O que este versículo ensina?"
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-transparent focus:border-bible-gold/30 focus:bg-white dark:focus:bg-gray-900 rounded-xl text-xs transition-all resize-none outline-none"
                      />
                    </div>
                  </div>
                ))}
                
                <button
                  onClick={() => {
                    const current = [...(localData.verses || [])];
                    current.push({ reference: '', summary: '' });
                    handleChange('verses', current);
                  }}
                  className="w-full py-4 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-2xl text-gray-400 hover:text-bible-gold hover:border-bible-gold transition-all flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest"
                >
                  <Plus size={16} />
                  Adicionar Versículo
                </button>
              </>
            )}

            {block.type === 'reflection-question' && (
              <>
                <div className="group transition-all">
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block px-1">Pergunta</label>
                  <textarea
                    aria-label="Pergunta"
                    value={localData.question || ''}
                    onChange={(e) => handleChange('question', e.target.value)}
                    rows={2}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-transparent focus:border-bible-gold/30 focus:bg-white dark:focus:bg-gray-900 rounded-2xl text-xs transition-all resize-none outline-none"
                  />
                </div>
                <div className="group transition-all">
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block px-1">Texto de apoio</label>
                  <textarea
                    aria-label="Texto de apoio"
                    value={localData.support || ''}
                    onChange={(e) => handleChange('support', e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-transparent focus:border-bible-gold/30 focus:bg-white dark:focus:bg-gray-900 rounded-2xl text-xs transition-all resize-none outline-none"
                  />
                </div>
                <div className="group transition-all">
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block px-1">Placeholder</label>
                  <input
                    type="text"
                    aria-label="Placeholder"
                    value={localData.placeholder || ''}
                    onChange={(e) => handleChange('placeholder', e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-transparent focus:border-bible-gold/30 focus:bg-white dark:focus:bg-gray-900 rounded-2xl text-xs transition-all outline-none"
                  />
                </div>
              </>
            )}
          </div>
        )}

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
