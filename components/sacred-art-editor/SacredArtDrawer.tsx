"use client";

import React from 'react';
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Loader2,
  Maximize,
  Minus,
  Plus,
  Sparkles,
  Type,
  Upload,
  Zap,
  Lock,
  X,
} from 'lucide-react';
import { motion } from 'framer-motion';

import { EDITOR_LAYER_Z_INDEX, VERSE_FONT_PX_LIMITS } from '../../app/criar-arte-sacra/editorLayout';
import { dbService } from '../../services/supabase';
import type { CompositionOptions } from '../../utils/imageCompositor';
import type { EditorControlTab, SacredArtGalleryItem } from './types';

interface StyleOption {
  id: string;
  label: string;
  icon: string;
}

interface FontOption {
  id: string;
  label: string;
  style: React.CSSProperties;
}

interface ColorOption {
  id: string;
  value: string;
  label: string;
}

interface FilterOption {
  id: string;
  label: string;
}

interface SacredArtDrawerProps {
  activeControlTab: EditorControlTab;
  setActiveControlTab: React.Dispatch<React.SetStateAction<EditorControlTab>>;
  galleryImages: SacredArtGalleryItem[];
  currentUser: { uid: string } | null;
  setGalleryImages: React.Dispatch<React.SetStateAction<SacredArtGalleryItem[]>>;
  setRawGeneratedBase64: (value: string | null) => void;
  editOptions: CompositionOptions;
  setEditOptions: React.Dispatch<React.SetStateAction<CompositionOptions>>;
  selectedStyle: string;
  setSelectedStyle: (value: string) => void;
  customPrompt: string;
  setCustomPrompt: (value: string) => void;
  handleCreateClick: () => void;
  isGeneratingImg: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  resetText: () => void;
  fontSizePx: number;
  onFontSizePxChange: (value: number) => void;
  styles: StyleOption[];
  fonts: FontOption[];
  colors: ColorOption[];
  filters: FilterOption[];
  fallbackImages: SacredArtGalleryItem[];
  desktopInline?: boolean;
  mode?: 'all' | 'creation' | 'inspector';
}

