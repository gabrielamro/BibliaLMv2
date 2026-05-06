"use client";

import React, { useState, useEffect } from 'react';

interface SlideKonvaProps {
  dimensions: { width: number; height: number };
  bgImage: any;
  currentSlideData: any;
  isEditing: boolean;
  updateSlide: (id: string, updates: any) => void;
  canvasWidth?: 'mobile' | 'tablet' | 'desktop' | 'full';
}

const SlideKonva: React.FC<SlideKonvaProps> = ({ 
  dimensions, 
  bgImage, 
  currentSlideData, 
  isEditing, 
  updateSlide,
  canvasWidth,
}) => {
  const [KonvaComponents, setKonvaComponents] = useState<any>(null);
  const isCompact = canvasWidth === 'mobile' || dimensions.width < 420;

    useEffect(() => {
        // Emergency Bridge - Garante que os internals do React estejam visíveis para o react-konva
        const r = React as any;
        if (!r.ReactSharedInternals && r.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED) {
            r.ReactSharedInternals = r.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;
        }

        import('react-konva').then(mod => {
            setKonvaComponents(mod);
        });
    }, []);

  if (!KonvaComponents || dimensions.width === 0 || dimensions.height === 0) {
    return (
      <div className="w-full h-full bg-gray-900 animate-pulse flex items-center justify-center text-white/10 text-[10px] font-black uppercase tracking-[0.2em]">
        Renderizando...
      </div>
    );
  }

  const { Stage, Layer, Image: KonvaImage, Rect } = KonvaComponents;

  return (
    <div className="relative w-full h-full">
      <Stage width={Math.floor(dimensions.width)} height={Math.floor(dimensions.height)}>
        <Layer>
          {bgImage && (
            <KonvaImage
              image={bgImage}
              width={bgImage.width}
              height={bgImage.height}
              scaleX={Math.max(dimensions.width / (bgImage.width || 1), dimensions.height / (bgImage.height || 1))}
              scaleY={Math.max(dimensions.width / (bgImage.width || 1), dimensions.height / (bgImage.height || 1))}
              offsetX={(bgImage.width || 0) / 2}
              offsetY={(bgImage.height || 0) / 2}
              x={dimensions.width / 2}
              y={dimensions.height / 2}
              opacity={1}
              listening={false}
            />
          )}
        </Layer>
        <Layer listening={false}>
          <Rect
            x={0}
            y={0}
            width={dimensions.width}
            height={dimensions.height}
            fill={`rgba(0, 0, 0, ${currentSlideData.overlayOpacity ?? 0.4})`}
          />
        </Layer>
      </Stage>

      {/* HTML Overlay - Posicionado sobre o Canvas */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        <div className={`${isCompact ? 'p-4' : 'p-5 md:p-8'} h-full flex items-center justify-center text-white pointer-events-auto`}>
          <div className={`w-full max-w-5xl flex ${isCompact ? 'flex-col' : 'flex-col md:flex-row'} items-center ${isCompact ? 'gap-3' : 'gap-4 md:gap-12'} ${!isCompact && currentSlideData.layout === 'image-left' ? 'md:flex-row-reverse' : ''}`}>
            <div className={`flex-1 min-w-0 ${isCompact ? 'w-full text-center space-y-2' : 'text-center md:text-left space-y-4'}`}>
              <h2
                contentEditable={isEditing}
                suppressContentEditableWarning={true}
                onBlur={(e) => updateSlide(currentSlideData.id, { title: e.currentTarget.innerText })}
                className={`${isCompact ? 'text-xl' : 'text-2xl md:text-4xl'} font-black drop-shadow-lg leading-tight outline-none break-words ${isEditing ? 'cursor-text hover:bg-white/10 rounded-lg px-2 -mx-2 transition-colors' : ''}`}
                style={{ color: currentSlideData.textColor || 'inherit' }}
              >
                {currentSlideData.title || ''}
              </h2>
              <div
                contentEditable={isEditing}
                suppressContentEditableWarning={true}
                onBlur={(e) => updateSlide(currentSlideData.id, { description: e.currentTarget.innerText })}
                className={`${isCompact ? 'text-xs leading-relaxed' : 'text-sm md:text-base leading-relaxed'} text-white/80 max-w-2xl mx-auto md:mx-0 font-medium outline-none break-words ${isEditing ? 'cursor-text hover:bg-white/10 rounded-lg px-2 -mx-2 transition-colors' : ''}`}
                style={{ color: currentSlideData.textColor ? `${currentSlideData.textColor}cc` : 'rgba(255,255,255,0.8)' }}
              >
                {currentSlideData.description || ''}
              </div>
            </div>
            {(currentSlideData.type !== 'text' || currentSlideData.mediaUrl) && (
              <div className={`${isCompact ? 'w-full flex-none' : 'flex-1 w-full'} flex justify-center min-w-0`}>
                 <img src={currentSlideData.mediaUrl} className={`w-full ${isCompact ? 'max-w-[128px] max-h-[96px] rounded-xl' : 'max-w-[200px] md:max-w-sm rounded-2xl'} h-auto object-cover shadow-2xl border border-white/20`} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SlideKonva;
