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
  Play
} from 'lucide-react';
import { Block, BlockType } from './types';
import { ImageUploadButton } from './ImageUploadButton';

interface BlockPropertiesProps {
  block: Block;
  onUpdate?: (data: any) => void;
  isEditing: boolean;
}

export const BlockProperties: React.FC<BlockPropertiesProps> = ({ block, onUpdate, isEditing }) => {
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
    <div className="space-y-6 animate-in fade-in slide-in-from-right duration-500">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-bible-gold/10 flex items-center justify-center text-bible-gold">
          <Settings2 size={20} />
        </div>
        <div>
          <h3 className="font-bold text-bible-ink dark:text-white leading-tight">Painel de Estilo</h3>
          <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-0.5">Customização do Bloco</p>
        </div>
      </div>

      {/* Hero e Sliders: Config específicas */}
      {block.type === 'hero' && (
        <>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="showSubtitle"
              checked={localData.showSubtitle !== false}
              onChange={(e) => handleChange('showSubtitle', e.target.checked)}
              className="rounded"
            />
            <label htmlFor="showSubtitle" className="text-sm text-gray-600 dark:text-gray-400">
              Mostrar subtítulo
            </label>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="showCta"
              checked={localData.showCta !== false}
              onChange={(e) => handleChange('showCta', e.target.checked)}
              className="rounded"
            />
            <label htmlFor="showCta" className="text-sm text-gray-600 dark:text-gray-400">
              Mostrar botão de chamada
            </label>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="showAuthor"
              checked={localData.showAuthor !== false}
              onChange={(e) => handleChange('showAuthor', e.target.checked)}
              className="rounded"
            />
            <label htmlFor="showAuthor" className="text-sm text-gray-600 dark:text-gray-400">
              Mostrar autor no topo
            </label>
          </div>
        </>
      )}

      {block.type === 'slide' && (
        <>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="autoplay"
              checked={localData.autoplay === true}
              onChange={(e) => handleChange('autoplay', e.target.checked)}
              className="rounded"
            />
            <label htmlFor="autoplay" className="text-sm text-gray-600 dark:text-gray-400">
              Reprodução automática
            </label>
          </div>
          {localData.autoplay && (
             <div>
                <label className="text-xs text-gray-500 block mb-1">Intervalo (ms)</label>
                <input
                  type="number"
                  step="500"
                  value={localData.autoplayInterval || 5000}
                  onChange={(e) => handleChange('autoplayInterval', parseInt(e.target.value))}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm"
                />
             </div>
          )}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="showNavigation"
              checked={localData.showNavigation !== false}
              onChange={(e) => handleChange('showNavigation', e.target.checked)}
              className="rounded"
            />
            <label htmlFor="showNavigation" className="text-sm text-gray-600 dark:text-gray-400">
              Mostrar navegação
            </label>
          </div>
        </>
      )}

      {block.type === 'biblical' && (
        <div className="space-y-4">
           <div className="flex items-center gap-2">
            <input type="checkbox" id="showBibImage" checked={localData.showImage !== false} onChange={(e) => handleChange('showImage', e.target.checked)} className="rounded" />
            <label htmlFor="showBibImage" className="text-sm text-gray-600 dark:text-gray-400">Mostrar imagem</label>
          </div>
          {localData.showImage !== false && (
            <div className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1 px-1">Img. do Versículo</label>
                <ImageUploadButton onUpload={(url) => handleChange('imageUrl', url)} label="Anexar" />
              </div>
              <input type="text" value={localData.imageUrl || ''} onChange={(e) => handleChange('imageUrl', e.target.value)} className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-800 border-none rounded-xl text-xs" placeholder="URL da imagem..." />
            </div>
          )}
          <div>
            <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1 px-1">Texto Bíblico</label>
            <textarea value={localData.text || ''} onChange={(e) => handleChange('text', e.target.value)} rows={3} className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-800 border-none rounded-xl text-xs resize-none" />
          </div>
          <div>
            <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1 px-1">Referência</label>
            <input type="text" value={localData.reference || ''} onChange={(e) => handleChange('reference', e.target.value)} className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-800 border-none rounded-xl text-xs" />
          </div>
        </div>
      )}

      {block.type === 'authority' && (
        <div className="space-y-4">
          <div>
            <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1 px-1">Nome do Autor</label>
            <input type="text" value={localData.name || ''} onChange={(e) => handleChange('name', e.target.value)} className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-800 border-none rounded-xl text-xs" />
          </div>
          <div>
            <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1 px-1">Biografia Curta</label>
            <textarea value={localData.bio || ''} onChange={(e) => handleChange('bio', e.target.value)} rows={3} className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-800 border-none rounded-xl text-xs resize-none" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1 px-1">Foto do Autor</label>
              <ImageUploadButton onUpload={(url) => handleChange('photo', url)} label="Anexar" />
            </div>
            <input type="text" value={localData.photo || ''} onChange={(e) => handleChange('photo', e.target.value)} className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-800 border-none rounded-xl text-xs" placeholder="URL da foto..." />
          </div>
        </div>
      )}

      {block.type === 'video' && (
        <div className="space-y-4">
          <div>
            <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1 px-1">Título do Vídeo</label>
            <input type="text" value={localData.title || ''} onChange={(e) => handleChange('title', e.target.value)} className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-800 border-none rounded-xl text-xs" />
          </div>
          <div>
            <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1 px-1">URL do YouTube</label>
            <input type="text" value={localData.url || ''} onChange={(e) => handleChange('url', e.target.value)} className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-800 border-none rounded-xl text-xs" placeholder="https://youtube.com/watch?v=..." />
          </div>
        </div>
      )}

      {/* Estilos Predefinidos (Presets) */}
      <div className="pt-6 border-t border-gray-100 dark:border-gray-800 mt-6">
        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] block mb-3 flex items-center gap-2">
          <Sparkle size={12} className="text-bible-gold" /> Estilos Sugeridos
        </label>
        <div className="grid grid-cols-2 gap-2">
           {[
             { name: 'Impacto', bg: '#0f172a', text: '#f8fafc', font: 'var(--font-montserrat), sans-serif', bold: true },
             { name: 'Pastoral', bg: '#fdfbf7', text: '#2d2d2d', font: 'var(--font-merriweather), serif' },
             { name: 'Elegante', bg: '#ffffff', text: '#000000', font: 'var(--font-playfair), serif', line: 2.0 },
             { name: 'Moderna', bg: '#f8fafc', text: '#0f172a', font: 'var(--font-inter), sans-serif' }
           ].map(preset => (
             <button
               key={preset.name}
               onClick={() => {
                 const newData = {
                   ...block.data,
                   backgroundColor: preset.bg,
                   textColor: preset.text,
                   fontFamily: preset.font,
                   lineHeight: preset.line || 1.8,
                   padding: 60,
                   borderRadius: 32,
                   shadow: preset.bg === '#ffffff' ? 'md' : 'none'
                 };
                 setLocalData(newData);
                 onUpdate?.(newData);
               }}
               className="flex flex-col items-center p-3 rounded-2xl border border-gray-100 dark:border-gray-800 hover:border-bible-gold transition-all bg-white dark:bg-gray-900 shadow-sm"
             >
               <div className="w-full h-8 rounded-lg mb-2 shadow-inner" style={{ backgroundColor: preset.bg, border: '1px solid #eee' }} />
               <span className="text-[10px] font-bold uppercase tracking-wider">{preset.name}</span>
             </button>
           ))}
        </div>
      </div>

      {/* Design Global (Aplicável a todos exceto slides isolados) */}
      {block.type !== 'slide' && (
        <div className="pt-6 border-t border-gray-100 dark:border-gray-800 mt-6 space-y-6">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-bold text-xs text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
              <Palette size={14} /> Estética do Bloco
            </h4>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5 flex items-center gap-1">
                <div className="w-1.5 h-1.5 bg-bible-gold rounded-full" /> Fundo
              </label>
              <div className="flex gap-1">
                <input type="color" value={localData.backgroundColor || '#ffffff'} onChange={e => handleChange('backgroundColor', e.target.value)} className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer overflow-hidden p-0" />
                <input type="text" value={localData.backgroundColor || ''} onChange={e => handleChange('backgroundColor', e.target.value)} className="flex-1 w-full px-2 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-lg text-xs font-mono" placeholder="#hex" />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5 flex items-center gap-1">
                <div className="w-1.5 h-1.5 bg-bible-ink rounded-full" /> Texto
              </label>
              <div className="flex gap-1">
                <input type="color" value={localData.textColor || '#000000'} onChange={e => handleChange('textColor', e.target.value)} className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer overflow-hidden p-0" />
                <input type="text" value={localData.textColor || ''} onChange={e => handleChange('textColor', e.target.value)} className="flex-1 w-full px-2 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-lg text-xs font-mono" placeholder="#hex" />
              </div>
            </div>
          </div>

          {/* Tipografia */}
          <div className="bg-gray-50 dark:bg-black/20 p-4 rounded-2xl border border-gray-100 dark:border-white/5">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] block mb-3 flex items-center gap-2">
              <TextIcon size={12} /> Tipografia & Tamanho
            </label>
            
            <div className="grid grid-cols-5 gap-1.5 mb-4">
              {([
                { key: '', label: 'Pad', css: 'inherit' },
                { key: 'var(--font-inter), sans-serif', label: 'Int', css: 'var(--font-inter), sans-serif' },
                { key: 'Georgia, serif', label: 'Geo', css: 'Georgia, serif' },
                { key: 'var(--font-playfair), serif', label: 'Ply', css: 'var(--font-playfair), serif' },
                { key: 'var(--font-merriweather), serif', label: 'Mer', css: 'var(--font-merriweather), serif' },
                { key: 'var(--font-lato), sans-serif', label: 'Lat', css: 'var(--font-lato), sans-serif' },
                { key: 'var(--font-montserrat), sans-serif', label: 'Mon', css: 'var(--font-montserrat), sans-serif' },
                { key: 'var(--font-roboto-slab), serif', label: 'Rob', css: 'var(--font-roboto-slab), serif' },
                { key: 'var(--font-oswald), sans-serif', label: 'Osw', css: 'var(--font-oswald), sans-serif' },
                { key: 'var(--font-lora), serif', label: 'Lor', css: 'var(--font-lora), serif' },
              ]).map(font => (
                <button
                  key={font.key}
                  onClick={() => handleChange('fontFamily', font.key)}
                  className={`h-10 rounded-lg border text-center transition-all ${
                    (localData.fontFamily || '') === font.key
                      ? 'border-bible-gold bg-bible-gold text-white shadow-lg'
                      : 'border-white dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-gray-300'
                  }`}
                  title={font.label}
                >
                  <span className="text-sm font-medium" style={{ fontFamily: font.css }}>Aa</span>
                </button>
              ))}
            </div>

            <div className="space-y-4">
               <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-bold text-gray-500 uppercase">Tam. Fonte</span>
                    <span className="text-xs font-mono text-bible-gold">{localData.fontSize || 16}px</span>
                  </div>
                  <input type="range" min="12" max="28" value={localData.fontSize || 16} onChange={e => handleChange('fontSize', parseInt(e.target.value))} className="w-full accent-bible-gold h-1" />
               </div>
               
               <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-bold text-gray-500 uppercase">Altura Linha</span>
                    <span className="text-xs font-mono text-bible-gold">{localData.lineHeight || 1.8}</span>
                  </div>
                  <input type="range" min="1" max="2.5" step="0.1" value={localData.lineHeight || 1.8} onChange={e => handleChange('lineHeight', parseFloat(e.target.value))} className="w-full accent-bible-gold h-1" />
               </div>
            </div>
          </div>

          {/* Layout e Espaçamento */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
               <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1 px-1">Largura</label>
                  <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
                    {(['thin', 'normal', 'full'] as const).map(w => (
                      <button key={w} onClick={() => handleChange('width', w)} className={`flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-tighter transition-all ${localData.width === w ? 'bg-white dark:bg-gray-700 text-bible-gold shadow-sm' : 'text-gray-400'}`}>
                        {w === 'thin' ? 'Slim' : w === 'normal' ? 'Largo' : 'Total'}
                      </button>
                    ))}
                  </div>
               </div>
               <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1 px-1">Alinhamento</label>
                  <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
                    {(['left', 'center', 'right', 'justify'] as const).map(align => (
                      <button key={align} onClick={() => handleChange('alignment', align)} className={`flex-1 py-1.5 rounded-lg transition-all ${localData.alignment === align ? 'bg-white dark:bg-gray-700 text-bible-gold shadow-sm' : 'text-gray-400'}`}>
                         {align === 'left' && <AlignLeft size={14} className="mx-auto" />}
                         {align === 'center' && <AlignCenter size={14} className="mx-auto" />}
                         {align === 'right' && <AlignRight size={14} className="mx-auto" />}
                         {align === 'justify' && <AlignJustify size={14} className="mx-auto" />}
                      </button>
                    ))}
                  </div>
               </div>
            </div>

            <div className="space-y-4 pt-2">
               <div className="grid grid-cols-2 gap-4">
                 <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[9px] font-bold text-gray-500 uppercase">Margem Superior</span>
                      <span className="text-[10px] font-mono text-bible-gold">{(typeof localData.margin === 'object' ? localData.margin?.top : (localData.margin ?? 0))}px</span>
                    </div>
                    <input type="range" min="0" max="160" step="4" value={(typeof localData.margin === 'object' ? localData.margin?.top : (localData.margin ?? 0))} onChange={e => {
                      const val = parseInt(e.target.value);
                      const current = typeof localData.margin === 'object' ? localData.margin : { top: localData.margin ?? 0, bottom: localData.margin ?? 0 };
                      handleChange('margin', { ...current, top: val });
                    }} className="w-full accent-bible-gold h-1" />
                 </div>
                 <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[9px] font-bold text-gray-500 uppercase">Margem Inferior</span>
                      <span className="text-[10px] font-mono text-bible-gold">{(typeof localData.margin === 'object' ? localData.margin?.bottom : (localData.margin ?? 0))}px</span>
                    </div>
                    <input type="range" min="0" max="160" step="4" value={(typeof localData.margin === 'object' ? localData.margin?.bottom : (localData.margin ?? 0))} onChange={e => {
                      const val = parseInt(e.target.value);
                      const current = typeof localData.margin === 'object' ? localData.margin : { top: localData.margin ?? 0, bottom: localData.margin ?? 0 };
                      handleChange('margin', { ...current, bottom: val });
                    }} className="w-full accent-bible-gold h-1" />
                 </div>
               </div>

               <div className="grid grid-cols-2 gap-4">
                 <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[9px] font-bold text-gray-500 uppercase">Espaçamento Topo</span>
                      <span className="text-[10px] font-mono text-bible-gold">{(typeof localData.padding === 'object' ? localData.padding?.top : (localData.padding ?? 0))}px</span>
                    </div>
                    <input type="range" min="0" max="160" step="4" value={(typeof localData.padding === 'object' ? localData.padding?.top : (localData.padding ?? 0))} onChange={e => {
                      const val = parseInt(e.target.value);
                      const current = typeof localData.padding === 'object' ? localData.padding : { top: localData.padding ?? 0, bottom: localData.padding ?? 0 };
                      handleChange('padding', { ...current, top: val });
                    }} className="w-full accent-bible-gold h-1" />
                 </div>
                 <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[9px] font-bold text-gray-500 uppercase">Espaçamento Base</span>
                      <span className="text-[10px] font-mono text-bible-gold">{(typeof localData.padding === 'object' ? localData.padding?.bottom : (localData.padding ?? 0))}px</span>
                    </div>
                    <input type="range" min="0" max="160" step="4" value={(typeof localData.padding === 'object' ? localData.padding?.bottom : (localData.padding ?? 0))} onChange={e => {
                      const val = parseInt(e.target.value);
                      const current = typeof localData.padding === 'object' ? localData.padding : { top: localData.padding ?? 0, bottom: localData.padding ?? 0 };
                      handleChange('padding', { ...current, bottom: val });
                    }} className="w-full accent-bible-gold h-1" />
                 </div>
               </div>

               <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-bold text-gray-500 uppercase">Arredondamento</span>
                    <span className="text-xs font-mono text-bible-gold">{localData.borderRadius || 0}px</span>
                  </div>
                  <input type="range" min="0" max="64" step="4" value={localData.borderRadius || 0} onChange={e => handleChange('borderRadius', parseInt(e.target.value))} className="w-full accent-bible-gold h-1" />
               </div>

               <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1 px-1">Sombra (Impacto)</label>
                  <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
                    {(['none', 'sm', 'md', 'lg', 'xl'] as const).map(s => (
                      <button key={s} onClick={() => handleChange('shadow', s)} className={`flex-1 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${localData.shadow === s ? 'bg-white dark:bg-gray-700 text-bible-gold shadow-sm' : 'text-gray-400'}`}>
                        {s}
                      </button>
                    ))}
                  </div>
               </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <label className="text-[10px] font-bold text-gray-500 uppercase block mb-2 px-1 flex items-center gap-1">
                <ImageIcon size={12} /> Imagem de Fundo
              </label>
              <ImageUploadButton onUpload={(url) => handleChange('backgroundImage', url)} label="Anexar" />
            </div>
            <input type="text" value={localData.backgroundImage || ''} onChange={e => handleChange('backgroundImage', e.target.value)} className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-800 border-none rounded-xl text-xs" placeholder="URL da imagem (ex: Unsplash)" />
          </div>
          
          {localData.backgroundImage && (
            <div>
              <div className="flex justify-between items-center mb-1">
                 <span className="text-[10px] font-bold text-gray-500 uppercase">Opacidade Overlay</span>
                 <span className="text-xs font-mono">{Math.round((localData.overlayOpacity ?? 0.5) * 100)}%</span>
              </div>
              <input type="range" min="0" max="1" step="0.1" value={localData.overlayOpacity ?? 0.5} onChange={e => handleChange('overlayOpacity', parseFloat(e.target.value))} className="w-full accent-bible-gold h-1" />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