export default function SacredArtDrawer({
  activeControlTab,
  setActiveControlTab,
  galleryImages,
  currentUser,
  setGalleryImages,
  setRawGeneratedBase64,
  editOptions,
  setEditOptions,
  selectedStyle,
  setSelectedStyle,
  customPrompt,
  setCustomPrompt,
  handleCreateClick,
  isGeneratingImg,
  fileInputRef,
  resetText,
  fontSizePx,
  onFontSizePxChange,
  styles,
  fonts,
  colors,
  filters,
  fallbackImages,
  desktopInline = false,
  mode = 'all',
}: SacredArtDrawerProps) {
  if (!activeControlTab && mode === 'all') return null;

  const requestedTab = activeControlTab ?? (mode === 'creation' ? 'templates' : 'text');
  const effectiveTab: Exclude<EditorControlTab, null> = mode === 'creation'
    ? (requestedTab === 'ai' ? 'ai' : 'templates')
    : mode === 'inspector'
      ? (requestedTab === 'style' ? 'style' : 'text')
      : requestedTab;
  const panelTabs = mode === 'creation'
    ? ([['templates', 'Templates'], ['ai', 'Criar com IA']] as const)
    : mode === 'inspector'
      ? ([['text', 'Texto'], ['style', 'Imagem e estilo']] as const)
      : [];

  return (
    <motion.div
      initial={{ x: '100%', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '100%', opacity: 0 }}
      className={`${desktopInline ? 'static h-full w-full max-h-full' : 'md:top-24 md:bottom-24 md:left-auto md:right-32 md:w-[420px]'} fixed bottom-[150px] left-4 right-4 max-h-[58vh] md:max-h-none bg-white/95 dark:bg-[#0A0A0A]/95 backdrop-blur-3xl rounded-[24px] border border-[#ded7cd] dark:border-white/10 shadow-[0_22px_55px_-24px_rgba(23,33,31,0.35)] overflow-hidden flex flex-col`}
      style={{ zIndex: EDITOR_LAYER_Z_INDEX.drawer }}
    >
      {/* Header Visual handle */}
      <div className="absolute top-0 left-0 right-0 h-1.5 flex justify-center pt-3 pointer-events-none md:hidden">
        <div className="w-12 h-1 bg-gray-200 dark:bg-white/10 rounded-full" />
      </div>

      <div className="flex flex-col h-full">
        {/* Navigation / Title */}
        <div className="px-5 pt-7 pb-4 flex justify-between items-end border-b border-[#ece5dc] dark:border-white/5 bg-white/50 dark:bg-black/20">
          <div>
            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-bible-gold mb-1">
              {mode === 'creation' ? 'Biblioteca visual' : mode === 'inspector' ? 'Ajustes da arte' : 'Editor Pro'}
            </h2>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
              {effectiveTab === 'templates' && 'Galeria Sacra'}
              {effectiveTab === 'ai' && 'Motor de Criação IA'}
              {effectiveTab === 'text' && 'Tipografia e Layout'}
              {effectiveTab === 'style' && 'Estética e Filtros'}
            </h3>
          </div>
          <button
            type="button"
            onClick={() => setActiveControlTab(null)}
            aria-label="Fechar editor Pro"
            title="Fechar editor Pro"
            className={`${mode !== 'all' ? 'invisible pointer-events-none' : ''} min-h-11 min-w-11 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center text-gray-400 hover:text-bible-gold transition-colors hover:scale-110 active:scale-95`}
          >
            <X size={18} />
          </button>
        </div>

        {panelTabs.length > 0 && (
          <div className="grid grid-cols-2 gap-1 border-b border-[#ece5dc] bg-[#fbf8f3] p-2 dark:border-white/5 dark:bg-white/[0.03]" role="tablist" aria-label={mode === 'creation' ? 'Ferramentas de criação' : 'Ferramentas de ajuste'}>
            {panelTabs.map(([tab, label]) => (
              <button
                key={tab}
                type="button"
                role="tab"
                aria-selected={effectiveTab === tab}
                onClick={() => setActiveControlTab(tab)}
                className={`min-h-10 rounded-xl px-3 text-[10px] font-black uppercase tracking-[0.1em] transition ${effectiveTab === tab ? 'bg-[#0b5148] text-white shadow-sm' : 'text-gray-500 hover:bg-white hover:text-[#0b5148] dark:hover:bg-white/10'}`}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        <div className={`min-h-0 flex-1 overflow-y-auto custom-scrollbar ${effectiveTab === 'ai' ? 'space-y-4 p-4' : 'space-y-7 p-5'}`}>
          {effectiveTab === 'templates' && (
            <div className="space-y-6">
              {/* Categorias modernizadas */}
              <div className="space-y-3">
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-1">Explorar Temas</label>
                <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                  {['Todas', 'Luz', 'Vida', 'Cruz', 'Paz', 'Amor', 'Geral'].map((cat) => (
                    <button
                      key={cat}
                      onClick={async () => {
                        try {
                          const userGal = currentUser
                            ? await dbService.getSacredArtGallery(currentUser.uid, cat === 'Todas' ? undefined : cat)
                            : [];
                          const freeGal = await dbService.getImageBank(50);
                          const mappedFree = freeGal.length > 0
                            ? freeGal
                                .map((img: SacredArtGalleryItem) => ({
                                  ...img,
                                  url: img.image_url || img.url,
                                  prompt: img.prompt || img.label || 'Arte Sacra',
                                }))
                                .filter((img: SacredArtGalleryItem) => img.url)
                            : fallbackImages;

                          const filteredFree =
                            cat === 'Todas'
                              ? mappedFree
                              : mappedFree.filter((img: SacredArtGalleryItem) => img.category === cat);

                          setGalleryImages([...userGal, ...filteredFree]);
                        } catch (error) {
                          console.error(error);
                        }
                      }}
                      className="px-5 py-2.5 bg-gray-100 dark:bg-white/5 rounded-2xl text-[10px] font-bold text-gray-500 whitespace-nowrap hover:bg-bible-gold/10 hover:text-bible-gold transition-all border border-transparent hover:border-bible-gold/20"
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Grid de imagens mais elegante */}
              <div className="grid grid-cols-4 gap-2">
                {galleryImages.map((img, index) => (
                  <button
                    key={`${img.url || img.image_url || 'gallery'}-${index}`}
                    onClick={() => {
                      setRawGeneratedBase64(img.url || img.image_url || null);
                      setEditOptions((current) => ({ ...current, bgX: 50, bgY: 50, bgScale: 1 }));
                    }}
                    className="aspect-square rounded-xl overflow-hidden border-2 border-transparent hover:border-bible-gold transition-all shadow-md group relative bg-gray-200 dark:bg-white/5"
                  >
                    <img
                      src={img.url || img.image_url}
                      alt="Template"
                      className="w-full h-full object-cover group-hover:scale-125 transition-transform duration-700 ease-out"
                    />
                    <div className="absolute inset-0 bg-bible-gold/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Plus size={20} className="text-white drop-shadow-lg" />
                    </div>
                  </button>
                ))}
              </div>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-5 border-2 border-dashed border-gray-200 dark:border-white/10 rounded-[24px] flex flex-col items-center gap-3 text-gray-400 hover:text-bible-gold hover:border-bible-gold/50 hover:bg-bible-gold/5 transition-all group"
              >
                <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Upload size={22} />
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Upload do Dispositivo</span>
              </button>
            </div>
          )}

          {effectiveTab === 'ai' && (
            <div data-testid="sacred-art-ai-engine" className="space-y-4">
              <div className="space-y-2">
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-1">Estilo Visual</label>
                <div className="grid grid-cols-5 gap-2">
                  {styles.map((style) => (
                    <button
                      key={style.id}
                      onClick={() => setSelectedStyle(style.id)}
                      className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl border-2 transition-all group ${selectedStyle === style.id ? 'bg-bible-gold/10 border-bible-gold text-bible-gold shadow-lg shadow-bible-gold/10' : 'border-transparent bg-gray-50 dark:bg-white/5 text-gray-500 hover:bg-gray-100 dark:hover:bg-white/10'}`}
                    >
                      <span className="text-lg group-hover:scale-110 transition-transform">{style.icon}</span>
                      <span className="text-[8px] font-black uppercase tracking-tighter text-center leading-none px-1">{style.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-1">Prompt Personalizado</label>
                <div className="relative">
                  <textarea
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    className="h-20 w-full resize-none rounded-xl border-2 border-transparent bg-gray-50 p-3 text-xs text-gray-900 shadow-inner transition-all focus:border-bible-gold/30 focus:outline-none dark:bg-white/5 dark:text-white"
                    placeholder="Ex: Uma montanha ao pôr do sol com luz celestial..."
                  />
                  <div className="absolute bottom-3 right-3 opacity-30">
                    <Sparkles size={16} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {effectiveTab === 'text' && (
            <div className="space-y-10">
              <div className="space-y-5">
                <div className="flex justify-between items-center px-1">
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Tamanho do Verso</label>
                  <span className="text-sm font-black text-bible-gold">{fontSizePx}px</span>
                </div>
                <div className="flex items-center gap-4 bg-gray-50 dark:bg-white/5 p-2 rounded-3xl border border-gray-100 dark:border-white/5">
                  <button
                    onClick={() => onFontSizePxChange(fontSizePx - 2)}
                    className="w-12 h-12 rounded-2xl bg-white dark:bg-white/5 flex items-center justify-center text-gray-500 hover:text-bible-gold shadow-sm transition-all active:scale-90"
                  >
                    <Minus size={20} />
                  </button>
                  <input
                    type="range"
                    min={VERSE_FONT_PX_LIMITS.min}
                    max={VERSE_FONT_PX_LIMITS.max}
                    step={1}
                    value={fontSizePx}
                    onChange={(e) => onFontSizePxChange(Number(e.target.value))}
                    className="flex-1 h-1.5 bg-gray-200 dark:bg-white/10 rounded-lg appearance-none cursor-pointer accent-bible-gold"
                  />
                  <button
                    onClick={() => onFontSizePxChange(fontSizePx + 2)}
                    className="w-12 h-12 rounded-2xl bg-white dark:bg-white/5 flex items-center justify-center text-gray-500 hover:text-bible-gold shadow-sm transition-all active:scale-90"
                  >
                    <Plus size={20} />
                  </button>
                </div>
              </div>

              <div className="space-y-5">
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-1">Tipografia</label>
                <div className="grid grid-cols-2 gap-3">
                  {fonts.map((font) => (
                    <button
                      key={font.id}
                      onClick={() => setEditOptions((current) => ({ ...current, fontFamily: font.id }))}
                      className={`px-5 py-4 rounded-2xl border-2 text-sm text-center transition-all ${editOptions.fontFamily === font.id ? 'border-bible-gold bg-bible-gold/10 text-bible-gold shadow-md' : 'border-transparent bg-gray-50 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10'}`}
                      style={font.style}
                    >
                      {font.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-5">
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-1">Alinhamento</label>
                <div className="flex bg-gray-50 dark:bg-white/5 rounded-[24px] p-2 gap-2 border border-gray-100 dark:border-white/5">
                  {['left', 'center', 'right'].map((align) => (
                    <button
                      key={align}
                      onClick={() => setEditOptions((current) => ({ ...current, alignment: align as CompositionOptions['alignment'] }))}
                      className={`flex-1 py-3 rounded-[18px] flex items-center justify-center transition-all ${editOptions.alignment === align ? 'bg-white dark:bg-gray-800 shadow-xl text-bible-gold scale-[1.02]' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                      {align === 'left' && <AlignLeft size={20} />}
                      {align === 'center' && <AlignCenter size={20} />}
                      {align === 'right' && <AlignRight size={20} />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={resetText}
                  className="flex-1 py-4 bg-gray-50 dark:bg-white/5 rounded-2xl text-[9px] font-black uppercase tracking-widest text-gray-500 hover:text-bible-gold transition-all flex items-center justify-center gap-2 border border-transparent hover:border-bible-gold/20"
                >
                  <Maximize size={16} /> Resetar
                </button>
                <button
                  onClick={() => onFontSizePxChange(VERSE_FONT_PX_LIMITS.default)}
                  className="flex-1 py-4 bg-gray-50 dark:bg-white/5 rounded-2xl text-[9px] font-black uppercase tracking-widest text-gray-500 hover:text-bible-gold transition-all flex items-center justify-center gap-2 border border-transparent hover:border-bible-gold/20"
                >
                  <Type size={16} /> Padrão
                </button>
              </div>
            </div>
          )}

          {effectiveTab === 'style' && (
            <div className="space-y-10">
              <div className="space-y-5">
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-1">Paleta do Texto</label>
                <div className="flex flex-wrap gap-4">
                  {colors.map((color) => (
                    <button
                      key={color.id}
                      onClick={() => setEditOptions((current) => ({ ...current, textColor: color.value }))}
                      className={`w-12 h-12 rounded-full border-4 transition-all hover:scale-110 shadow-lg ${editOptions.textColor === color.value ? 'border-bible-gold scale-125' : 'border-white/10 opacity-70'}`}
                      style={{ backgroundColor: color.value }}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex justify-between items-center px-1">
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Contraste de Fundo</label>
                  <span className="text-sm font-black text-bible-gold">{Math.round(editOptions.overlayOpacity * 100)}%</span>
                </div>
                <div className="bg-gray-50 dark:bg-white/5 p-6 rounded-[32px] border border-gray-100 dark:border-white/5">
                  <input
                    type="range"
                    min="0"
                    max="0.9"
                    step="0.05"
                    value={editOptions.overlayOpacity}
                    onChange={(e) => setEditOptions((current) => ({ ...current, overlayOpacity: parseFloat(e.target.value) }))}
                    className="w-full h-2 bg-gray-200 dark:bg-white/10 rounded-lg appearance-none cursor-pointer accent-bible-gold"
                  />
                </div>
              </div>

              <div className="space-y-5">
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-1">Filtros Atmosféricos</label>
                <div className="grid grid-cols-4 gap-3">
                  {filters.map((filter) => (
                    <button
                      key={filter.id}
                      onClick={() => setEditOptions((current) => ({ ...current, filter: filter.id as CompositionOptions['filter'] }))}
                      className={`py-3 rounded-2xl border-2 text-[9px] font-black uppercase tracking-tighter transition-all ${editOptions.filter === filter.id ? 'border-bible-gold text-bible-gold bg-bible-gold/10 shadow-md' : 'border-transparent bg-gray-50 dark:bg-white/5 text-gray-500 hover:bg-gray-100 dark:hover:bg-white/10'}`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
        {effectiveTab === 'ai' && (
          <div className="shrink-0 border-t border-[#ece5dc] bg-white/90 p-3 backdrop-blur-xl dark:border-white/5 dark:bg-black/30">
            <button
              data-testid="sacred-art-create-button"
              onClick={handleCreateClick}
              disabled={isGeneratingImg}
              className={`flex min-h-12 w-full items-center justify-center gap-3 rounded-xl px-4 text-[11px] font-black uppercase tracking-[0.16em] shadow-xl transition-all active:scale-[0.98] ${!currentUser ? 'border border-gray-200 bg-gray-100 text-gray-500 dark:border-white/10 dark:bg-white/5' : 'bg-bible-gold text-black shadow-bible-gold/30 hover:shadow-bible-gold/50'}`}
            >
              {isGeneratingImg ? (
                <Loader2 size={18} className="animate-spin" />
              ) : !currentUser ? (
                <Lock size={18} />
              ) : (
                <Zap size={18} />
              )}
              {isGeneratingImg ? 'Gerando sua Obra...' : !currentUser ? 'Login para IA' : 'Criar Arte Inédita'}
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
