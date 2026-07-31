"use client";
import React from 'react';
import { HeroBlock } from './blocks/HeroBlock';
import { AuthorityBlock } from './blocks/AuthorityBlock';
import { BiblicalBlock } from './blocks/BiblicalBlock';
import { VideoBlock } from './blocks/VideoBlock';
import { FooterBlock } from './blocks/FooterBlock';
import { StudyContentBlock } from './blocks/StudyContentBlock';
import dynamic from 'next/dynamic';

const SlideBlock = dynamic(() => import('./blocks/SlideBlock').then(mod => mod.SlideBlock), { 
  ssr: false,
  loading: () => <div className="h-80 md:h-96 bg-gray-900 rounded-3xl animate-pulse flex items-center justify-center text-gray-500 font-bold uppercase tracking-widest text-[10px]">Carregando Slide...</div>
});
import { HeroSplitBlock } from './blocks/HeroSplitBlock';
import { StudyOutlineBlock } from './blocks/StudyOutlineBlock';
import { RelatedVersesBlock } from './blocks/RelatedVersesBlock';
import { ReflectionQuestionBlock } from './blocks/ReflectionQuestionBlock';
import { ReferencesChainBlock } from './blocks/ReferencesChainBlock';
import { SpacerBlock } from './blocks/SpacerBlock';
import { RichTextBlock } from './blocks/RichTextBlock';
import { CTABlock } from './blocks/CTABlock';

interface BlockRendererProps {
  block: any;
  isEditing: boolean;
  onUpdate?: (id: string, data: any) => void;
  authorName?: string;
  canvasWidth?: 'mobile' | 'tablet' | 'desktop' | 'full';
  editor?: any;
  layoutWidth?: string;
  studyId?: string;
  studyTitle?: string;
}

