import type React from 'react';
import { CompositionOptions } from '../../utils/imageCompositor';

export type EditorControlTab = 'text' | 'style' | 'templates' | 'ai' | null;
export type EditorLayer = 'text' | 'bg' | null;

export interface VersePreview {
  ref: string;
  text: string;
}

export interface SacredArtGalleryItem {
  url?: string;
  image_url?: string;
  prompt?: string;
  label?: string;
  category?: string;
  userId?: string;
}

export interface SacredArtCanvasProps {
  canvasContainerRef: React.RefObject<HTMLDivElement>;
  rawGeneratedBase64: string | null;
  foundVerse: VersePreview | null;
  editOptions: CompositionOptions;
  selectedLayer: EditorLayer;
  setSelectedLayer: (layer: EditorLayer) => void;
  onBgDragEnd: (_event: MouseEvent | TouchEvent | PointerEvent, info: { delta: { x: number; y: number } }) => void;
  onTextDragEnd: (_event: MouseEvent | TouchEvent | PointerEvent, info: { point: { x: number; y: number } }) => void;
  onOpenAi: () => void;
  onOpenTemplates: () => void;
  onCanvasResize?: (size: { width: number; height: number }) => void;
  onFontSizeScaleChange?: (scale: number) => void;
  onBgScaleChange?: (scale: number) => void;
  getCSSFilters: () => React.CSSProperties;
}
