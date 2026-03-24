import React from 'react';
import { HeroBlock } from './blocks/HeroBlock';
import { AuthorityBlock } from './blocks/AuthorityBlock';
import { BiblicalBlock } from './blocks/BiblicalBlock';
import { VideoBlock } from './blocks/VideoBlock';
import { FooterBlock } from './blocks/FooterBlock';
import { StudyContentBlock } from './blocks/StudyContentBlock';
import { SlideBlock } from './blocks/SlideBlock';

interface BlockRendererProps {
  block: any;
  isEditing: boolean;
  onUpdate?: (id: string, data: any) => void;
  authorName?: string;
  canvasWidth?: 'mobile' | 'tablet' | 'desktop' | 'full';
}

export const BlockRenderer: React.FC<BlockRendererProps> = ({ 
  block, 
  isEditing, 
  onUpdate, 
  authorName,
  canvasWidth 
}) => {
  const { type, data } = block;

  const renderBlock = () => {
    switch (type) {
      case 'hero':
        return <HeroBlock data={data} onUpdate={(newData) => onUpdate?.(block.id, newData)} isEditing={isEditing} authorName={authorName} />;
      case 'authority':
        return <AuthorityBlock data={data} isEditing={isEditing} onUpdate={(newData) => onUpdate?.(block.id, newData)} />;
      case 'biblical':
        return <BiblicalBlock data={data} isEditing={isEditing} onUpdate={(newData) => onUpdate?.(block.id, newData)} />;
      case 'video':
        return <VideoBlock data={data} isEditing={isEditing} onUpdate={(newData) => onUpdate?.(block.id, newData)} />;
      case 'footer':
        return <FooterBlock data={data} isEditing={isEditing} />;
      case 'study-content':
        return <StudyContentBlock data={data} onUpdate={(newData) => onUpdate?.(block.id, newData)} isEditing={isEditing} authorName={authorName} />;
      case 'slide':
        return <SlideBlock data={data} onUpdate={(newData) => onUpdate?.(block.id, newData)} isEditing={isEditing} authorName={authorName} />;
      default:
        return (
          <div className="p-8 bg-gray-100 rounded-xl text-center text-gray-400">
            Tipo de bloco não suportado: {type}
          </div>
        );
    }
  };

  // Determinar a largura do container
  let containerClass = 'mx-auto transition-all duration-300 w-full';
  
  // Se for 'full', ele já é full. Se for 'contained' ou outros, aplicamos limites.
  if (data.width === 'contained') {
    containerClass += ' max-w-4xl px-4';
  } else if (data.width === 'full') {
    containerClass += ' w-full px-0';
  } else {
    // Default: largura confortável dependendo do tipo de bloco
    if (canvasWidth === 'mobile') {
        containerClass += ' max-w-full px-4';
    } else if (canvasWidth === 'tablet') {
        containerClass += ' max-w-2xl px-6';
    } else {
        // Desktop widths diferenciadas
        if (type === 'hero' || type === 'slide' || type === 'video') {
            containerClass += ' max-w-6xl px-8';
        } else if (type === 'study-content' || type === 'biblical') {
            containerClass += ' max-w-4xl px-8 md:px-12'; // Mais estreito para melhor legibilidade
        } else {
            containerClass += ' max-w-5xl px-8';
        }
    }
  }

  const styles: React.CSSProperties = {
    backgroundColor: data.backgroundColor || 'transparent',
    color: data.textColor || 'inherit',
    paddingTop: (data.padding?.top ?? 0) * 4,
    paddingBottom: (data.padding?.bottom ?? 0) * 4,
    marginTop: (data.margin?.top ?? 0) * 4,
    marginBottom: (data.margin?.bottom ?? 0) * 4,
  };

  // Se houver imagem de fundo no bloco
  if (data.backgroundImage && type !== 'hero' && type !== 'slide') {
    styles.backgroundImage = `url(${data.backgroundImage})`;
    styles.backgroundSize = 'cover';
    styles.backgroundPosition = 'center';
    styles.position = 'relative';
  }

  const shadowClasses: Record<string, string> = {
    none: '',
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-xl', // shadow-lg as reference
    xl: 'shadow-2xl'
  };

  return (
    <div 
      className={`${shadowClasses[data.shadow || 'none']} ${data.borderRadius ? 'overflow-hidden' : ''} transition-all duration-300 w-full`}
      style={{ 
        ...styles,
        borderRadius: data.borderRadius ? `${data.borderRadius}px` : undefined,
      }}
    >
      {/* Overlay se houver imagem de fundo */}
      {data.backgroundImage && type !== 'hero' && type !== 'slide' && (
        <div 
          className="absolute inset-0 z-0" 
          style={{ 
            backgroundColor: 'black', 
            opacity: data.overlayOpacity ?? 0.5 
          }} 
        />
      )}
      
      <div className={`${containerClass} relative z-10`}>
        {renderBlock()}
      </div>
    </div>
  );
};