export const BlockRenderer: React.FC<BlockRendererProps> = ({ 
  block, 
  isEditing, 
  onUpdate, 
  authorName,
  canvasWidth,
  editor,
  layoutWidth,
  studyId,
  studyTitle,
}) => {
  const { type, data } = block;
  
  // Lógica de Visibilidade
  const showOnDesktop = data.showOnDesktop !== false;
  
  // Regra: Sumário não aparece no mobile por padrão (showOnMobile deve ser explicitamente true)
  const showOnMobile = type === 'study-outline' 
    ? (data.showOnMobile === true)  // Precisa ser explicitamente ativado
    : (data.showOnMobile !== false); // Outros blocos: visíveis por padrão

  const isMobileView = canvasWidth === 'mobile';
  const isDesktopView = !isMobileView; // tablet and full also count as desktop-ish for this logic

  const isHiddenOnCurrentViewport = (isMobileView && !showOnMobile) || (isDesktopView && !showOnDesktop);

  // Se estiver escondido na visualizacao atual, nao renderiza nada.
  if (isHiddenOnCurrentViewport) {
    return null;
  }

  const renderBlock = () => {
    switch (type) {
      case 'hero':
        return <HeroBlock data={data} onUpdate={(newData) => onUpdate?.(block.id, newData)} isEditing={isEditing} authorName={authorName} />;
      case 'authority':
        return <AuthorityBlock data={data} isEditing={isEditing} onUpdate={(newData) => onUpdate?.(block.id, newData)} />;
      case 'biblical':
        return <BiblicalBlock data={data} isEditing={isEditing} onUpdate={(newData) => onUpdate?.(block.id, newData)} canvasWidth={canvasWidth} />;
      case 'video':
        return <VideoBlock data={data} isEditing={isEditing} onUpdate={(newData) => onUpdate?.(block.id, newData)} />;
      case 'footer':
        return <FooterBlock data={data} isEditing={isEditing} />;
      case 'study-content':
        return <StudyContentBlock data={data} onUpdate={(newData) => onUpdate?.(block.id, newData)} isEditing={isEditing} authorName={authorName} />;
      case 'slide':
        return <SlideBlock data={data} onUpdate={(newData) => onUpdate?.(block.id, newData)} isEditing={isEditing} authorName={authorName} canvasWidth={canvasWidth} />;
      case 'hero-split':
        return <HeroSplitBlock data={data} isEditing={isEditing} onUpdate={onUpdate ? (newData) => onUpdate(block.id, newData) : undefined} />;
      case 'study-outline':
        return <StudyOutlineBlock data={data} isEditing={isEditing} onUpdate={onUpdate ? (newData) => onUpdate(block.id, newData) : undefined} editor={editor} />;
      case 'related-verses':
        return <RelatedVersesBlock data={data} isEditing={isEditing} onUpdate={onUpdate ? (newData) => onUpdate(block.id, newData) : undefined} layoutWidth={layoutWidth || data.layoutWidth || '1/1'} canvasWidth={canvasWidth} />;
      case 'references-chain':
        return <ReferencesChainBlock data={data} isEditing={isEditing} onUpdate={onUpdate ? (newData) => onUpdate(block.id, newData) : undefined} />;
      case 'reflection-question':
        return <ReflectionQuestionBlock data={data} isEditable={isEditing} studyId={studyId} studyTitle={studyTitle} onUpdate={onUpdate ? (newData) => onUpdate(block.id, newData) : undefined} />;
      case 'spacer':
        return <SpacerBlock data={data} isEditing={isEditing} onUpdate={(newData) => onUpdate?.(block.id, newData)} />;
      case 'free-text':
      case 'rich-text':
        return <RichTextBlock data={data} onUpdate={(newData) => onUpdate?.(block.id, newData)} isEditing={isEditing} editor={editor} layoutWidth={layoutWidth || data.layoutWidth || '1/1'} blockType={type} canvasWidth={canvasWidth} />;
      case 'cta':
        return <CTABlock data={data} isEditing={isEditing} onUpdate={onUpdate ? (newData) => onUpdate(block.id, newData) : undefined} />;
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
  
  const currentLayoutWidth = layoutWidth || data.layoutWidth;
  const hasExplicitGridWidth =
    currentLayoutWidth === '1/1' ||
    currentLayoutWidth === '2/3' ||
    currentLayoutWidth === '1/2' ||
    currentLayoutWidth === '1/3';

  // Quando o grid da V2 controla a largura, o bloco deve ocupar toda a coluna atribuída.
  if (hasExplicitGridWidth) {
    containerClass += ' max-w-full px-0';
  } else if (data.width === 'contained') {
    containerClass += ' max-w-4xl px-0';
  } else if (data.width === 'full') {
    containerClass += ' w-full px-0';
  } else {
    // Default: largura confortável dependendo do tipo de bloco
    if (canvasWidth === 'mobile' || canvasWidth === 'full') {
        containerClass += ' max-w-full px-0';
    } else if (canvasWidth === 'tablet') {
        containerClass += ' max-w-2xl px-0';
    } else {
        // Desktop widths diferenciadas
        if (type === 'hero' || type === 'slide' || type === 'video' || type === 'hero-split') {
            containerClass += ' max-w-6xl px-0';
        } else if (type === 'study-content' || type === 'biblical') {
            containerClass += ' max-w-4xl px-0';
        } else if (type === 'study-outline' || type === 'related-verses') {
            containerClass += ' max-w-4xl px-0';
        } else if (type === 'rich-text' || type === 'free-text') {
            containerClass += ' max-w-full px-0';
        } else {
            containerClass += ' max-w-5xl px-0';
        }
    }
  }

  const styles: React.CSSProperties = {
    backgroundColor: data.backgroundColor || 'transparent',
    color: data.textColor || 'inherit',
    paddingTop: 0,
    paddingBottom: 0,
    marginTop: 0,
    marginBottom: 0,
    fontFamily: data.fontFamily || 'inherit',
    fontSize: data.fontSize ? `${data.fontSize}px` : undefined,
    lineHeight: data.lineHeight || 'inherit',
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
        fontFamily: data.fontFamily,
        fontSize: data.fontSize ? `${data.fontSize}px` : undefined,
        lineHeight: data.lineHeight
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

      <div className={`${containerClass} relative z-10 h-full`}>
        {renderBlock()}
      </div>
    </div>
  );
};
