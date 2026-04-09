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
}: SacredArtDrawerProps) {
  if (!activeControlTab) return null;

  return (
    <motion.div
      initial={{ y: '20%', opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: '20%', opacity: 0 }}
      className="fixed bottom-24 left-4 right-4 md:left-auto md:right-8 md:w-[450px] bg-white/95 dark:bg-black/90 backdrop-blur-2xl rounded-[32px] border border-gray-200 dark:border-white/10 shadow-2xl max-h-[50vh] overflow-hidden flex flex-col"
      style={{ zIndex: EDITOR_LAYER_Z_INDEX.drawer }}
    >
      <div
        className="w-12 h-1.5 bg-gray-200 dark:bg-white/10 rounded-full mx-auto mt-4 mb-2 shrink-0 cursor-pointer"
        onClick={() => setActiveControlTab(null)}
      />

      <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-bible-gold">
            {activeControlTab === 'templates' && 'Galeria de Fundos'}
            {activeControlTab === 'ai' && 'Gerador de Arte IA'}
            {activeControlTab === 'text' && 'Formatação de Texto'}
            {activeControlTab === 'style' && 'Estilo e Filtros'}
          </h3>
          <button
            onClick={() => setActiveControlTab(null)}
            className="text-gray-400 hover:text-white uppercase font-black text-[8px] tracking-widest"
          >
            Fechar
          </button>
        </div>

        {activeControlTab === 'templates' && (
          <div className="space-y-6">
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
                  className="px-4 py-1.5 bg-gray-100 dark:bg-white/5 rounded-full text-[9px] font-black text-gray-400 whitespace-nowrap hover:text-bible-gold transition-colors"
                >
                  {cat}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-6 gap-1 md:grid-cols-8 lg:grid-cols-10">
              {galleryImages.map((img, index) => (
                <button
                  key={`${img.url || img.image_url || 'gallery'}-${index}`}
                  onClick={() => {
                    setRawGeneratedBase64(img.url || img.image_url || null);
                    setEditOptions((current) => ({ ...current, bgX: 50, bgY: 50, bgScale: 1 }));
                  }}
                  className="aspect-square rounded-lg overflow-hidden border border-transparent hover:border-bible-gold transition-all shadow-sm group relative"
                >
                  <img
                    src={img.url || img.image_url}
                    alt="Template"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                </button>
              ))}
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-4 border-2 border-dashed border-gray-200 dark:border-white/10 rounded-2xl flex flex-col items-center gap-2 text-gray-500 hover:text-bible-gold hover:border-bible-gold transition-all"
            >
              <Upload size={20} />
              <span className="text-[10px] font-black uppercase tracking-widest">Enviar do Dispositivo</span>
            </button>
          </div>
        )}

        {activeControlTab === 'ai' && (
          <div className="space-y-6">
            <div className="grid grid-cols-4 md:grid-cols-5 gap-2">
              {styles.map((style) => (
                <button
                  key={style.id}
                  onClick={() => setSelectedStyle(style.id)}
                  className={`p-3 rounded-2xl border flex flex-col items-center gap-2 transition-all ${selectedStyle === style.id ? 'bg-bible-gold/10 border-bible-gold text-bible-gold' : 'border-transparent bg-gray-50 dark:bg-white/5 text-gray-500'}`}
                >
                  <span className="text-xl">{style.icon}</span>
                  <span className="text-[8px] font-black uppercase text-center leading-none">{style.label}</span>
                </button>
              ))}
            </div>
            <textarea
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              className="w-full bg-gray-50 dark:bg-white/5 border border-transparent focus:border-bible-gold text-gray-900 dark:text-white rounded-2xl p-4 text-[11px] h-24 focus:outline-none transition-all resize-none"
              placeholder="Descreva a imagem que você deseja criar..."
            />
            <button
              onClick={handleCreateClick}
              disabled={isGeneratingImg}
              className="w-full py-4 bg-bible-gold text-black font-black uppercase tracking-widest text-[11px] rounded-2xl flex items-center justify-center gap-3 shadow-xl shadow-bible-gold/30 disabled:opacity-50 active:scale-95 transition-all"
            >
              {isGeneratingImg ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />}
              {isGeneratingImg ? 'IA Gerando Imagem...' : 'Gerar Fundo Inédito'}
            </button>
          </div>
        )}

        {activeControlTab === 'text' && (
          <div className="space-y-6">
            <div className="space-y-3">
              <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Tamanho da Fonte</label>
              <div className="flex items-center gap-3 rounded-2xl bg-gray-100 dark:bg-white/5 p-3">
                <button
                  onClick={() => onFontSizePxChange(fontSizePx - 1)}
                  className="p-2 rounded-full text-gray-500 hover:text-bible-gold hover:bg-white dark:hover:bg-white/10 transition-colors"
                  title="Diminuir fonte"
                >
                  <Minus size={16} />
                </button>
                <div className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-gray-200 dark:border-white/10 bg-white/80 dark:bg-black/20 px-4 py-3">
                  <input
                    type="number"
                    min={VERSE_FONT_PX_LIMITS.min}
                    max={VERSE_FONT_PX_LIMITS.max}
                    step={1}
                    value={fontSizePx}
                    onChange={(event) => onFontSizePxChange(Number(event.target.value))}
                    className="w-20 bg-transparent text-center text-sm font-black text-gray-900 dark:text-white outline-none"
                  />
                  <span className="text-[10px] font-black uppercase tracking-[0.18em] text-bible-gold">px</span>
                </div>
                <button
                  onClick={() => onFontSizePxChange(fontSizePx + 1)}
                  className="p-2 rounded-full text-gray-500 hover:text-bible-gold hover:bg-white dark:hover:bg-white/10 transition-colors"
                  title="Aumentar fonte"
                >
                  <Plus size={16} />
                </button>
              </div>
              <p className="text-[10px] text-gray-400">Ajuste direto em pixels para o verso dentro da arte.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Tipografia</label>
                <div className="grid grid-cols-2 gap-2">
                  {fonts.map((font) => (
                    <button
                      key={font.id}
                      onClick={() => setEditOptions((current) => ({ ...current, fontFamily: font.id }))}
                      className={`px-4 py-3 rounded-xl border text-[11px] text-left transition-all ${editOptions.fontFamily === font.id ? 'border-bible-gold bg-bible-gold/10 text-bible-gold' : 'border-gray-200 dark:border-white/5 text-gray-600 dark:text-gray-400'}`}
                      style={font.style}
                    >
                      {font.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Alinhamento</label>
                <div className="flex bg-gray-100 dark:bg-white/5 rounded-xl p-1.5 gap-2">
                  {['left', 'center', 'right'].map((align) => (
                    <button
                      key={align}
                      onClick={() => setEditOptions((current) => ({ ...current, alignment: align as CompositionOptions['alignment'] }))}
                      className={`flex-1 py-2 rounded-lg flex items-center justify-center transition-all ${editOptions.alignment === align ? 'bg-white dark:bg-gray-800 shadow-md text-bible-gold' : 'text-gray-400'}`}
                    >
                      {align === 'left' && <AlignLeft size={18} />}
                      {align === 'center' && <AlignCenter size={18} />}
                      {align === 'right' && <AlignRight size={18} />}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-4">
              <button
                onClick={resetText}
                className="flex-1 py-4 bg-gray-100 dark:bg-white/5 rounded-2xl text-[9px] font-black uppercase text-gray-400 hover:text-bible-gold transition-colors flex items-center justify-center gap-2"
              >
                <Maximize size={16} /> Resetar Posição
              </button>
              <button
                onClick={() => onFontSizePxChange(VERSE_FONT_PX_LIMITS.default)}
                className="flex-1 py-4 bg-gray-100 dark:bg-white/5 rounded-2xl text-[9px] font-black uppercase text-gray-400 hover:text-bible-gold transition-colors flex items-center justify-center gap-2"
              >
                <Type size={16} /> Fonte Padrão
              </button>
            </div>
          </div>
        )}

        {activeControlTab === 'style' && (
          <div className="space-y-8">
            <div className="space-y-4">
              <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Cores do Texto</label>
              <div className="flex gap-4">
                {colors.map((color) => (
                  <button
                    key={color.id}
                    onClick={() => setEditOptions((current) => ({ ...current, textColor: color.value }))}
                    className={`w-10 h-10 rounded-full border-4 transition-transform ${editOptions.textColor === color.value ? 'border-bible-gold scale-110 shadow-lg' : 'border-transparent opacity-60'}`}
                    style={{ backgroundColor: color.value }}
                    title={color.label}
                  />
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Opacidade Fundo</label>
                  <span className="text-[10px] font-black text-bible-gold">{Math.round(editOptions.overlayOpacity * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="0.9"
                  step="0.05"
                  value={editOptions.overlayOpacity}
                  onChange={(e) => setEditOptions((current) => ({ ...current, overlayOpacity: parseFloat(e.target.value) }))}
                  className="w-full h-1.5 bg-gray-100 dark:bg-white/10 rounded-lg appearance-none cursor-pointer accent-bible-gold"
                />
              </div>
              <div className="space-y-4">
                <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Filtros de Cor</label>
                <div className="grid grid-cols-4 gap-2">
                  {filters.map((filter) => (
                    <button
                      key={filter.id}
                      onClick={() => setEditOptions((current) => ({ ...current, filter: filter.id as CompositionOptions['filter'] }))}
                      className={`py-2 rounded-xl border text-[8px] font-black uppercase transition-all ${editOptions.filter === filter.id ? 'border-bible-gold text-bible-gold bg-bible-gold/5' : 'border-gray-200 dark:border-white/5 text-gray-500'}`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
