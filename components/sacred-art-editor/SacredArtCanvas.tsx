"use client";

import React, { useEffect, useRef, useState, useMemo, useLayoutEffect } from 'react';
import { Stage, Layer, Image as KonvaImage, Rect, Group, Text as KonvaText, Transformer, Line } from 'react-konva';
import useImage from 'use-image';
import { Sparkles, Plus } from 'lucide-react';

import { EDITOR_LAYER_Z_INDEX, getResponsiveTextLayout } from '../../app/criar-arte-sacra/editorLayout';
import type { SacredArtCanvasProps } from './types';

const SNAP_THRESHOLD = 8;

export default function SacredArtCanvas({
  canvasContainerRef,
  rawGeneratedBase64,
  foundVerse,
  editOptions,
  selectedLayer,
  setSelectedLayer,
  onBgDragEnd,
  onTextDragEnd,
  onOpenAi,
  onOpenTemplates,
  onCanvasResize,
  onFontSizeScaleChange,
  onBgScaleChange,
  getCSSFilters,
}: SacredArtCanvasProps) {
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [image] = useImage(rawGeneratedBase64 || '');
  
  const stageRef = useRef<any>(null);
  const textGroupRef = useRef<any>(null);
  const verseTextRef = useRef<any>(null);
  const refTextRef = useRef<any>(null);
  const transformerRef = useRef<any>(null);
  const bgImageRef = useRef<any>(null);

  const [guides, setGuides] = useState<{ x: number | null; y: number | null }>({ x: null, y: null });
  const [isDragging, setIsDragging] = useState(false);

  // Responsive stage sizing
  useEffect(() => {
    const node = canvasContainerRef.current;
    if (!node || typeof ResizeObserver === 'undefined') return;

    const updateSize = () => {
      const rect = node.getBoundingClientRect();
      const nextSize = { width: rect.width, height: rect.height };
      setCanvasSize(nextSize);
      onCanvasResize?.(nextSize);
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(node);

    return () => observer.disconnect();
  }, [canvasContainerRef, editOptions.aspectRatio, onCanvasResize]);

  const textLayout = useMemo(() => {
    return getResponsiveTextLayout({
      aspectRatio: editOptions.aspectRatio ?? 'feed',
      containerWidth: canvasSize.width,
      containerHeight: canvasSize.height,
      fontSizeScale: editOptions.fontSizeScale,
    });
  }, [editOptions.aspectRatio, canvasSize, editOptions.fontSizeScale]);

  // Internal layout adjustment for the text group (centering and reference positioning)
  useLayoutEffect(() => {
    if (foundVerse && verseTextRef.current && refTextRef.current && textGroupRef.current) {
      const verseHeight = verseTextRef.current.height();
      refTextRef.current.y(verseHeight + 20);
      
      const width = canvasSize.width * (textLayout.contentWidthPercent / 100);
      verseTextRef.current.width(width);
      refTextRef.current.width(width);

      const box = textGroupRef.current.getClientRect({ skipTransform: true });
      textGroupRef.current.offsetX(box.width / 2 + box.x);
      textGroupRef.current.offsetY(box.height / 2 + box.y);
    }
  }, [foundVerse, canvasSize, textLayout, editOptions.fontFamily, editOptions.alignment]);

  // Transformer node management
  useEffect(() => {
    if (!transformerRef.current) return;
    
    if (selectedLayer === 'text' && textGroupRef.current) {
      transformerRef.current.nodes([textGroupRef.current]);
      transformerRef.current.getLayer().batchDraw();
    } else {
      transformerRef.current.nodes([]);
      transformerRef.current.getLayer().batchDraw();
    }
  }, [selectedLayer]);

  const pctToPx = (pct: number, total: number) => (pct / 100) * total;
  const pxToPct = (px: number, total: number) => (px / total) * 100;

  const handleTextDragMove = (e: any) => {
    const stage = e.target.getStage();
    const centerX = stage.width() / 2;
    const centerY = stage.height() / 2;
    const node = e.target;

    let newX = node.x();
    let newY = node.y();
    let snapX = null;
    let snapY = null;

    if (Math.abs(newX - centerX) < SNAP_THRESHOLD) {
      newX = centerX;
      snapX = centerX;
    }
    if (Math.abs(newY - centerY) < SNAP_THRESHOLD) {
      newY = centerY;
      snapY = centerY;
    }

    node.x(newX);
    node.y(newY);
    setGuides({ x: snapX, y: snapY });
    setIsDragging(true);
  };

  const handleTextDragEnd = (e: any) => {
    const node = e.target;
    const rect = canvasContainerRef.current?.getBoundingClientRect();
    if (!rect) return;

    setIsDragging(false);
    setGuides({ x: null, y: null });

    onTextDragEnd({} as any, {
      point: {
        x: rect.left + node.x(),
        y: rect.top + node.y()
      }
    } as any);
  };

  const handleBgDragMove = (e: any) => {
    const stage = e.target.getStage();
    const centerX = stage.width() / 2;
    const centerY = stage.height() / 2;
    const node = e.target;

    let snapX = null;
    let snapY = null;

    if (Math.abs(node.x() - centerX) < SNAP_THRESHOLD) {
      node.x(centerX);
      snapX = centerX;
    }
    if (Math.abs(node.y() - centerY) < SNAP_THRESHOLD) {
      node.y(centerY);
      snapY = centerY;
    }

    setGuides({ x: snapX, y: snapY });
    setIsDragging(true);
  };

  const handleBgDragEnd = (e: any) => {
    const node = e.target;
    const stage = e.target.getStage();
    
    setIsDragging(false);
    setGuides({ x: null, y: null });

    const newBgX = pxToPct(node.x(), stage.width());
    const newBgY = pxToPct(node.y(), stage.height());
    
    const deltaXPct = newBgX - (editOptions.bgX ?? 50);
    const deltaYPct = newBgY - (editOptions.bgY ?? 50);

    onBgDragEnd({} as any, {
      delta: {
        x: (deltaXPct / 100) * stage.width(),
        y: (deltaYPct / 100) * stage.height()
      }
    } as any);
  };

  const handleTransformEnd = (e: any) => {
    const node = e.target;
    const scaleX = node.scaleX();
    
    const newFontSizeScale = editOptions.fontSizeScale * scaleX;
    
    node.scaleX(1);
    node.scaleY(1);
    
    onFontSizeScaleChange?.(newFontSizeScale);
  };

  if (!rawGeneratedBase64) {
    return (
      <div
        ref={canvasContainerRef}
        className={`relative isolate overflow-hidden rounded-[28px] bg-gray-900 border border-white/10 shadow-2xl animate-in zoom-in-95 duration-500 select-none flex items-center justify-center ${editOptions.aspectRatio === 'story' ? 'aspect-[9/16] h-[55vh] md:h-[75vh]' : 'aspect-square h-[45vh] md:h-[70vh]'}`}
      >
        <div className="flex flex-col items-center justify-center text-center p-8 space-y-8 z-10">
          <div className="relative">
            <div className="w-24 h-24 bg-gradient-to-br from-gray-900 to-black rounded-3xl flex items-center justify-center text-bible-gold border border-white/10 shadow-2xl animate-pulse">
              <Sparkles size={44} />
            </div>
            <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-bible-gold text-black rounded-full flex items-center justify-center shadow-lg">
              <Plus size={20} />
            </div>
          </div>
          <div className="space-y-3">
            <h3 className="text-2xl font-serif font-black text-white tracking-tight uppercase">Crie sua Obra-Prima</h3>
            <p className="text-sm text-gray-400 max-w-xs leading-relaxed">
              Busque um versículo acima e use a força do <span className="text-bible-gold font-bold">Nano Banana IA</span> para dar vida às Escrituras.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <button onClick={onOpenAi} className="px-8 py-4 bg-bible-gold text-black rounded-2xl text-[12px] font-black uppercase tracking-widest shadow-xl shadow-bible-gold/20 hover:scale-105 transition-all flex items-center gap-2">
              <Sparkles size={18} /> Gerar Arte Inédita
            </button>
            <button onClick={onOpenTemplates} className="px-8 py-4 bg-white/5 text-gray-400 rounded-2xl text-[12px] font-black uppercase tracking-widest border border-white/10 hover:bg-white/10 hover:text-white transition-all">
              Explorar Acervo
            </button>
          </div>
        </div>
      </div>
    );
  }

  const getBgTransform = () => {
    if (!image || !canvasSize.width) return { x: 0, y: 0, scaleX: 1, scaleY: 1, offsetX: 0, offsetY: 0 };
    
    // Scale image to cover the canvas exactly like object-cover
    const baseScale = Math.max(canvasSize.width / image.width, canvasSize.height / image.height);
    const finalScale = baseScale * (editOptions.bgScale ?? 1);
    
    return {
      x: pctToPx(editOptions.bgX ?? 50, canvasSize.width),
      y: pctToPx(editOptions.bgY ?? 50, canvasSize.height),
      scaleX: finalScale,
      scaleY: finalScale,
      offsetX: image.width / 2,
      offsetY: image.height / 2
    };
  };

  const bgTransform = getBgTransform();

  return (
    <div
      ref={canvasContainerRef}
      className={`relative isolate overflow-hidden rounded-[28px] bg-gray-900 border border-white/10 shadow-2xl animate-in zoom-in-95 duration-500 select-none ${editOptions.aspectRatio === 'story' ? 'aspect-[9/16] h-[55vh] md:h-[75vh]' : 'aspect-square h-[45vh] md:h-[70vh]'}`}
    >
      <Stage
        width={canvasSize.width}
        height={canvasSize.height}
        ref={stageRef}
        onMouseDown={(e) => {
          if (e.target === e.target.getStage()) {
            setSelectedLayer(null);
          }
        }}
      >
        {/* Layer 1: Background Layer */}
        <Layer>
          {image && (
            <KonvaImage
              ref={bgImageRef}
              image={image}
              x={bgTransform.x}
              y={bgTransform.y}
              width={image.width * bgTransform.scaleX}
              height={image.height * bgTransform.scaleY}
              offsetX={bgTransform.offsetX}
              offsetY={bgTransform.offsetY}
              draggable
              onDragStart={() => {
                setSelectedLayer('bg');
                setIsDragging(true);
              }}
              onDragMove={handleBgDragMove}
              onDragEnd={handleBgDragEnd}
              onClick={(e) => {
                e.cancelBubble = true;
                setSelectedLayer('bg');
              }}
            />
          )}
        </Layer>

        {/* Layer 2: Overlay Layer */}
        <Layer listening={false}>
          <Rect
            x={0}
            y={0}
            width={canvasSize.width}
            height={canvasSize.height}
            fillLinearGradientStartPoint={{ x: 0, y: 0 }}
            fillLinearGradientEndPoint={{ x: 0, y: canvasSize.height }}
            fillLinearGradientColorStops={[
              0, `rgba(0,0,0,${Math.max(0, (editOptions.overlayOpacity ?? 0.4) - 0.2)})`,
              0.5, `rgba(0,0,0,${editOptions.overlayOpacity ?? 0.4})`,
              1, `rgba(0,0,0,${Math.min(1, (editOptions.overlayOpacity ?? 0.4) + 0.2)})`
            ]}
          />
        </Layer>

        {/* Layer 3: Text Layer */}
        <Layer>
          {foundVerse && (
            <Group
              ref={textGroupRef}
              x={pctToPx(editOptions.textX ?? 50, canvasSize.width)}
              y={pctToPx(editOptions.textY ?? 50, canvasSize.height)}
              draggable
              onDragStart={() => {
                setSelectedLayer('text');
                setIsDragging(true);
              }}
              onDragMove={handleTextDragMove}
              onDragEnd={handleTextDragEnd}
              onTransformEnd={handleTransformEnd}
              onClick={(e) => {
                e.cancelBubble = true;
                setSelectedLayer('text');
              }}
            >
              <KonvaText
                ref={verseTextRef}
                text={`“${foundVerse.text}”`}
                align={editOptions.alignment}
                fontFamily={editOptions.fontFamily}
                fontSize={textLayout.verseFontSizePx}
                fill={editOptions.textColor}
                fontStyle="bold"
                lineHeight={1.4}
                shadowColor="rgba(0,0,0,0.8)"
                shadowBlur={15}
                shadowOffset={{ x: 0, y: 4 }}
                shadowOpacity={0.8}
              />
              <KonvaText
                ref={refTextRef}
                text={foundVerse.ref.toUpperCase()}
                align={editOptions.alignment}
                fontFamily="Inter, sans-serif"
                fontSize={textLayout.referenceFontSizePx}
                fill="#c5a059"
                fontStyle="900"
                letterSpacing={2}
              />
            </Group>
          )}
          
          {selectedLayer === 'text' && (
            <Transformer
              ref={transformerRef}
              rotateEnabled={false}
              keepRatio={true}
              enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right']}
              boundBoxFunc={(oldBox, newBox) => {
                if (newBox.width < 50 || newBox.height < 50) return oldBox;
                return newBox;
              }}
              anchorSize={10}
              anchorFill="#c5a059"
              anchorStroke="#fff"
              borderStroke="#c5a059"
              centeredScaling={true}
            />
          )}
        </Layer>

        {/* Layer 4: Guide Layer */}
        <Layer listening={false}>
          {isDragging && guides.x !== null && (
            <Line
              points={[guides.x, 0, guides.x, canvasSize.height]}
              stroke={guides.x === canvasSize.width / 2 ? "#FFD700" : "rgba(197, 160, 89, 0.5)"}
              strokeWidth={guides.x === canvasSize.width / 2 ? 2.5 : 1}
              dash={[5, 5]}
            />
          )}
          {isDragging && guides.y !== null && (
            <Line
              points={[0, guides.y, canvasSize.width, guides.y]}
              stroke={guides.y === canvasSize.height / 2 ? "#FFD700" : "rgba(197, 160, 89, 0.5)"}
              strokeWidth={guides.y === canvasSize.height / 2 ? 2.5 : 1}
              dash={[5, 5]}
            />
          )}
          {isDragging && guides.x !== null && guides.y !== null && (
            <Rect
              x={guides.x - 6}
              y={guides.y - 6}
              width={12}
              height={12}
              stroke="#FFD700"
              strokeWidth={2}
              cornerRadius={6}
            />
          )}
        </Layer>

        {/* Layer 5: Watermark / Branding */}
        <Layer listening={false}>
          <KonvaText
            text="BíbliaLM App"
            x={0}
            y={canvasSize.height - (editOptions.aspectRatio === 'story' ? 40 : 30)}
            width={canvasSize.width}
            align="center"
            fontFamily="Inter, sans-serif"
            fontSize={12}
            fill={editOptions.textColor === '#000000' ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.6)'}
            fontStyle="700"
            letterSpacing={1.5}
          />
        </Layer>
      </Stage>
    </div>
  );
}